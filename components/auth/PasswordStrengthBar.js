import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '../theme/tokens';

const SEGMENT_COUNT = 3;
const INACTIVE_COLOR = '#E5E5E5';

const STRENGTH = {
  weak:   { color: '#E53935', label: 'Zwak',      segments: 1 },
  medium: { color: '#F59E0B', label: 'Gemiddeld',  segments: 2 },
  strong: { color: '#3F8E3F', label: 'Sterk',      segments: 3 },
};

export default function PasswordStrengthBar({ strength }) {
  if (!strength) return null;
  const config = STRENGTH[strength];
  if (!config) return null;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel={`Wachtwoord-sterkte: ${config.label}`}
      accessibilityValue={{ min: 0, max: SEGMENT_COUNT, now: config.segments }}
    >
      <View style={styles.barRow}>
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i < config.segments ? config.color : INACTIVE_COLOR },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:    { marginTop: 6, marginBottom: 4, gap: 4 },
  barRow:  { flexDirection: 'row', gap: 4, height: 4 },
  segment: { flex: 1, borderRadius: 2 },
  label:   { fontFamily: FONTS.bodyMedium, fontSize: 11 },
});
