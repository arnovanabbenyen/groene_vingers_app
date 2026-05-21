import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChatsCircleIcon, HouseIcon, MapTrifoldIcon, PlusCircleIcon, EnvelopeSimpleIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

const DEFAULT_PROFILE_IMAGE =
  'http://localhost:3845/assets/5268695094ed7bc20eac210bd6af6feec43ec8ef.png';

const DEFAULT_ITEMS = [
  { key: 'start', label: 'Start', icon: 'home' },
  { key: 'kaart', label: 'Kaart', icon: 'map' },
  { key: 'loggen', label: 'Loggen', icon: 'plus' },
  { key: 'berichten', label: 'Berichten', icon: 'chat' },
  { key: 'profiel', label: 'Profiel', type: 'avatar' },
];

const TUINEIGENAAR_ITEMS = [
  { key: 'start', label: 'Start', icon: 'home' },
  { key: 'verzoeken', label: 'Verzoeken', icon: 'envelope' },
  { key: 'perceel', label: 'Perceel', icon: 'plus' },
  { key: 'berichten', label: 'Berichten', icon: 'chat' },
  { key: 'profiel', label: 'Profiel', type: 'avatar' },
];

const NAV_ICON_SIZE = 26;

function NavIcon({ item, isActive, profileImageSource }) {
  if (item.type === 'avatar') {
    const source = typeof profileImageSource === 'string'
      ? { uri: profileImageSource }
      : profileImageSource;
    return <Image source={source} style={styles.avatar} />;
  }

  const color = isActive ? COLORS.brand : COLORS.textPrimary;

  if (item.icon === 'home') {
    return <HouseIcon size={NAV_ICON_SIZE} color={color} weight={isActive ? 'fill' : 'regular'} />;
  }

  if (item.icon === 'map') {
    return <MapTrifoldIcon size={NAV_ICON_SIZE} color={color} weight={isActive ? 'fill' : 'regular'} />;
  }

  if (item.icon === 'envelope') {
    return <EnvelopeSimpleIcon size={NAV_ICON_SIZE} color={color} weight={isActive ? 'fill' : 'regular'} />;
  }

  if (item.icon === 'plus') {
    return <PlusCircleIcon size={NAV_ICON_SIZE} color={color} weight={isActive ? 'fill' : 'regular'} />;
  }

  return <ChatsCircleIcon size={NAV_ICON_SIZE} color={color} weight={isActive ? 'fill' : 'regular'} />;
}

function Badge({ count }) {
  const label = count > 9 ? '9+' : String(count);

  return (
    <View style={styles.badge} accessible accessibilityRole="text">
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export default function BottomNav({
  items,
  activeKey = 'start',
  onTabPress,
  profileImageUri = DEFAULT_PROFILE_IMAGE,
  profileImageSource,
  style,
  role = 'tuinzoeker',
  badgeCounts = {},
}) {
  const insets = useSafeAreaInsets();
  const resolvedProfileImageSource = profileImageSource ?? profileImageUri;
  const navItems = items ?? (role === 'tuineigenaar' ? TUINEIGENAAR_ITEMS : DEFAULT_ITEMS);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(14, insets.bottom + 8) }, style]}>
      {navItems.map((item) => {
        const isActive = item.key === activeKey;
        const badgeCount = item.type === 'avatar' ? 0 : Number(badgeCounts?.[item.key] || 0);
        const badgeLabel = badgeCount > 9 ? '9+' : String(badgeCount);

        return (
          <Pressable
            key={item.key}
            style={styles.tabItem}
            onPress={() => onTabPress?.(item)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}${badgeCount > 0 ? `, ${badgeLabel} nieuwe` : ''}`}
          >
            <View
              style={[
                styles.indicator,
                {
                  backgroundColor: isActive ? COLORS.brand : 'transparent',
                },
              ]}
            />
            <View style={styles.iconLabelWrap}>
              <View style={styles.iconWrap}>
                <NavIcon item={item} isActive={isActive} profileImageSource={resolvedProfileImageSource} />
                {badgeCount > 0 && item.type !== 'avatar' ? <Badge count={badgeCount} /> : null}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isActive ? COLORS.brand : COLORS.textPrimary },
                ]}
              >
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
    alignItems: 'flex-end',
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
    width: '100%',
    height: 2,
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
    fontWeight: '500',
    lineHeight: 11,
    includeFontPadding: false,
  },
  avatar: {
    width: 23,
    height: 23,
    borderRadius: RADIUS.pill / 2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
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
