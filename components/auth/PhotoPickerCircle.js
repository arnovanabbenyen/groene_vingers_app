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
        accessibilityHint="Opent een menu om een foto te nemen of uit je galerij te kiezen"
        style={styles.circle}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={styles.empty}>
            <Camera size={32} color={COLORS.border} weight="regular" />
            <Text style={styles.emptyText}>Voeg foto toe</Text>
          </View>
        )}
      </Pressable>
      <Text style={styles.hint}>
        {imageUri ? 'Tik om te wijzigen of te verwijderen' : 'Optioneel — je kunt dit altijd later aanpassen'}
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
    gap: 6,
    paddingHorizontal: 12,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
