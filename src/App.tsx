import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { WantToReadPage } from '@/pages/WantToReadPage'
import { CollectionsPage } from '@/pages/CollectionsPage'
import { CollectionDetailPage } from '@/pages/CollectionDetailPage'
import { SearchPage } from '@/pages/SearchPage'
import { BookDetailPage } from '@/pages/BookDetailPage'
import { BookPreviewPage } from '@/pages/BookPreviewPage'
import { SettingsPage } from '@/pages/SettingsPage'
import ScanPage from '@/pages/ScanPage'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login"         element={<LoginPage />} />
            <Route path="/signup"        element={<SignUpPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected — all wrapped in AppShell */}
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/library"             element={<LibraryPage />} />
              <Route path="/want-to-read"        element={<WantToReadPage />} />
              <Route path="/collections"         element={<CollectionsPage />} />
              <Route path="/collections/:id"     element={<CollectionDetailPage />} />
              <Route path="/search"              element={<SearchPage />} />
              <Route path="/books/preview"        element={<BookPreviewPage />} />
              <Route path="/books/:id"           element={<BookDetailPage />} />
              <Route path="/settings"            element={<SettingsPage />} />
              <Route path="/scan"               element={<ScanPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/library" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
