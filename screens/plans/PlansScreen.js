import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/navigation/Header';
import PlanOptionCard from '../../components/plans/PlanOptionCard';
import ProPlanConfirmScreen from './ProPlanConfirmScreen';
import ProPlanSuccessScreen from './ProPlanSuccessScreen';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../../components/theme/tokens';
import { createCheckoutSession } from '../../services/stripe';

const PLAN_OPTIONS = [
  {
    key: 'pro',
    variant: 'pro',
    title: 'Pro',
    price: '€7,01',
    priceSuffix: 'Per maand (incl. €1,22 btw)',
    note: null,
    buttonLabel: 'Selecteer Pro',
    buttonVariant: 'solid',
    features: [
      { label: 'Percelen bekijken & zoeken', included: true },
      { label: 'Matchen met tuineigenaar', included: true },
      { label: 'Logboek bijhouden', included: true },
    ],
  },
  {
    key: 'free',
    variant: 'free',
    title: 'Gratis',
    price: '€0',
    priceSuffix: 'Per maand',
    note: 'Altijd gratis, geen kredietkaart nodig',
    buttonLabel: 'Huidig plan',
    buttonVariant: 'outline',
    features: [
      { label: 'Percelen bekijken', included: true },
      { label: 'Matchen met tuineigenaar', included: false },
      { label: 'Logboek bijhouden', included: false },
    ],
  },
];

export default function PlansScreen({ onBack, onUpgradeSuccess, onDiscoverPercelen }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const insets = useSafeAreaInsets();

  if (showSuccess) {
    return (
      <ProPlanSuccessScreen
        onDiscoverPercelen={() => {
          onUpgradeSuccess?.();
          onDiscoverPercelen?.();
        }}
      />
    );
  }

  if (showConfirm) {
    return (
      <ProPlanConfirmScreen
        onBack={() => setShowConfirm(false)}
        onConfirm={handleStartPro}
        isLoading={isLoading}
      />
    );
  }

  async function handleStartPro() {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const session = await createCheckoutSession();

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Groene Vingers',
        customerId: session.customerId,
        customerEphemeralKeySecret: session.ephemeralKeySecret,
        paymentIntentClientSecret: session.paymentIntentClientSecret,
        allowsDelayedPaymentMethods: false,
        returnURL: Linking.createURL('stripe-redirect'),
      });

      if (initError) throw new Error(initError.message);

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') return;
        throw new Error(paymentError.message);
      }

      setShowSuccess(true);
      setStatusMessage(null);
    } catch (err) {
      console.error('Payment flow error:', err);
      Alert.alert('Er ging iets mis', err.message || 'Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  }

  return (
    <View style={styles.screen}>
      <Header title="Kies jouw plan" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(SPACING.xl, insets.bottom + SPACING.lg) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Kies een plan dat bij jou past en begin vandaag met tuinieren.
        </Text>

        {PLAN_OPTIONS.map((plan) => (
          <PlanOptionCard
            key={plan.key}
            variant={plan.variant}
            title={plan.title}
            price={plan.price}
            priceSuffix={plan.priceSuffix}
            note={plan.note}
            buttonLabel={plan.buttonLabel}
            buttonVariant={plan.buttonVariant}
            features={plan.features}
            isLoading={false}
            onPress={plan.key === 'pro' ? () => setShowConfirm(true) : onBack}
          />
        ))}

        {statusMessage ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color={COLORS.brand} size="small" />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}
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
    paddingTop: SPACING.xl,
    gap: SPACING.lg,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    fontFamily: FONTS.body,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  statusText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
