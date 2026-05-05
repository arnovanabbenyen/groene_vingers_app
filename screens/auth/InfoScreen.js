import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapPin } from 'phosphor-react-native';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';

export default function InfoScreen({ onContinue, onSkip }) {
  const illustration = (
    <View style={styles.illustrationInner}>
      <View style={styles.ellipse} />
      <View style={styles.iconWrap}>
        <MapPin size={36} color={COLORS.brand} weight="fill" />
      </View>
    </View>
  );

  return (
    <OnboardingLayout
      title="Vind jouw groene plek"
      subtitle="Ontdek privétuinen in jouw buurt die deelbaar zijn. Dicht bij huis, op maat van jou."
      illustration={illustration}
      onSkip={onSkip}
      onContinue={onContinue}
      step={1}
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
