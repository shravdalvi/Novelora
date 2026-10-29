import React from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Hero } from '../components/landing/Hero'
import { MarqueeStrip } from '../components/landing/MarqueeStrip'
import { FeaturedBooks } from '../components/landing/FeaturedBooks'
import { LatestChapters } from '../components/landing/LatestChapters'
import { HowItWorks } from '../components/landing/HowItWorks'
import { AuthorSection } from '../components/landing/AuthorSection'
import { Newsletter } from '../components/landing/Newsletter'

export const Landing: React.FC = () => {
  return (
    <PageWrapper title="Home" noNavbar>
      <Hero />
      <MarqueeStrip />
      <FeaturedBooks />
      <LatestChapters />
      <HowItWorks />
      <AuthorSection />
      <Newsletter />
    </PageWrapper>
  )
}

export default Landing
