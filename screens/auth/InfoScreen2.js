import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Leaf } from 'phosphor-react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { COLORS } from '../../components/theme/tokens';

export default function InfoScreen2({ onContinue, onSkip }) {
  const illustration = (
    <View style={styles.illustrationInner}>
      <View style={styles.ellipse} />
      <View style={styles.iconWrap}>
        <Leaf size={36} color={COLORS.brand} weight="fill" />
      </View>
    </View>
  );

  return (
    <OnboardingLayout
      title="Leer van andere tuiniers"
      subtitle="Krijg tips en ervaringen van lokale tuiniers om je eigen project te laten slagen."
      illustration={illustration}
      onSkip={onSkip}
      onContinue={onContinue}
      step={2}
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
    borderRadius: 226 / 2,
    backgroundColor: 'rgba(251,246,234,0.5)',
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 90 / 2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
