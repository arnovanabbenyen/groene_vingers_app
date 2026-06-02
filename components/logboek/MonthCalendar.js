import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

// Returns local YYYY-MM-DD key — avoids UTC-midnight timezone drift
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Belgian standard: week starts on Monday (getDay 0=Sun → index 6, 1=Mon → index 0)
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekIndex = (firstOfMonth.getDay() + 6) % 7; // Mon=0 … Sun=6

  const totalCells = Math.ceil((firstWeekIndex + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstWeekIndex + 1;
    if (day < 1 || day > daysInMonth) return null;
    return new Date(year, month, day);
  });
}

export default function MonthCalendar({ year, month, loggedDates = [], selectedDate, onDayPress }) {
  const cells = buildMonthGrid(year, month);
  const loggedSet = new Set(loggedDates);
  const todayKey = toLocalDateKey(new Date());
  const selectedKey = selectedDate ? toLocalDateKey(selectedDate) : null;
  const todayDate = new Date();

  return (
    <View style={styles.container}>
      {/* Column headers */}
      <View style={styles.labelsRow}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.labelCell}>
            <Text style={styles.labelText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.emptyCell} />;
          }

          const key = toLocalDateKey(date);
          const hasLog = loggedSet.has(key);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const isFuture = date > todayDate;

          return (
            <Pressable
              key={key}
              style={styles.dayCell}
              onPress={() => !isFuture && onDayPress?.(date)}
              disabled={isFuture}
              accessibilityRole="button"
              accessibilityLabel={`${date.getDate()} ${date.toLocaleDateString('nl-BE', { month: 'long' })}${hasLog ? ', heeft log' : ''}`}
              accessibilityState={{ selected: isSelected, disabled: isFuture }}
            >
              <View style={[
                styles.dayCircle,
                isToday && !isSelected && styles.dayCircleToday,
                isSelected && styles.dayCircleSelected,
              ]}>
                <Text style={[
                  styles.dayNumber,
                  isFuture && styles.dayNumberFuture,
                  isToday && !isSelected && styles.dayNumberToday,
                  isSelected && styles.dayNumberSelected,
                ]}>
                  {date.getDate()}
                </Text>
              </View>
              {hasLog && (
                <View style={[styles.dot, isSelected && styles.dotSelected]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  labelCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 6,
  },
  labelText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: 'rgba(87,98,56,0.1)',
  },
  dayCircleSelected: {
    backgroundColor: COLORS.brand,
  },
  dayNumber: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  dayNumberFuture: {
    color: COLORS.textMuted,
    opacity: 0.4,
  },
  dayNumberToday: {
    color: COLORS.brand,
    fontFamily: FONTS.displaySemiBold,
  },
  dayNumberSelected: {
    color: COLORS.textInverse,
    fontFamily: FONTS.displaySemiBold,
  },
  dot: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accent,
  },
  dotSelected: {
    backgroundColor: COLORS.textInverse,
  },
});
