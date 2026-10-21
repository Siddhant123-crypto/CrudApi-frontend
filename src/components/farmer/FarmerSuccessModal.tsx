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
import { FARMER_THEME } from '../../constants/farmerTheme';

interface FarmerSuccessModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  orderNumber?: string;
  customerName?: string;
  buttonText?: string;
  onClose: () => void;
}

export const FarmerSuccessModal: React.FC<FarmerSuccessModalProps> = ({
  visible,
  title = 'Order Accepted!',
  message = 'You have successfully accepted this order. You can now prepare the fresh produce.',
  orderNumber,
  customerName,
  buttonText = 'Awesome, Got it!',
  onClose,
}) => {
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
          {/* Glowing Animated-style Success Badge */}
          <View style={styles.outerGlowRing}>
            <LinearGradient
              colors={['#279659', '#14633B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.innerIconCircle}
            >
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Micro Status Chip */}
          <View style={styles.statusPill}>
            <Ionicons name="sparkles" size={13} color="#15803D" style={{ marginRight: 4 }} />
            <Text style={styles.statusPillText}>SUCCESS</Text>
          </View>

          {/* Title & Message */}
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          {/* Order Snapshot Card */}
          {(orderNumber || customerName) && (
            <View style={styles.orderSnapshot}>
              {orderNumber ? (
                <View style={styles.snapshotRow}>
                  <Text style={styles.snapshotLabel}>Order ID</Text>
                  <Text style={styles.snapshotValue} numberOfLines={1}>
                    #{orderNumber.length > 14 ? orderNumber.substring(0, 14) + '...' : orderNumber}
                  </Text>
                </View>
              ) : null}
              {customerName ? (
                <View style={[styles.snapshotRow, { marginTop: 6 }]}>
                  <Text style={styles.snapshotLabel}>Customer</Text>
                  <Text style={styles.snapshotValue} numberOfLines={1}>
                    {customerName}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={FARMER_THEME.colors.primaryBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.btnText}>{buttonText}</Text>
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
    backgroundColor: 'rgba(6, 32, 26, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  modalContainer: {
    backgroundColor: '#FBFEF9',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4EAD9',
    ...FARMER_THEME.shadows.card,
    shadowColor: '#0E3B29',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  outerGlowRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#E7F7ED',
    borderWidth: 2.5,
    borderColor: '#A8E4BC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  innerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 10,
  },
  statusPillText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11,
    color: '#15803D',
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: FARMER_THEME.fonts.serif,
    color: '#0E3B29',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13.5,
    fontFamily: FARMER_THEME.fonts.regular,
    color: '#3D5A4C',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  orderSnapshot: {
    width: '100%',
    backgroundColor: '#F3FAF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0F0E5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapshotLabel: {
    fontSize: 12,
    fontFamily: FARMER_THEME.fonts.medium,
    color: FARMER_THEME.colors.textSecondary,
  },
  snapshotValue: {
    fontSize: 12.5,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    maxWidth: '65%',
  },
  actionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#115C35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default FarmerSuccessModal;
