import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import * as Linking from 'expo-linking';
import ScreenHeader from '../../components/headers/ScreenHeader';
import PlanOptionCard from '../../components/plans/PlanOptionCard';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import { createCheckoutSession, pollForProStatus } from '../../services/stripe';

const PLAN_OPTIONS = [
  {
    key: 'pro',
    variant: 'pro',
    title: 'Pro',
    price: '€7,01',
    priceSuffix: '/ Per maand (inclusief €1,22 btw)',
    note: null,
    buttonLabel: 'Start Pro nu',
    buttonVariant: 'solid',
    features: [
      { label: 'Percelen bekijken & zoeken', included: true },
      { label: 'Matchen met tuin eigenaar', included: true },
      { label: 'Logboek bijhouden', included: true },
    ],
  },
  {
    key: 'free',
    variant: 'free',
    title: 'Gratis',
    price: '€0',
    priceSuffix: '/ Per maand',
    note: 'Altijd gratis, geen kredietkaart',
    buttonLabel: 'Huidige plan',
    buttonVariant: 'outline',
    features: [
      { label: 'Percelen bekijken', included: true },
      { label: 'Matchen met tuin eigenaar', included: false },
      { label: 'Logboek bijhouden', included: false },
    ],
  },
];

export default function PlansScreen({ onBack, onUpgradeSuccess }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

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

      setStatusMessage('We verwerken je betaling...');
      const isPro = await pollForProStatus();

      if (isPro) {
        Alert.alert(
          'Welkom bij Pro!',
          'Je upgrade is voltooid. Je kunt nu aanvragen sturen.',
          [{ text: 'OK', onPress: () => onUpgradeSuccess?.() }]
        );
      } else {
        Alert.alert(
          'Betaling ontvangen',
          'Je betaling is verwerkt. De activatie kan tot een minuut duren — open de app eventueel kort opnieuw.',
          [{ text: 'OK', onPress: () => onUpgradeSuccess?.() }]
        );
      }
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
      <ScreenHeader title="Kies jouw plan" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {PLAN_OPTIONS.map((plan) => (
          <PlanOptionCard
            key={plan.key}
            variant={plan.variant}
            title={plan.title}
            price={plan.price}
            priceSuffix={plan.priceSuffix}
            note={plan.note}
            buttonLabel={
              plan.key === 'pro' && isLoading ? 'Even geduld...' : plan.buttonLabel
            }
            buttonVariant={plan.buttonVariant}
            features={plan.features}
            onPress={plan.key === 'pro' ? (isLoading ? undefined : handleStartPro) : undefined}
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
    backgroundColor: COLORS.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 32,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statusText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
