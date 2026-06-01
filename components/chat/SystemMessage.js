import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircleIcon, HandshakeIcon, ProhibitIcon, XCircleIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function SystemMessage({ message, aanvraag, isOwner, onConfirm, onDecline }) {
  if (message.type === 'system_samenwerking_proposed') {
    const isPending = !!aanvraag?.samenwerking_proposed_at && aanvraag?.status !== 'confirmed';
    const canAct = !isOwner && isPending;

    return (
      <View style={[styles.bubble, styles.proposedBubble]}>
        <View style={styles.header}>
          <HandshakeIcon size={18} color={COLORS.brand} weight="regular" />
          <Text style={styles.title}>Samenwerking voorgesteld</Text>
        </View>
        <Text style={styles.body}>
          {isOwner
            ? 'Je hebt voorgesteld om de samenwerking officieel te starten. Wachten op bevestiging.'
            : 'De eigenaar stelt voor om de samenwerking officieel te starten.'}
        </Text>
        {canAct && (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Samenwerking bevestigen"
            >
              <Text style={styles.btnPrimaryText}>Bevestigen</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
              onPress={onDecline}
              accessibilityRole="button"
              accessibilityLabel="Voorstel afwijzen"
            >
              <Text style={styles.btnSecondaryText}>Niet nu</Text>
            </Pressable>
          </View>
        )}
        {isOwner && isPending && (
          <Text style={styles.waiting}>Wachten op bevestiging...</Text>
        )}
      </View>
    );
  }

  if (message.type === 'system_samenwerking_confirmed') {
    return (
      <View style={[styles.bubble, styles.confirmedBubble]}>
        <View style={styles.header}>
          <CheckCircleIcon size={18} color={COLORS.brand} weight="fill" />
          <Text style={styles.title}>Samenwerking gestart 🌱</Text>
        </View>
        <Text style={styles.body}>
          De samenwerking is officieel gestart. Bekijk je samenwerking op je homescherm.
        </Text>
      </View>
    );
  }

  if (message.type === 'system_samenwerking_cancelled') {
    return (
      <View style={[styles.bubble, styles.cancelledBubble]}>
        <View style={styles.header}>
          <XCircleIcon size={18} color={COLORS.textSecondary} weight="regular" />
          <Text style={[styles.title, styles.titleMuted]}>Voorstel afgewezen</Text>
        </View>
        <Text style={styles.body}>
          Het voorstel is afgewezen. Praat verder en stel later opnieuw voor wanneer je er klaar voor bent.
        </Text>
      </View>
    );
  }

  if (message.type === 'system_samenwerking_ended') {
    return (
      <View style={[styles.bubble, styles.endedBubble]}>
        <View style={styles.header}>
          <ProhibitIcon size={18} color={COLORS.negative} weight="fill" />
          <Text style={[styles.title, styles.titleNegative]}>Samenwerking beëindigd</Text>
        </View>
        <Text style={styles.body}>
          De samenwerking is beëindigd. Je kunt je beoordeling nog achterlaten als je dat nog niet hebt gedaan.
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'center',
    maxWidth: '85%',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  proposedBubble: {
    backgroundColor: COLORS.accentSoft,
  },
  confirmedBubble: {
    backgroundColor: COLORS.surfaceBrand,
  },
  cancelledBubble: {
    backgroundColor: COLORS.surfaceMuted,
  },
  endedBubble: {
    backgroundColor: COLORS.negativeSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.brand,
  },
  titleMuted: {
    color: COLORS.textSecondary,
  },
  titleNegative: {
    color: COLORS.negative,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  btnSecondary: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.brand,
  },
  btnPressed: {
    opacity: 0.75,
  },
  waiting: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
