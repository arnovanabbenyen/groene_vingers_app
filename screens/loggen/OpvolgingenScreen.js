import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CircleIcon,
  PlusIcon,
  TrashIcon,
} from 'phosphor-react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../services/supabase';
import { deleteOpvolging, getOpvolgingen, toggleOpvolgingComplete } from '../../services/opvolgingen';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = toLocalDateKey(new Date());
  return dateStr < today;
}

export default function OpvolgingenScreen({ aanvraagId, onBack, onNieuweOpvolging, refreshKey = 0 }) {
  const insets = useSafeAreaInsets();

  const [opvolgingen, setOpvolgingen] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const open = opvolgingen.filter((o) => !o.completed_at);
  const completed = opvolgingen.filter((o) => !!o.completed_at);

  const loadOpvolgingen = useCallback(async () => {
    if (!aanvraagId) { setIsLoading(false); return; }
    try {
      const { data, error } = await getOpvolgingen(aanvraagId);
      if (error) throw error;
      setOpvolgingen(data || []);
    } catch (err) {
      console.warn('OpvolgingenScreen load error', err);
    } finally {
      setIsLoading(false);
    }
  }, [aanvraagId]);

  useEffect(() => {
    setIsLoading(true);
    loadOpvolgingen();
  }, [loadOpvolgingen, refreshKey]);

  async function handleToggle(opvolging) {
    const isCompleted = !opvolging.completed_at;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await toggleOpvolgingComplete(opvolging.id, isCompleted, user?.id);
      if (error) throw error;
      setOpvolgingen((prev) => prev.map((o) => (o.id === opvolging.id ? data : o)));
    } catch (err) {
      Alert.alert('Fout', 'Kon status niet bijwerken.');
    }
  }

  function handleDelete(opvolging) {
    Alert.alert(
      'Opvolging verwijderen',
      `Wil je "${opvolging.title}" verwijderen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteOpvolging(opvolging.id);
              if (error) throw error;
              setOpvolgingen((prev) => prev.filter((o) => o.id !== opvolging.id));
            } catch (err) {
              Alert.alert('Fout', 'Kon opvolging niet verwijderen.');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} accessibilityRole="button">
            <ArrowLeftIcon size={20} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Opvolgingen</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <ActivityIndicator color={COLORS.brand} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 96 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Open tasks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Te doen{open.length > 0 ? ` (${open.length})` : ''}
            </Text>

            {open.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Geen openstaande opvolgingen. Voeg er een toe!</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {open.map((item) => (
                  <OpvolgingRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Completed tasks */}
          {completed.length > 0 && (
            <View style={styles.section}>
              <Pressable
                style={styles.completedHeader}
                onPress={() => setCompletedExpanded((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={completedExpanded ? 'Afgeronde taken inklappen' : 'Afgeronde taken uitklappen'}
              >
                <Text style={styles.sectionTitle}>
                  Afgerond ({completed.length})
                </Text>
                {completedExpanded
                  ? <CaretUpIcon size={18} color={COLORS.textSecondary} weight="regular" />
                  : <CaretDownIcon size={18} color={COLORS.textSecondary} weight="regular" />
                }
              </Pressable>

              {completedExpanded && (
                <View style={styles.list}>
                  {completed.map((item) => (
                    <OpvolgingRow
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggle(item)}
                      onDelete={() => handleDelete(item)}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <View style={[styles.fabWrap, { bottom: insets.bottom + SPACING.lg }]}>
        <Pressable
          style={styles.fab}
          onPress={onNieuweOpvolging}
          accessibilityRole="button"
          accessibilityLabel="Nieuwe opvolging toevoegen"
        >
          <PlusIcon size={22} color={COLORS.textInverse} weight="bold" />
          <Text style={styles.fabText}>Nieuw</Text>
        </Pressable>
      </View>
    </View>
  );
}

function OpvolgingRow({ item, onToggle, onDelete }) {
  const isDone = !!item.completed_at;
  const overdue = !isDone && isOverdue(item.due_date);

  return (
    <View style={[styles.row, overdue && styles.rowOverdue, isDone && styles.rowDone]}>
      <Pressable
        style={styles.checkbox}
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityLabel={isDone ? 'Markeer als niet afgerond' : 'Markeer als afgerond'}
        accessibilityState={{ checked: isDone }}
      >
        {isDone
          ? <CheckCircleIcon size={24} color={COLORS.brand} weight="fill" />
          : <CircleIcon size={24} color={overdue ? COLORS.negative : COLORS.textSecondary} weight="regular" />
        }
      </Pressable>

      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, isDone && styles.rowTitleDone]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.rowDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        {item.due_date ? (
          <Text style={[styles.rowDue, overdue && styles.rowDueOverdue]}>
            {overdue ? 'Verlopen: ' : 'Deadline: '}{formatDueDate(item.due_date)}
          </Text>
        ) : null}
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Verwijderen"
      >
        <TrashIcon size={18} color={COLORS.textMuted} weight="regular" />
      </Pressable>
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
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    gap: SPACING.lg,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...SHADOWS.card,
  },
  rowOverdue: {
    borderColor: COLORS.negative,
  },
  rowDone: {
    opacity: 0.6,
  },
  checkbox: {
    paddingTop: 1,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  rowTitleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  rowDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  rowDue: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  rowDueOverdue: {
    color: COLORS.negative,
    fontFamily: FONTS.bodyMedium,
  },
  deleteButton: {
    paddingTop: 2,
  },
  fabWrap: {
    position: 'absolute',
    right: SPACING.screenX,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.card,
  },
  fabText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textInverse,
  },
});
