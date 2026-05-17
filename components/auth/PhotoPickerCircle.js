import React from 'react';
import { Pressable, StyleSheet, View, Image } from 'react-native';
import { PlusCircle, TrashSimple } from 'phosphor-react-native';
import { COLORS, RADIUS, SPACING } from '../theme/tokens';

export default function PhotoPickerCircle({ imageUri, onPress, onDelete }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={imageUri ? 'Wijzig profielfoto' : 'Voeg een foto toe'}
      style={styles.button}
    >
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.overlay} />
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel="Verwijder foto"
              hitSlop={8}
              style={styles.deleteButton}
            >
              <TrashSimple size={18} color={COLORS.textInverse} weight="regular" />
            </Pressable>
          ) : null}
        </>
      ) : (
        <View style={styles.inner}>
          <PlusCircle size={52} color={COLORS.textPrimary} weight="regular" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 150,
    height: 147,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  deleteButton: {
    position: 'absolute',
    right: SPACING.xs,
    bottom: SPACING.xs,
    width: 30,
    height: 30,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.negative,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
