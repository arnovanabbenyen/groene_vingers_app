import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../../components/theme/tokens';
import { supabase } from '../../services/supabase';

const DEFAULT_SETTINGS = { aanvragen: true, messages: true, samenwerkingen: true };

const ROWS = [
  {
    key: 'aanvragen',
    label: 'Aanvragen',
    subtext:
      'Krijg een melding wanneer iemand jouw perceel aanvraagt of jouw aanvraag wordt beoordeeld.',
  },
  {
    key: 'messages',
    label: 'Berichten',
    subtext: 'Krijg een melding wanneer je een nieuw bericht ontvangt in een gesprek.',
  },
  {
    key: 'samenwerkingen',
    label: 'Samenwerkingen',
    subtext: 'Krijg een melding bij updates over bevestigde of actieve samenwerkingen.',
  },
];

export default function NotificatieInstellingenScreen({ onBack }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const userIdRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase) { if (mounted) setIsLoading(false); return; }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) { if (mounted) setIsLoading(false); return; }

        userIdRef.current = userId;

        const { data: profile } = await supabase
          .from('profiles')
          .select('notification_settings')
          .eq('id', userId)
          .maybeSingle();

        if (mounted) {
          setSettings({ ...DEFAULT_SETTINGS, ...(profile?.notification_settings ?? {}) });
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('Failed to load notification settings', e);
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  async function handleToggle(key, value) {
    const prev = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);

    const userId = userIdRef.current;
    if (!userId || !supabase) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_settings: next })
        .eq('id', userId);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to persist notification settings', e);
      setSettings(prev);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Terug naar instellingen"
          >
            <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Notificaties</Text>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {ROWS.map((row, index) => (
            <View key={row.key}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowSubtext}>{row.subtext}</Text>
                </View>
                <Switch
                  value={settings[row.key] ?? true}
                  onValueChange={(val) => handleToggle(row.key, val)}
                  trackColor={{ false: COLORS.indicatorMuted, true: COLORS.brand }}
                  thumbColor={COLORS.surface}
                  ios_backgroundColor={COLORS.indicatorMuted}
                  accessibilityLabel={row.label}
                  accessibilityRole="switch"
                />
              </View>
              {index < ROWS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerSafe: {
    backgroundColor: COLORS.brand,
  },
  header: {
    backgroundColor: COLORS.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textInverse,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
    paddingBottom: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  rowLeft: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  rowSubtext: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
  },
});
