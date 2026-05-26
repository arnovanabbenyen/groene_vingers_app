import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon, ArrowRightIcon } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DOT_SIZE = 10;
const CHIP_WIDTH = 36;

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export default function WeekCalendar({ loggedDates = [] }) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));

  const weekDates = getWeekDates(weekStart);
  const loggedSet = new Set(loggedDates.map((d) => String(d).slice(0, 10)));
  const todayStr = toISODate(today);

  const monthLabel = weekStart.toLocaleDateString('nl-BE', {
    month: 'long',
    year: 'numeric',
  });

  function prevWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function nextWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  return (
    <View style={styles.root}>
      {/* Month header */}
      <View style={styles.monthRow}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <View style={styles.arrows}>
          <Pressable onPress={prevWeek} hitSlop={8} accessibilityLabel="Vorige week">
            <ArrowLeftIcon size={20} color={COLORS.textPrimary} weight="regular" />
          </Pressable>
          <Pressable onPress={nextWeek} hitSlop={8} accessibilityLabel="Volgende week">
            <ArrowRightIcon size={20} color={COLORS.textPrimary} weight="regular" />
          </Pressable>
        </View>
      </View>

      {/* Dots row */}
      <View style={styles.dotsRow}>
        {weekDates.map((date) => {
          const dateStr = toISODate(date);
          const isLogged = loggedSet.has(dateStr);
          return (
            <View key={dateStr} style={styles.dotCell}>
              {isLogged ? <View style={styles.dot} /> : null}
            </View>
          );
        })}
      </View>

      {/* Day chips */}
      <View style={styles.chipsRow}>
        {weekDates.map((date, idx) => {
          const dateStr = toISODate(date);
          const isToday = dateStr === todayStr;
          return (
            <View
              key={dateStr}
              style={[styles.chip, isToday && styles.chipToday]}
            >
              <Text style={[styles.chipDayLabel, isToday && styles.chipTextToday]}>
                {DAY_LABELS[idx]}
              </Text>
              <Text style={[styles.chipDate, isToday && styles.chipTextToday]}>
                {String(date.getDate()).padStart(2, '0')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: SPACING.sm,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  arrows: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dotCell: {
    width: CHIP_WIDTH,
    alignItems: 'center',
    height: DOT_SIZE,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: COLORS.brand,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    width: CHIP_WIDTH,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 32,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  chipToday: {
    backgroundColor: COLORS.brand,
  },
  chipDayLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(0,0,0,0.6)',
    lineHeight: 10,
  },
  chipDate: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.textPrimary,
    lineHeight: 10,
  },
  chipTextToday: {
    color: COLORS.textInverse,
  },
});
