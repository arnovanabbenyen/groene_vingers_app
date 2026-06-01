import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MagnifyingGlassIcon, EnvelopeOpenIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../components/navigation/BottomNav';
import AanvraagCard from '../../components/aanvraag/AanvraagCard';
import EmptyState from '../../components/common/EmptyState';
import { usePendingAanvragen } from '../../hooks/usePendingAanvragen';
import { COLORS, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';
import { createConversationForAanvraag } from '../../services/conversations';
import { AANVRAAG_STATUS } from '../../services/aanvraagStatus';
import { showToast } from '../../components/common/Toast';

export default function VerzoekenOverzichtScreen({
  onTabPress,
  profileImageSource,
  badgeCounts = {},
  onBadgeCountChange,
  onViewAanvraag,
  onAanvraagActionComplete,
}) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { aanvragen, isLoading, setAanvragen } = usePendingAanvragen();

  const filteredAanvragen = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return aanvragen;

    return aanvragen.filter((aanvraag) => {
      const senderName = [aanvraag.sender?.first_name, aanvraag.sender?.last_name].filter(Boolean).join(' ').toLowerCase();
      const perceelNaam = (aanvraag.perceel?.naam || '').toLowerCase();
      return senderName.includes(q) || perceelNaam.includes(q);
    });
  }, [aanvragen, searchQuery]);

  async function handleAccept(aanvraagId) {
    const aanvraag = aanvragen.find((item) => item.id === aanvraagId);

    showConfirm({
      title: 'Accepteer aanvraag?',
      message: 'Weet je zeker dat je deze aanvraag wilt accepteren? De aanvrager wordt hierover geïnformeerd.',
      confirmLabel: 'Accepteer',
      cancelLabel: 'Annuleren',
      onConfirm: async () => {
        const { error } = await supabase
          .from('aanvragen')
          .update({ status: AANVRAAG_STATUS.ACCEPTED, updated_at: new Date().toISOString() })
          .eq('id', aanvraagId);

        if (error) {
          showToast('Aanvraag kon niet worden geaccepteerd. Probeer opnieuw.', 'error');
          return;
        }

        if (aanvraag?.id && aanvraag?.sender_id) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.warn('Failed to load current user for conversation creation', userError);
          } else {
            const { error: conversationError } = await createConversationForAanvraag({
              aanvraagId: aanvraag.id,
              ownerId: userData?.user?.id,
              senderId: aanvraag.sender_id,
            });

            if (conversationError) console.warn('Failed to create conversation for accepted aanvraag', conversationError);
          }
        }

        setAanvragen((current) => current.filter((aanvraag) => aanvraag.id !== aanvraagId));
        onBadgeCountChange?.((current) => Math.max(0, current - 1));
        onAanvraagActionComplete?.();
        showToast('Aanvraag geaccepteerd', 'success');
      },
    });
  }

  function handleView(aanvraag) {
    onViewAanvraag?.(aanvraag);
  }

return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={styles.title} accessibilityRole="header">Aanvragen</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <MagnifyingGlassIcon size={18} color={COLORS.textSecondary} weight="regular" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Zoeken naar een aanvraag"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.searchInput}
              accessibilityLabel="Zoeken naar een aanvraag"
              accessibilityHint="Filter de lijst op naam of perceel"
              returnKeyType="search"
            />
          </View>

        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingWrap} accessibilityLabel="Aanvragen worden geladen">
            <ActivityIndicator size="small" color={COLORS.brand} />
          </View>
        ) : aanvragen.length === 0 ? (
          <EmptyState
            icon={EnvelopeOpenIcon}
            title="Nog geen aanvragen"
            body="Wanneer iemand interesse heeft in jouw perceel zie je het hier."
          />
        ) : filteredAanvragen.length === 0 ? (
          <EmptyState
            icon={EnvelopeOpenIcon}
            title="Geen resultaten"
            body="Geen aanvragen gevonden voor je zoekopdracht."
          />
        ) : (
          filteredAanvragen.map((aanvraag) => (
            <AanvraagCard key={aanvraag.id} aanvraag={aanvraag} onAccept={handleAccept} onView={handleView} />
          ))
        )}

        <View style={{ height: SIZES.bottomNavClearance }} />
      </ScrollView>

      <BottomNav
        activeKey="verzoeken"
        onTabPress={onTabPress}
        role="tuineigenaar"
        profileImageSource={profileImageSource}
        badgeCounts={badgeCounts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  title: {
    color: COLORS.surface,
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchInputWrap: {
    flex: 1,
    minHeight: 47,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  list: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});