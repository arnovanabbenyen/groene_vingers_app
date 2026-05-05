import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

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
});
