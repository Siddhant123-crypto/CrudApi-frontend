import { Platform } from 'react-native';

export const AdminFonts = {
  heading: 'Fraunces_600SemiBold',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export const ADMIN_THEME = {
  colors: {
    // Page background
    pageBgTop: '#F4F6FB',
    pageBgBottom: '#ECEFF7',
    pageBgGradient: ['#F4F6FB', '#ECEFF7'] as const,

    // Header gradient
    headerGradient: ['#233577', '#0A1122'] as const,
    headerGradientStart: { x: 0.3, y: 0 },
    headerGradientEnd: { x: 0.7, y: 1 },
    headerCircle1: '#5B7CFA',
    headerCircle2: '#E7C06A',

    // Ink (headings, dark)
    ink: '#0B1326',
    inkMuted: '#5B6580',
    pearl: '#F4F6FB',
    textPrimary: '#0B1326',
    textSecondary: '#5B6580',
    secondaryText: '#5B6580',
    muted: '#8A93AB',
    textMuted: '#8A93AB',
    textInactive: '#8A93AB',
    placeholder: '#8A93AB',

    // Indigo accent
    indigo: '#4F5BD5',
    indigoTint: '#E8EBFF',
    indigoPastel: '#E8EBFF',

    // Status shortcuts
    danger: '#D64545',
    success: '#1E9E6A',
    cardBg: '#FFFFFF',

    // Champagne gold
    gold: '#E7C06A',
    goldButtonGradient: ['#F3D58E', '#C99A36'] as const,

    // Navy gradient for primary buttons, active chips, icon tiles
    navyGradient: ['#1F2F6B', '#0B1326'] as const,
    darkTileGradient: ['#1F2F6B', '#0B1326'] as const,

    // Hero revenue card
    revenueCardGradient: ['#243879', '#0A1122'] as const,
    revenueCardStart: { x: 0.2, y: 0 },
    revenueCardEnd: { x: 0.8, y: 1 },

    // Card & surfaces
    card: '#FFFFFF',
    cardBorder: '#E3E7F2',
    divider: '#EEF0F7',

    // Inputs
    inputBg: '#F7F8FD',
    inputBorder: '#E3E7F2',
    inputFocusedBorder: '#4F5BD5',
    inputErrorBorder: '#D64545',

    // Status pairs
    statusSuccess: '#1E9E6A',
    statusSuccessBg: '#E1F6EC',
    statusWarning: '#B8860B',
    statusWarningBg: '#FFF4D6',
    statusError: '#D64545',
    statusErrorBg: '#FDE7E7',
    statusInfo: '#4F5BD5',
    statusInfoBg: '#E8EBFF',

    // Legacy status pill mappings for backward compatibility
    statusDeliveredBg: '#E1F6EC',
    statusDeliveredText: '#1E9E6A',
    statusProcessingBg: '#E8EBFF',
    statusProcessingText: '#4F5BD5',
    statusPendingBg: '#FFF4D6',
    statusPendingText: '#B8860B',
    statusCancelledBg: '#FDE7E7',
    statusCancelledText: '#D64545',

    // Stat card pastels & icon colors
    farmersPastel: '#E8EBFF',
    farmersIcon: '#4F5BD5',
    customersPastel: '#D9F3F1',
    customersIcon: '#1F8F89',
    productsPastel: '#FFF1D2',
    productsIcon: '#C98A1B',
    ordersPastel: '#FDE7F1',
    ordersIcon: '#C23B7A',

    // Order status pastels & icon colors
    pendingPastel: '#FFF4D6',
    pendingIcon: '#B8860B',
    completedPastel: '#E1F6EC',
    completedIcon: '#1E9E6A',
    cancelledPastel: '#FDE7E7',
    cancelledIcon: '#D64545',

    // Growth chip
    growthPositiveBg: 'rgba(126,224,176,0.14)',
    growthPositiveText: '#7EE0B0',
    growthNegativeBg: 'rgba(255,154,154,0.14)',
    growthNegativeText: '#FF9A9A',

    // Misc
    white: '#FFFFFF',
    overlay: 'rgba(11,19,38,0.55)',
  },

  fonts: {
    serif: AdminFonts.heading,
    regular: AdminFonts.regular,
    medium: AdminFonts.medium,
    semiBold: AdminFonts.semiBold,
    bold: AdminFonts.bold,
  },

  typography: {
    screenTitle: 26,
    heading: 22,
    subheading: 18,
    cardTitle: 15,
    body: 14,
    label: 13,
    small: 12,
    badge: 10.5,
  },

  radius: {
    headerBottom: 34,
    revenueCard: 28,
    card: 24,
    statCard: 22,
    smallCard: 20,
    orderStatusCard: 20,
    recentOrdersCard: 24,
    quickActionTile: 22,
    tabBar: 28,
    tabBarItem: 20,
    input: 16,
    button: 16,
    largeButton: 18,
    chip: 999,
    pill: 999,
    bottomSheet: 32,
    dialog: 24,
  },

  spacing: {
    pagePadding: 20,
    sectionGap: 26,
    cardGap: 12,
  },

  shadows: {
    dateChip: Platform.select({
      ios: {
        shadowColor: 'rgba(15,25,60,1)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 26,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
    supportButton: Platform.select({
      ios: {
        shadowColor: '#C99A36',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
      default: {},
    }),
    revenueCard: Platform.select({
      ios: {
        shadowColor: 'rgba(11,19,38,1)',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.35,
        shadowRadius: 38,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
    card: Platform.select({
      ios: {
        shadowColor: 'rgba(15,25,60,1)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 26,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
    primaryButton: Platform.select({
      ios: {
        shadowColor: 'rgba(11,19,38,1)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
    stickyBar: Platform.select({
      ios: {
        shadowColor: 'rgba(15,25,60,1)',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
    searchBar: Platform.select({
      ios: {
        shadowColor: 'rgba(15,25,60,1)',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
    quickActionTile: Platform.select({
      ios: {
        shadowColor: 'rgba(11,19,38,1)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
    tabBar: Platform.select({
      ios: {
        shadowColor: 'rgba(15,25,60,1)',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.22,
        shadowRadius: 40,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
    tabBarActiveItem: Platform.select({
      ios: {
        shadowColor: 'rgba(11,19,38,1)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
      default: {},
    }),
    fab: Platform.select({
      ios: {
        shadowColor: '#4F5BD5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
};
