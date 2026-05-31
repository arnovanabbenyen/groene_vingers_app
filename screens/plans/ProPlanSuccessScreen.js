import { Confetti } from 'phosphor-react-native';
import EmptyState from '../../components/common/EmptyState';
import { COLORS, SPACING } from '../../components/theme/tokens';

export default function ProPlanSuccessScreen({ onDiscoverPercelen }) {
  return (
    <EmptyState
      icon={Confetti}
      iconSize={56}
      iconColor={COLORS.brand}
      iconBgColor={COLORS.surfaceBrand}
      title="Joepie, je zit nu op het pro plan!"
      body="Je kunt nu matchen met tuineigenaars en een logboek bijhouden"
      cta={{
        label: 'Ontdek percelen',
        onPress: onDiscoverPercelen,
        accessibilityLabel: 'Ontdek percelen',
        hint: 'Ga naar het overzicht van percelen',
      }}
      ctaPlacement="bottom"
      style={styles.screen}
    />
  );
}

const styles = {
  screen: {
    backgroundColor: COLORS.background,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
};
