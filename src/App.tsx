import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { CategoryPage, FavoritesPage, RecentPage, SearchPage } from './pages/BrowsePages'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ToolPage } from './pages/ToolPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="tools/:id" element={<ToolPage />} />
        <Route path="category/:categoryId" element={<CategoryPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="recent" element={<RecentPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
