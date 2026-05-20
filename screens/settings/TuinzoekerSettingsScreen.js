import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image, Alert } from 'react-native';
import ScreenHeader from '../../components/headers/ScreenHeader';
import SettingsRow from '../../components/settings/SettingsRow';
import { UserCircleIcon, BellIcon, LockKeyIcon, QuestionIcon } from 'phosphor-react-native';
import { SignOut } from 'phosphor-react-native';
import { supabase } from '../../services/supabase';
import { COLORS, FONTS, SPACING, RADIUS, SIZES } from '../../components/theme/tokens';

const PROFILE_IMAGE = require('../../images/tuinzoeker_pfp.png');

export default function TuinzoekerSettingsScreen({ onBack, onLogout }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      if (onLogout) onLogout();
    } catch (e) {
      Alert.alert('Fout', 'Kon niet uitloggen. Probeer opnieuw.');
    }
  }

  return (
    <View style={styles.safeArea}>
      <ScreenHeader title="Instellingen" onBack={onBack} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Image source={PROFILE_IMAGE} style={styles.avatar} />
          <View style={styles.profileMeta}>
            <Text style={styles.name}>Sofie Janssens</Text>
            <Text style={styles.email}>sofie.janssens@example.com</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsRow
            icon={<UserCircleIcon size={20} color={COLORS.brand} />}
            title="Profiel bewerken"
            subtitle="Naam, foto en bio"
            onPress={() => Alert.alert('Profiel', 'Profiel bewerken niet geïmplementeerd')}
          />
          <SettingsRow
            icon={<LockKeyIcon size={20} color={COLORS.brand} />}
            title="Wachtwoord wijzigen"
            subtitle="Wijzig je wachtwoord"
            onPress={() => Alert.alert('Wachtwoord', 'Wachtwoord wijzigen niet geïmplementeerd')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voorkeuren</Text>
          <SettingsRow
            icon={<BellIcon size={20} color={COLORS.brand} />}
            title="Meldingen"
            subtitle="Ontvang notificaties over matches"
            showSwitch
            switchValue={notificationsEnabled}
            onSwitchChange={setNotificationsEnabled}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hulp</Text>
          <SettingsRow
            icon={<QuestionIcon size={20} color={COLORS.brand} />}
            title="Help & Support"
            subtitle="Veelgestelde vragen"
            onPress={() => Alert.alert('Help', 'Help & Support niet geïmplementeerd')}
          />
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon={<SignOut size={20} color={COLORS.negative} />}
            title="Uitloggen"
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.screenX,
    paddingTop: SPACING.md,
    gap: SPACING.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 64,
  },
  profileMeta: {
    marginLeft: SPACING.sm,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
  },
  email: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.body,
    marginBottom: SPACING.xs,
  },
});
