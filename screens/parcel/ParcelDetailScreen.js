import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ParcelDetailHeader from '../../components/parcel/ParcelDetailHeader';
import ParcelOverviewSection from '../../components/parcel/ParcelOverviewSection';
import ParcelPresenceSection from '../../components/parcel/ParcelPresenceSection';
import ParcelInfoList from '../../components/parcel/ParcelInfoList';
import ParcelOwnerCard from '../../components/parcel/ParcelOwnerCard';
import { COLORS, FONTS, RADIUS, SPACING } from '../../components/theme/tokens';

const HERO_IMAGE = require('../../images/overdekt_perceel_met_serre.png');

export default function ParcelDetailScreen({ onBack, onRequest = () => {}, onMorePress = () => {} }) {
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ParcelDetailHeader title="Perceel" onBack={onBack} onMorePress={onMorePress} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ParcelOverviewSection
          heroImage={HERO_IMAGE}
          title="Overdekt perceel met serre"
          location="Kessel-Lo"
          distance="2,8km"
          ownerName="Arthur De Klerck"
          rating="4,5"
          stats={[
            { value: '30m²', label: 'Grootte' },
            { value: 'Nu vrij', label: 'Beschikbaar' },
            { value: '4.5', label: 'Score' },
          ]}
        />

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beschrijving</Text>
          <Text style={styles.description}>
            Een rustige, groene tuin met een serre waar vooral groenten en kruiden worden gekweekt. Ideaal voor wie graag praktisch meehelpt en graag in het groen werkt.
          </Text>
        </View>

        <View style={styles.section}>
          <ParcelPresenceSection />
        </View>

        <View style={styles.section}>
          <ParcelInfoList />
        </View>

        <View style={styles.section}>
          <ParcelOwnerCard />
        </View>

        <View style={styles.divider} />

        <Pressable style={styles.primaryButton} onPress={onRequest}>
          <Text style={styles.primaryButtonText}>Stuur verzoek</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.brand,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.screenX,
    paddingTop: 31,
    paddingBottom: 20,
  },
  divider: {
    marginTop: 24,
    height: 1,
    backgroundColor: COLORS.border,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
  },
  description: {
    marginTop: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
  primaryButton: {
    marginTop: 18,
    height: 41,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
});
