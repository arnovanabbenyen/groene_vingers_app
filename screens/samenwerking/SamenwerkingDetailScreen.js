import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, ChatCircleIcon, LeafIcon } from 'phosphor-react-native';
import { supabase } from '../../services/supabase';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';

const FALLBACK_AVATAR = require('../../images/tuinzoeker_pfp.png');

export default function SamenwerkingDetailScreen({
  samenwerking,
  onBack,
  onOpenConversation,
  onEndSamenwerking,
}) {
  const insets = useSafeAreaInsets();
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const ownerId = samenwerking?.percelen?.owner_id;
  const perceelNaam = samenwerking?.percelen?.naam || 'Perceel';
  const perceelPlaats = samenwerking?.percelen?.plaats;
  const perceelFoto = samenwerking?.percelen?.fotos?.[0];

  useEffect(() => {
    if (!samenwerking?.id) { setIsLoading(false); return; }
    let mounted = true;

    async function load() {
      try {
        const [profileResult, convResult] = await Promise.all([
          ownerId
            ? supabase.from('profiles').select('id, first_name, last_name, avatar_url, bio').eq('id', ownerId).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase.from('conversations').select('id, aanvraag_id').eq('aanvraag_id', samenwerking.id).maybeSingle(),
        ]);
        if (mounted) {
          setOwnerProfile(profileResult.data || null);
          setConversation(convResult.data || null);
        }
      } catch (err) {
        console.warn('SamenwerkingDetailScreen load error', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [samenwerking?.id, ownerId]);

  if (!samenwerking) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.emptyText}>Geen samenwerking gevonden.</Text>
      </View>
    );
  }

  const ownerName = ownerProfile
    ? [ownerProfile.first_name, ownerProfile.last_name].filter(Boolean).join(' ').trim() || 'Tuineigenaar'
    : 'Tuineigenaar';
  const ownerAvatar = ownerProfile?.avatar_url ? { uri: ownerProfile.avatar_url } : FALLBACK_AVATAR;

  const startDate = samenwerking.confirmed_at
    ? new Date(samenwerking.confirmed_at).toLocaleDateString('nl-BE', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  // Enriched samenwerking object for EindSamenwerkingScreen
  function buildEnriched() {
    return {
      ...samenwerking,
      ownerProfile,
      conversationId: conversation?.id ?? null,
    };
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} accessibilityRole="button">
            <ArrowLeftIcon size={20} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Mijn samenwerking</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <ActivityIndicator color={COLORS.brand} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Perceel hero */}
          {perceelFoto ? (
            <Image source={{ uri: perceelFoto }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              <LeafIcon size={48} color={COLORS.brand} weight="regular" />
            </View>
          )}

          {/* Perceel info */}
          <View style={styles.section}>
            <Text style={styles.perceelNaam}>{perceelNaam}</Text>
            {perceelPlaats ? (
              <Text style={styles.perceelPlaats}>📍 {perceelPlaats}</Text>
            ) : null}
          </View>

          {/* Partner info */}
          <View style={styles.partnerCard}>
            <Image source={ownerAvatar} style={styles.partnerAvatar} />
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{ownerName}</Text>
              {startDate ? (
                <Text style={styles.partnerSub}>Gestart op {startDate}</Text>
              ) : (
                <Text style={styles.partnerSub}>Tuineigenaar</Text>
              )}
            </View>
          </View>

          {/* Chat button */}
          <Pressable
            style={[styles.primaryButton, !conversation && styles.buttonDisabled]}
            onPress={() => conversation && onOpenConversation?.(conversation)}
            disabled={!conversation}
            accessibilityRole="button"
            accessibilityLabel="Open gesprek"
          >
            <ChatCircleIcon size={18} color={COLORS.textInverse} weight="fill" />
            <Text style={styles.primaryButtonText}>Open gesprek</Text>
          </Pressable>

          {/* End samenwerking */}
          <Pressable
            style={styles.endButton}
            onPress={() => onEndSamenwerking?.(buildEnriched())}
            accessibilityRole="button"
            accessibilityLabel="Beëindig samenwerking"
          >
            <Text style={styles.endButtonText}>Beëindig samenwerking</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  headerSafe: { backgroundColor: COLORS.brand },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.screenX, paddingVertical: SPACING.sm, minHeight: 52,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 80 },
  backText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZES.md, color: COLORS.textInverse },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: FONTS.displaySemiBold, fontSize: FONT_SIZES.xl, color: COLORS.textInverse,
  },
  headerSpacer: { minWidth: 80 },
  scroll: { flex: 1 },
  scrollContent: { gap: SPACING.md },

  hero: { width: '100%', height: 200, backgroundColor: COLORS.surfaceMuted },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  section: { paddingHorizontal: SPACING.screenX, gap: 6 },
  perceelNaam: { fontFamily: FONTS.displaySemiBold, fontSize: 22, color: COLORS.textPrimary },
  perceelPlaats: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  partnerCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.screenX,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md,
    ...SHADOWS.card,
  },
  partnerAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.surfaceMuted,
  },
  partnerInfo: { flex: 1, gap: 3 },
  partnerName: { fontFamily: FONTS.displaySemiBold, fontSize: FONT_SIZES.lg, color: COLORS.textPrimary },
  partnerSub: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  primaryButton: {
    marginHorizontal: SPACING.screenX,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.brand, borderRadius: RADIUS.xl, paddingVertical: SPACING.md,
  },
  primaryButtonText: { fontFamily: FONTS.displayMedium, fontSize: FONT_SIZES.md, color: COLORS.textInverse },
  buttonDisabled: { opacity: 0.5 },

  endButton: {
    marginHorizontal: SPACING.screenX,
    borderWidth: 1.5, borderColor: COLORS.negative, borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md, alignItems: 'center',
  },
  endButtonText: { fontFamily: FONTS.displayMedium, fontSize: FONT_SIZES.md, color: COLORS.negative },
  emptyText: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
});
