import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerGoldButton, FarmerPrimaryButton } from '../components/farmer/FarmerButtons';
import { FARMER_THEME } from '../constants/farmerTheme';

export const FarmCertificateScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { farmDetails } = route.params || {};

  if (!farmDetails) {
    return (
      <FarmerPageBackground>
        <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" />
        <FarmerHeader
          variant="inner"
          title={t('farmer.officialCert', 'Official Certificate')}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('farmer.certNotFound', 'Certificate details not found.')}</Text>
        </View>
      </FarmerPageBackground>
    );
  }

  const formatParticular = (val?: string | number | null) => {
    if (!val || val === 'null' || val === 'undefined') return 'N/A';
    const str = String(val).trim();
    if (!str) return 'N/A';
    return str
      .split(',')
      .map(part =>
        part
          .trim()
          .split(' ')
          .map(w => {
            const lower = w.toLowerCase();
            if (lower === 'and') return '&';
            if (lower === 'canel') return 'Canal';
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          })
          .join(' ')
      )
      .join(', ');
  };

  const VerifiedRow = ({
    label,
    value,
    isLast = false,
  }: {
    label: string;
    value: string;
    isLast?: boolean;
  }) => (
    <View style={[styles.verifiedRow, isLast && styles.verifiedRowLast]}>
      <View style={styles.labelCol}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.valueCol}>
        <Text style={styles.rowValue} numberOfLines={2}>
          {formatParticular(value)}
        </Text>
      </View>
      <View style={styles.tickCircle}>
        <Ionicons name="checkmark-sharp" size={12} color="#FFFFFF" />
      </View>
    </View>
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return 'Recently Verified';
    }
  };

  const verificationDateStr = farmDetails.verifiedOn || farmDetails.updatedAt || new Date().toISOString();
  const verificationDate = formatDate(verificationDateStr);

  const handleDownloadPDF = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .page { width: 700px; margin: 0 auto; background: #FAFAF8; padding: 40px; border: 8px solid #17663F; position: relative; }
            .corner { position: absolute; width: 28px; height: 28px; border-color: #E9B949; border-style: solid; border-width: 4px; }
            .tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
            .tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
            .bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
            .br { bottom: 12px; right: 12px; border-left: none; border-top: none; }
            .header { text-align: center; margin: 20px 0; }
            .ribbon { font-size: 40px; }
            .cert-title { font-size: 28px; font-weight: 900; color: #0E3B29; letter-spacing: 6px; margin: 8px 0 4px; }
            .cert-subtitle { font-size: 13px; font-weight: 700; color: #C98A1B; letter-spacing: 4px; }
            .intro { font-size: 14px; color: #5C6B60; font-style: italic; text-align: center; margin: 20px 0 8px; }
            .farm-name { font-size: 26px; font-weight: 900; color: #17663F; text-align: center; letter-spacing: 2px; margin-bottom: 12px; }
            .cert-body { font-size: 13px; color: #1B2A22; text-align: center; line-height: 1.7; padding: 0 20px; }
            .divider { width: 60px; height: 3px; background: #E9B949; margin: 20px auto; border-radius: 2px; }
            .section-title { font-size: 11px; font-weight: 800; color: #0E3B29; text-align: center; letter-spacing: 2px; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #E5EFE3; }
            td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #F3F8F0; }
            .lbl { color: #5C6B60; font-weight: 600; width: 40%; }
            .val { color: #0E3B29; font-weight: 800; width: 50%; }
            .tick { color: #17663F; text-align: center; width: 10%; font-size: 16px; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding: 0 10px; }
            .footer-label { font-size: 10px; color: #7D8D81; font-weight: 600; margin-bottom: 4px; }
            .footer-value { font-size: 13px; color: #0E3B29; font-weight: 800; border-bottom: 1px solid #0E3B29; padding-bottom: 2px; }
            .stamp { text-align: center; transform: rotate(-15deg); border: 2.5px solid #C0392B; border-radius: 50%; width: 80px; height: 80px; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 0 auto; opacity: 0.85; }
            .stamp-text { color: #C0392B; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
            .sig { font-size: 13px; color: #0E3B29; font-style: italic; font-weight: 700; border-top: 1px solid #7D8D81; padding-top: 4px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="corner tl"></div><div class="corner tr"></div>
            <div class="corner bl"></div><div class="corner br"></div>
            <div class="header">
              <div class="ribbon">🎗️</div>
              <div class="cert-title">${t('farmer.certTitle', 'CERTIFICATE')}</div>
              <div class="cert-subtitle">${t('farmer.certOfVerification', 'OF VERIFICATION')}</div>
            </div>
            <div class="intro">${t('farmer.certIntro', 'This document certifies that')}</div>
            <div class="farm-name">${(farmDetails.farmName || 'THE FARM').toUpperCase()}</div>
            <div class="cert-body">${t('farmer.certApprovedNotice', 'has undergone a rigorous verification process and all provided agricultural details have been officially approved by the Farm2Home Administration.')}</div>
            <div class="divider"></div>
            <div class="section-title">${t('farmer.verifiedParticulars', 'VERIFIED FARM PARTICULARS')}</div>
            <table>
              <tr><td class="lbl">${t('common.location', 'Location')}</td><td class="val">${farmDetails.location || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">${t('farmer.farmArea', 'Farm Area')}</td><td class="val">${farmDetails.farmArea ? `${farmDetails.farmArea} ${farmDetails.farmAreaUnit || 'Acres'}` : 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">${t('farmer.farmingType', 'Farming Type')}</td><td class="val">${farmDetails.farmingType || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">${t('farmer.mainCrops', 'Main Crops')}</td><td class="val">${farmDetails.mainCrops || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">${t('farmer.irrigation', 'Irrigation')}</td><td class="val">${farmDetails.irrigationSource || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">${t('farmer.soilType', 'Soil Type')}</td><td class="val">${farmDetails.soilType || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">${t('farmer.experience', 'Experience')}</td><td class="val">${farmDetails.yearsExperience ? `${farmDetails.yearsExperience} ${t('farmer.years', 'Years')}` : 'N/A'}</td><td class="tick">✓</td></tr>
            </table>
            <div class="footer">
              <div>
                <div class="footer-label">${t('farmer.dateOfIssue', 'Date of Issue')}</div>
                <div class="footer-value">${verificationDate}</div>
              </div>
              <div style="text-align:center">
                <div style="border: 2px solid #C0392B; border-radius: 50%; width: 74px; height: 74px; display:inline-flex; flex-direction:column; justify-content:center; align-items:center; transform:rotate(-12deg); opacity:0.88; box-sizing:border-box; padding:4px;">
                  <span style="color:#C0392B;font-size:7px;line-height:1;margin-bottom:2px">★</span>
                  <span style="color:#C0392B;font-size:8.5px;font-weight:900;letter-spacing:1px;white-space:nowrap;line-height:1.1">${t('farmer.verifiedStamp', 'VERIFIED')}</span>
                  <span style="width:28px;height:1px;background:#C0392B;margin:2px 0"></span>
                  <span style="color:#C0392B;font-size:7.5px;font-weight:800;letter-spacing:0.8px;white-space:nowrap;line-height:1.1">FARM2HOME</span>
                </div>
              </div>
              <div>
                <div class="footer-label">${t('farmer.adminAuthority', 'Admin Authority')}</div>
                <div class="sig">Farm2Home</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: t('farmer.downloadPdf', 'Download Certificate PDF'),
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(t('farmer.pdfCreated', 'PDF Created'), t('farmer.pdfSavedAt', { uri }));
      }
    } catch (error) {
      console.log('PDF error:', error);
      Alert.alert(t('common.error', 'Error'), t('farmer.couldNotGenPdf', 'Could not generate the PDF certificate.'));
    }
  };

  return (
    <FarmerPageBackground>
      <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" />
      <FarmerHeader
        variant="inner"
        title={t('farmer.officialCert', 'Official Certificate')}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 40, 70) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FarmerCard style={styles.certificateCard}>
          {/* Gold corner decorations */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Header */}
          <View style={styles.certHeader}>
            <Ionicons name="ribbon" size={40} color="#E9B949" />
            <Text style={styles.certTitle}>{t('farmer.certTitle', 'CERTIFICATE')}</Text>
            <Text style={styles.certSubtitle}>{t('farmer.certOfVerification', 'OF VERIFICATION')}</Text>
          </View>

          {/* Intro */}
          <Text style={styles.certIntro}>{t('farmer.certIntro', 'This document certifies that')}</Text>
          <Text style={styles.farmName}>{(farmDetails.farmName || t('farmer.theFarm', 'The Farm')).toUpperCase()}</Text>
          <Text style={styles.certText}>
            {t('farmer.certApprovedNotice', 'has undergone a rigorous verification process and all provided agricultural details have been officially approved by the Farm2Home Administration.')}
          </Text>

          <View style={styles.divider} />

          {/* Details Section */}
          <Text style={styles.sectionHeader}>{t('farmer.verifiedParticulars', 'VERIFIED FARM PARTICULARS')}</Text>
          <View style={styles.detailsBox}>
            <VerifiedRow label={t('farmer.location', 'Location')} value={farmDetails.location} />
            <VerifiedRow
              label={t('farmer.farmArea', 'Farm Area')}
              value={
                farmDetails.farmArea
                  ? `${farmDetails.farmArea} ${farmDetails.farmAreaUnit || 'Acres'}`
                  : 'N/A'
              }
            />
            <VerifiedRow label={t('farmer.farmingType', 'Farming Type')} value={farmDetails.farmingType} />
            <VerifiedRow label={t('farmer.mainCrops', 'Main Crops')} value={farmDetails.mainCrops} />
            <VerifiedRow label={t('farmer.irrigationSource', 'Irrigation')} value={farmDetails.irrigationSource} />
            <VerifiedRow label={t('farmer.soilType', 'Soil Type')} value={farmDetails.soilType} />
            <VerifiedRow
              label={t('farmer.experience', 'Experience')}
              value={
                farmDetails.yearsExperience
                  ? `${farmDetails.yearsExperience} Years`
                  : 'N/A'
              }
              isLast={true}
            />
          </View>

          {/* Footer */}
          <View style={styles.certFooter}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerLabel}>{t('farmer.dateOfIssue', 'Date of Issue')}</Text>
              <Text style={styles.footerValue}>{verificationDate}</Text>
            </View>
            <View style={styles.stampArea}>
              <View style={styles.stampOuterCircle}>
                <View style={styles.stampInnerCircle}>
                  <Text style={styles.stampStar}>★</Text>
                  <Text style={styles.stampText} numberOfLines={1}>
                    {t('farmer.verifiedStamp', 'VERIFIED')}
                  </Text>
                  <View style={styles.stampDivider} />
                  <Text style={styles.stampSub}>
                    Farm2Home
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerLabel}>{t('farmer.adminAuthority', 'Admin Authority')}</Text>
              <Text style={styles.signatureText}>Farm2Home</Text>
            </View>
          </View>
        </FarmerCard>

        {/* Action Buttons: Share Certificate FIRST (on top), Download PDF below */}
        <View style={styles.actionButtonsCol}>
          <FarmerPrimaryButton
            title={t('farmer.shareCert', 'Share Certificate')}
            icon={<Ionicons name="share-social-outline" size={18} color="#FFFFFF" />}
            onPress={handleDownloadPDF}
            style={styles.actionBtn}
          />
          <FarmerGoldButton
            title={t('farmer.downloadPdf', 'Download PDF')}
            icon={<Ionicons name="download-outline" size={18} color="#0E3B29" />}
            onPress={handleDownloadPDF}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#C0392B', fontSize: 15, fontFamily: FARMER_THEME.fonts.medium },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },

  // Certificate Card inside FarmerCard with gold hairline border (#E9B949)
  certificateCard: {
    width: '100%',
    backgroundColor: '#FAFAF8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E9B949',
    position: 'relative',
    ...FARMER_THEME.shadows.card,
  },

  // Corner decorations
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#E9B949',
    borderWidth: 2.5,
  },
  topLeft: { top: 8, left: 8, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 8, right: 8, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 8, left: 8, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 8, right: 8, borderLeftWidth: 0, borderTopWidth: 0 },

  certHeader: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  certTitle: {
    fontSize: 21,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    letterSpacing: 3.5,
    textAlign: 'center',
    marginTop: 4,
  },
  certSubtitle: {
    fontSize: 11.5,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#C98A1B',
    letterSpacing: 2.5,
    marginTop: 2,
  },

  certIntro: {
    fontSize: 12.5,
    color: '#5C6B60',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: FARMER_THEME.fonts.regular,
  },
  farmName: {
    fontSize: 20,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#17663F',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1,
  },
  certText: {
    fontSize: 11.5,
    color: '#1B2A22',
    textAlign: 'center',
    lineHeight: 16.5,
    paddingHorizontal: 4,
    fontFamily: FARMER_THEME.fonts.regular,
  },

  divider: {
    width: 44,
    height: 2,
    backgroundColor: '#E9B949',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },

  sectionHeader: {
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  detailsBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E5EFE3',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7.5,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5EE',
  },
  verifiedRowLast: {
    borderBottomWidth: 0,
  },
  labelCol: {
    width: 104,
    flexShrink: 0,
  },
  rowLabel: {
    fontSize: 12.5,
    color: '#5C6B60',
    fontFamily: FARMER_THEME.fonts.medium,
  },
  valueCol: {
    flex: 1,
    paddingRight: 6,
  },
  rowValue: {
    fontSize: 13,
    color: '#0E3B29',
    fontFamily: FARMER_THEME.fonts.bold,
  },
  tickCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#17663F',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  // Footer
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  footerLeft: {
    alignItems: 'flex-start',
    flex: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  footerLabel: {
    fontSize: 10,
    color: '#7D8D81',
    fontFamily: FARMER_THEME.fonts.medium,
    marginBottom: 3,
  },
  footerValue: {
    fontSize: 12.5,
    color: '#0E3B29',
    fontFamily: FARMER_THEME.fonts.bold,
    borderBottomWidth: 1,
    borderBottomColor: '#0E3B29',
    paddingBottom: 2,
  },
  signatureText: {
    fontSize: 13,
    color: '#0E3B29',
    fontStyle: 'italic',
    fontFamily: FARMER_THEME.fonts.bold,
    borderTopWidth: 1,
    borderTopColor: '#7D8D81',
    paddingTop: 3,
  },
  stampArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  stampOuterCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: '#C0392B',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-12deg' }],
    opacity: 0.9,
  },
  stampInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(192, 57, 43, 0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  stampStar: {
    fontSize: 8,
    color: '#C0392B',
    lineHeight: 9,
    marginBottom: 1,
  },
  stampText: {
    color: '#C0392B',
    fontSize: 8.5,
    fontFamily: FARMER_THEME.fonts.bold,
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  stampDivider: {
    width: 28,
    height: 1,
    backgroundColor: '#C0392B',
    marginVertical: 2,
  },
  stampSub: {
    color: '#C0392B',
    fontSize: 7,
    fontFamily: FARMER_THEME.fonts.bold,
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  actionButtonsCol: {
    width: '100%',
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
  },
});
export default FarmCertificateScreen;

