import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon } from 'phosphor-react-native';
import { supabase } from '../../services/supabase';
import { getLogboekEntriesForMonth } from '../../services/logboek';
import MonthCalendar from '../../components/logboek/MonthCalendar';
import LogEntryCard from '../../components/logboek/LogEntryCard';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
];

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function LogboekMonthScreen({ onBack, onOpenLogDetail, aanvraagId }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loggedDates, setLoggedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const canGoNext =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth());

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) { if (mounted) setIsLoading(false); return; }

        const { logs: monthLogs, loggedDates: dates } =
          await getLogboekEntriesForMonth(user.id, year, month, aanvraagId);

        if (mounted) {
          setLogs(monthLogs);
          setLoggedDates(dates);
        }
      } catch (err) {
        console.warn('LogboekMonthScreen load error', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [year, month]);

  // Deselect when month changes
  useEffect(() => {
    setSelectedDate(null);
  }, [year, month]);

  function handlePrevMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    if (!canGoNext) return;
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleDayPress(date) {
    if (selectedDate && toLocalDateKey(selectedDate) === toLocalDateKey(date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  }

  const displayedLogs = useMemo(() => {
    if (!selectedDate) return logs;
    const key = toLocalDateKey(selectedDate);
    return logs.filter((log) => log.logged_at === key);
  }, [logs, selectedDate]);

  function formatSelectedDate(date) {
    return date.toLocaleDateString('nl-BE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  const sectionTitle = selectedDate
    ? `Logs op ${formatSelectedDate(selectedDate)}`
    : `Alle logs van ${MONTH_NAMES[month]}`;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} accessibilityRole="button">
            <ArrowLeftIcon size={20} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Logboek</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <Pressable
            onPress={handlePrevMonth}
            style={styles.navButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Vorige maand"
          >
            <CaretLeftIcon size={22} color={COLORS.textPrimary} weight="regular" />
          </Pressable>

          <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>

          <Pressable
            onPress={handleNextMonth}
            style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
            disabled={!canGoNext}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Volgende maand"
          >
            <CaretRightIcon size={22} color={COLORS.textPrimary} weight="regular" />
          </Pressable>
        </View>

        {/* Calendar card */}
        <View style={styles.calendarCard}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.brand} style={styles.calendarLoader} />
          ) : (
            <MonthCalendar
              year={year}
              month={month}
              loggedDates={loggedDates}
              selectedDate={selectedDate}
              onDayPress={handleDayPress}
            />
          )}
        </View>

        {/* Logs section */}
        <View style={styles.logsSection}>
          <Text style={styles.logsSectionTitle}>{sectionTitle}</Text>

          {isLoading ? (
            <ActivityIndicator color={COLORS.brand} style={{ marginTop: SPACING.md }} />
          ) : displayedLogs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {selectedDate
                  ? 'Geen logs op deze dag.'
                  : `Geen logs in ${MONTH_NAMES[month]}.`}
              </Text>
            </View>
          ) : (
            <View style={styles.logsList}>
              {displayedLogs.map((log) => (
                <LogEntryCard
                  key={log.id}
                  entry={log}
                  onPress={() => onOpenLogDetail?.(log.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    minHeight: 52,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 80,
  },
  backText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  headerSpacer: {
    minWidth: 80,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  monthTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  calendarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
    minHeight: 60,
  },
  calendarLoader: {
    paddingVertical: SPACING.xl,
  },
  logsSection: {
    gap: SPACING.sm,
  },
  logsSectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  logsList: {
    gap: SPACING.xs,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
