import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { FarmerPrimaryButton } from './FarmerButtons';
import { CheckmarkIcon } from './FarmerIcons';

interface FarmerPhotoPreviewModalProps {
  visible: boolean;
  mediaUri: string | null;
  isVideo?: boolean;
  fileName?: string | null;
  title?: string;
  subtitle?: string;
  onConfirm: () => void;
  onChooseAnother: () => void;
  onCancel: () => void;
}

/**
 * Confirmation modal shown after picking a farm photo or video from the gallery,
 * giving the farmer an explicit "Done" button to confirm selection.
 */
export const FarmerPhotoPreviewModal: React.FC<FarmerPhotoPreviewModalProps> = ({
  visible,
  mediaUri,
  isVideo = false,
  fileName,
  title,
  subtitle,
  onConfirm,
  onChooseAnother,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerBlock}>
            <Text
              style={styles.title}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {title || t('farmer.selectedPhoto', 'Selected Photo')}
            </Text>
            {subtitle ? (
              <Text
                style={styles.subtitle}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={styles.previewFrame}>
            {isVideo ? (
              <View style={styles.videoPreviewBox}>
                <View style={styles.videoIconCircle}>
                  <Ionicons name="videocam" size={34} color={FARMER_THEME.colors.primaryGreen} />
                </View>
                <Text
                  style={styles.videoLabel}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {t('farmer.videoSelected', 'Video Selected')}
                </Text>
                {fileName ? (
                  <Text
                    style={styles.fileNameText}
                    numberOfLines={1}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    {fileName}
                  </Text>
                ) : null}
              </View>
            ) : mediaUri ? (
              <Image
                source={{ uri: mediaUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : null}
          </View>

          <FarmerPrimaryButton
            title={t('common.done', 'Done')}
            onPress={onConfirm}
            style={styles.doneBtn}
            icon={<CheckmarkIcon size={18} color="#FFFFFF" strokeWidth={2.5} />}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onChooseAnother}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Ionicons
                name="images-outline"
                size={16}
                color={FARMER_THEME.colors.primaryGreen}
                style={{ marginRight: 6 }}
              />
              <Text
                style={styles.secondaryBtnText}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {t('farmer.chooseAnother', 'Choose another')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text
                style={styles.cancelBtnText}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 26, 18, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderRadius: FARMER_THEME.radius.cards,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    padding: 22,
    alignItems: 'center',
    elevation: 12,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 21,
    color: FARMER_THEME.colors.headings,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 13,
    color: FARMER_THEME.colors.textSecondary,
    textAlign: 'center',
  },
  previewFrame: {
    width: '100%',
    height: 230,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: FARMER_THEME.colors.focusGreen,
    overflow: 'hidden',
    backgroundColor: FARMER_THEME.colors.uploadTileBg,
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPreviewBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  videoIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  videoLabel: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 15,
    color: FARMER_THEME.colors.headings,
  },
  fileNameText: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 12,
    color: FARMER_THEME.colors.textSecondary,
    marginTop: 4,
  },
  doneBtn: {
    width: '100%',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  secondaryBtnText: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 13.5,
    color: FARMER_THEME.colors.primaryGreen,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cancelBtnText: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 13.5,
    color: FARMER_THEME.colors.error,
  },
});
