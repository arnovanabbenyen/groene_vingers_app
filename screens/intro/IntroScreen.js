import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

export default function IntroScreen({ onCreateAccount, onSignIn }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>

        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            accessibilityLabel="Groene Vingers"
            resizeMode="contain"
          />
        </View>

        <View style={styles.plantWrap} accessible={false}>
          <ImageBackground
            source={require('../../images/groenten_patroon.png')}
            style={styles.patternBg}
            imageStyle={styles.patternImage}
          >
            <Image
              source={require('../../images/plant_in_aarde.png')}
              style={styles.plant}
              resizeMode="contain"
            />
          </ImageBackground>
        </View>

        <View style={styles.card}>
          <View style={styles.textWrap}>
            <Text style={styles.heading} accessibilityRole="header">
              Groen groeit beter samen
              <Text style={styles.accentPeriod}>.</Text>
            </Text>
            <Text style={styles.subtitle}>
              Ontdek tuinen, ontmoet mensen en maak het stukje bij beetje eigen.
            </Text>
          </View>

          <View style={styles.buttons}>
            <AuthButton
              label="Maak een account aan"
              variant="primary"
              onPress={onCreateAccount}
            />
            <AuthButton
              label="Ik heb al een account"
              variant="secondary"
              onPress={onSignIn}
            />
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.screenX,
  },
  logoWrap: {
    position: 'absolute',
    top: 24,
    left: SPACING.screenX,
    zIndex: 10,
  },
  logo: {
    width: 145,
    height: 51,
  },
  plantWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  patternBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternImage: {
    resizeMode: 'cover',
    opacity: 0.2,
  },
  plant: {
    width: '90%',
    height: '72%',
    position: 'absolute',
    bottom: '26%',
  },
  card: {
    gap: SPACING.lg,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    zIndex: 20,
  },
  textWrap: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  heading: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.brand,
    textAlign: 'center',
    lineHeight: 32,
  },
  accentPeriod: {
    color: COLORS.accent,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: SPACING.md,
  },
});
