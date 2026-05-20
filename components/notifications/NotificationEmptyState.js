import { StyleSheet, Text, View } from 'react-native';
import { BellSlashIcon } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

export default function NotificationEmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.illustrationContainer}>
        <BellSlashIcon size={60} color={COLORS.negative} weight="regular" />
      </View>
      <View style={styles.textContent}>
        <Text style={styles.emptyTitle}>Hier is het nog stil</Text>
        <Text style={styles.emptyBody}>Nieuwe meldingen verschijnen hier zodra er iets verandert.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.xl,
    justifyContent: 'center',
  },
  illustrationContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.negativeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    gap: SPACING.xs,
    alignItems: 'center',
    width: '100%',
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 25,
    lineHeight: 25,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBody: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.body,
    fontWeight: '400',
    textAlign: 'center',
  },
});
