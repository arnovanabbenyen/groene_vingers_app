import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/tokens';
import AanvraagCard from './AanvraagCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.screenX * 2;
const CARD_GAP = SPACING.sm;

export default function AanvraagCarousel({ aanvragen, onView, onAccept }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!aanvragen || aanvragen.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(
            event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP),
          );
          setActiveIndex(Math.max(0, Math.min(aanvragen.length - 1, next)));
        }}
      >
        {aanvragen.map((aanvraag) => (
          <AanvraagCard
            key={aanvraag.id}
            aanvraag={aanvraag}
            onView={onView}
            onAccept={onAccept}
            style={styles.card}
          />
        ))}
      </ScrollView>

      {aanvragen.length > 1 ? (
        <View style={styles.dotsRow}>
          {aanvragen.map((aanvraag, index) => (
            <View
              key={`${aanvraag.id}-dot`}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    marginHorizontal: -SPACING.screenX,
    paddingHorizontal: SPACING.screenX,
  },
  scroll: {
    marginHorizontal: -SPACING.screenX,
  },
  content: {
    gap: CARD_GAP,
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 0,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  dot: {
    width: SPACING.sm,
    height: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.indicatorMuted,
  },
  dotActive: {
    backgroundColor: COLORS.brand,
    width: 24,
  },
});
