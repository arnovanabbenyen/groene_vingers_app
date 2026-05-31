import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftIcon, HeartIcon, MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import { useSavedPercelen } from '../../hooks/useSavedPercelen';
import { useFavorites } from '../../hooks/useFavorites';
import PlotCard from '../../components/home/PlotCard';
import { mapPerceelToPlot } from '../../utils/mapPerceelToPlot';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SIZES, SPACING } from '../../components/theme/tokens';

export default function OpgeslagenScreen({ onBack, onPerceelPress }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [removedIds, setRemovedIds] = useState(new Set());

  const { percelen, isLoading } = useSavedPercelen();
  const { isFavorite, toggleFavorite } = useFavorites();

  const filteredPercelen = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return percelen
      .filter((p) => !removedIds.has(p.id))
      .filter((p) => {
        if (!q) return true;
        return [p.naam, p.plaats].join(' ').toLowerCase().includes(q);
      });
  }, [percelen, removedIds, searchQuery]);

  function handleToggleFavorite(perceelId) {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.add(perceelId);
      return next;
    });
    toggleFavorite(perceelId);
  }

  const isEmpty = !isLoading && filteredPercelen.length === 0;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: Math.max(SPACING.xl, insets.top + SPACING.md) }]}>
        <View style={styles.titleRow}>
          <Pressable
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Terug"
          >
            <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
          </Pressable>
          <Text style={styles.headerTitle} accessibilityRole="header">Opgeslagen</Text>
        </View>

        <View style={styles.searchPill}>
          <MagnifyingGlassIcon size={18} color={COLORS.textSecondary} weight="regular" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Zoek in opgeslagen..."
            placeholderTextColor={COLORS.textSecondary}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Zoek in opgeslagen percelen"
            accessibilityHint="Typ om te filteren op naam of plaats"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Zoekopdracht wissen"
            >
              <XIcon size={16} color={COLORS.textSecondary} weight="regular" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={COLORS.brand}
          style={styles.loader}
          accessibilityLabel="Laden..."
        />
      ) : isEmpty ? (
        <View style={styles.emptyState} accessible accessibilityRole="text">
          <HeartIcon size={48} color={COLORS.brand} weight="regular" accessibilityElementsHidden />
          <Text style={styles.emptyTitle}>
            {searchQuery.trim() ? 'Geen resultaten' : 'Nog niets opgeslagen'}
          </Text>
          <Text style={styles.emptyBody}>
            {searchQuery.trim()
              ? 'Geen opgeslagen percelen gevonden voor je zoekopdracht.'
              : 'Sla percelen op door op het hartje te tikken.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredPercelen.map((perceel) => {
            const plot = mapPerceelToPlot(perceel);
            return (
              <PlotCard
                key={perceel.id}
                plot={plot}
                onPress={() => onPerceelPress?.(plot)}
                isFavorited={isFavorite(perceel.id)}
                onToggleFavorite={() => handleToggleFavorite(perceel.id)}
                showFavoriteButton
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: COLORS.textInverse,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: 22,
  },
  searchPill: {
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
  loader: {
    marginTop: SPACING.xl,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.screenX,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
