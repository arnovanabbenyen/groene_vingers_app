import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  CaretRightIcon,
  SignOutIcon,
  StarIcon,
  TrashSimpleIcon,
} from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';

export default function InstellingenScreen({
  role = 'tuinzoeker',
  onBack,
  onOpenProfielBewerken,
  onOpenNotificaties,
  onOpenKiesPlan,
  onOpenWeeklyGoal,
  onLogout,
}) {
  const [plan, setPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPlan() {
      if (!supabase) { if (mounted) setIsLoading(false); return; }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) { if (mounted) setIsLoading(false); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', userId)
          .maybeSingle();

        if (mounted) {
          setPlan(profile?.plan ?? 'free');
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('Failed to load plan', e);
        if (mounted) setIsLoading(false);
      }
    }

    loadPlan();
    return () => { mounted = false; };
  }, []);

  const showProFeatures = role === 'tuinzoeker' && plan === 'free';

  async function handleLogout() {
    Alert.alert(
      'Uitloggen',
      'Weet je zeker dat je wilt uitloggen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Uitloggen',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase?.auth.signOut();
            } catch (e) {
              console.warn('signOut error', e);
            }
            onLogout?.();
          },
        },
      ],
    );
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Account verwijderen?',
      'Je account wordt verwijderd. Je gegevens blijven 30 dagen bewaard voor het geval je terug wilt komen. Daarna worden ze definitief verwijderd. Lopende samenwerkingen blijven actief voor de andere partij.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              const userId = sessionData?.session?.user?.id;
              if (!userId) return;

              await supabase
                .from('profiles')
                .update({
                  deleted_at: new Date().toISOString(),
                  first_name: 'Verwijderd',
                  last_name: 'Account',
                })
                .eq('id', userId);

              await supabase
                .from('percelen')
                .update({ status: 'deleted' })
                .eq('owner_id', userId);

              await supabase?.auth.signOut();
              onLogout?.();
            } catch (e) {
              console.warn('Delete account error', e);
              Alert.alert('Fout', 'Account kon niet worden verwijderd. Probeer opnieuw.');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Terug naar profiel"
          >
            <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Instellingen</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.brand} style={{ marginTop: SPACING.xl }} />
        ) : (
          <>
            {showProFeatures && (
              <TouchableOpacity
                style={styles.proBanner}
                onPress={() => onOpenKiesPlan?.()}
                accessibilityRole="button"
                accessibilityLabel="Upgrade naar Pro voor onbeperkte aanvragen"
              >
                <StarIcon size={16} color={COLORS.accent} weight="regular" />
                <Text style={styles.proBannerText}>
                  Upgrade naar Pro voor onbeperkte aanvragen
                </Text>
                <CaretRightIcon size={16} color={COLORS.accent} weight="regular" />
              </TouchableOpacity>
            )}

            <Text style={styles.sectionLabel}>Account</Text>

            <TouchableOpacity
              style={styles.row}
              onPress={onOpenProfielBewerken}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>Persoonlijke gegevens</Text>
              <CaretRightIcon size={24} color={COLORS.textPrimary} weight="regular" />
            </TouchableOpacity>
            <View style={styles.divider} />

            {showProFeatures && (
              <>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => onOpenKiesPlan?.()}
                  accessibilityRole="button"
                >
                  <View style={styles.rowLabelWrap}>
                    <Text style={styles.rowLabel}>Abonnement</Text>
                    <View style={styles.gratisBadge}>
                      <Text style={styles.gratisBadgeText}>Gratis</Text>
                    </View>
                  </View>
                  <CaretRightIcon size={24} color={COLORS.textPrimary} weight="regular" />
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                // TODO: implement identity verification flow
                Alert.alert('Binnenkort beschikbaar', 'Account verificatie is binnenkort beschikbaar.');
              }}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>Account verifiëren</Text>
              <CaretRightIcon size={24} color={COLORS.textPrimary} weight="regular" />
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={onOpenNotificaties}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>Notificaties</Text>
              <CaretRightIcon size={24} color={COLORS.textPrimary} weight="regular" />
            </TouchableOpacity>

            {role === 'tuinzoeker' && (
              <>
                <Text style={[styles.sectionLabel, styles.sectionLabelMeer]}>Logboek</Text>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => onOpenWeeklyGoal?.()}
                  accessibilityRole="button"
                >
                  <Text style={styles.rowLabel}>Wekelijks doel</Text>
                  <CaretRightIcon size={24} color={COLORS.textPrimary} weight="regular" />
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}

            <Text style={[styles.sectionLabel, styles.sectionLabelMeer]}>Meer</Text>

            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                // TODO: link to FAQ / support portal
                Alert.alert('Binnenkort beschikbaar', 'Help & ondersteuning is binnenkort beschikbaar.');
              }}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>Help & ondersteuning</Text>
              <CaretRightIcon size={24} color={COLORS.textPrimary} weight="regular" />
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={handleDeleteAccount}
              accessibilityRole="button"
              accessibilityLabel="Account verwijderen"
            >
              <Text style={styles.rowLabel}>Account verwijderen</Text>
              <TrashSimpleIcon size={24} color={COLORS.negative} weight="regular" />
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Uitloggen"
            >
              <Text style={styles.rowLabel}>Uitloggen</Text>
              <SignOutIcon size={24} color={COLORS.negative} weight="regular" />
            </TouchableOpacity>
            <View style={styles.divider} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: 48,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    height: 38,
    paddingHorizontal: SPACING.screenX,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  proBannerText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
  },
  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  sectionLabelMeer: {
    marginTop: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  rowLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  rowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  gratisBadge: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  gratisBadgeText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textInverse,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
  },
});
