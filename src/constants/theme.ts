import { Platform } from 'react-native';

export const THEME = {
  colors: {
    // Page backgrounds
    pageBgTop: '#FBF5EA',
    pageBgBottom: '#F6EFE2',
    pageBgGradient: ['#FBF5EA', '#F6EFE2'] as const,

    // Header gradient & glass
    headerGradient: ['#A23A14', '#3B1008'] as const,
    headerGradientStart: { x: 0.3, y: 0 },
    headerGradientEnd: { x: 0.7, y: 1 },
    headerCircle1: '#F59E3A',
    headerCircle2: '#FFC15E',
    headerLabel: '#FFD9A0',
    headerGlassBorder: 'rgba(255,255,255,0.22)',
    headerGlassBg: 'rgba(255,255,255,0.10)',

    // Text colors
    textBase: '#2A1710',
    textHeading: '#3B1A0E',
    textSecondary: '#7A6350',
    textMuted: '#8A6F5C',
    placeholder: '#8E9A90',

    // Accents
    accent: '#B8470F',
    accentDeep: '#C2561A',

    // Surfaces & borders
    cardBg: '#FFFDF8',
    cardBorder: '#F0E1CF',
    divider: '#F0E1CF',
    inputBg: '#FFF9F2',
    inputBorder: '#F1DCC6',
    inputBorderFocused: '#E07B39',

    // Chips & selections
    chipBg: '#FFF1E3',
    chipText: '#B8470F',
    selectedBg: '#FFE7CC',
    selectedBorder: '#E8A56B',
    selectedText: '#8A2E12',

    // CTA Gradients
    ctaOrangeGradient: ['#F59A4A', '#D9651B'] as const,
    ctaGoldGradient: ['#FFD36B', '#F2A31F'] as const,
    ctaGoldText: '#3B1A0E',
    ctaMaroonGradient: ['#C2561A', '#7A2A0C'] as const,
    ctaMaroonText: '#FFFFFF',

    // Icons & badges
    star: '#F0A020',
    heartActive: '#B8470F',
    notificationDot: '#F59A4A',

    // Status colors
    success: '#2E7D4F',
    successBg: '#E3F3E8',
    warning: '#F2A31F',
    warningBg: '#FFF4DD',
    error: '#C0392B',
    errorBg: '#FDE6E2',

    // Hero / Tile Radial colors
    tileRadialStart: '#FFFFFF',
    tileRadialMiddle: '#FFF1DE',
    tileRadialEnd: '#FBDDB8',

    // White
    white: '#FFFFFF',
  },

  fonts: {
    serif: 'Fraunces_600SemiBold',
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },

  radius: {
    cards: 24,
    smallCards: 20,
    inputs: 16,
    buttons: 16,
    largeButtons: 18,
    smallButtons: 12,
    chips: 999,
    bottomSheets: 32,
    dialogs: 24,
    pill: 999,
  },

  spacing: {
    pageHorizontal: 20,
    sectionGap: 26,
    cardGap: 12,
  },

  shadows: {
    card: Platform.select({
      ios: {
        shadowColor: 'rgba(90,40,15,1)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.09,
        shadowRadius: 24,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
    primaryButton: Platform.select({
      ios: {
        shadowColor: '#D9651B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
    bottomNav: Platform.select({
      ios: {
        shadowColor: 'rgba(90, 40, 15, 1)',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.22,
        shadowRadius: 40,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
    stickyBar: Platform.select({
      ios: {
        shadowColor: 'rgba(90,40,15,1)',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
};

export default THEME;
