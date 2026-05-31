import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MapPinIcon, NavigationArrowIcon } from 'phosphor-react-native';
// TODO: voor productie EAS builds op Android, voeg een Google Maps API key toe aan
//       app.json onder android.config.googleMaps.apiKey.
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomNav from '../../components/navigation/BottomNav';
import KaartHeader from '../../components/kaart/KaartHeader';
import MapMarker from '../../components/kaart/MapMarker';
import MapPerceelCard from '../../components/kaart/MapPerceelCard';
import PerceelPopupCard from '../../components/kaart/PerceelPopupCard';
import FilterScreen from './FilterScreen';
import { useMapPercelen } from '../../hooks/useMapPercelen';
import { useFavorites } from '../../hooks/useFavorites';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOWS,
  SIZES,
  SPACING,
} from '../../components/theme/tokens';
import { DEFAULT_FILTERS, hasActiveFilters, passesFilters } from '../../services/perceelFilters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 72;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.72;

const LEUVEN_REGION = {
  latitude: 50.8798,
  longitude: 4.7005,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

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

export default function KaartScreen({
  onTabPress,
  profileImageSource,
  badgeCounts = {},
  onOpenPerceel,
  autoFocusSearch = false,
}) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const { percelen, isLoading } = useMapPercelen();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerceel, setSelectedPerceel] = useState(null);
  const [trackingMarkerId, setTrackingMarkerId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const suggestionsTimer = useRef(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);
  const { isFavorite, toggleFavorite } = useFavorites();

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
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
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

  useEffect(() => {
    if (!autoFocusSearch) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [autoFocusSearch]);

  const filteredPercelen = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return percelen.filter((p) => {
      if (q && ![p.naam, p.plaats].join(' ').toLowerCase().includes(q)) return false;
      return passesFilters(p, activeFilters, userLocation);
    });
  }, [searchQuery, percelen, activeFilters, userLocation]);

  useEffect(() => {
    if (suggestionsTimer.current) clearTimeout(suggestionsTimer.current);
    if (searchQuery.trim().length < 2) { setSuggestions([]); return; }
    suggestionsTimer.current = setTimeout(async () => {
      try {
        const key = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY;
        const url = `https://api.locationiq.com/v1/autocomplete?key=${key}&q=${encodeURIComponent(searchQuery.trim())}&limit=5&dedupe=1&countrycodes=be`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        setSuggestions(Array.isArray(json) ? json.slice(0, 5) : []);
      } catch (_) { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(suggestionsTimer.current);
  }, [searchQuery]);

  function handleSuggestionSelect(suggestion) {
    setSearchQuery(suggestion.display_name.split(',')[0].trim());
    setSuggestions([]);
    if (mapRef.current && suggestion.lat && suggestion.lon) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(suggestion.lat),
        longitude: parseFloat(suggestion.lon),
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  }

  async function handleSearchSubmit() {
    setSuggestions([]);
    if (!searchQuery.trim() || !mapRef.current) return;
    try {
      const key = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY;
      const url = `https://us1.locationiq.com/v1/search?key=${key}&q=${encodeURIComponent(searchQuery.trim())}&format=json&limit=1&countrycodes=be`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (!json?.[0]) return;
      const { lat, lon } = json[0];
      mapRef.current.animateToRegion(
        { latitude: parseFloat(lat), longitude: parseFloat(lon), latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500,
      );
    } catch (_) {}
  }

  function handlePinPress(perceel) {
    setSelectedPerceel((prev) => (prev?.id === perceel.id ? null : perceel));
    setTrackingMarkerId(perceel.id);
    setTimeout(() => setTrackingMarkerId(null), 150);
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

  const perceelenWithCoords = filteredPercelen.filter(
    (p) => p.approximate_lat != null && p.approximate_lng != null,
  );

  const resultLabel = isLoading
    ? 'Laden...'
    : filteredPercelen.length > 0
      ? `${filteredPercelen.length} ${filteredPercelen.length === 1 ? 'tuin' : 'tuinen'} gevonden`
      : searchQuery.length > 0
        ? `Geen resultaten voor "${searchQuery}"`
        : 'Geen percelen beschikbaar';

  return (
    <View style={styles.screen}>
      <KaartHeader
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={handleSearchSubmit}
        onClear={() => { setSearchQuery(''); setSuggestions([]); }}
        onFilterPress={() => setFilterVisible(true)}
        hasActiveFilters={hasActiveFilters(activeFilters)}
        paddingTop={insets.top}
      />

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
                tracksViewChanges={trackingMarkerId === perceel.id}
                anchor={{ x: 0.5, y: 0.5 }}
                accessibilityLabel={perceel.naam}
                accessibilityRole="button"
              >
                <MapMarker selected={isSelected} />
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
              strokeColor={COLORS.brandOverlayStroke}
              strokeWidth={1.5}
              fillColor={COLORS.brandOverlay}
            />
          )}
        </MapView>

        {/* Locatie-suggesties dropdown */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsDropdown} accessibilityRole="list">
            {suggestions.map((s, i) => (
              <Pressable
                key={s.place_id ?? i}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  i < suggestions.length - 1 && styles.suggestionBorder,
                  pressed && styles.suggestionPressed,
                ]}
                onPress={() => handleSuggestionSelect(s)}
                accessibilityRole="button"
                accessibilityLabel={s.display_name}
              >
                <MapPinIcon size={14} color={COLORS.textSecondary} weight="regular" accessibilityElementsHidden />
                <Text style={styles.suggestionText} numberOfLines={1}>{s.display_name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Perceel popup — gecentreerd over de kaart */}
        {selectedPerceel && (
          <Pressable
            style={styles.popupBackdrop}
            onPress={() => setSelectedPerceel(null)}
            accessibilityRole="button"
            accessibilityLabel="Sluit perceel kaartje"
          >
            <Pressable style={styles.popupOverlay} onPress={(e) => e.stopPropagation()}>
              <PerceelPopupCard
                perceel={selectedPerceel}
                onClose={() => setSelectedPerceel(null)}
                onOpen={() => onOpenPerceel?.(toPlotShape(selectedPerceel))}
                isFavorited={isFavorite(selectedPerceel?.id)}
                onToggleFavorite={() => toggleFavorite(selectedPerceel?.id)}
              />
            </Pressable>
          </Pressable>
        )}

        {/* Mijn locatie knop */}
        {userLocation && (
          <Pressable
            style={({ pressed }) => [styles.locationBtn, pressed && styles.locationBtnPressed]}
            onPress={() => mapRef.current?.animateToRegion(
              { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 },
              500,
            )}
            accessibilityRole="button"
            accessibilityLabel="Ga naar mijn locatie"
          >
            <NavigationArrowIcon size={22} color={COLORS.brand} weight="fill" />
          </Pressable>
        )}

        {/* Snap bottom sheet */}
        <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
          <View
            style={styles.dragHandleWrap}
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Resultatenlijst, sleep omhoog om te openen"
          >
            <View style={styles.dragHandle} />
          </View>

          <Text style={styles.countText} accessibilityLiveRegion="polite">
            {resultLabel}
          </Text>

          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.brand}
                style={styles.loader}
                accessibilityLabel="Percelen worden geladen"
              />
            ) : (
              filteredPercelen.map((perceel) => (
                <MapPerceelCard
                  key={perceel.id}
                  perceel={perceel}
                  onPress={() => onOpenPerceel?.(toPlotShape(perceel))}
                  isFavorited={isFavorite(perceel.id)}
                  onToggleFavorite={() => toggleFavorite(perceel.id)}
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

      <FilterScreen
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={(newFilters) => {
          setActiveFilters(newFilters);
          setFilterVisible(false);
        }}
        initialFilters={activeFilters}
        percelen={percelen}
        userLocation={userLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  body: { flex: 1 },

  // Locatie-suggesties dropdown
  suggestionsDropdown: {
    position: 'absolute',
    top: 0,
    left: SPACING.screenX,
    right: SPACING.screenX,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    zIndex: 50,
    ...SHADOWS.card,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dividerSoft,
  },
  suggestionPressed: { backgroundColor: COLORS.background },
  suggestionText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },

  // Popup backdrop
  popupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: SPACING.screenX,
  },
  popupOverlay: {
    width: '100%',
  },

  // Mijn locatie knop
  locationBtn: {
    position: 'absolute',
    bottom: COLLAPSED_HEIGHT + SPACING.md,
    right: SPACING.screenX,
    width: SIZES.iconBtn,
    height: SIZES.iconBtn,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  locationBtnPressed: { opacity: 0.75 },

  // Snap bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sheet,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: SPACING.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.indicatorMuted,
  },
  countText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  listScroll: { flex: 1 },
  listContent: { paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  loader: { marginTop: SPACING.lg },
});
