import { View, StyleSheet } from 'react-native';
import OnboardingLayout from './OnboardingLayout';
import { ONBOARDING } from '../theme/tokens';

export default function OnboardingSlide({ slide, step, total, onContinue, onSkip }) {
  const variant = ONBOARDING.variants[slide.variant] ?? ONBOARDING.variants.green;
  const IconComponent = slide.icon;

  const illustration = (
    <View style={[styles.circle, { backgroundColor: variant.circleBackground }]}>
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
      onContinue={onContinue}
      step={step}
      total={total}
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
