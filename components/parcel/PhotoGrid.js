import { Dimensions, Image, Pressable, StyleSheet, View } from 'react-native';
import { PlusCircleIcon, XCircleIcon } from 'phosphor-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

const TILE_WIDTH = Math.round(
  (Dimensions.get('window').width - SPACING.screenX * 2 - SPACING.md * 2 - SPACING.md) / 2,
);
const TILE_HEIGHT = Math.round((TILE_WIDTH * 121) / 141);

export default function PhotoGrid({ photos = [], onAdd, onRemove }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 4 }).map((_, index) => {
        const photo = photos[index];

        if (photo) {
          return (
            <View key={photo.id} style={styles.slot}>
              <View style={styles.frame}>
                <Image
                  source={{ uri: photo.previewUri }}
                  style={styles.image}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={`Foto ${index + 1} van perceel`}
                />
              </View>
              <Pressable
                onPress={() => onRemove(index)}
                style={styles.removeButton}
                accessibilityRole="button"
                accessibilityLabel={`Foto ${index + 1} verwijderen`}
                accessibilityHint="Verwijder deze foto uit het perceel"
                hitSlop={12}
              >
                <XCircleIcon size={22} color={COLORS.negative} weight="fill" />
              </Pressable>
            </View>
          );
        }

        return (
          <Pressable
            key={`empty-${index}`}
            onPress={() => onAdd(index)}
            style={({ pressed }) => [styles.emptySlot, pressed && styles.emptySlotPressed]}
            accessibilityRole="button"
            accessibilityLabel="Foto toevoegen"
            accessibilityHint={`Voeg foto ${index + 1} toe aan je perceel`}
          >
            <PlusCircleIcon size={32} color={COLORS.textMuted} weight="regular" />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  slot: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: RADIUS.sm,
    overflow: 'visible',
    position: 'relative',
  },
  frame: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    elevation: 3,
    ...SHADOWS.card,
  },
  emptySlot: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.dividerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  emptySlotPressed: {
    backgroundColor: COLORS.surfaceBrand,
    borderColor: COLORS.brandOverlayStroke,
  },
});
