import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FloppyDiskIcon, MinusIcon, PlusIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/navigation/Header';
import { showToast } from '../../components/common/Toast';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';
import { updateWeeklyLogGoal } from '../../services/logboek';

export default function WeeklyGoalScreen({ onBack, onSaved }) {
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState(4);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase) { if (mounted) setIsLoading(false); return; }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) { if (mounted) setIsLoading(false); return; }

        const { data } = await supabase
          .from('profiles')
          .select('weekly_log_goal')
          .eq('id', userId)
          .maybeSingle();

        if (mounted) {
          setGoal(data?.weekly_log_goal ?? 4);
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('WeeklyGoalScreen load error', e);
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  async function handleSave() {
    if (!supabase) return;
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Niet ingelogd');

      const { error } = await updateWeeklyLogGoal(userId, goal);
      if (error) throw error;

      onSaved?.();
    } catch (e) {
      console.warn('WeeklyGoalScreen save error', e);
      showToast(e.message || 'Opslaan mislukt. Probeer opnieuw.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Header title="Wekelijks doel" onBack={onBack} />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.brand} accessibilityLabel="Laden" />
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.description}>
            Hoeveel keer per week wil je jouw perceel bezoeken en loggen?
          </Text>

          <View style={styles.stepperCard}>
            <Pressable
              style={[styles.stepperBtn, goal <= 1 && styles.stepperBtnDisabled]}
              onPress={() => setGoal((g) => Math.max(1, g - 1))}
              disabled={goal <= 1}
              accessibilityRole="button"
              accessibilityLabel="Doel verlagen"
              accessibilityState={{ disabled: goal <= 1 }}
            >
              <MinusIcon
                size={22}
                color={goal <= 1 ? COLORS.textMuted : COLORS.textPrimary}
                weight="regular"
                accessibilityElementsHidden
              />
            </Pressable>

            <View
              style={styles.goalDisplay}
              accessible
              accessibilityLabel={`Huidig doel: ${goal} keer per week`}
            >
              <Text style={styles.goalNumber}>{goal}</Text>
              <Text style={styles.goalUnit}>per week</Text>
            </View>

            <Pressable
              style={[styles.stepperBtn, goal >= 7 && styles.stepperBtnDisabled]}
              onPress={() => setGoal((g) => Math.min(7, g + 1))}
              disabled={goal >= 7}
              accessibilityRole="button"
              accessibilityLabel="Doel verhogen"
              accessibilityState={{ disabled: goal >= 7 }}
            >
              <PlusIcon
                size={22}
                color={goal >= 7 ? COLORS.textMuted : COLORS.textPrimary}
                weight="regular"
                accessibilityElementsHidden
              />
            </Pressable>
          </View>
        </View>
      )}

      {!isLoading && (
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.md }]}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              isSaving && styles.saveBtnDisabled,
              pressed && !isSaving && styles.saveBtnPressed,
            ]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Doel opslaan"
            accessibilityState={{ disabled: isSaving, busy: isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.textInverse} size="small" />
            ) : (
              <>
                <FloppyDiskIcon size={20} color={COLORS.textInverse} weight="regular" />
                <Text style={styles.saveBtnText}>Opslaan</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl,
    gap: SPACING.lg,
  },
  actionBar: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  goalDisplay: {
    alignItems: 'center',
    gap: 2,
  },
  goalNumber: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 48,
    color: COLORS.textPrimary,
    lineHeight: 52,
  },
  goalUnit: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    height: SIZES.iconBtn,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
});
