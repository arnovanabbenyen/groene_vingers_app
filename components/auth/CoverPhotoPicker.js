import React from 'react';
import { Pressable, StyleSheet, View, Image, Text } from 'react-native';
import { Camera, Image as ImageIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

export default function CoverPhotoPicker({ imageUri, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={imageUri ? 'Omslagfoto wijzigen' : 'Omslagfoto toevoegen'}
      style={styles.cover}
    >
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.overlay}>
            <Camera size={28} color="#FFFFFF" weight="regular" />
          </View>
        </>
      ) : (
        <View style={styles.placeholder}>
          <ImageIcon size={36} color={COLORS.border} weight="regular" />
          <Text style={styles.placeholderText}>Tik om een foto te kiezen</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
