import re
import socket
import ipaddress
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup
import trafilatura

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

def is_safe_url(url: str) -> tuple[bool, str]:
    """
    SSRF Protection: Block localhost, 127.x.x.x, 10.x.x.x, 172.16-31.x.x,
    192.168.x.x, 169.254.x.x, file://, internal hostnames.
    """
    if not url or not isinstance(url, str):
        return False, "Invalid URL provided."

    parsed = urlparse(url.strip())
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        return False, f"Unsupported scheme '{scheme}'. Only HTTP and HTTPS are allowed."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL does not contain a valid hostname."

    hostname_lower = hostname.lower()
    if hostname_lower in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
        return False, "Access to localhost or loopback is blocked."

    if (
        hostname_lower.endswith(".local")
        or hostname_lower.endswith(".internal")
        or hostname_lower.endswith(".lan")
        or hostname_lower.endswith(".home")
    ):
        return False, "Access to internal domain names is blocked."

    # Check if hostname directly represents an IP or resolves to private IP
    try:
        addr_infos = socket.getaddrinfo(hostname, None)
        for addr_info in addr_infos:
            ip_str = addr_info[4][0]
            ip = ipaddress.ip_address(ip_str)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False, f"Access to private/internal network IP '{ip_str}' is forbidden."
    except socket.gaierror:
        return False, f"Could not resolve hostname '{hostname}'."
    except Exception as e:
        return False, f"DNS resolution error: {str(e)}"

    return True, ""


def clean_text(text: str, max_chars: int = 8000) -> str:
    if not text:
        return ""
    # Normalize common mojibake sequences
    mojibake_map = {
        "â€™": "'",
        "â€˜": "'",
        "â€œ": '"',
        "â€\x9d": '"',
        "â€\x94": "—",
        "â€\x93": "–",
        "â€¦": "...",
        "â": "",
        "\u00e2\u0080\u0099": "'",
        "\u00e2\u0080\u0098": "'",
        "\u00e2\u0080\u009c": '"',
        "\u00e2\u0080\u009d": '"',
        "\u00e2\u0080\u0093": "–",
        "\u00e2\u0080\u0094": "—",
        "\u00e2\u0080\u00a6": "...",
    }
    for bad, good in mojibake_map.items():
        text = text.replace(bad, good)

    # Normalize unicode and whitespace
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text).strip()
    return text[:max_chars]


def extract_metadata_from_soup(soup: BeautifulSoup, url: str) -> dict:
    title = ""
    description = ""
    image_url = ""
    source = ""

    # Source / domain
    parsed = urlparse(url)
    source = parsed.netloc.replace("www.", "")

    # OpenGraph / Twitter / standard title
    og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "twitter:title"})
    if og_title and og_title.get("content"):
        title = og_title["content"].strip()
    elif soup.title and soup.title.string:
        title = soup.title.string.strip()
    elif soup.find("h1"):
        h1 = soup.find("h1")
        title = h1.get_text().strip()

    # Description
    og_desc = (
        soup.find("meta", property="og:description")
        or soup.find("meta", attrs={"name": "description"})
        or soup.find("meta", attrs={"name": "twitter:description"})
    )
    if og_desc and og_desc.get("content"):
        description = og_desc["content"].strip()

    # Image
    og_img = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "twitter:image"})
    if og_img and og_img.get("content"):
        image_url = og_img["content"].strip()

    # Site name
    og_site = soup.find("meta", property="og:site_name")
    if og_site and og_site.get("content"):
        source = og_site["content"].strip()

    return {
        "title": title,
        "description": description,
        "image_url": image_url,
        "source": source,
    }


def extract_article(url: str) -> dict:
    """
    Extracts article text and metadata from URL with SSRF protection,
    trafilatura primary extractor, and BeautifulSoup fallback.
    """
    safe, msg = is_safe_url(url)
    if not safe:
        return {
            "error": msg,
            "partial": True,
            "content": "",
            "title": "",
            "description": "",
            "image_url": "",
            "source": "",
        }

    raw_html = None
    try:
        response = requests.get(
            url,
            headers=DEFAULT_HEADERS,
            timeout=8,
            allow_redirects=True,
            verify=True,
        )
        response.raise_for_status()
        raw_html = response.text
    except Exception as req_err:
        # Try trafilatura fetch_url as second attempt if requests had issue (e.g. SSL or headers)
        try:
            raw_html = trafilatura.fetch_url(url)
        except Exception:
            raw_html = None

        if not raw_html:
            return {
                "error": f"Failed to fetch article: {str(req_err)}",
                "partial": True,
                "content": "",
                "title": "",
                "description": "",
                "image_url": "",
                "source": urlparse(url).netloc,
            }

    soup = BeautifulSoup(raw_html, "html.parser")
    meta = extract_metadata_from_soup(soup, url)

    # 1. Trafilatura extraction
    content = ""
    try:
        extracted = trafilatura.extract(
            raw_html,
            url=url,
            include_comments=False,
            include_tables=False,
            no_fallback=False,
        )
        if extracted:
            content = extracted.strip()
    except Exception:
        content = ""

    # 2. BeautifulSoup Fallback if trafilatura failed or returned empty
    partial = False
    if not content:
        partial = True
        body_elements = soup.find_all(["article", "main"])
        paragraphs = []
        if body_elements:
            for el in body_elements:
                for p in el.find_all("p"):
                    p_text = p.get_text().strip()
                    if len(p_text) > 25:
                        paragraphs.append(p_text)
        else:
            for p in soup.find_all("p"):
                p_text = p.get_text().strip()
                if len(p_text) > 25:
                    paragraphs.append(p_text)

        content = "\n\n".join(paragraphs)

    # If description is empty, use first paragraph or snippet
    if not meta["description"] and content:
        meta["description"] = content[:200] + ("..." if len(content) > 200 else "")

    cleaned_content = clean_text(content, max_chars=8000)

    # If content is still extremely short (< 100 chars), mark partial
    if len(cleaned_content) < 100:
        partial = True

    return {
        "title": meta["title"],
        "description": meta["description"],
        "content": cleaned_content,
        "image_url": meta["image_url"],
        "partial": partial,
        "source": meta["source"],
    }
