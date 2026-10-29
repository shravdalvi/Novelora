import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#D8D0C2' }}>
        <div className="border-3 border-ink p-6 shadow-hard text-center" style={{ backgroundColor: '#233126' }}>
          <div className="font-bangers text-2xl tracking-comic mb-2 text-bone">LOADING...</div>
          <div className="font-grotesk text-sm text-bone/70">Verifying credentials</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
