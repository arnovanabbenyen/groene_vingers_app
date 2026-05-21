import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

const OWNER_IMAGE = require('../../images/tuineigenaar_pfp.png');

export default function ParcelOwnerCard() {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Image source={OWNER_IMAGE} style={styles.avatar} />
        <View style={styles.meta}>
          <Text style={styles.name}>Arthur De Klerck</Text>
          <Text style={styles.since}>Lid sinds 2025</Text>
        </View>
      </View>

      <Text style={styles.quote}>
        Het doet me deugd om te zien hoe gemotiveerde tuinliefhebbers mijn tuin met zorg en aandacht onderhouden.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.background,
    padding: 16,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  meta: {
    flex: 1,
    gap: 8,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '900',
  },
  since: {
    color: COLORS.textSecondary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
  quote: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
});
