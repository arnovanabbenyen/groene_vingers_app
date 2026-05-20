import React from 'react';
import { Pressable, StyleSheet, View, Image } from 'react-native';
import { PlusCircleIcon, TrashSimpleIcon } from 'phosphor-react-native';
import { COLORS, RADIUS, SPACING } from '../theme/tokens';

export default function PhotoPickerCircle({ imageUri, onPress, onDelete }) {
  return (
    <View style={styles.wrapper}>
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
          </>
        ) : (
          <View style={styles.inner}>
            <PlusCircleIcon size={52} color={COLORS.textPrimary} weight="regular" />
          </View>
        )}
      </Pressable>

      {onDelete ? (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Verwijder foto"
          hitSlop={8}
          style={styles.deleteButton}
        >
          <TrashSimpleIcon size={18} color={COLORS.textInverse} weight="regular" />
        </Pressable>
      ) : null}
    </View>
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
  wrapper: {
    width: 150,
    height: 147,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.negative,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
});
