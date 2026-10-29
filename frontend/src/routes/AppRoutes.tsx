import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminRoute } from './AdminRoute'

// Reader / Public Pages
import { Landing } from '../pages/Landing'
import { Library } from '../pages/Library'
import { BookDetail } from '../pages/BookDetail'
import { ReadChapter } from '../pages/ReadChapter'
import { Login } from '../pages/Login'
import { Signup } from '../pages/Signup'
import { About } from '../pages/About'
import { Bookshelf } from '../pages/Bookshelf'
import { Profile } from '../pages/Profile'

// Admin Pages
import { Dashboard } from '../pages/admin/Dashboard'
import { BooksList } from '../pages/admin/BooksList'
import { BookForm } from '../pages/admin/BookForm'
import { ChaptersList } from '../pages/admin/ChaptersList'
import { WritingStudio } from '../pages/admin/WritingStudio'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Reader Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/library" element={<Library />} />
      <Route path="/book/:slug" element={<BookDetail />} />
      <Route path="/read/:bookSlug/:chapterNumber" element={<ReadChapter />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/about" element={<About />} />

      {/* Reader Authenticated Route */}
      <Route
        path="/bookshelf"
        element={
          <ProtectedRoute>
            <Bookshelf />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/books"
        element={
          <AdminRoute>
            <BooksList />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/books/new"
        element={
          <AdminRoute>
            <BookForm />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/books/:id/edit"
        element={
          <AdminRoute>
            <BookForm />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/books/:id/chapters"
        element={
          <AdminRoute>
            <ChaptersList />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/chapters/:id/edit"
        element={
          <AdminRoute>
            <WritingStudio />
          </AdminRoute>
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
