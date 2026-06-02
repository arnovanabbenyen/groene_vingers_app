import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/navigation/Header';
import AmenityIcon from '../../components/kaart/AmenityIcon';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';
import { SAMENWERKING_TYPES } from '../../services/samenwerkingTypes';
import { countMatchingPercelen, DEFAULT_FILTERS } from '../../services/perceelFilters';

const AFSTAND_MIN = 1;
const AFSTAND_MAX = 15;
const AFSTAND_MARKS = [1, 8, 15];

const AMENITY_OPTIONS = ['Water', 'Tools', 'Zaden', 'Compost', 'Bomen'];

const GROOTTE_OPTIONS = [
  { label: 'Maakt niet uit', value: 'any' },
  { label: '< 10 m²', value: '<10' },
  { label: '10 - 30 m²', value: '10-30' },
  { label: '30+ m²', value: '30+' },
];

function AfstandSlider({ value, onChange }) {
  const trackRef = useRef(null);
  const trackWidthRef = useRef(0);
  const animValue = useRef(new Animated.Value(value)).current;
  const currentValueRef = useRef(value);

  useEffect(() => {
    animValue.setValue(value);
    currentValueRef.current = value;
  }, [value, animValue]);

  function percentToValue(pct) {
    const raw = pct * (AFSTAND_MAX - AFSTAND_MIN) + AFSTAND_MIN;
    return Math.round(Math.max(AFSTAND_MIN, Math.min(AFSTAND_MAX, raw)));
  }

  const thumbLeft = animValue.interpolate({
    inputRange: [AFSTAND_MIN, AFSTAND_MAX],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const fillWidth = animValue.interpolate({
    inputRange: [AFSTAND_MIN, AFSTAND_MAX],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        if (trackWidthRef.current > 0) {
          const pct = Math.max(0, Math.min(1, x / trackWidthRef.current));
          const v = percentToValue(pct);
          currentValueRef.current = v;
          animValue.setValue(v);
          onChange(v);
        }
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        if (trackWidthRef.current > 0) {
          const pct = Math.max(0, Math.min(1, x / trackWidthRef.current));
          const v = percentToValue(pct);
          currentValueRef.current = v;
          animValue.setValue(v);
          onChange(v);
        }
      },
      onPanResponderRelease: () => {
        onChange(currentValueRef.current);
      },
    }),
  ).current;

  return (
    <View style={slider.wrap}>
      <View
        ref={trackRef}
        style={slider.track}
        onLayout={(e) => { trackWidthRef.current = e.nativeEvent.layout.width; }}
        {...panResponder.panHandlers}
      >
        <Animated.View style={[slider.fill, { width: fillWidth }]} />
        <Animated.View style={[slider.thumb, { left: thumbLeft }]} />
      </View>
      <View style={slider.marksRow}>
        {AFSTAND_MARKS.map((m) => (
          <Text key={m} style={slider.markLabel}>{m}km</Text>
        ))}
      </View>
    </View>
  );
}

export default function FilterScreen({
  visible,
  onClose,
  onApply,
  initialFilters = DEFAULT_FILTERS,
  percelen = [],
  userLocation = null,
}) {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    if (visible) setFilters(initialFilters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function resetFilters() {
    setFilters({ ...DEFAULT_FILTERS });
  }

  function toggleVoorzienig(label) {
    setFilters((f) => ({
      ...f,
      voorzieningen: f.voorzieningen.includes(label)
        ? f.voorzieningen.filter((v) => v !== label)
        : [...f.voorzieningen, label],
    }));
  }

  function toggleSamenwerking(type) {
    setFilters((f) => ({
      ...f,
      samenwerking: f.samenwerking.includes(type)
        ? f.samenwerking.filter((v) => v !== type)
        : [...f.samenwerking, type],
    }));
  }

  const matchCount = useMemo(
    () => countMatchingPercelen(percelen, filters, userLocation),
    [percelen, filters, userLocation],
  );

  const handleAfstandChange = useCallback((v) => {
    setFilters((f) => ({ ...f, maxAfstand: v }));
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <Header title="Filter" onBack={onClose} contentStyle={styles.headerContentOffset} />

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Afstand */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Afstand:</Text>
            <AfstandSlider
              value={filters.maxAfstand}
              onChange={handleAfstandChange}
            />
            {filters.maxAfstand < AFSTAND_MAX && (
              <Text style={styles.afstandValue}>Max {filters.maxAfstand} km</Text>
            )}
          </View>

          {/* Aanwezig */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Aanwezig:</Text>
            <View style={styles.amenityRow}>
              {AMENITY_OPTIONS.map((label) => {
                const selected = filters.voorzieningen.includes(label);
                return (
                  <Pressable
                    key={label}
                    style={({ pressed }) => [styles.amenityItem, pressed && styles.amenityItemPressed]}
                    onPress={() => toggleVoorzienig(label)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                  >
                    <View style={[styles.amenityCircle, selected && styles.amenityCircleSelected]}>
                      <AmenityIcon
                        label={label}
                        size={22}
                        color={selected ? COLORS.textInverse : COLORS.textSecondary}
                        weight={selected ? 'fill' : 'regular'}
                      />
                    </View>
                    <Text style={[styles.amenityLabel, selected && styles.amenityLabelSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Grootte */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Grootte van de tuin:</Text>
            <View style={styles.pillWrap}>
              {GROOTTE_OPTIONS.map(({ label, value }) => {
                const selected = filters.grootte === value;
                return (
                  <Pressable
                    key={value}
                    style={({ pressed }) => [
                      styles.pill,
                      selected && styles.pillSelected,
                      pressed && styles.pillPressed,
                    ]}
                    onPress={() => setFilters((f) => ({ ...f, grootte: value }))}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                  >
                    <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]} numberOfLines={1}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Type samenwerking */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Type samenwerking:</Text>
            <View style={styles.pillWrap}>
              <Pressable
                style={({ pressed }) => [
                  styles.pill,
                  filters.samenwerking.length === 0 && styles.pillSelected,
                  pressed && styles.pillPressed,
                ]}
                onPress={() => setFilters((f) => ({ ...f, samenwerking: [] }))}
                accessibilityRole="button"
                accessibilityState={{ selected: filters.samenwerking.length === 0 }}
                accessibilityLabel="Maakt niet uit"
              >
                <Text style={[styles.pillLabel, filters.samenwerking.length === 0 && styles.pillLabelSelected]} numberOfLines={1}>
                  Maakt niet uit
                </Text>
              </Pressable>
              {SAMENWERKING_TYPES.map((type) => {
                const selected = filters.samenwerking.includes(type);
                return (
                  <Pressable
                    key={type}
                    style={({ pressed }) => [
                      styles.pill,
                      selected && styles.pillSelected,
                      pressed && styles.pillPressed,
                    ]}
                    onPress={() => toggleSamenwerking(type)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={type}
                  >
                    <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]} numberOfLines={1}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Apply bar */}
        <View style={[styles.applyBar, { paddingBottom: insets.bottom + SPACING.md }]}>
          <Pressable
            style={({ pressed }) => [styles.applyBtn, pressed && styles.applyBtnPressed]}
            onPress={() => onApply(filters)}
            accessibilityRole="button"
            accessibilityLabel={
              matchCount === 0
                ? 'Geen resultaten'
                : `Toon ${matchCount} ${matchCount === 1 ? 'tuin' : 'tuinen'}`
            }
          >
            <Text style={styles.applyLabel}>
              {matchCount === 0
                ? 'Geen resultaten'
                : `Toon ${matchCount} ${matchCount === 1 ? 'tuin' : 'tuinen'}`}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.resetBtn, pressed && styles.resetBtnPressed]}
            onPress={resetFilters}
            accessibilityRole="button"
            accessibilityLabel="Wis alle filters"
          >
            <Text style={styles.resetLabel}>Wis filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const slider = StyleSheet.create({
  wrap: {
    paddingTop: 8,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    position: 'relative',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    marginLeft: -10,
    top: -7,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  marksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginHorizontal: 10,
  },
  markLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.brand,
    minHeight: 129,
  },
  headerContentOffset: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingTop: 30,
    paddingBottom: 35,
    position: 'relative',
  },
  headerSpacer: {
    width: 96,
    opacity: 0,
  },
  titleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
    textAlign: 'center',
    includeFontPadding: false,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    zIndex: 2,
  },
  backText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.displayMedium,
    includeFontPadding: false,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.screenX,
    gap: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  afstandValue: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.brand,
    textAlign: 'center',
    marginTop: -8,
  },
  amenityRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  amenityItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  amenityItemPressed: { opacity: 0.7 },
  amenityCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityCircleSelected: {
    backgroundColor: COLORS.brand,
  },
  amenityLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  amenityLabelSelected: {
    color: COLORS.brand,
    fontFamily: FONTS.bodyMedium,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pill: {
    borderWidth: 2,
    borderColor: COLORS.brand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: COLORS.brand,
  },
  pillPressed: { opacity: 0.75 },
  pillLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.brand,
    fontWeight: '600',
    textAlign: 'center',
  },
  pillLabelSelected: {
    color: COLORS.textInverse,
  },
  samenwerkingList: {
    gap: SPACING.sm,
  },
  samenwerkingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(87,98,56,0.05)',
  },
  samenwerkingItemSelected: {
    backgroundColor: 'rgba(87,98,56,0.12)',
  },
  samenwerkingCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  samenwerkingCheckSelected: {
    borderColor: COLORS.brand,
  },
  samenwerkingCheckInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  samenwerkingLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  samenwerkingLabelSelected: {
    color: COLORS.brand,
  },
  applyBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.dividerSoft,
  },
  resetBtn: {
    borderWidth: 2,
    borderColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetLabel: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.brand,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  applyBtnPressed: { opacity: 0.85 },
  applyLabel: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
  resetBtnPressed: { opacity: 0.7 },
});
