import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../theme/tokens';

export default function AuthProgressBar({ step, totalSteps }) {
  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Stap ${step} van ${totalSteps}`}
      accessibilityValue={{ min: 0, max: totalSteps, now: step }}
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View key={i} style={[styles.segment, i < step && styles.segmentFill]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 3,
    height: 3,
  },
  segment: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(181,184,167,0.35)',
  },
  segmentFill: {
    backgroundColor: COLORS.brand,
  },
});
