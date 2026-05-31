import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BellIcon, MapPinIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function TuineigenaarHeader({
  location = 'Locatie',
  firstName = 'Arno',
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View>
            <View style={styles.locationRow}>
              <MapPinIcon size={14} color={COLORS.textInverse} weight="regular" accessibilityElementsHidden />
              <Text style={styles.locationText}>{location}</Text>
            </View>
            <Text style={styles.greeting}>Hallo, {firstName}</Text>
          </View>

          <Pressable
            onPress={onOpenNotifications}
            hitSlop={8}
            style={styles.bellWrap}
            accessibilityRole="button"
            accessibilityLabel={
              unreadNotificationsCount > 0
                ? `Meldingen, ${unreadNotificationsCount} ongelezen`
                : 'Meldingen'
            }
          >
            <BellIcon size={24} color={COLORS.textInverse} weight="regular" accessibilityElementsHidden />
            {unreadNotificationsCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : String(unreadNotificationsCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  locationText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.sm,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
  greeting: {
    marginTop: 6,
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 25,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
  },
  bellWrap: {
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.negative,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
  },
  bellBadgeText: {
    color: COLORS.surface,
    fontSize: 9,
    fontFamily: FONTS.bodyMedium,
    lineHeight: 11,
  },
});
