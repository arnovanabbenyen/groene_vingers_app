import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FunnelIcon, MagnifyingGlassIcon, EnvelopeOpenIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../components/navigation/BottomNav';
import AanvraagCard from '../../components/aanvraag/AanvraagCard';
import { usePendingAanvragen } from '../../hooks/usePendingAanvragen';
import { COLORS, FONTS, RADIUS, SIZES, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';
import { createConversationForAanvraag } from '../../services/conversations';

function EmptyRequestsState() {
  return (
    <View style={styles.emptyState} accessible accessibilityRole="text">
      <EnvelopeOpenIcon size={40} color={COLORS.brand} weight="regular" />
      <Text style={styles.emptyTitle}>Nog geen aanvragen ontvangen</Text>
      <Text style={styles.emptySubtext}>Wanneer iemand interesse heeft in jouw perceel zie je het hier.</Text>
    </View>
  );
}

function NoResultsState() {
  return (
    <View style={styles.emptyState} accessible accessibilityRole="text">
      <EnvelopeOpenIcon size={40} color={COLORS.brand} weight="regular" />
      <Text style={styles.emptyTitle}>Geen resultaten</Text>
      <Text style={styles.emptySubtext}>Geen aanvragen gevonden voor je zoekopdracht.</Text>
    </View>
  );
}

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

    const { error } = await supabase
      .from('aanvragen')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', aanvraagId);

    if (error) {
      Alert.alert('Fout', 'De aanvraag kon niet worden geaccepteerd. Probeer opnieuw.');
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

        if (conversationError) {
          console.warn('Failed to create conversation for accepted aanvraag', conversationError);
        }
      }
    }

    setAanvragen((current) => current.filter((aanvraag) => aanvraag.id !== aanvraagId));
    onBadgeCountChange?.((current) => Math.max(0, current - 1));
    onAanvraagActionComplete?.();
    Alert.alert('Aanvraag geaccepteerd', 'De aanvrager wordt hierover geïnformeerd.');
  }

  function handleView(aanvraag) {
    onViewAanvraag?.(aanvraag);
  }

  function handleFilterPress() {
    // TODO: implement filter modal with options like status, date range, perceel selection
    Alert.alert('Binnenkort beschikbaar', 'Filters worden binnenkort toegevoegd.');
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

          <Pressable
            onPress={handleFilterPress}
            style={styles.filterButton}
            accessibilityRole="button"
            accessibilityLabel="Filters openen"
          >
            <FunnelIcon size={20} color={COLORS.surface} weight="regular" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingWrap} accessibilityLabel="Aanvragen worden geladen">
            <ActivityIndicator size="small" color={COLORS.brand} />
          </View>
        ) : aanvragen.length === 0 ? (
          <EmptyRequestsState />
        ) : filteredAanvragen.length === 0 ? (
          <NoResultsState />
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
  filterButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
  },
  loadingWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});