import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { THEME } from '../constants/theme';
import { PrimaryButton } from './ui/Buttons';

interface SuccessModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ visible, message, onClose }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, THEME.shadows.card]}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={48} color={THEME.colors.success} />
          </View>
          <Text style={styles.title}>Success!</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonWrapper}>
            <PrimaryButton title="Continue" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 14, 6, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.dialogs,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: THEME.colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C6E8D0',
  },
  title: {
    fontFamily: THEME.fonts.serif,
    fontSize: 22,
    color: THEME.colors.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: THEME.fonts.regular,
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  buttonWrapper: {
    width: '100%',
  },
});

export default SuccessModal;
