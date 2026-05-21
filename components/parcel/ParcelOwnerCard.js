import { Image, StyleSheet, Text, View } from 'react-native';
import { UserCircleIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

export default function ParcelOwnerCard({ ownerProfile, joinYear }) {
  if (!ownerProfile) return null;

  const fullName = [ownerProfile.first_name, ownerProfile.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Eigenaar';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {ownerProfile.avatar_url ? (
          <Image source={{ uri: ownerProfile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <UserCircleIcon size={48} color={COLORS.brand} weight="regular" />
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.name}>{fullName}</Text>
          {joinYear ? <Text style={styles.since}>Lid sinds {joinYear}</Text> : null}
        </View>
      </View>

      {ownerProfile.bio ? <Text style={styles.quote}>{ownerProfile.bio}</Text> : null}
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
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
