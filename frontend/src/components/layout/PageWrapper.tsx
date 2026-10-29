import React, { useEffect } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export interface PageWrapperProps {
  children: React.ReactNode
  title?: string
  noNavbar?: boolean
  noFooter?: boolean
  className?: string
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  noNavbar = false,
  noFooter = false,
  className = '',
}) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Novelora`
    } else {
      document.title = 'Novelora – Stories, panel by panel'
    }
    window.scrollTo(0, 0)
  }, [title])

  return (
    <div className="min-h-screen bg-bone flex flex-col selection:bg-sage selection:text-bone">
      {!noNavbar && <Navbar />}
      <main className={`flex-1 ${className}`}>{children}</main>
      {!noFooter && <Footer />}
    </div>
  )
}
