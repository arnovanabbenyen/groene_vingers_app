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

export default function BottomNav({
  items,
  activeKey = 'start',
  onTabPress,
  profileImageUri = DEFAULT_PROFILE_IMAGE,
  profileImageSource,
  style,
  role = 'tuinzoeker',
}) {
  const insets = useSafeAreaInsets();
  const resolvedProfileImageSource = profileImageSource ?? profileImageUri;
  const navItems = items ?? (role === 'tuineigenaar' ? TUINEIGENAAR_ITEMS : DEFAULT_ITEMS);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(14, insets.bottom + 8) }, style]}>
      {navItems.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <Pressable
            key={item.key}
            style={styles.tabItem}
            onPress={() => onTabPress?.(item)}
            hitSlop={6}
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
              <NavIcon item={item} isActive={isActive} profileImageSource={resolvedProfileImageSource} />
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
});
