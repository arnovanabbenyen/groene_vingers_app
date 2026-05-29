import React from 'react';
import { Pressable, StyleSheet, View, Image, Text } from 'react-native';
import { Camera } from 'phosphor-react-native';
import { COLORS, FONTS } from '../theme/tokens';

const SIZE = 140;

export default function PhotoPickerCircle({ imageUri, onPress }) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={imageUri ? 'Profielfoto wijzigen' : 'Profielfoto toevoegen'}
        style={styles.circle}
      >
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.overlay}>
              <Camera size={28} color="#FFFFFF" weight="regular" />
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Camera size={32} color={COLORS.border} weight="regular" />
          </View>
        )}
      </Pressable>
      <Text style={styles.hint}>
        {imageUri ? 'Tik om te wijzigen' : 'Tik om een foto te kiezen'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
