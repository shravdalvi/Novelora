import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ReaderSettingsProvider } from './context/ReaderSettingsContext'
import { AppRoutes } from './routes/AppRoutes'

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReaderSettingsProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                border: '3px solid #1A1A1A',
                boxShadow: '6px 6px 0 #1A1A1A',
                borderRadius: '0px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                padding: '12px 18px',
                color: '#1A1A1A',
                backgroundColor: '#EDE8DF',
              },
            }}
          />
          <AppRoutes />
        </ReaderSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
