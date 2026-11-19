import json
import logging
import re
from typing import Dict, Any, Optional
import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)

# Configure Gemini if key is provided
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to configure Gemini API: {e}")


GEMINI_CLASSIFICATION_PROMPT = """You are an expert content moderation AI for a news platform. Your task is to analyze a news article and determine its age suitability.

Article Title: {title}
Article Description: {description}
Article Content: {content}

CLASSIFICATION RULES:
- Classify as "Below 18" (default): Regular news, educational content, sports, business, technology, science, general events
- Classify as "18+" ONLY IF the article contains EXPLICIT and GRAPHIC:
  * Detailed descriptions of extreme violence (gore, torture)
  * Sexual content or adult themes
  * Strong profanity used extensively  
  * Promotion or glorification of drug/substance use
  * Detailed self-harm or suicide methods
  * Extremely disturbing content inappropriate for minors

IMPORTANT: 
- Context matters. An article ABOUT drugs for education ≠ promotion
- Crime reporting without graphic detail = Below 18
- War reporting without gore = Below 18
- Health articles = Below 18
- When in doubt, classify as Below 18

Respond ONLY with valid JSON in this exact format:
{{
  "age_category": "18+" or "Below 18",
  "confidence": <float 0.0-1.0>,
  "reason": "<clear explanation in 1-2 sentences>",
  "sensitive_indicators": ["<only list if 18+, e.g. Graphic Violence>"],
  "summary": "<2-4 sentence factual summary of the article>",
  "content_severity": "Low" or "Medium" or "High"
}}
"""


GEMINI_DETAILED_SUMMARY_PROMPT = """You are a senior journalistic summarizer.
Generate a comprehensive, high-quality detailed summary (6 to 10 sentences) of the following news article.
Cover key background, primary events/claims, involved parties, immediate impact, and future outlook.

Article Title: {title}
Article Content: {content}

Return ONLY the detailed summary text without meta commentary.
"""


def clean_json_text(text: str) -> str:
    """Extract JSON object from model response even if surrounded by markdown."""
    text = text.strip()
    # Strip markdown code fence if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    # Search for first { to last }
    match = re.search(r"(\{[\s\S]*\})", text)
    if match:
        return match.group(1).strip()
    return text


def get_default_fallback_analysis(title: str, description: str, reason_note: str) -> Dict[str, Any]:
    summary_text = (description or title or "News article summary unavailable.")
    return {
        "age_category": "Below 18",
        "confidence": 0.75,
        "reason": reason_note,
        "sensitive_indicators": [],
        "summary": summary_text[:300],
        "content_severity": "Low",
    }


def analyze_article(title: str, description: str, content: str, url: str = "") -> Dict[str, Any]:
    """
    Analyzes an article using Gemini API to determine age suitability,
    extract key indicators, and generate a 2-4 sentence summary.
    """
    title = (title or "").strip()
    description = (description or "").strip()
    content = (content or "").strip()

    # If content is empty, use description
    article_body = content if content else description
    if not article_body and not title:
        return {
            "age_category": "Below 18",
            "confidence": 0.5,
            "reason": "Insufficient content provided to analyze.",
            "sensitive_indicators": [],
            "summary": "No content available.",
            "content_severity": "Low",
        }

    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not configured. Falling back to default Below 18 classification.")
        return get_default_fallback_analysis(
            title, description, "Gemini API key is not set. Defaulted to Below 18."
        )

    prompt = GEMINI_CLASSIFICATION_PROMPT.format(
        title=title or "Untitled",
        description=description or "None",
        content=article_body[:6000] or "None",
    )

    models_to_try = [GEMINI_MODEL, "gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-flash-latest"]
    # Deduplicate while preserving order
    seen = set()
    models_to_try = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

    last_error = None
    for model_name in models_to_try:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    top_p=0.9,
                    max_output_tokens=1024,
                ),
                request_options={"timeout": 15},
            )

            raw_text = response.text if hasattr(response, "text") and response.text else ""
            cleaned = clean_json_text(raw_text)
            data = json.loads(cleaned)

            # Validate and normalize age_category
            raw_age = str(data.get("age_category", "")).strip().lower()
            if "18+" in raw_age or "above 18" in raw_age or "mature" in raw_age or "adult" in raw_age:
                age_category = "18+"
            else:
                age_category = "Below 18"

            # Validate confidence
            try:
                confidence = float(data.get("confidence", 0.85))
                confidence = max(0.0, min(1.0, confidence))
            except (ValueError, TypeError):
                confidence = 0.85

            # Validate sensitive indicators
            raw_indicators = data.get("sensitive_indicators", [])
            if isinstance(raw_indicators, list):
                sensitive_indicators = [str(item).strip() for item in raw_indicators if str(item).strip()]
            else:
                sensitive_indicators = []

            # If age is Below 18, indicators should typically be empty
            if age_category == "Below 18" and not sensitive_indicators:
                sensitive_indicators = []

            reason = str(data.get("reason", "")).strip() or (
                "Content evaluated suitable for all audiences." if age_category == "Below 18" else "Content contains mature themes."
            )

            summary = str(data.get("summary", "")).strip()
            if not summary:
                summary = (description or title or "Summary not available.")[:300]

            severity = str(data.get("content_severity", "Low")).strip().capitalize()
            if severity not in ("Low", "Medium", "High"):
                severity = "High" if age_category == "18+" else "Low"

            return {
                "age_category": age_category,
                "confidence": round(confidence, 2),
                "reason": reason,
                "sensitive_indicators": sensitive_indicators,
                "summary": summary,
                "content_severity": severity,
            }

        except Exception as exc:
            last_error = exc
            logger.warning(f"Model {model_name} failed: {exc}, trying next model...")
            continue

    logger.error(f"All Gemini models failed: {last_error}", exc_info=True)
    return get_default_fallback_analysis(
        title, description, f"Analysis fallback (Gemini error: {str(last_error)[:100]})"
    )


def generate_detailed_summary(title: str, content: str) -> str:
    """
    Generates a 6-10 sentence comprehensive summary using Gemini API.
    """
    title = (title or "").strip()
    content = (content or "").strip()

    if not content and not title:
        return "No sufficient content to generate a detailed summary."

    if not GEMINI_API_KEY:
        return (
            f"Detailed Summary: {title}. "
            f"Content overview: {content[:400]}... (Configure GEMINI_API_KEY for complete AI-generated summary)."
        )

    prompt = GEMINI_DETAILED_SUMMARY_PROMPT.format(
        title=title or "Untitled",
        content=content[:7000] if content else title,
    )

    models_to_try = [GEMINI_MODEL, "gemini-3-flash-preview", "gemini-3.1-flash-lite", "gemini-flash-latest"]
    seen = set()
    models_to_try = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

    for model_name in models_to_try:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    top_p=0.9,
                    max_output_tokens=1024,
                ),
                request_options={"timeout": 15},
            )
            if hasattr(response, "text") and response.text:
                return response.text.strip()
        except Exception as exc:
            logger.warning(f"Detailed summary model {model_name} failed: {exc}, trying next...")
            continue
    return "Detailed summary generation returned empty output."
