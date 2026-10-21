import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import {
  useFonts,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

// ─── SVG ICONS ─────────────────────────────────────────────────────────────

const HomeIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 11 12 3l9 8"
      stroke="#17663F"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 10v10h14V10"
      stroke="#17663F"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LogoIcon = () => (
  <Svg
    width={44}
    height={44}
    viewBox="0 0 48 48"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path
      d="M6 36c0-14 8-22 22-22 0 14-8 22-22 22z"
      stroke="#17663F"
      strokeWidth={3}
    />
    <Path d="M6 36 20 22" stroke="#17663F" strokeWidth={3} />
    <Path d="M26 22 36 13l10 9v14H26z" stroke="#E8742A" strokeWidth={3} />
  </Svg>
);

const ChevronRightIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5l7 7-7 7"
      stroke="#FFFFFF"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CustomerBagIcon = () => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M6 8h12l-1 12H7L6 8z" stroke="#D9651B" strokeWidth={1.8} />
    <Path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#D9651B" strokeWidth={1.8} />
  </Svg>
);

const FarmerSproutIcon = () => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M12 21v-8" stroke="#17663F" strokeWidth={1.8} />
    <Path
      d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6z"
      stroke="#17663F"
      strokeWidth={1.8}
    />
    <Path
      d="M12 11c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5z"
      stroke="#17663F"
      strokeWidth={1.8}
    />
  </Svg>
);

// ─── COMPONENT ─────────────────────────────────────────────────────────────

const RoleSelectionScreen = ({ route, navigation }: any) => {
  const params = route?.params || {};

  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ─── 1) HERO SECTION (height 340 + statusBarHeight) ─── */}
        <View style={[styles.heroContainer, { height: 340 + statusBarHeight }]}>
          <Svg
            width="100%"
            height={340 + statusBarHeight}
            viewBox="0 0 390 340"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFillObject}
          >
            <Defs>
              <SvgLinearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FFE3B8" />
                <Stop offset="60%" stopColor="#DDEFD9" />
                <Stop offset="100%" stopColor="#BFE3C9" />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="390" height="340" fill="url(#heroGrad)" />
            {/* Sun at (70, 150), radius 52 */}
            <Circle cx="70" cy="150" r="52" fill="#FFF3D6" opacity={0.9} />
            {/* Hill A */}
            <Path
              d="M0 230 Q100 180 200 215 T390 200 V340 H0 Z"
              fill="#8FD0A6"
            />
            {/* Hill B */}
            <Path
              d="M0 260 Q120 215 240 250 T390 240 V340 H0 Z"
              fill="#4FB07A"
            />
            {/* Hill C */}
            <Path
              d="M0 290 Q140 255 270 285 T390 275 V340 H0 Z"
              fill="#1F8A56"
            />
            {/* 4 Crop Rows */}
            <Path
              d="M20 340 Q90 295 160 302"
              stroke="#2FA066"
              strokeWidth={2}
              opacity={0.7}
              fill="none"
            />
            <Path
              d="M80 340 Q150 302 230 308"
              stroke="#2FA066"
              strokeWidth={2}
              opacity={0.7}
              fill="none"
            />
            <Path
              d="M150 340 Q220 308 300 314"
              stroke="#2FA066"
              strokeWidth={2}
              opacity={0.7}
              fill="none"
            />
            <Path
              d="M230 340 Q290 312 370 316"
              stroke="#2FA066"
              strokeWidth={2}
              opacity={0.7}
              fill="none"
            />
          </Svg>

          {/* Home Button (top-right) */}
          <TouchableOpacity
            style={[styles.homeButton, { top: 48 + statusBarHeight }]}
            onPress={() => navigation.navigate('Welcome')}
            activeOpacity={0.8}
          >
            <HomeIcon />
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>

          {/* Logo Block, centered horizontally, top = 84 + statusBarHeight */}
          <View style={[styles.logoBlock, { top: 84 + statusBarHeight }]}>
            <View style={styles.logoCircle}>
              <LogoIcon />
            </View>
            <Text style={styles.brandTitle}>Farm2Home</Text>
            <Text style={styles.brandSubTitle}>FRESH • LOCAL • DELIVERED</Text>
          </View>
        </View>

        {/* ─── 2) WHITE SHEET (starts at y=300 + statusBarHeight) ─── */}
        <View style={styles.whiteSheet}>
          <Text style={styles.heading}>Select your role</Text>
          <Text style={styles.subtitle}>Choose how you want to continue</Text>

          {/* Card 1 - Customer */}
          <Pressable
            style={styles.cardContainer}
            onPress={() => navigation.navigate('CustomerRegister', params)}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F5FBF7']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Tile Gradient */}
              <LinearGradient
                colors={['#FFEBD6', '#FFD3A8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconTile}
              >
                <CustomerBagIcon />
              </LinearGradient>

              {/* Text Column */}
              <View style={styles.textColumn}>
                <Text style={styles.cardTitle}>I am a Customer</Text>
                <Text style={styles.cardDescription}>
                  {"Order fresh produce\ndelivered to your home"}
                </Text>
              </View>

              {/* Arrow Button */}
              <View style={styles.arrowButton}>
                <ChevronRightIcon />
              </View>
            </LinearGradient>
          </Pressable>

          <View style={{ height: 16 }} />

          {/* Card 2 - Farmer */}
          <Pressable
            style={styles.cardContainer}
            onPress={() => navigation.navigate('FarmerRegister', params)}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F5FBF7']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Tile Gradient */}
              <LinearGradient
                colors={['#DDF3E4', '#B5E3C6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconTile}
              >
                <FarmerSproutIcon />
              </LinearGradient>

              {/* Text Column */}
              <View style={styles.textColumn}>
                <Text style={styles.cardTitle}>I am a Farmer</Text>
                <Text style={styles.cardDescription}>
                  {"Sell your harvest\ndirectly to customers"}
                </Text>
              </View>

              {/* Arrow Button */}
              <View style={styles.arrowButton}>
                <ChevronRightIcon />
              </View>
            </LinearGradient>
          </Pressable>

          {/* "← Back to sign in" link */}
          <TouchableOpacity
            style={styles.backLinkContainer}
            onPress={() => navigation.navigate('NewUserLogin')}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkText}>← Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFE3B8',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  // ─── HERO ───
  heroContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  homeButton: {
    position: 'absolute',
    right: 20,
    height: 38,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#0E3B29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    zIndex: 20,
  },
  homeButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13.5,
    color: '#0E3B29',
  },
  logoBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#CFE8D6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E3B29',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 6,
  },
  brandTitle: {
    marginTop: 10,
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 23,
    color: '#0E3B29',
    textAlign: 'center',
  },
  brandSubTitle: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9.5,
    letterSpacing: 2.6,
    color: '#17663F',
    textAlign: 'center',
  },
  // ─── WHITE SHEET ───
  whiteSheet: {
    marginTop: 300 + statusBarHeight,
    flex: 1,
    minHeight: SCREEN_HEIGHT - 300,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 28,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 85,
    shadowColor: '#0E3B29',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
    position: 'relative',
  },
  heading: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 27,
    color: '#0E3B29',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 5,
    marginBottom: 22,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    color: '#5C6B60',
    textAlign: 'center',
  },
  cardContainer: {
    width: '92%',
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D3E5D8',
    overflow: 'hidden',
    shadowColor: '#0E3B29',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
    minHeight: 78,
  },
  cardGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textColumn: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16.5,
    color: '#0E3B29',
  },
  cardDescription: {
    marginTop: 3,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    lineHeight: 16.5,
    color: '#5C6B60',
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17663F',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backLinkContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  backLinkText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13.5,
    color: '#17663F',
    textAlign: 'center',
  },
});

export default RoleSelectionScreen;
