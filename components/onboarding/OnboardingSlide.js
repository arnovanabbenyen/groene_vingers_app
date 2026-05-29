import { View, StyleSheet } from 'react-native';
import OnboardingLayout from './OnboardingLayout';

const ONBOARDING = {
  circleSize: 226,
  iconSize: 90,
  variants: {
    green: {
      circleBackground: '#E2EDD8',
      iconColor: '#36392B',
    },
    yellow: {
      circleBackground: '#FAE49C',
      iconColor: '#8A7010',
    },
    beige: {
      circleBackground: '#DCD7C6',
      iconColor: '#36392B',
    },
  },
};

export default function OnboardingSlide({ slide, step, total, onContinue, onSkip, onBack, isLast = false }) {
  const variant = ONBOARDING.variants[slide.variant] ?? ONBOARDING.variants.green;
  const IconComponent = slide.icon;

  const illustration = (
    <View
      style={[styles.circle, { backgroundColor: variant.circleBackground }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <IconComponent
        size={ONBOARDING.iconSize}
        color={variant.iconColor}
        weight="regular"
      />
    </View>
  );

  return (
    <OnboardingLayout
      title={slide.title}
      subtitle={slide.subtitle}
      illustration={illustration}
      onSkip={onSkip}
      onBack={onBack}
      onContinue={onContinue}
      step={step}
      total={total}
      ctaLabel={isLast ? 'Aan de slag' : 'Volgende'}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    width: ONBOARDING.circleSize,
    height: ONBOARDING.circleSize,
    borderRadius: ONBOARDING.circleSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
