import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../components/theme/tokens';

export default function IntroScreen({ onCreateAccount, onSignIn }) {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../images/tuineigenaar_pfp.png')}
          style={styles.logo}
        />
      </View>

      {/* Plant Image */}
      <View style={styles.plantContainer}>
        <Image
          source={require('../../images/perceel_onder_de_bomen.png')}
          style={styles.plant}
          resizeMode="contain"
        />
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
          {/* Primary Button */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonPrimary,
              pressed && styles.buttonPrimaryPressed,
            ]}
            onPress={onCreateAccount}
          >
            <Text style={styles.buttonTextPrimary}>Maak een account aan</Text>
          </Pressable>

          {/* Secondary Button */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonSecondaryPressed,
            ]}
            onPress={onSignIn}
          >
            <Text style={styles.buttonTextSecondary}>Ik heb al een account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },

  logo: {
    width: 120,
    height: 50,
    resizeMode: 'contain',
  },

  plantContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },

  plant: {
    width: 200,
    height: 280,
  },

  contentContainer: {
    gap: SPACING.lg,
    marginBottom: SPACING.md,
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

  button: {
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonPrimary: {
    backgroundColor: COLORS.brand,
  },

  buttonPrimaryPressed: {
    opacity: 0.85,
  },

  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.brand,
  },

  buttonSecondaryPressed: {
    backgroundColor: COLORS.background,
    opacity: 0.9,
  },

  buttonTextPrimary: {
    fontSize: 16,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
    color: COLORS.textInverse,
    textAlign: 'center',
  },

  buttonTextSecondary: {
    fontSize: 16,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
    color: COLORS.brand,
    textAlign: 'center',
  },
});
