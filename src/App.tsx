import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { WantToReadPage } from '@/pages/WantToReadPage'
import { CollectionsPage } from '@/pages/CollectionsPage'
import { BookDetailPage } from '@/pages/BookDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/signup"        element={<SignUpPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected routes — wrapped in AppShell */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/library"      element={<LibraryPage />} />
            <Route path="/want-to-read" element={<WantToReadPage />} />
            <Route path="/collections"  element={<CollectionsPage />} />
            <Route path="/books/:id"    element={<BookDetailPage />} />
            <Route path="/settings"     element={<SettingsPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/library" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
