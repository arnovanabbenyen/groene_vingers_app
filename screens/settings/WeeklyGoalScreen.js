import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon, MinusIcon, PlusIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';
import { updateWeeklyLogGoal } from '../../services/logboek';

export default function WeeklyGoalScreen({ onBack, onSaved }) {
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
      Alert.alert('Opslaan mislukt', e.message || 'Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Terug"
          >
            <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>
          <Text style={styles.headerTitle} accessibilityRole="header">Wekelijks doel</Text>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <ActivityIndicator color={COLORS.brand} style={{ marginTop: 40 }} />
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
            >
              <MinusIcon size={22} color={goal <= 1 ? COLORS.textMuted : COLORS.textPrimary} weight="regular" />
            </Pressable>

            <View style={styles.goalDisplay}>
              <Text style={styles.goalNumber}>{goal}</Text>
              <Text style={styles.goalUnit}>per week</Text>
            </View>

            <Pressable
              style={[styles.stepperBtn, goal >= 7 && styles.stepperBtnDisabled]}
              onPress={() => setGoal((g) => Math.min(7, g + 1))}
              disabled={goal >= 7}
              accessibilityRole="button"
              accessibilityLabel="Doel verhogen"
            >
              <PlusIcon size={22} color={goal >= 7 ? COLORS.textMuted : COLORS.textPrimary} weight="regular" />
            </Pressable>
          </View>

          <Pressable
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Doel opslaan"
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.textInverse} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Opslaan</Text>
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
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  body: {
    flex: 1,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl,
    gap: SPACING.lg,
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
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
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
  saveButton: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
});
