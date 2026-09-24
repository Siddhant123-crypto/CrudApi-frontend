import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const FarmCertificateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { farmDetails } = route.params || {};

  if (!farmDetails) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Certificate details not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const VerifiedRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.verifiedRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || 'N/A'}</Text>
      <View style={styles.tickCircle}>
        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
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
            .page { width: 700px; margin: 0 auto; background: #FAFAF8; padding: 40px; border: 8px solid #10B981; position: relative; }
            .corner { position: absolute; width: 28px; height: 28px; border-color: #F59E0B; border-style: solid; border-width: 4px; }
            .tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
            .tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
            .bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
            .br { bottom: 12px; right: 12px; border-left: none; border-top: none; }
            .header { text-align: center; margin: 20px 0; }
            .ribbon { font-size: 40px; }
            .cert-title { font-size: 28px; font-weight: 900; color: #1B2430; letter-spacing: 6px; margin: 8px 0 4px; }
            .cert-subtitle { font-size: 13px; font-weight: 700; color: #F59E0B; letter-spacing: 4px; }
            .intro { font-size: 14px; color: #6B7280; font-style: italic; text-align: center; margin: 20px 0 8px; }
            .farm-name { font-size: 26px; font-weight: 900; color: #10B981; text-align: center; letter-spacing: 2px; margin-bottom: 12px; }
            .cert-body { font-size: 13px; color: #4B5563; text-align: center; line-height: 1.7; padding: 0 20px; }
            .divider { width: 60px; height: 3px; background: #F59E0B; margin: 20px auto; border-radius: 2px; }
            .section-title { font-size: 11px; font-weight: 800; color: #1B2430; text-align: center; letter-spacing: 2px; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #E5E7EB; }
            td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #F3F4F6; }
            .lbl { color: #6B7280; font-weight: 600; width: 40%; }
            .val { color: #1B2430; font-weight: 800; width: 50%; }
            .tick { color: #10B981; text-align: center; width: 10%; font-size: 16px; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding: 0 10px; }
            .footer-label { font-size: 10px; color: #9CA3AF; font-weight: 600; margin-bottom: 4px; }
            .footer-value { font-size: 13px; color: #1B2430; font-weight: 800; border-bottom: 1px solid #1B2430; padding-bottom: 2px; }
            .stamp { text-align: center; transform: rotate(-15deg); border: 2.5px solid #EF4444; border-radius: 50%; width: 80px; height: 80px; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 0 auto; opacity: 0.85; }
            .stamp-text { color: #EF4444; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
            .sig { font-size: 13px; color: #1B2430; font-style: italic; font-weight: 700; border-top: 1px solid #9CA3AF; padding-top: 4px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="corner tl"></div><div class="corner tr"></div>
            <div class="corner bl"></div><div class="corner br"></div>
            <div class="header">
              <div class="ribbon">🎗️</div>
              <div class="cert-title">CERTIFICATE</div>
              <div class="cert-subtitle">OF VERIFICATION</div>
            </div>
            <div class="intro">This document certifies that</div>
            <div class="farm-name">${(farmDetails.farmName || 'THE FARM').toUpperCase()}</div>
            <div class="cert-body">has undergone a rigorous verification process and all provided agricultural details have been officially approved by the Farm2Home Administration.</div>
            <div class="divider"></div>
            <div class="section-title">VERIFIED FARM PARTICULARS</div>
            <table>
              <tr><td class="lbl">Location</td><td class="val">${farmDetails.location || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">Farm Area</td><td class="val">${farmDetails.farmArea ? `${farmDetails.farmArea} ${farmDetails.farmAreaUnit || 'Acres'}` : 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">Farming Type</td><td class="val">${farmDetails.farmingType || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">Main Crops</td><td class="val">${farmDetails.mainCrops || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">Irrigation</td><td class="val">${farmDetails.irrigationSource || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">Soil Type</td><td class="val">${farmDetails.soilType || 'N/A'}</td><td class="tick">✓</td></tr>
              <tr><td class="lbl">Experience</td><td class="val">${farmDetails.yearsExperience ? `${farmDetails.yearsExperience} Years` : 'N/A'}</td><td class="tick">✓</td></tr>
            </table>
            <div class="footer">
              <div>
                <div class="footer-label">Date of Issue</div>
                <div class="footer-value">${verificationDate}</div>
              </div>
              <div style="text-align:center">
                <div style="border: 2.5px solid #EF4444; border-radius: 50%; width: 70px; height: 70px; display:inline-flex; flex-direction:column; justify-content:center; align-items:center; transform:rotate(-15deg); opacity:0.85">
                  <span style="color:#EF4444;font-size:9px;font-weight:900;letter-spacing:1px">VERIFIED</span>
                  <span style="color:#EF4444;font-size:8px;font-weight:700">Farm2Home</span>
                </div>
              </div>
              <div>
                <div class="footer-label">Admin Authority</div>
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
          dialogTitle: 'Download / Save Certificate PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Created', `PDF saved at:\n${uri}`);
      }
    } catch (error) {
      console.log('PDF error:', error);
      Alert.alert('Error', 'Could not generate the PDF certificate.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Official Certificate</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.certificateCard}>
          {/* Gold corner decorations */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Header */}
          <View style={styles.certHeader}>
            <Ionicons name="ribbon" size={40} color="#F59E0B" />
            <Text style={styles.certTitle}>CERTIFICATE</Text>
            <Text style={styles.certSubtitle}>OF VERIFICATION</Text>
          </View>

          {/* Intro */}
          <Text style={styles.certIntro}>This document certifies that</Text>
          <Text style={styles.farmName}>{(farmDetails.farmName || 'The Farm').toUpperCase()}</Text>
          <Text style={styles.certText}>
            has undergone a rigorous verification process and all provided agricultural details have been officially approved by the Farm2Home Administration.
          </Text>

          <View style={styles.divider} />

          {/* Details Section */}
          <Text style={styles.sectionHeader}>VERIFIED FARM PARTICULARS</Text>
          <View style={styles.detailsBox}>
            <VerifiedRow label="Location" value={farmDetails.location} />
            <VerifiedRow label="Farm Area" value={farmDetails.farmArea ? `${farmDetails.farmArea} ${farmDetails.farmAreaUnit || 'Acres'}` : 'N/A'} />
            <VerifiedRow label="Farming Type" value={farmDetails.farmingType} />
            <VerifiedRow label="Main Crops" value={farmDetails.mainCrops} />
            <VerifiedRow label="Irrigation" value={farmDetails.irrigationSource} />
            <VerifiedRow label="Soil Type" value={farmDetails.soilType} />
            <VerifiedRow label="Experience" value={farmDetails.yearsExperience ? `${farmDetails.yearsExperience} Years` : 'N/A'} />
          </View>

          {/* Footer */}
          <View style={styles.certFooter}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerLabel}>Date of Issue</Text>
              <Text style={styles.footerValue}>{verificationDate}</Text>
            </View>
            <View style={styles.stampArea}>
              <View style={styles.stampCircle}>
                <Text style={styles.stampText}>VERIFIED</Text>
                <Text style={styles.stampSub}>Farm2Home</Text>
              </View>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerLabel}>Admin Authority</Text>
              <Text style={styles.signatureText}>Farm2Home</Text>
            </View>
          </View>
        </View>

        {/* Download PDF Button */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadPDF} activeOpacity={0.85}>
          <Ionicons name="download-outline" size={20} color="#FFFFFF" />
          <Text style={styles.downloadBtnText}>Download / Share Certificate</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#17212F',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#EF4444', fontSize: 15 },

  // Certificate Card
  certificateCard: {
    width: '100%',
    backgroundColor: '#FAFAF8',
    borderRadius: 4,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 6,
    borderColor: '#10B981',
    position: 'relative',
  },

  // Corner decorations
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#F59E0B',
    borderWidth: 3,
  },
  topLeft: { top: 10, left: 10, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 10, right: 10, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 10, left: 10, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 10, right: 10, borderLeftWidth: 0, borderTopWidth: 0 },

  certHeader: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  certTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1B2430',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 6,
  },
  certSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 3,
    marginTop: 3,
  },

  certIntro: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  farmName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  certText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 4,
  },

  divider: {
    width: 50,
    height: 2.5,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 18,
  },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1B2430',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  detailsBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    width: 90,
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 12,
    color: '#1B2430',
    fontWeight: '800',
    flex: 1,
  },
  tickCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 0,
  },

  // Footer
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
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
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 3,
  },
  footerValue: {
    fontSize: 13,
    color: '#1B2430',
    fontWeight: '800',
    borderBottomWidth: 1,
    borderBottomColor: '#1B2430',
    paddingBottom: 2,
  },
  signatureText: {
    fontSize: 13,
    color: '#1B2430',
    fontStyle: 'italic',
    fontWeight: '700',
    borderTopWidth: 1,
    borderTopColor: '#9CA3AF',
    paddingTop: 3,
  },
  stampArea: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stampCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-15deg' }],
    opacity: 0.85,
  },
  stampText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stampSub: {
    color: '#EF4444',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },

  // Download Button
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
