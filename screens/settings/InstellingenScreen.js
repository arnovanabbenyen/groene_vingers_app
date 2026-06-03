import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { CaretRightIcon, SignOutIcon, StarIcon, TrashSimpleIcon } from 'phosphor-react-native';
import Header from '../../components/navigation/Header';
import { showConfirm } from '../../components/common/ConfirmDialog';
import SettingsRow from '../../components/settings/SettingsRow';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';
import { useActiveSamenwerking } from '../../hooks/useActiveSamenwerking';
import { createBillingPortalSession } from '../../services/stripe';

export default function InstellingenScreen({
  role = 'tuinzoeker',
  onBack,
  onOpenProfielBewerken,
  onOpenNotificaties,
  onOpenKiesPlan,
  onOpenWeeklyGoal,
  onOpenWachtwoordWijzigen,
  onLogout,
}) {
  const [plan, setPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningBillingPortal, setIsOpeningBillingPortal] = useState(false);

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

  const { samenwerking: activeSamenwerking } = useActiveSamenwerking(role === 'tuinzoeker' ? 0 : null);
  const showProBanner = role === 'tuinzoeker' && plan === 'free';
  const showSubscriptionSection = role === 'tuinzoeker';

  async function handleLogout() {
    showConfirm({
      title: 'Uitloggen',
      message: 'Weet je zeker dat je wilt uitloggen?',
      confirmLabel: 'Uitloggen',
      cancelLabel: 'Annuleren',
      onConfirm: async () => {
        try { await supabase?.auth.signOut(); } catch (e) { console.warn('signOut error', e); }
        onLogout?.();
      },
    });
  }

  async function handleDeleteAccount() {
    showConfirm({
      title: 'Account verwijderen?',
      message: 'Je account wordt verwijderd. Je gegevens blijven 30 dagen bewaard voor het geval je terug wilt komen. Daarna worden ze definitief verwijderd. Lopende samenwerkingen blijven actief voor de andere partij.',
      confirmLabel: 'Verwijderen',
      cancelLabel: 'Annuleren',
      onConfirm: async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData?.session?.user?.id;
          if (!userId) return;

          await supabase
            .from('profiles')
            .update({ deleted_at: new Date().toISOString(), first_name: 'Verwijderd', last_name: 'Account' })
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
    });
  }

  async function handleOpenSubscription() {
    if (isOpeningBillingPortal) return;

    setIsOpeningBillingPortal(true);
    try {
      const session = await createBillingPortalSession({
        returnUrl: Linking.createURL(''),
      });

      if (!session?.url) throw new Error('no_url');

      await Linking.openURL(session.url);
    } catch (error) {
      console.warn('Failed to open billing portal', error);
      Alert.alert(
        'Abonnement beheren',
        'Het beheren van je abonnement is momenteel nog niet beschikbaar in de app. Dit wordt later toegevoegd.',
        [{ text: 'Begrepen' }],
      );
    } finally {
      setIsOpeningBillingPortal(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Header title="Instellingen" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.brand} style={styles.loader} accessibilityLabel="Laden" />
        ) : (
          <>
            {/* Pro nudging */}
            {showProBanner && (
              <>
                <Pressable
                  style={({ pressed }) => [styles.proBanner, pressed && styles.proBannerPressed]}
                  onPress={onOpenKiesPlan}
                  accessibilityRole="button"
                  accessibilityLabel="Upgrade naar Groene Vingers Pro"
                  accessibilityHint="Tik om de beschikbare plannen te bekijken"
                >
                  <StarIcon size={20} color={COLORS.accent} weight="fill" accessibilityElementsHidden />
                  <View style={styles.proBannerText}>
                    <Text style={styles.proBannerTitle}>Upgrade naar Pro</Text>
                    <Text style={styles.proBannerSubtitle}>Onbeperkte aanvragen en meer voordelen.</Text>
                  </View>
                  <CaretRightIcon size={16} color={COLORS.accent} weight="regular" accessibilityElementsHidden />
                </Pressable>

                <View style={styles.sectionCard}>
                  <SettingsRow
                    label="Abonnement"
                    badge={plan === 'pro' ? 'Pro' : 'Gratis'}
                    onPress={onOpenKiesPlan}
                  />
                </View>
              </>
            )}

            {showSubscriptionSection && plan === 'pro' && (
              <>
                <Text style={styles.sectionLabel}>Abonnement</Text>
                <View style={styles.sectionCard}>
                  <SettingsRow
                    label="Mijn abonnement"
                    badge="Pro"
                    onPress={handleOpenSubscription}
                    sublabel="Beheer of zeg je abonnement op via Stripe."
                    disabled={isOpeningBillingPortal}
                  />
                </View>
              </>
            )}

            {/* Account */}
            <Text style={styles.sectionLabel}>Account</Text>
            <View style={styles.sectionCard}>
              <SettingsRow label="Persoonlijke gegevens" onPress={onOpenProfielBewerken} />
              <View style={styles.divider} />
              <SettingsRow
                label="Wachtwoord wijzigen"
                onPress={onOpenWachtwoordWijzigen ?? (() =>
                  Alert.alert('Binnenkort beschikbaar', 'Wachtwoord wijzigen is binnenkort beschikbaar.')
                )}
              />
              <View style={styles.divider} />
              <SettingsRow label="Notificaties" onPress={onOpenNotificaties} />
            </View>

            {/* Logboek (tuinzoeker only) */}
            {role === 'tuinzoeker' && (
              <>
                <Text style={styles.sectionLabel}>Logboek</Text>
                <View style={styles.sectionCard}>
                  <SettingsRow
                    label="Wekelijks doel"
                    onPress={activeSamenwerking ? onOpenWeeklyGoal : undefined}
                    disabled={!activeSamenwerking}
                    sublabel={!activeSamenwerking ? 'Beschikbaar zodra je een actieve samenwerking hebt.' : undefined}
                  />
                </View>
              </>
            )}

            {/* Meer */}
            <Text style={styles.sectionLabel}>Meer</Text>
            <View style={styles.sectionCard}>
              <SettingsRow
                label="Help & ondersteuning"
                onPress={() => Alert.alert('Binnenkort beschikbaar', 'Help & ondersteuning is binnenkort beschikbaar.')}
              />
            </View>

            {/* Danger zone */}
            <View style={[styles.sectionCard, styles.sectionCardDanger]}>
              <SettingsRow
                label="Account verwijderen"
                destructive
                showCaret={false}
                rightElement={<TrashSimpleIcon size={18} color={COLORS.negative} weight="regular" accessibilityElementsHidden />}
                onPress={handleDeleteAccount}
                accessibilityHint="Verwijder je account permanent"
              />
              <View style={styles.divider} />
              <SettingsRow
                label="Uitloggen"
                destructive
                showCaret={false}
                rightElement={<SignOutIcon size={18} color={COLORS.negative} weight="regular" accessibilityElementsHidden />}
                onPress={handleLogout}
              />
            </View>
          </>
        )}
      </ScrollView>
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
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  // Pro nudging
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  proBannerPressed: {
    opacity: 0.88,
  },
  proBannerText: {
    flex: 1,
    gap: 2,
  },
  proBannerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.accent,
  },
  proBannerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textInverse,
    lineHeight: 18,
  },
  // Sections
  sectionLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  sectionCardDanger: {
    marginTop: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
    marginHorizontal: SPACING.md,
  },
});
