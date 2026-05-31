import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { ArrowsOutSimpleIcon, XIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapMarker from '../kaart/MapMarker';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

const RADIUS_METERS = 300;
const FILL_COLOR = 'rgba(87,98,56,0.12)';
const STROKE_COLOR = 'rgba(87,98,56,0.38)';

export default function ParcelLocationMap({ latitude, longitude }) {
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();

  if (!latitude || !longitude) return null;

  const coordinate = { latitude, longitude };
  const previewRegion = { latitude, longitude, latitudeDelta: 0.014, longitudeDelta: 0.014 };
  const fullRegion = { latitude, longitude, latitudeDelta: 0.026, longitudeDelta: 0.026 };

  const marker = (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}>
      <MapMarker />
    </Marker>
  );

  return (
    <>
      <View style={styles.previewWrap}>
        <MapView
          style={styles.previewMap}
          region={previewRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {marker}
        </MapView>

        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel="Bekijk kaart op volledig scherm"
        >
          <View style={styles.expandBadge}>
            <ArrowsOutSimpleIcon size={14} color={COLORS.textPrimary} weight="bold" />
          </View>
        </Pressable>
      </View>

      <Modal
        visible={expanded}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.fullWrap}>
          <MapView style={StyleSheet.absoluteFill} initialRegion={fullRegion}>
            <Circle
              center={coordinate}
              radius={RADIUS_METERS}
              fillColor={FILL_COLOR}
              strokeColor={STROKE_COLOR}
              strokeWidth={1.5}
            />
            {marker}
          </MapView>

          <Pressable
            style={[styles.closeBtn, { top: insets.top + SPACING.sm }]}
            onPress={() => setExpanded(false)}
            accessibilityRole="button"
            accessibilityLabel="Sluit kaart"
            hitSlop={8}
          >
            <XIcon size={18} color={COLORS.textPrimary} weight="bold" />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  previewWrap: {
    marginTop: SPACING.sm,
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  previewMap: {
    flex: 1,
  },
  expandBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  fullWrap: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    right: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
});
