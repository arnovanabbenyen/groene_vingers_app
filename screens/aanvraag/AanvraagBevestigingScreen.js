import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

const ILLUSTRATION = 'http://localhost:3845/assets/d047a925a674ca8b2b2b33d446d7564d72c48265.svg';

export default function AanvraagBevestigingScreen({ perceel, onBackToListings, onBackToMessages }) {
  const title = 'Aanvraag verstuurd!\u00A0';
  const body = `${perceel?.ownerName || 'De eigenaar'} ontvangt jouw aanvraag en neemt doorgaans zo snel mogelijk contact op via de chat.`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.headerTitle}>Aanvraag verstuurd</Text>
      </View>

      <View style={styles.content}>
        <Image source={{ uri: ILLUSTRATION }} style={styles.illustration} resizeMode="contain" />

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        <View style={styles.actions}>
          <AuthButton label="Meer percelen bekijken" onPress={onBackToListings} variant="primary" />

          <Pressable style={styles.secondary} onPress={onBackToMessages} accessibilityRole="button">
            <Text style={styles.secondaryText}>Bekijk je berichten</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.brand, height: 129, justifyContent: 'flex-end', paddingBottom: 12, paddingHorizontal: SPACING.md },
  headerTitle: { color: COLORS.textInverse, fontFamily: FONTS.displaySemiBold, fontSize: 20, textAlign: 'center' },
  content: { padding: SPACING.md, alignItems: 'center' },
  illustration: { width: 90, height: 90, marginTop: 40, marginBottom: SPACING.md },
  title: { fontFamily: FONTS.displaySemiBold, fontSize: 25, color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.xs, textAlign: 'center' },
  body: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', width: '90%', marginBottom: SPACING.lg },
  actions: { width: '100%', gap: SPACING.sm, alignItems: 'center' },
  secondary: { width: '100%', marginTop: SPACING.sm, height: 53, borderRadius: RADIUS.xl, borderWidth: 2, borderColor: COLORS.brand, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  secondaryText: { fontFamily: FONTS.displayMedium, fontSize: 16, color: COLORS.textPrimary },
});
