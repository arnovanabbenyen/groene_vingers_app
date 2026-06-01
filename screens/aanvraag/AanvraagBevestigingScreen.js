import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaperPlaneTiltIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/navigation/Header';
import AuthButton from '../../components/buttons/AuthButton';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../../components/theme/tokens';

export default function AanvraagBevestigingScreen({ perceel, onBackToListings, onBackToMessages }) {
  const insets = useSafeAreaInsets();
  const ownerName = perceel?.ownerName || 'De eigenaar';

  return (
    <View style={styles.screen}>
      <Header title="Aanvraag verstuurd" />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <PaperPlaneTiltIcon
            size={52}
            color={COLORS.brand}
            weight="regular"
            accessibilityElementsHidden
          />
        </View>

        <View style={styles.textBlock}>
          <Text
            style={styles.title}
            accessibilityRole="header"
            accessibilityLiveRegion="assertive"
          >
            Aanvraag verstuurd!
          </Text>
          <Text style={styles.body}>
            {`${ownerName} ontvangt jouw aanvraag en neemt doorgaans zo snel mogelijk contact op via de chat.`}
          </Text>
        </View>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + SPACING.md }]}>
        <AuthButton
          label="Meer percelen bekijken"
          onPress={onBackToListings}
          variant="primary"
        />
        <AuthButton
          label="Bekijk je berichten"
          onPress={onBackToMessages}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  actions: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
});
