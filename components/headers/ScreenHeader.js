import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/ArrowLeft.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

export default function ScreenHeader({ title = 'Meldingen', onBack }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
      <View style={styles.headerContent}>
        <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}>
          <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
          <Text style={styles.backText}>Terug</Text>
        </Pressable>

        <Text style={styles.headerTitle}>{title}</Text>

        <View style={styles.headerSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.brand,
    minHeight: 129,
  },
  headerContent: {
    position: 'relative',
    paddingHorizontal: SPACING.screenX,
    paddingTop: 30,
    paddingBottom: 35,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    zIndex: 2,
  },
  backText: {
    color: COLORS.textInverse,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 30,
    color: COLORS.textInverse,
    fontSize: 20,
    lineHeight: 20,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 96,
    opacity: 0,
  },
});
