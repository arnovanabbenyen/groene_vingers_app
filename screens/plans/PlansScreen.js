import { ScrollView, StyleSheet, View } from 'react-native';
import ScreenHeader from '../../components/headers/ScreenHeader';
import PlanOptionCard from '../../components/plans/PlanOptionCard';
import { COLORS, SPACING } from '../../components/theme/tokens';

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

export default function PlansScreen({ onBack }) {
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
            buttonLabel={plan.buttonLabel}
            buttonVariant={plan.buttonVariant}
            features={plan.features}
            onPress={() => {}}
          />
        ))}
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
});
