import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

export default function IntroScreen({ onCreateAccount, onSignIn }) {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />
      </View>

      {/* Plant with vegetables pattern background */}
      <View style={styles.plantContainer}>
        <ImageBackground
          source={require('../../images/groenten_patroon.png')}
          style={styles.patternBackground}
          imageStyle={styles.patternImage}
        >
          <Image
            source={require('../../images/plant_in_aarde.png')}
            style={styles.plant}
            resizeMode="contain"
          />
        </ImageBackground>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Heading */}
        <View style={styles.textContainer}>
          <Text style={styles.heading}>
            Groen groeit beter samen
            <Text style={styles.accentPeriod}>.</Text>
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Ontdek tuinen, ontmoet mensen en maak het stukje bij beetje eigen.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.xl,
  },

  logoContainer: {
    position: 'absolute',
    top: 80,
    left: SPACING.screenX,
    zIndex: 10,
  },

  logo: {
    width: 145,
    height: 51,
    resizeMode: 'contain',
  },

  plantContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    zIndex: 5,
  },

  patternBackground: {
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
    height: '85%',
    position: 'absolute',
  },

  contentContainer: {
    gap: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    zIndex: 20,
  },

  textContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  },

  heading: {
    fontSize: 24,
    fontFamily: FONTS.displayBold,
    fontWeight: '700',
    color: COLORS.brand,
    textAlign: 'center',
    lineHeight: 32,
  },

  accentPeriod: {
    color: COLORS.accent,
    fontSize: 24,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },

  buttonContainer: {
    gap: SPACING.md,
  },
});
