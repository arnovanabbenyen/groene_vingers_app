import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { FunnelIcon, MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../theme/tokens';

export default function KaartHeader({
  searchInputRef,
  searchQuery,
  onChangeText,
  onSubmit,
  onClear,
  onFilterPress,
  hasActiveFilters = false,
  paddingTop = 0,
}) {
  return (
    <View style={[styles.header, { paddingTop }]}>
      <View style={styles.inner}>
        <View style={styles.searchRow}>
          <View style={styles.searchPill}>
            <MagnifyingGlassIcon
              size={18}
              color={COLORS.textSecondary}
              weight="regular"
              accessibilityElementsHidden
            />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={onChangeText}
              placeholder="Zoek percelen op naam of plaats..."
              placeholderTextColor={COLORS.textSecondary}
              returnKeyType="search"
              onSubmitEditing={onSubmit}
              accessibilityLabel="Zoeken naar percelen"
              accessibilityRole="search"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={onClear}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Zoekopdracht wissen"
              >
                <XIcon size={16} color={COLORS.textSecondary} weight="regular" />
              </Pressable>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.filterBtn, pressed && styles.filterBtnPressed]}
            hitSlop={8}
            onPress={onFilterPress}
            accessibilityRole="button"
            accessibilityLabel={hasActiveFilters ? 'Filters actief — aanpassen' : 'Filters openen'}
          >
            <FunnelIcon size={20} color={COLORS.textInverse} weight="regular" />
            {hasActiveFilters && <View style={styles.filterDot} />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.brand,
  },
  inner: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    height: SIZES.searchBarHeight,
    gap: SPACING.sm,
    ...SHADOWS.search,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  filterBtn: {
    width: SIZES.iconBtn,
    height: SIZES.iconBtn,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnPressed: { opacity: 0.7 },
  filterDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: SIZES.dot,
    height: SIZES.dot,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accent,
  },
});
