import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Bell.js';
import { HeartIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Heart.js';
import { MapPinIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/MapPin.js';
import { MagnifyingGlassIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/MagnifyingGlass.js';
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../theme/tokens';

export default function HomeHeader({ searchQuery, onSearchChange, onPressNotifications }) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(46, insets.top + 18);

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
              <Text style={styles.locationText}>Leuven</Text>
            </View>
            <Text style={styles.greeting}>Hallo, Arno</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable onPress={onPressNotifications} hitSlop={8}>
              <BellIcon size={24} color={COLORS.textInverse} weight="regular" />
            </Pressable>
            <Pressable>
              <HeartIcon size={24} color={COLORS.textInverse} weight="regular" />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBar}>
          <MagnifyingGlassIcon size={27} color={COLORS.textSecondary} weight="regular" />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Zoeken naar een perceel"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
              <Text style={styles.clearText}>Wis</Text>
            </Pressable>
          ) : null}
        </View>
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
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
  greeting: {
    marginTop: 3,
    color: COLORS.textInverse,
    fontSize: 25,
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
  searchBar: {
    marginTop: SPACING.md,
    height: SIZES.searchBarHeight,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.search,
  },
  searchInput: {
    flex: 1,
    marginLeft: 14,
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.bodyMedium,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearText: {
    marginLeft: 12,
    color: COLORS.brand,
    fontSize: 13,
    lineHeight: 16,
    fontFamily: FONTS.bodyMedium,
    fontWeight: '500',
  },
});
