import { FONT_FAMILIES } from './fonts';

export const COLORS = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#E9E9E9',
  surfaceBrand: '#EAF3DE',
  accentSoft: '#FFFBEE',
  brand: '#576238',
  brandMid: '#606C3D',
  brandSoft: 'rgba(87,98,56,0.2)',
  brandSoft2: 'rgba(251,246,234,0.2)',
  accent: '#FFD95E',
  textPrimary: '#36392B',
  textSecondary: '#56594D',
  textInverse: '#FAF9F5',
  border: '#B5B8A7',
  indicatorMuted: '#D2D5C6',
  shadow: '#000000',
  textMuted: '#B5B8A7',
  dividerSoft: '#DED8CA',
  negative: '#D53C3E',
  negativeSoft: 'rgba(213,60,62,0.15)',
};

export const SPACING = {
  navTop: 7,
  navIconGap: 1,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  screenX: 15,
};

export const SIZES = {
  headerHeight: 212,
  searchBarHeight: 47,
  dot: 8,
  bottomNavClearance: 110,
  profileCoverHeight: 201,
};

export const FONT_SIZES = {
  xxs: 11,
  xs: 12,
  sm: 12.8,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 25,
};

export const FONTS = {
  displayMedium: FONT_FAMILIES.kanitMedium,
  displaySemiBold: FONT_FAMILIES.kanitSemiBold,
  displayBold: FONT_FAMILIES.kanitBold,
  body: FONT_FAMILIES.satoshiRegular,
  bodyMedium: FONT_FAMILIES.satoshiMedium,
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  xl: 12,
  pill: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 5,
  },
  header: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 6,
  },
  search: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 57,
    elevation: 5,
  },
  nav: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 24.5,
    elevation: 14,
  },
};
