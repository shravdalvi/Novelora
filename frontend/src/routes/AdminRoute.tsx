import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export interface AdminRouteProps {
  children: React.ReactNode
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#D8D0C2' }}>
        <div className="border-3 border-ink p-6 shadow-hard text-center" style={{ backgroundColor: '#233126' }}>
          <div className="font-bangers text-2xl tracking-comic mb-2 text-bone">VERIFYING ADMIN...</div>
          <div className="font-grotesk text-sm text-bone/70">Checking author permissions</div>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <>{children}</>
}
