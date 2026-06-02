import { Image, StyleSheet } from 'react-native';
import { COLORS } from '../theme/tokens';

const FALLBACK = require('../../images/tuinzoeker_pfp.png');

export default function ChatAvatar({ avatarUrl, size = 48 }) {
  return (
    <Image
      source={avatarUrl ? { uri: avatarUrl } : FALLBACK}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityElementsHidden
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surfaceMuted,
  },
});
