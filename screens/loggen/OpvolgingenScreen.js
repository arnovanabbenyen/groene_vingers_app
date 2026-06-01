import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  CircleIcon,
  TrashIcon,
} from 'phosphor-react-native';
import { StatusBar } from 'expo-status-bar';
import Header from '../../components/navigation/Header';
import AuthButton from '../../components/buttons/AuthButton';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
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
  return dateStr < toLocalDateKey(new Date());
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
    } catch {
      showToast('Kon opvolgingen niet laden.', 'error');
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
    } catch {
      showToast('Kon status niet bijwerken.', 'error');
    }
  }

  async function handleDelete(opvolging) {
    try {
      const { error } = await deleteOpvolging(opvolging.id);
      if (error) throw error;
      setOpvolgingen((prev) => prev.filter((o) => o.id !== opvolging.id));
    } catch {
      showToast('Kon opvolging niet verwijderen.', 'error');
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Header title="Opvolgingen" onBack={onBack} backLabel="Terug" />

      {isLoading ? (
        <ActivityIndicator color={COLORS.brand} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Open tasks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Te doen{open.length > 0 ? ` (${open.length})` : ''}
            </Text>

            {open.length === 0 ? (
              <EmptyState
                icon={CheckSquareIcon}
                title="Geen openstaande taken"
                body="Voeg een opvolging toe via de knop onderaan."
                compact
              />
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
                <Text style={styles.sectionTitle}>Afgerond ({completed.length})</Text>
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

      <View style={[styles.saveBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <AuthButton
          label="Nieuwe opvolging"
          onPress={onNieuweOpvolging}
          accessibilityLabel="Nieuwe opvolging toevoegen"
        />
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
        accessibilityLabel={`${item.title} verwijderen`}
      >
        <TrashIcon size={18} color={COLORS.negative} weight="regular" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
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
  saveBar: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.background,
  },
});
