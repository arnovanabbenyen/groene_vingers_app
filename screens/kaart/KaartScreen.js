import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  DropIcon,
  FunnelIcon,
  LeafIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlantIcon,
  ShovelIcon,
  TreeIcon,
  XIcon,
} from 'phosphor-react-native';
// TODO: voor productie EAS builds op Android, voeg een Google Maps API key toe aan
//       app.json onder android.config.googleMaps.apiKey.
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomNav from '../../components/navigation/BottomNav';
import { useMapPercelen } from '../../hooks/useMapPercelen';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOWS,
  SIZES,
  SPACING,
} from '../../components/theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 72;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.72;

const LEUVEN_REGION = {
  latitude: 50.8798,
  longitude: 4.7005,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function AmenityIcon({ label }) {
  const n = (label || '').toLowerCase();
  if (n.includes('water')) return <DropIcon size={13} color={COLORS.textSecondary} weight="regular" />;
  if (n.includes('shovel') || n.includes('materiaal')) return <ShovelIcon size={13} color={COLORS.textSecondary} weight="regular" />;
  if (n.includes('plant') || n.includes('zaden')) return <PlantIcon size={13} color={COLORS.textSecondary} weight="regular" />;
  if (n.includes('boom') || n.includes('tree')) return <TreeIcon size={13} color={COLORS.textSecondary} weight="regular" />;
  return <LeafIcon size={13} color={COLORS.textSecondary} weight="regular" />;
}

export default function KaartScreen({
  onTabPress,
  profileImageSource,
  badgeCounts = {},
  onOpenPerceel,
}) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const { percelen, isLoading } = useMapPercelen();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerceel, setSelectedPerceel] = useState(null);

  const sheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const currentHeightRef = useRef(COLLAPSED_HEIGHT);

  useEffect(() => {
    const id = sheetHeight.addListener(({ value }) => { currentHeightRef.current = value; });
    return () => sheetHeight.removeListener(id);
  }, [sheetHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 3,
      onPanResponderGrant: () => {
        sheetHeight.setOffset(currentHeightRef.current);
        sheetHeight.setValue(0);
      },
      onPanResponderMove: (_, gs) => {
        sheetHeight.setValue(-gs.dy);
      },
      onPanResponderRelease: () => {
        sheetHeight.flattenOffset();
        const mid = (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2;
        const target = currentHeightRef.current > mid ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
        Animated.spring(sheetHeight, {
          toValue: target,
          useNativeDriver: false,
          bounciness: 4,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        mapRef.current?.animateToRegion(
          {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          600,
        );
      } catch (_) {
        // keep Leuven default
      }
    })();
  }, []);

  const filteredPercelen = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return percelen;
    return percelen.filter((p) =>
      [p.naam, p.plaats].join(' ').toLowerCase().includes(q),
    );
  }, [searchQuery, percelen]);

  const perceelenWithCoords = filteredPercelen.filter(
    (p) => p.approximate_lat != null && p.approximate_lng != null,
  );

  function handlePinPress(perceel) {
    setSelectedPerceel((prev) => (prev?.id === perceel.id ? null : perceel));
    if (perceel.approximate_lat && perceel.approximate_lng) {
      mapRef.current?.animateToRegion(
        {
          latitude: parseFloat(perceel.approximate_lat),
          longitude: parseFloat(perceel.approximate_lng),
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        400,
      );
    }
  }

  function toPlotShape(perceel) {
    return {
      id: perceel.id,
      image: perceel.fotos?.[0] || null,
      fotos: perceel.fotos || [],
      location: perceel.plaats || 'Locatie niet beschikbaar',
      title: perceel.naam,
      naam: perceel.naam,
      plaats: perceel.plaats,
      adres: perceel.adres || null,
      beschrijving: perceel.beschrijving || null,
      size: perceel.grootte ? `${perceel.grootte}m²` : null,
      grootte: perceel.grootte,
      chips: perceel.voorzieningen || [],
      voorzieningen: perceel.voorzieningen || [],
      ownerId: perceel.owner_id,
      owner_id: perceel.owner_id,
    };
  }

  return (
    <View style={styles.screen}>
      {/* Green header */}
      <View style={[styles.headerBg, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.searchRow}>
            <View style={styles.searchPill}>
              <MagnifyingGlassIcon size={18} color={COLORS.textSecondary} weight="regular" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Zoek percelen op naam of plaats..."
                placeholderTextColor={COLORS.textSecondary}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <XIcon size={16} color={COLORS.textSecondary} weight="regular" />
                </Pressable>
              )}
            </View>
            <Pressable style={styles.filterBtn} hitSlop={8}>
              <FunnelIcon size={20} color={COLORS.textInverse} weight="regular" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Body: map full-screen + overlays */}
      <View style={styles.body}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={LEUVEN_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          pitchEnabled={false}
          rotateEnabled={false}
          onPress={() => setSelectedPerceel(null)}
        >
          {perceelenWithCoords.map((perceel) => {
            const isSelected = selectedPerceel?.id === perceel.id;
            return (
              <Marker
                key={perceel.id}
                coordinate={{
                  latitude: parseFloat(perceel.approximate_lat),
                  longitude: parseFloat(perceel.approximate_lng),
                }}
                onPress={() => handlePinPress(perceel)}
                tracksViewChanges={isSelected}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.pin, isSelected && styles.pinSelected]} pointerEvents="none">
                  <LeafIcon
                    size={isSelected ? 20 : 16}
                    color={COLORS.textInverse}
                    weight="fill"
                  />
                </View>
              </Marker>
            );
          })}

          {selectedPerceel?.approximate_lat && selectedPerceel?.approximate_lng && (
            <Circle
              center={{
                latitude: parseFloat(selectedPerceel.approximate_lat),
                longitude: parseFloat(selectedPerceel.approximate_lng),
              }}
              radius={200}
              strokeColor="rgba(87,98,56,0.45)"
              strokeWidth={1.5}
              fillColor="rgba(87,98,56,0.12)"
            />
          )}
        </MapView>

        {/* Popup card — floats above the collapsed sheet */}
        {selectedPerceel && (
          <Animated.View style={[styles.popupOverlay, { bottom: Animated.add(sheetHeight, 16) }]}>
            <PerceelPopupCard
              perceel={selectedPerceel}
              onClose={() => setSelectedPerceel(null)}
              onOpen={() => onOpenPerceel?.(toPlotShape(selectedPerceel))}
            />
          </Animated.View>
        )}

        {/* Snap bottom sheet */}
        <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
          <View style={styles.dragHandleWrap} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>
          <Text style={styles.countText}>
            {isLoading
              ? 'Laden...'
              : filteredPercelen.length > 0
                ? `Meer dan ${filteredPercelen.length} ${filteredPercelen.length === 1 ? 'tuin' : 'tuinen'}`
                : searchQuery.length > 0
                  ? `Geen resultaten voor "${searchQuery}"`
                  : 'Geen percelen beschikbaar'}
          </Text>
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.brand} style={styles.loader} />
            ) : (
              filteredPercelen.map((perceel) => (
                <MapPerceelCard
                  key={perceel.id}
                  perceel={perceel}
                  onPress={() => onOpenPerceel?.(toPlotShape(perceel))}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>

      <BottomNav
        activeKey="kaart"
        onTabPress={onTabPress}
        profileImageSource={profileImageSource}
        badgeCounts={badgeCounts}
      />
    </View>
  );
}

/* Sub-components */

function MapPerceelCard({ perceel, onPress }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = perceel.fotos?.[0];
  const hasImage = imageUrl && !imageError;
  const amenities = (perceel.voorzieningen || []).slice(0, 4);

  return (
    <Pressable style={card.container} onPress={onPress}>
      <View style={card.imageWrap}>
        {hasImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={card.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[card.image, card.imagePlaceholder]}>
            <LeafIcon size={32} color={COLORS.brand} weight="regular" />
          </View>
        )}
        <View style={card.badgeRow}>
          <View style={card.locationPill}>
            <MapPinIcon size={13} color={COLORS.textPrimary} weight="regular" />
            <Text style={card.pillText} numberOfLines={1}>
              {perceel.plaats || 'Locatie niet beschikbaar'}
            </Text>
          </View>
        </View>
      </View>

      <View style={card.body}>
        <View style={card.titleRow}>
          <Text style={card.title} numberOfLines={1}>
            {perceel.naam}
          </Text>
          {perceel.grootte != null && (
            <Text style={card.size}>{perceel.grootte}m²</Text>
          )}
        </View>

        {perceel.beschrijving ? (
          <Text style={card.description} numberOfLines={3}>
            {perceel.beschrijving}
          </Text>
        ) : null}

        {amenities.length > 0 && (
          <View style={card.amenityRow}>
            {amenities.map((label, i) => (
              <View key={label} style={card.amenityItem}>
                {i > 0 && <View style={card.amenityDivider} />}
                <AmenityIcon label={label} />
                <Text style={card.amenityText}>{label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function PerceelPopupCard({ perceel, onClose, onOpen }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = perceel.fotos?.[0];
  const hasImage = imageUrl && !imageError;

  return (
    <View style={popup.card}>
      {hasImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={popup.image}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[popup.image, popup.imagePlaceholder]}>
          <LeafIcon size={22} color={COLORS.brand} weight="regular" />
        </View>
      )}
      <View style={popup.info}>
        <Text style={popup.title} numberOfLines={1}>{perceel.naam}</Text>
        <Text style={popup.location} numberOfLines={1}>{perceel.plaats}</Text>
        {perceel.grootte != null && (
          <Text style={popup.size}>{perceel.grootte}m²</Text>
        )}
      </View>
      <View style={popup.actions}>
        <Pressable onPress={onClose} hitSlop={8} style={popup.closeBtn}>
          <XIcon size={16} color={COLORS.textSecondary} weight="regular" />
        </Pressable>
        <Pressable style={popup.openBtn} onPress={onOpen}>
          <Text style={popup.openBtnText}>Bekijk</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* Styles */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.surface },

  // Header
  headerBg: { backgroundColor: COLORS.brand },
  headerContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 12,
    paddingBottom: 16,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body
  body: { flex: 1 },

  // Pins
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  pinSelected: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brandMid,
  },

  // Popup — volgt de sheetHeight via Animated.add
  popupOverlay: {
    position: 'absolute',
    left: SPACING.screenX,
    right: SPACING.screenX,
  },

  // Snap bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 69,
    height: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#D9D9D9',
  },
  countText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  listScroll: { flex: 1 },
  listContent: { paddingBottom: SPACING.xl },
  loader: { marginTop: SPACING.lg },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.screenX,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  imageWrap: {
    width: '100%',
    height: 201,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: '70%',
  },
  pillText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  body: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  size: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amenityDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
    marginRight: 4,
  },
  amenityText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});

const popup = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  image: { width: 88, height: 88 },
  imagePlaceholder: {
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: 3,
  },
  title: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  location: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  size: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  actions: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  closeBtn: { padding: 4 },
  openBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  openBtnText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textInverse,
  },
});
