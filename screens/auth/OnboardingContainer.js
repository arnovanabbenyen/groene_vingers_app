import { useState } from 'react';
import OnboardingSlide from '../../components/onboarding/OnboardingSlide';
import { ONBOARDING_SLIDES } from '../../components/onboarding/slides.config';

export default function OnboardingContainer({ onComplete, onSkip }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slide = ONBOARDING_SLIDES[currentIndex];
  const isLast = currentIndex === ONBOARDING_SLIDES.length - 1;

  function handleContinue() {
    if (isLast) {
      onComplete?.();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  return (
    <OnboardingSlide
      slide={slide}
      step={currentIndex + 1}
      total={ONBOARDING_SLIDES.length}
      onContinue={handleContinue}
      onSkip={onSkip}
    />
  );
}
