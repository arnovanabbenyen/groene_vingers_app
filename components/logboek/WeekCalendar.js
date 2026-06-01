import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CaretLeftIcon, CaretRightIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

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

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

export default function WeekCalendar({ loggedDates = [], onExpand }) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));

  const weekDates = getWeekDates(weekStart);
  const loggedSet = new Set(loggedDates.map((d) => d.slice(0, 10)));
  const todayStr = toDateString(today);

  const monthLabel = weekStart.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });

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
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <Pressable onPress={prevWeek} hitSlop={8} accessibilityLabel="Vorige week">
          <CaretLeftIcon size={18} color={COLORS.textSecondary} weight="regular" />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={nextWeek} hitSlop={8} accessibilityLabel="Volgende week">
          <CaretRightIcon size={18} color={COLORS.textSecondary} weight="regular" />
        </Pressable>
      </View>

      <Pressable
        onPress={onExpand}
        style={styles.daysRow}
        accessibilityRole="button"
        accessibilityLabel="Maandoverzicht openen"
        accessibilityHint="Toon het volledige maandoverzicht"
      >
        {weekDates.map((date, idx) => {
          const dateStr = toDateString(date);
          const isLogged = loggedSet.has(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <View key={dateStr} style={styles.dayCol}>
              {isLogged ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
              <View style={[styles.dayChip, isToday && styles.dayChipToday]}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {DAYS[idx]}
                </Text>
                <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                  {date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  monthLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.brand,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
  dayChip: {
    width: 36,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    gap: 1,
  },
  dayChipToday: {
    backgroundColor: COLORS.brand,
  },
  dayLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xxs,
    color: COLORS.textSecondary,
  },
  dayLabelToday: {
    color: COLORS.textInverse,
  },
  dayNum: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  dayNumToday: {
    color: COLORS.textInverse,
  },
});
