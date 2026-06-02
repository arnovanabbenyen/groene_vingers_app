import React from 'react';
import { Pressable, StyleSheet, View, Image, Text } from 'react-native';
import { Image as ImageIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

export default function CoverPhotoPicker({ imageUri, onPress }) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={imageUri ? 'Omslagfoto wijzigen' : 'Omslagfoto toevoegen'}
        accessibilityHint="Opent een menu om een foto te nemen of uit je galerij te kiezen"
        style={styles.cover}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <ImageIcon size={36} color={COLORS.border} weight="regular" />
            <Text style={styles.placeholderText}>Tik om een foto te kiezen</Text>
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
    width: '100%',
    gap: 10,
  },
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
  hint: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
