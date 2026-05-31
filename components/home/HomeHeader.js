import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon, HeartIcon, MapPinIcon, MagnifyingGlassIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../theme/tokens';

export default function HomeHeader({
  onPressSearchBar,
  onPressNotifications,
  notificationCount = 0,
  onPressHeart,
  firstName,
  plaats,
}) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(46, insets.top + 18);
  const displayName = firstName || 'daar';
  const displayPlaats = plaats || 'Locatie';

  return (
    <View style={styles.headerWrap}>
      <LinearGradient
        colors={[COLORS.brand, COLORS.brandMid, COLORS.brand]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.headerGradient, { paddingTop: topPadding }]}
      >
        <View style={styles.topRow}>
          <View>
            <View style={styles.locationRow}>
              <MapPinIcon size={14} color={COLORS.textInverse} weight="regular" />
              <Text style={styles.locationText}>{displayPlaats}</Text>
            </View>
            <Text style={styles.greeting}>Hallo, {displayName}</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={onPressNotifications}
              hitSlop={8}
              style={styles.bellWrap}
              accessibilityRole="button"
              accessibilityLabel={
                notificationCount > 0
                  ? `Meldingen, ${notificationCount} ongelezen`
                  : 'Meldingen'
              }
            >
              <BellIcon size={24} color={COLORS.textInverse} weight="regular" />
              {notificationCount > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {notificationCount > 9 ? '9+' : String(notificationCount)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={onPressHeart}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Opgeslagen percelen"
            >
              <HeartIcon size={24} color={COLORS.textInverse} weight="regular" />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.searchBar}
          onPress={onPressSearchBar}
          accessibilityRole="search"
          accessibilityLabel="Zoeken naar een tuin"
          accessibilityHint="Tik om percelen te zoeken op de kaart"
        >
          <MagnifyingGlassIcon size={18} color={COLORS.textSecondary} weight="regular" />
          <Text style={styles.searchPlaceholder}>Zoek percelen op naam of plaats...</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    height: SIZES.headerHeight,
    overflow: 'hidden',
    backgroundColor: COLORS.brand,
    ...SHADOWS.header,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: SPACING.screenX,
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
    marginTop: SPACING.sm,
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 25,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: 2,
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
  searchBar: {
    marginTop: SPACING.md,
    height: SIZES.searchBarHeight,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.search,
  },
  searchPlaceholder: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.body,
  },
});
