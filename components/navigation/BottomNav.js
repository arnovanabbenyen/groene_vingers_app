import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ChatsCircleIcon,
  EnvelopeSimpleIcon,
  HouseIcon,
  MapTrifoldIcon,
  PlusCircleIcon,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

const DEFAULT_PROFILE_IMAGE = require('../../images/tuinzoeker_pfp.png');
const NAV_ICON_SIZE = 26;

const ICON_MAP = {
  home: HouseIcon,
  map: MapTrifoldIcon,
  plus: PlusCircleIcon,
  chat: ChatsCircleIcon,
  envelope: EnvelopeSimpleIcon,
};

const DEFAULT_ITEMS = [
  { key: 'start',     label: 'Start',     icon: 'home' },
  { key: 'kaart',     label: 'Kaart',     icon: 'map' },
  { key: 'loggen',    label: 'Loggen',    icon: 'plus' },
  { key: 'berichten', label: 'Berichten', icon: 'chat' },
  { key: 'profiel',   label: 'Profiel',   type: 'avatar' },
];

const TUINEIGENAAR_ITEMS = [
  { key: 'start',     label: 'Start',     icon: 'home' },
  { key: 'verzoeken', label: 'Verzoeken', icon: 'envelope' },
  { key: 'perceel',   label: 'Perceel',   icon: 'plus' },
  { key: 'berichten', label: 'Berichten', icon: 'chat' },
  { key: 'profiel',   label: 'Profiel',   type: 'avatar' },
];

function NavIcon({ item, isActive, profileImageSource }) {
  const color = isActive ? COLORS.brand : COLORS.textSecondary;

  if (item.type === 'avatar') {
    const source = typeof profileImageSource === 'string'
      ? { uri: profileImageSource }
      : (profileImageSource ?? DEFAULT_PROFILE_IMAGE);
    return (
      <Image
        source={source}
        style={[styles.avatar, isActive && styles.avatarActive]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    );
  }

  const Icon = ICON_MAP[item.icon] ?? ChatsCircleIcon;
  return (
    <Icon
      size={NAV_ICON_SIZE}
      color={color}
      weight={isActive ? 'fill' : 'regular'}
      accessibilityElementsHidden
    />
  );
}

function Badge({ count }) {
  return (
    <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no">
      <Text style={styles.badgeText}>{count > 9 ? '9+' : String(count)}</Text>
    </View>
  );
}

export default function BottomNav({
  items,
  activeKey = 'start',
  onTabPress,
  profileImageSource,
  style,
  role = 'tuinzoeker',
  badgeCounts = {},
}) {
  const insets = useSafeAreaInsets();
  const navItems = items ?? (role === 'tuineigenaar' ? TUINEIGENAAR_ITEMS : DEFAULT_ITEMS);

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(14, insets.bottom + 8) }, style]}
      accessibilityRole="tablist"
    >
      {navItems.map((item) => {
        const isActive = item.key === activeKey;
        const badgeCount = item.type === 'avatar' ? 0 : Number(badgeCounts?.[item.key] || 0);
        const a11yLabel = badgeCount > 0
          ? `${item.label}, ${badgeCount} nieuwe`
          : item.label;

        return (
          <Pressable
            key={item.key}
            style={styles.tabItem}
            onPress={() => onTabPress?.(item)}
            hitSlop={4}
            accessibilityRole="tab"
            accessibilityLabel={a11yLabel}
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.indicator, isActive && styles.indicatorActive]} />
            <View style={styles.iconLabelWrap}>
              <View style={styles.iconWrap}>
                <NavIcon item={item} isActive={isActive} profileImageSource={profileImageSource} />
                {badgeCount > 0 && <Badge count={badgeCount} />}
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {item.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.navTop,
    ...SHADOWS.nav,
  },
  tabItem: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
  },
  indicator: {
    width: 24,
    height: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: COLORS.brand,
  },
  iconLabelWrap: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.navIconGap,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
    lineHeight: 11,
    includeFontPadding: false,
    color: COLORS.textSecondary,
  },
  labelActive: {
    color: COLORS.brand,
  },
  avatar: {
    width: NAV_ICON_SIZE,
    height: NAV_ICON_SIZE,
    borderRadius: RADIUS.pill,
  },
  avatarActive: {
    borderWidth: 2,
    borderColor: COLORS.brand,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.xs,
    backgroundColor: COLORS.negative,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.surface,
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    lineHeight: 10,
    includeFontPadding: false,
  },
});
