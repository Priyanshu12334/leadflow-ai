import React from 'react';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Pricing } from '../components/landing/Pricing';
import { FAQ } from '../components/landing/FAQ';
import { CtaSection } from '../components/landing/CtaSection';

export const LandingPage = () => {
  return (
    <div>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CtaSection />
    </div>
  );
};
