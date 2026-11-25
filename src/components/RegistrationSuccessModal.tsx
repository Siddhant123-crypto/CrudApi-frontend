import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

export interface RegistrationSuccessModalProps {
  visible: boolean;
  role: 'CUSTOMER' | 'FARMER';
  userName?: string;
  userEmail?: string;
  message?: string;
  onContinue: () => void;
}

const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  visible,
  role,
  userName,
  userEmail,
  message,
  onContinue,
}) => {
  const { t } = useTranslation();
  const isFarmer = role === 'FARMER';

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.86)).current;
  const cardTranslateY = useRef(new Animated.Value(24)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.86);
      cardTranslateY.setValue(24);
      checkScale.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.spring(cardScale, {
            toValue: 1,
            tension: 75,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.spring(cardTranslateY, {
            toValue: 0,
            tension: 75,
            friction: 9,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, cardScale, cardTranslateY, checkScale]);

  const headerColors: [string, string] = isFarmer
    ? ['#0E4D2E', '#1F8A4D']
    : ['#B8470F', '#E67A28'];

  const buttonColors: [string, string] = isFarmer
    ? ['#17663F', '#228B54']
    : ['#C85210', '#E57A25'];

  const pillBg = isFarmer ? '#E8F7EE' : '#FFF3E8';
  const pillBorder = isFarmer ? '#B7E4C7' : '#F6CBA5';
  const pillTextColor = isFarmer ? '#145A32' : '#A8420C';
  const accentRingColor = isFarmer ? 'rgba(34, 139, 84, 0.22)' : 'rgba(230, 122, 40, 0.22)';

  const defaultMessage = isFarmer
    ? t(
        'auth.farmerAccountCreated',
        'Your farmer account has been created successfully. Please login.',
      )
    : t(
        'auth.customerAccountCreated',
        'Your customer account has been created successfully. Please login.',
      );

  const roleLabel = isFarmer
    ? t('auth.farmer', 'Farmer')
    : t('auth.customer', 'Customer');

  const displayName = (userName || '').trim();
  const displayEmail = (userEmail || '').trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onContinue}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
            },
          ]}
        >
          {/* Branded Celebration Header */}
          <LinearGradient
            colors={headerColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBanner}
          >
            {/* Subtle decorative sparkles & leaf accents */}
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 320 120"
              style={styles.headerDecor}
            >
              <Circle cx="36" cy="26" r="22" fill="rgba(255,255,255,0.08)" />
              <Circle cx="286" cy="22" r="28" fill="rgba(255,255,255,0.08)" />
              <Circle cx="264" cy="96" r="14" fill="rgba(255,255,255,0.07)" />
              <Path
                d="M52 82c4-8 12-10 18-10-1 7-4 14-12 16-3 1-5-2-6-6z"
                fill="rgba(255,255,255,0.14)"
              />
              <Path
                d="M242 42l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z"
                fill="rgba(255,255,255,0.28)"
              />
              <Path
                d="M78 28l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z"
                fill="rgba(255,255,255,0.24)"
              />
            </Svg>

            {/* Animated Success Badge */}
            <View style={[styles.badgeHalo, { backgroundColor: accentRingColor }]}>
              <Animated.View
                style={[
                  styles.badgeCircle,
                  { transform: [{ scale: checkScale }] },
                ]}
              >
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M5 13l4.5 4.5L19 7.5"
                    stroke={isFarmer ? '#17663F' : '#C85210'}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Animated.View>
            </View>
          </LinearGradient>

          {/* Card Content */}
          <View style={styles.body}>
            {/* Role Confirmation Pill */}
            <View
              style={[
                styles.rolePill,
                { backgroundColor: pillBg, borderColor: pillBorder },
              ]}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
                  fill={pillTextColor}
                />
              </Svg>
              <Text style={[styles.rolePillText, { color: pillTextColor }]}>
                {roleLabel}
              </Text>
            </View>

            <Text style={styles.title}>
              {t('auth.registrationSuccessful', 'Registration Successful')}
            </Text>

            <Text style={styles.subtitle}>{message || defaultMessage}</Text>

            {/* Account Summary Box */}
            {(displayName.length > 0 || displayEmail.length > 0) && (
              <View style={styles.accountCard}>
                <View style={styles.verifiedDot}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 13l4 4L19 7"
                      stroke="#FFFFFF"
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <View style={styles.accountTextCol}>
                  {displayName.length > 0 && (
                    <Text style={styles.accountName} numberOfLines={1}>
                      {displayName}
                    </Text>
                  )}
                  {displayEmail.length > 0 && (
                    <Text style={styles.accountEmail} numberOfLines={1}>
                      {displayEmail}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Primary CTA Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={onContinue}
              style={styles.ctaWrapper}
            >
              <LinearGradient
                colors={buttonColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>
                  {t('auth.signIn', 'Sign In')}
                </Text>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M5 12h14m-6-6 6 6-6 6"
                    stroke="#FFFFFF"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 32, 20, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0A2416',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.24,
        shadowRadius: 24,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  headerBanner: {
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  badgeHalo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
  badgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
  },
  rolePillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: '#0E3B29',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5E52',
    textAlign: 'center',
    marginBottom: 18,
  },
  accountCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F9F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCECE0',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 20,
    gap: 12,
  },
  verifiedDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E8E4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTextCol: {
    flex: 1,
  },
  accountName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#123524',
  },
  accountEmail: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12.5,
    color: '#5A6E61',
    marginTop: 1,
  },
  ctaWrapper: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0E3B29',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaButton: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default RegistrationSuccessModal;
