import { Platform } from 'react-native';

export const FARMER_THEME = {
  colors: {
    // Page background
    pageBgTop: '#F3F8F0',
    pageBgBottom: '#EAF2E6',
    pageBgGradient: ['#F3F8F0', '#EAF2E6'] as const,

    // Header gradient & circles
    headerGradient: ['#1F7A4D', '#082419'] as const,
    headerGradientStart: { x: 0.3, y: 0 },
    headerGradientEnd: { x: 0.7, y: 1 },
    headerCircle1: '#6FD39B',
    headerCircle2: '#E9B949',

    // Greens
    headings: '#0E3B29',
    darkGreen: '#0E3B29', // Headings, labels, active tab
    primaryGreen: '#17663F', // Links, search icon, active indicators, icons
    focusGreen: '#2A9560',
    leafGreen: '#2F7A3A',
    tealGreen: '#1F7F78',

    // Buttons gradients
    primaryBtnGradient: ['#2FA66B', '#145238'] as const,
    goldBtnGradient: ['#F8DF86', '#DDA520'] as const,
    deepBtnGradient: ['#1F8A56', '#0E3B29'] as const,

    // Gold accents
    goldLight: '#F5D77A', // Header labels, pin icon, chip text
    goldDot: '#F5C84B', // Notification dot
    goldDotBorder: '#0F4A31',
    ctaGoldGradient: ['#F8DF86', '#DDA520'] as const,
    ctaGoldShadow: '#DDA520',

    // Cards & Surfaces
    cardBg: '#FBFEF9',
    cardBorder: '#DCE8DF',
    divider: '#DCE8DF',
    white: '#FFFFFF',

    // Inputs
    inputBg: '#F5FBF7',
    inputBorder: '#D3E5D8',
    inputFocusBorder: '#2A9560',
    uploadTileBg: '#F0F8F2',
    uploadTileBorder: '#7CCB9C',

    // Text colors
    textPrimary: '#0E3B29',
    textDark: '#1B2A22',
    bodyText: '#1B2A22',
    textSecondary: '#5C6B60',
    textMuted: '#6B7A6F',
    placeholder: '#8E9A90',

    // Chips
    chipBgInactive: '#FBFEF9',
    chipBorderInactive: '#DCE8DF',
    chipTextInactive: '#5C6B60',
    chipBgActive: '#DDF3E4',
    chipBorderActive: '#7CCB9C',
    chipTextActive: '#0E3B29',

    // Pastels for categories / tiles
    pastelRed: '#FFE3DC',
    pastelBlue: '#E3EEFF',
    pastelGreen: '#DDF3E4',
    pastelLime: '#E4F5D6',
    pastelYellow: '#FFF0CC',
    pastelTan: '#F3E3D3',
    pastelTeal: '#D7F0EC',

    // Status colors
    success: '#2E7D4F',
    successBg: '#E3F3E8',
    deliveredBg: '#E3F3E8',
    deliveredText: '#2E7D4F',

    warning: '#B8860B',
    warningBg: '#FFF4DD',
    pendingBg: '#FFF4DD',
    pendingText: '#B8860B',

    error: '#C0392B',
    errorBg: '#FDE6E2',
    cancelledBg: '#FDE6E2',
    cancelledText: '#C0392B',

    info: '#1F7F78',
    infoBg: '#D7F0EC',

    // Ratings
    star: '#F0A020',
    emptyStar: '#DCE8DF',

    // Overlays
    backdrop: 'rgba(6,32,26,0.55)',

    // Convenience aliases
    forestGreen: '#0E3B29',
    emeraldPrimary: '#1F7A4D',
    sageText: '#5C6B60',
    harvestGold: '#F5C84B',
    pastelGold: '#FFF0CC',
    pastelMint: '#D7F0EC',
  },

  fonts: {
    serif: 'Fraunces_600SemiBold',
    serifSemiBold: 'Fraunces_600SemiBold',
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
    chips: 999,
    bottomSheets: 32,
    dialogs: 24,
  },

  spacing: {
    pagePadding: 20,
    sectionGap: 26,
    cardGap: 12,
    tabBottomPadding: 130,
  },

  typography: {
    maxFontSizeMultiplier: 1.15,
    fontSerifBold: 'Fraunces_600SemiBold',
    fontFamilyRegular: 'PlusJakartaSans_400Regular',
    fontFamilyMedium: 'PlusJakartaSans_500Medium',
    fontFamilySemiBold: 'PlusJakartaSans_600SemiBold',
    fontFamilyBold: 'PlusJakartaSans_700Bold',
  },

  shadows: {
    searchBar: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.22)',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 1,
        shadowRadius: 28,
      },
      android: {
        elevation: 10,
      },
    }),
    heroBanner: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.32)',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 1,
        shadowRadius: 38,
      },
      android: {
        elevation: 10,
      },
    }),
    addProductBtn: Platform.select({
      ios: {
        shadowColor: '#DDA520',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
    }),
    tile: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      android: {
        elevation: 3,
      },
    }),
    shortsCard: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.20)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
    shortCard: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.20)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
    orderCard: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.08)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 4,
      },
    }),
    card: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.08)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 4,
      },
    }),
    stickyBar: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.12)',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
    bottomNav: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.22)',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 1,
        shadowRadius: 40,
      },
      android: {
        elevation: 12,
      },
    }),
    button: Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,0.22)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
};

export default FARMER_THEME;
