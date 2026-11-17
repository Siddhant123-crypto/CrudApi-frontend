/**
 * LanguageSelectionScreen.tsx
 * Farm2Home Language Selection Screen.
 * UI-only change: language logic, navigation targets, and AsyncStorage
 * keys are identical to the previous implementation.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  BackHandler,
  Platform,
  StatusBar as RNStatusBar,
  Text as RNText,
  TextProps as RNTextProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  setAppLanguage,
  getStoredLanguage,
} from '../i18n';

// ─── Local text wrapper preventing system font scaling breakage ──────────────
const AppText: React.FC<RNTextProps> = (props) => (
  <RNText
    allowFontScaling={false}
    maxFontSizeMultiplier={1}
    {...props}
  />
);

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  creamBg: '#FBF6EC',
  forest: '#14532D',
  forestMid: '#1E6B3C',
  forestDeep: '#0F3D22',
  forestEnd: '#232714',
  terracotta: '#B24A14',
  gold: '#F2B544',
  softGold: '#F2D08A',
  ink: '#2A1D12',
  softInk: '#6B5A48',
  sheetBorder: '#EFE3CB',
  tileBg: '#FFFDF8',
  tileBorder: '#E9DCC4',
  sheetHeading: '#123D24',
  chipBg: '#FCE9D6',
  chipText: '#8A3A0F',
  white: '#FFFFFF',
  tileSelectedBorder: '#0F3D22',
  tileRing: 'rgba(232,120,46,0.35)',
  heroGlowTerra: 'rgba(232,120,46,0.55)',
  heroGlowGold: 'rgba(242,181,68,0.30)',
  glassBg: 'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.28)',
  btnShadow: 'rgba(99,60,22,0.38)',
  sheetShadow: 'rgba(43,26,12,0.14)',
  selectedTileGlow: 'rgba(14,61,34,0.30)',
};

// ─── Font map (native script → font family) ──────────────────────────────────
const NATIVE_FONTS: Record<string, string> = {
  en: 'PlusJakartaSans_700Bold',
  hi: 'NotoSansDevanagari_700Bold',
  mr: 'NotoSansDevanagari_700Bold',
  sa: 'NotoSansDevanagari_700Bold',
  ta: 'NotoSansTamil_700Bold',
  bn: 'NotoSansBengali_700Bold',
  kn: 'NotoSansKannada_700Bold',
  or: 'NotoSansOriya_700Bold',
  te: 'NotoSansTelugu_700Bold',
};

// ─── SVG Hero gradient background (sized for shorter hero) ───────────────────
interface HeroGradientBgProps {
  width: number;
  height: number;
}
const HeroGradientBg: React.FC<HeroGradientBgProps> = ({ width, height }) => (
  <Svg
    width={width}
    height={height}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    <Defs>
      {/* Diagonal hero gradient: forest → forestDeep → dark olive-brown */}
      <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={C.forestMid} stopOpacity="1" />
        <Stop offset="0.55" stopColor={C.forestDeep} stopOpacity="1" />
        <Stop offset="1" stopColor={C.forestEnd} stopOpacity="1" />
      </LinearGradient>
      {/* Terracotta glow — top-right */}
      <RadialGradient id="glowTerra" cx="1" cy="0" r="1" fx="1" fy="0">
        <Stop offset="0" stopColor="rgba(232,120,46,1)" stopOpacity="0.55" />
        <Stop offset="1" stopColor="rgba(232,120,46,0)" stopOpacity="0" />
      </RadialGradient>
      {/* Gold glow — bottom-left */}
      <RadialGradient id="glowGold" cx="0" cy="1" r="1" fx="0" fy="1">
        <Stop offset="0" stopColor="rgba(242,181,68,1)" stopOpacity="0.30" />
        <Stop offset="1" stopColor="rgba(242,181,68,0)" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    {/* Base gradient */}
    <Rect x={0} y={0} width={width} height={height} fill="url(#heroGrad)" />
    {/* Terracotta glow circle ~200px, top-right */}
    <Circle
      cx={width + 30 - 100}
      cy={-50 + 100}
      r={100}
      fill="url(#glowTerra)"
    />
    {/* Gold glow circle ~190px, bottom-left */}
    <Circle
      cx={-30 + 95}
      cy={height + 50 - 95}
      r={95}
      fill="url(#glowGold)"
    />
  </Svg>
);

// ─── SVG Continue button gradient ────────────────────────────────────────────
interface BtnGradProps {
  width: number;
  height: number;
}
const BtnGradBg: React.FC<BtnGradProps> = ({ width, height }) => (
  <Svg
    width={width}
    height={height}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    <Defs>
      <LinearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor={C.forest} stopOpacity="1" />
        <Stop offset="0.42" stopColor={C.forestMid} stopOpacity="1" />
        <Stop offset="1" stopColor={C.terracotta} stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={width} height={height} fill="url(#btnGrad)" rx={18} ry={18} />
  </Svg>
);

// ─── SVG Selected-tile gradient ──────────────────────────────────────────────
const TileGradBg: React.FC = () => (
  <Svg
    width="100%"
    height="100%"
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    <Defs>
      <LinearGradient id="tileGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={C.forestMid} stopOpacity="1" />
        <Stop offset="1" stopColor={C.forestDeep} stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width="100%" height="100%" fill="url(#tileGrad)" rx={20} ry={20} />
  </Svg>
);

// ─── Check badge SVG ─────────────────────────────────────────────────────────
const CheckBadge = () => (
  <View style={styles.checkBadge} pointerEvents="none">
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx={11} cy={11} r={11} fill={C.gold} />
      <Path
        d="M6.5 11.5L9.5 14.5L15.5 8.5"
        stroke="#2A1308"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  navigation: any;
  route?: { params?: { fromSettings?: boolean } };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LanguageSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const fromSettings = Boolean(route?.params?.fromSettings);
  const canGoBack = fromSettings || navigation.canGoBack();

  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    i18n.language || 'en'
  );
  const [saving, setSaving] = useState(false);
  const isConfirmedRef = useRef(false);
  const initialLanguageRef = useRef<string>(i18n.language || 'en');

  // Status bar handling: force light-content (white icons/clock) on hero
  useFocusEffect(
    useCallback(() => {
      RNStatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        RNStatusBar.setTranslucent(true);
        RNStatusBar.setBackgroundColor('transparent', true);
      }
      return () => {
        RNStatusBar.setBarStyle('light-content', true);
        if (Platform.OS === 'android') {
          RNStatusBar.setBackgroundColor('#A23A14', true);
        }
      };
    }, [])
  );

  // Load the persisted language on mount
  useEffect(() => {
    getStoredLanguage().then((stored) => {
      setSelectedLanguage(stored);
      initialLanguageRef.current = stored;
    });
  }, []);

  // Revert live-preview when leaving WITHOUT pressing Continue (back arrow, gesture, Android hardware back)
  useEffect(() => {
    const unsubscribe = navigation.addListener(
      'beforeRemove',
      () => {
        // If the user confirmed by pressing Continue, do NOT revert!
        if (isConfirmedRef.current) {
          return;
        }
        if (i18n.language !== initialLanguageRef.current) {
          i18n.changeLanguage(initialLanguageRef.current);
        }
      }
    );
    return unsubscribe;
  }, [navigation, i18n]);

  // Android hardware back — same revert logic
  useEffect(() => {
    if (!canGoBack) {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        // On first-launch (no back stack) pressing hardware back exits the app
        BackHandler.exitApp();
        return true;
      });
      return () => handler.remove();
    }
    return undefined;
  }, [canGoBack]);

  const handleSelect = useCallback(
    async (code: string) => {
      setSelectedLanguage(code);
      await i18n.changeLanguage(code);
    },
    [i18n]
  );

  const handleBack = useCallback(() => {
    if (i18n.language !== initialLanguageRef.current) {
      i18n.changeLanguage(initialLanguageRef.current);
    }
    navigation.goBack();
  }, [navigation, i18n]);

  const handleContinue = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      isConfirmedRef.current = true;
      await setAppLanguage(selectedLanguage);
      if (fromSettings) {
        navigation.goBack();
      } else {
        navigation.replace('NewUserLogin');
      }
    } catch {
      // Even on error, navigate so we don't block the user
      if (fromSettings) {
        navigation.goBack();
      } else {
        navigation.replace('NewUserLogin');
      }
    } finally {
      setSaving(false);
    }
  }, [saving, selectedLanguage, fromSettings, navigation]);

  // ── Derived dimensions & responsiveness ───────────────────────────────────
  const heroTopPadding = insets.top + 14;
  const btnBottom = insets.bottom + 24;
  const scrollPaddingBottom = 58 + btnBottom + 16; // button height + its offset + gap

  // Chunk supported languages into 3 rows of 3 to guarantee exact 3-column layout
  const languageRows: SupportedLanguage[][] = [
    SUPPORTED_LANGUAGES.slice(0, 3),
    SUPPORTED_LANGUAGES.slice(3, 6),
    SUPPORTED_LANGUAGES.slice(6, 9),
  ];

  return (
    <View style={styles.root}>
      {/* Translucent status bar — light icons over the hero */}
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* ── SCROLL AREA ───────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollPaddingBottom },
        ]}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HERO (Compact height) ─────────────────────────────────────── */}
        <View
          style={[
            styles.hero,
            {
              paddingTop: heroTopPadding,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
            },
          ]}
        >
          {/* Gradient + glows background */}
          <HeroGradientBg width={SCREEN_WIDTH} height={240} />

          {/* Top row: left group (back + wordmark) and right globe button */}
          <View style={styles.heroTopRow}>
            {/* Left group */}
            <View style={styles.heroLeftGroup}>
              {canGoBack ? (
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.glassCircle}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={t('language.back', 'Back')}
                >
                  <Ionicons name="chevron-back" size={22} color={C.white} />
                </TouchableOpacity>
              ) : (
                <View style={styles.glassCirclePlaceholder} />
              )}

              {/* Wordmark */}
              <AppText style={styles.wordmarkText}>
                {'Farm'}
                <AppText style={styles.wordmarkGold}>{'2'}</AppText>
                {'Home'}
              </AppText>
            </View>

            {/* Right: Globe button (decorative) */}
            <View
              style={styles.glassCircle}
              importantForAccessibility="no"
              accessibilityElementsHidden
            >
              <Ionicons name="globe-outline" size={20} color={C.white} />
            </View>
          </View>

          {/* Title */}
          <AppText
            style={styles.heroTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {t('language.chooseTitle', 'Choose your language')}
          </AppText>
        </View>

        {/* ── SHEET CARD ────────────────────────────────────────────────── */}
        <View style={styles.sheetCard}>
          {/* Header row: Larger heading (24px) + Count chip */}
          <View style={styles.sheetHeader}>
            <AppText
              style={styles.sheetHeading}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {t('language.selectLanguage', 'Select language')}
            </AppText>
            <View style={styles.countChip}>
              <AppText style={styles.countChipText}>
                {t('language.count', {
                  total: SUPPORTED_LANGUAGES.length,
                })}
              </AppText>
            </View>
          </View>

          {/* 3-column x 3-row grid using flex rows (never wraps) */}
          <View style={styles.grid}>
            {languageRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((lang) => {
                  const isSelected = lang.code === selectedLanguage;
                  const nativeFont = NATIVE_FONTS[lang.code] ?? 'PlusJakartaSans_700Bold';

                  return (
                    <View key={lang.code} style={styles.tileWrapper}>
                      {/* Orange ring — rendered outside tile boundary */}
                      {isSelected && (
                        <View style={styles.tileRing} pointerEvents="none" />
                      )}

                      <TouchableOpacity
                        style={[
                          styles.tile,
                          isSelected ? styles.tileSelected : styles.tileUnselected,
                        ]}
                        onPress={() => handleSelect(lang.code)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`${lang.name}, ${lang.nativeName}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        {/* Gradient fill for selected tile */}
                        {isSelected && (
                          <View style={styles.tileGradContainer} pointerEvents="none">
                            <TileGradBg />
                          </View>
                        )}

                        {/* Tile content */}
                        <AppText
                          style={[
                            styles.tileNativeName,
                            { fontFamily: nativeFont },
                            isSelected
                              ? styles.tileNativeNameSelected
                              : styles.tileNativeNameUnselected,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                        >
                          {lang.nativeName}
                        </AppText>
                        <AppText
                          style={[
                            styles.tileEnglishName,
                            isSelected
                              ? styles.tileEnglishNameSelected
                              : styles.tileEnglishNameUnselected,
                          ]}
                          numberOfLines={1}
                        >
                          {lang.name}
                        </AppText>

                        {/* Gold check badge — top-right */}
                        {isSelected && <CheckBadge />}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* ── FOOTNOTE (outside the white card, on cream background) ─────── */}
        <AppText style={styles.footnote} numberOfLines={1}>
          {t(
            'language.changeLater',
            'You can change the language anytime from Settings.'
          )}
        </AppText>
      </ScrollView>

      {/* ── CONTINUE BUTTON (pinned) ────────────────────────────────────── */}
      <View
        style={[
          styles.btnContainer,
          {
            bottom: btnBottom,
            left: 20,
            right: 20,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.continueBtn, saving && { opacity: 0.75 }]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={t('common.continue', 'Continue')}
        >
          {/* Gradient background */}
          <BtnGradBg width={SCREEN_WIDTH - 40} height={58} />

          {/* Label centred with 56 px horizontal padding so it clears the gold circle */}
          <AppText style={styles.btnLabel} numberOfLines={1}>
            {t('common.continue', 'Continue')}
          </AppText>

          {/* Gold arrow circle */}
          <View style={styles.goldCircle}>
            <Ionicons name="arrow-forward" size={18} color="#2A1308" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.creamBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    // bottom padding added dynamically
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingBottom: 40,
    // borderBottomLeftRadius / borderBottomRightRadius set inline (40)
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  glassCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.glassBg,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCirclePlaceholder: {
    width: 44,
    height: 44,
  },
  wordmarkText: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: C.white,
    letterSpacing: 0,
  },
  wordmarkGold: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: C.gold,
  },
  heroTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.4,
    color: C.white,
    marginTop: 24,
  },

  // ── Sheet card ────────────────────────────────────────────────────────────
  sheetCard: {
    marginTop: -22,
    marginHorizontal: 20,
    backgroundColor: C.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.sheetBorder,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    // Shadow
    shadowColor: C.sheetShadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  sheetHeading: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 24,
    lineHeight: 32,
    color: C.sheetHeading,
    flexShrink: 1,
  },
  countChip: {
    backgroundColor: C.chipBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexShrink: 0,
  },
  countChipText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: C.chipText,
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tileWrapper: {
    flex: 1,
    minWidth: 0,
    height: 112,
    position: 'relative',
  },
  tileRing: {
    position: 'absolute',
    top: -4.5,
    left: -4.5,
    right: -4.5,
    bottom: -4.5,
    borderRadius: 24.5,
    borderWidth: 3,
    borderColor: C.tileRing,
    zIndex: 0,
  },
  tile: {
    flex: 1,
    width: '100%',
    height: 112,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 4,
    zIndex: 1,
  },
  tileUnselected: {
    backgroundColor: C.tileBg,
    borderWidth: 1.5,
    borderColor: C.tileBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tileSelected: {
    borderWidth: 1.5,
    borderColor: C.tileSelectedBorder,
    shadowColor: C.selectedTileGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  tileGradContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tileNativeName: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  tileNativeNameUnselected: {
    color: C.ink,
  },
  tileNativeNameSelected: {
    color: C.white,
  },
  tileEnglishName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  tileEnglishNameUnselected: {
    color: C.softInk,
  },
  tileEnglishNameSelected: {
    color: C.softGold,
  },

  // Check badge (absolute inside tile)
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },

  // ── Footnote ──────────────────────────────────────────────────────────────
  footnote: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12.5,
    lineHeight: 18,
    color: C.softInk,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
  },

  // ── Continue button ───────────────────────────────────────────────────────
  btnContainer: {
    position: 'absolute',
    // left / right / bottom set inline
  },
  continueBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    // Shadow
    shadowColor: C.btnShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  btnLabel: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: C.white,
    textAlign: 'center',
    paddingHorizontal: 56,
  },
  goldCircle: {
    position: 'absolute',
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LanguageSelectionScreen;
