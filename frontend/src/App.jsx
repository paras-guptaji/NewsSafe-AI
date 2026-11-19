import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import AllNews from './pages/AllNews'
import NewsDetail from './pages/NewsDetail'
import AnalyzeURL from './pages/AnalyzeURL'
import Bookmarks from './pages/Bookmarks'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="news" element={<AllNews />} />
          <Route path="news/:id" element={<NewsDetail />} />
          <Route path="analyze" element={<AnalyzeURL />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
