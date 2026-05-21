import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { Bell, Heart, Eye } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import BottomNav from '../../components/navigation/BottomNav';
import { supabase } from '../../services/supabase';
import PerceelToevoegenScreen from '../parcel/PerceelToevoegenScreen';

const PROFILE_IMAGE = require('../../images/tuineigenaar_pfp.png');
const GARDEN_IMAGE = require('../../images/overdekt_perceel_met_serre.png');

export default function TuineigenaarHomeScreen({ onLogout }) {
  const [activeTab, setActiveTab] = useState('start');
  const [profileImageSource, setProfileImageSource] = useState(PROFILE_IMAGE);

  const requests = [
    {
      id: 'request-1',
      userName: 'Arno Van Abbenyen',
      userImage: PROFILE_IMAGE,
      rating: '4.5',
      gardenImage: GARDEN_IMAGE,
      title: 'Overdekt perceel met serre',
      size: '30m²',
    },
  ];

  const handleLogout = () => {
    onLogout();
  };

  function handleTabPress(item) {
    if (item.key === 'perceel') {
      setActiveTab('perceel');
      return;
    }

    setActiveTab(item.key);
  }

  useEffect(() => {
    let mounted = true;
    async function loadProfileAvatar() {
      if (!supabase) return;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) return;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log('Failed to fetch profile avatar', profileError);
          return;
        }

        if (mounted && profile?.avatar_url) setProfileImageSource(profile.avatar_url);
      } catch (e) {
        console.log('loadProfileAvatar error', e);
      }
    }

    loadProfileAvatar();
    return () => { mounted = false; };
  }, []);

  if (activeTab === 'perceel') {
    return (
      <PerceelToevoegenScreen
        onBack={() => {
          setActiveTab('start');
        }}
        onSaved={() => {
          setActiveTab('start');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Green Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.location}>
            <Text style={styles.locationText}>📍 Kessel-Lo</Text>
          </View>
          <Pressable hitSlop={8}>
            <Bell size={24} color={COLORS.surface} weight="regular" />
          </Pressable>
        </View>

        <Text style={styles.greeting}>Hallo, Arno</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nieuwe aanvragen Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nieuwe aanvragen</Text>

          {requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              {/* User Info */}
              <View style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Image source={request.userImage} style={styles.userAvatar} />
                  <View>
                    <Text style={styles.userName}>{request.userName}</Text>
                  </View>
                </View>

                <View style={styles.userMeta}>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingValue}>⭐ {request.rating}</Text>
                  </View>
                  <Pressable hitSlop={8}>
                    <Heart size={20} color={COLORS.textSecondary} weight="regular" />
                  </Pressable>
                </View>
              </View>

              {/* Garden Image */}
              <Image source={request.gardenImage} style={styles.gardenImage} />

              {/* Garden Info */}
              <View style={styles.gardenInfo}>
                <Text style={styles.gardenTitle}>{request.title}</Text>
                <Text style={styles.gardenSize}>{request.size}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <Pressable style={styles.acceptButton}>
                  <Text style={styles.acceptButtonText}>✓ Accepteren</Text>
                </Pressable>
                <Pressable style={styles.viewButton}>
                  <Eye size={20} color={COLORS.brand} weight="regular" />
                  <Text style={styles.viewButtonText}>Bekijk</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Jouw planning Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jouw planning</Text>

          {/* Calendar */}
          <View style={styles.calendar}>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>Dag</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>M</Text>
            </View>
            <View style={[styles.dayLabel, styles.dayActive]}>
              <Text style={[styles.dayText, styles.dayTextActive]}>D</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>W</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>D</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>V</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>Z</Text>
            </View>
            <View style={styles.dayLabel}>
              <Text style={styles.dayText}>Z</Text>
            </View>
          </View>
        </View>

        {/* Spacer for bottom nav */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav activeKey={activeTab} onTabPress={handleTabPress} role="tuineigenaar" profileImageSource={profileImageSource} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    backgroundColor: COLORS.brand,
    paddingTop: 16,
    paddingHorizontal: SPACING.screenX,
    paddingBottom: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.surface,
  },
  greeting: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 25,
    color: COLORS.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.screenX,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(54, 57, 43, 0.08)',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  gardenImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  gardenInfo: {
    marginBottom: SPACING.md,
  },
  gardenTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  gardenSize: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.brand,
    borderRadius: 6,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: COLORS.surface,
  },
  viewButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.brand,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  viewButtonText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: COLORS.brand,
  },
  calendar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  dayLabel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(54, 57, 43, 0.08)',
  },
  dayActive: {
    borderBottomColor: COLORS.brand,
  },
  dayText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: 'rgba(54, 57, 43, 0.4)',
  },
  dayTextActive: {
    color: COLORS.brand,
    fontWeight: '600',
  },
});
