import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { THEME } from '../constants/theme';
import { FARMER_THEME } from '../constants/farmerTheme';
import { useTranslation } from 'react-i18next';

export interface ProfileSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  synchronizedOrdersCount?: number;
  isFarmer?: boolean;
  buttonText?: string;
}

export const ProfileSuccessModal: React.FC<ProfileSuccessModalProps> = ({
  visible,
  onClose,
  title,
  message,
  synchronizedOrdersCount = 0,
  isFarmer = false,
  buttonText,
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('profile.profileUpdated', 'Profile Updated!');
  const displayMessage = message || t('profile.savedSuccessfully', 'Your profile details have been saved successfully.');
  const displayButtonText = buttonText || t('profile.awesomeGotIt', 'Awesome, Got it!');

  // Theme-specific color palettes
  const gradientColors = isFarmer
    ? (['#22C55E', '#15803D'] as const)
    : (['#F59A4A', '#C2561A'] as const);

  const buttonGradient = isFarmer
    ? (['#1F7A4D', '#114B2E'] as const)
    : THEME.colors.ctaOrangeGradient;

  const pillBg = isFarmer ? '#E8F8EE' : '#FFF1E3';
  const pillTextColor = isFarmer ? '#15803D' : '#B8470F';
  const ringGlow = isFarmer ? 'rgba(34, 197, 94, 0.16)' : 'rgba(245, 154, 74, 0.18)';
  const ringMid = isFarmer ? 'rgba(34, 197, 94, 0.26)' : 'rgba(245, 154, 74, 0.28)';

  const cardSyncBg = isFarmer ? '#F0FDF4' : '#FFF7ED';
  const cardSyncBorder = isFarmer ? '#BBF7D0' : '#FED7AA';
  const syncIconColor = isFarmer ? '#16A34A' : '#EA580C';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          {/* Top Decorative Floating Halo Ring */}
          <View style={[styles.outerGlowRing, { backgroundColor: ringGlow }]}>
            <View style={[styles.middleRing, { backgroundColor: ringMid }]}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.innerIconCircle}
              >
                <Ionicons name="checkmark-sharp" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Sparkle micro badge */}
            <View style={styles.sparkleBadge}>
              <Ionicons name="sparkles" size={12} color="#F59E0B" />
            </View>
          </View>

          {/* Micro Status Chip */}
          <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
            <Ionicons
              name={isFarmer ? 'leaf' : 'shield-checkmark'}
              size={13}
              color={pillTextColor}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.statusPillText, { color: pillTextColor }]}>
              {isFarmer ? t('common.farmerRole', 'FARMER PROFILE') : t('profile.profileUpdated', 'PROFILE UPDATED')}
            </Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.modalTitle}>{displayTitle}</Text>
          <Text style={styles.modalMessage}>{displayMessage}</Text>

          {/* Synchronized Active Orders Highlight Card (Customer) */}
          {synchronizedOrdersCount > 0 && (
            <View
              style={[
                styles.syncCard,
                { backgroundColor: cardSyncBg, borderColor: cardSyncBorder },
              ]}
            >
              <View style={styles.syncHeaderRow}>
                <View
                  style={[
                    styles.syncIconCircle,
                    { backgroundColor: isFarmer ? '#DCFCE7' : '#FFEDD5' },
                  ]}
                >
                  <Ionicons name="cube-outline" size={17} color={syncIconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.syncTitle, { color: syncIconColor }]}>
                    {t('profile.activeOrdersSynced', 'Active Orders Synchronized')}
                  </Text>
                  <Text style={styles.syncSubtitle}>
                    {t('profile.ordersSyncedDesc', {
                      count: synchronizedOrdersCount,
                      defaultValue: `Delivery address updated across ${synchronizedOrdersCount} active order(s).`
                    })}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onClose}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtnGradient}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.actionBtnText}>{displayButtonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 20, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.18,
        shadowRadius: 22,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  outerGlowRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  middleRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sparkleBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  syncCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  syncIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  syncSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
  },
  actionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default ProfileSuccessModal;
