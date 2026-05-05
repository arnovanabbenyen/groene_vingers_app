import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Notebook } from 'phosphor-react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { COLORS } from '../../components/theme/tokens';

export default function InfoScreen3({ onContinue, onSkip }) {
  const illustration = (
    <View style={styles.illustrationInner}>
      <View style={styles.ellipse} />
      <View style={styles.iconWrap}>
        <Notebook size={46} color={COLORS.textPrimary} weight="regular" />
      </View>
    </View>
  );

  return (
    <OnboardingLayout
      title="Houd alles bij"
      subtitle="Documenteer je perceelbezoeken, noteer opvolgingen en volg je groei seizoen per seizoen."
      illustration={illustration}
      onSkip={onSkip}
      onContinue={onContinue}
      step={3}
      total={3}
    />
  );
}

const styles = StyleSheet.create({
  illustrationInner: {
    width: 226,
    height: 226,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipse: {
    position: 'absolute',
    width: 226,
    height: 226,
    borderRadius: 113,
    backgroundColor: 'rgba(220, 215, 198, 1)',
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
