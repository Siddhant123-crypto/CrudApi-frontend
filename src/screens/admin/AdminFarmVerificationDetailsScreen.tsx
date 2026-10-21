import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  getAdminFarmDetails,
  getAdminFarmGallery,
  verifyFarmer,
  requestFarmerAdditionalInfo,
} from '../../services/adminService';
import { BASE_URL } from '../../services/api';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminCard,
  AdminBadge,
  AdminStickyBar,
  AdminPrimaryButton,
  AdminDangerButton,
  AdminOutlineButton,
  AdminInput,
  ShieldCheckIcon,
  PhoneIcon,
  LocationIcon,
} from '../../components/admin';

export const AdminFarmVerificationDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { verificationId } = route.params || {};

  const [farmData, setFarmData] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (verificationId) {
      fetchData();
    }
  }, [verificationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [farmRes, galleryRes] = await Promise.all([
        getAdminFarmDetails(verificationId),
        getAdminFarmGallery(verificationId).catch(() => ({ data: [] })),
      ]);
      if (farmRes && farmRes.data) {
        setFarmData(farmRes.data);
      }
      if (galleryRes && galleryRes.data) {
        setGallery(galleryRes.data);
      }
    } catch (error) {
      console.error('Error fetching farm details', error);
      Alert.alert('Error', 'Failed to load farm details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => setShowApproveModal(true);

  const confirmApprove = async () => {
    try {
      setActionLoading(true);
      await verifyFarmer(verificationId);
      setShowApproveModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to approve farm.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection.');
      return;
    }
    try {
      setActionLoading(true);
      await requestFarmerAdditionalInfo(verificationId, rejectReason);
      setShowRejectModal(false);
      Alert.alert('Success', 'Rejection reason sent to farmer.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to reject farm.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title="Farm Verification" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={ADMIN_THEME.colors.indigo} />
        </View>
      </AdminPageBackground>
    );
  }

  if (!farmData) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title="Farm Verification" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Farm details not found.</Text>
        </View>
      </AdminPageBackground>
    );
  }

  const profilePhotoUri = farmData.profilePhoto
    ? `${BASE_URL}/user/image/${farmData.profilePhoto}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(farmData.name || 'F')}&background=E8EBFF&color=4F5BD5`;

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="inner"
        title="Farm Verification"
        rightAction={<AdminBadge status={farmData.verified ? 'Verified' : 'Pending'} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1) FARMER PROFILE CARD (72px avatar, 3px white ring) */}
        <AdminCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profilePhotoUri }} style={styles.profileImage} />
          </View>
          <Text style={styles.farmerName}>{farmData.name}</Text>

          <View style={styles.profileRow}>
            <PhoneIcon size={16} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            <Text style={styles.profileDetail}>{farmData.mobile || 'No mobile'}</Text>
          </View>

          {farmData.email ? (
            <View style={styles.profileRow}>
              <Text style={styles.profileDetail}>{farmData.email}</Text>
            </View>
          ) : null}
        </AdminCard>

        {/* 2) FARM INFORMATION TABLE */}
        <AdminCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Farm Information</Text>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Farm Name</Text>
            <Text style={styles.tableValue}>{farmData.farmName || 'N/A'}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Farm Size</Text>
            <Text style={styles.tableValue}>{farmData.farmSize ? `${farmData.farmSize} Acres` : 'N/A'}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Farming Type</Text>
            <Text style={styles.tableValue}>{farmData.farmingType || 'Organic'}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Experience</Text>
            <Text style={styles.tableValue}>{farmData.farmingExperience ? `${farmData.farmingExperience} Years` : 'N/A'}</Text>
          </View>

          <View style={styles.tableRowLast}>
            <Text style={styles.tableLabel}>Location</Text>
            <Text style={styles.tableValue}>
              {[farmData.village, farmData.state].filter(Boolean).join(', ') || 'N/A'}
            </Text>
          </View>
        </AdminCard>

        {/* 3) FARM GALLERY */}
        {gallery.length > 0 && (
          <AdminCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Farm Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {gallery.map((item, idx) => {
                const imgUri = item.imageUrl?.startsWith('http')
                  ? item.imageUrl
                  : `${BASE_URL}/farm/image/${item.imageUrl}`;
                return (
                  <Image key={idx} source={{ uri: imgUri }} style={styles.galleryImage} />
                );
              })}
            </ScrollView>
          </AdminCard>
        )}

        {/* 4) CERTIFICATE / DOCUMENT */}
        {farmData.certificateUrl && (
          <AdminCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Certificate & Documents</Text>
            <View style={styles.certificateRow}>
              <View style={styles.pdfIconBox}>
                <Text style={styles.pdfIconText}>PDF</Text>
              </View>
              <View style={styles.certInfo}>
                <Text style={styles.certName} numberOfLines={1}>
                  Farm Certificate
                </Text>
                <Text style={styles.certSize}>Official Verification Document</Text>
              </View>
              <AdminOutlineButton
                title="View"
                style={styles.viewDocBtn}
                onPress={() => {
                  const url = farmData.certificateUrl.startsWith('http')
                    ? farmData.certificateUrl
                    : `${BASE_URL}/farm/certificate/${farmData.certificateUrl}`;
                  Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open certificate document.'));
                }}
              />
            </View>
          </AdminCard>
        )}
      </ScrollView>

      {/* 5) STICKY BOTTOM ACTIONS */}
      {!farmData.verified && (
        <AdminStickyBar>
          <View style={styles.bottomBarRow}>
            <AdminDangerButton
              title="Reject"
              onPress={() => setShowRejectModal(true)}
              style={styles.bottomRejectBtn}
            />
            <AdminPrimaryButton
              title="Approve Farm"
              onPress={handleApprove}
              style={styles.bottomApproveBtn}
            />
          </View>
        </AdminStickyBar>
      )}

      {/* REJECT MODAL */}
      <Modal visible={showRejectModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Verification</Text>
            <Text style={styles.modalDescription}>
              Please provide a clear reason for rejecting the farm verification request.
            </Text>

            <AdminInput
              label="Reason for Rejection"
              required
              multiline
              numberOfLines={4}
              placeholder="State what documents or information are missing..."
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalActions}>
              <AdminOutlineButton
                title="Cancel"
                onPress={() => setShowRejectModal(false)}
                style={styles.modalActionBtn}
              />
              <AdminDangerButton
                title="Send Reason"
                loading={actionLoading}
                onPress={handleRejectSubmit}
                style={styles.modalActionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* APPROVE CONFIRM MODAL */}
      <Modal visible={showApproveModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.approveIconCircle}>
              <ShieldCheckIcon size={36} color={ADMIN_THEME.colors.statusSuccess} strokeWidth={2} />
            </View>
            <Text style={styles.modalTitleCenter}>Approve Farm?</Text>
            <Text style={styles.modalDescriptionCenter}>
              This will officially grant verified status to {farmData.farmName || farmData.name}.
            </Text>

            <View style={styles.modalActions}>
              <AdminOutlineButton
                title="Cancel"
                onPress={() => setShowApproveModal(false)}
                style={styles.modalActionBtn}
              />
              <AdminPrimaryButton
                title="Confirm Approve"
                loading={actionLoading}
                onPress={confirmApprove}
                style={styles.modalActionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.approveIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={ADMIN_THEME.colors.statusSuccess} />
            </View>
            <Text style={styles.modalTitleCenter}>Verification Approved!</Text>
            <Text style={styles.modalDescriptionCenter}>
              The farmer's account and farm have been successfully verified.
            </Text>
            <AdminPrimaryButton
              title="Done"
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
              style={{ width: '100%', marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    </AdminPageBackground>
  );
};

export default AdminFarmVerificationDetailsScreen;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: AdminFonts.medium,
    color: ADMIN_THEME.colors.textSecondary,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: ADMIN_THEME.colors.indigoTint,
    ...ADMIN_THEME.shadows.card,
    marginBottom: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  farmerName: {
    fontFamily: AdminFonts.heading,
    fontSize: 22,
    color: ADMIN_THEME.colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  profileDetail: {
    fontFamily: AdminFonts.medium,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
  },

  // Section Card
  sectionCard: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: AdminFonts.heading,
    fontSize: 18,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_THEME.colors.divider,
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  tableLabel: {
    width: 120,
    fontFamily: AdminFonts.medium,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
  tableValue: {
    flex: 1,
    fontFamily: AdminFonts.semiBold,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
  },

  // Gallery
  galleryScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  galleryImage: {
    width: 120,
    height: 85,
    borderRadius: 14,
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
  },

  // Certificate
  certificateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
  },
  pdfIconBox: {
    width: 42,
    height: 48,
    backgroundColor: ADMIN_THEME.colors.statusError,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfIconText: {
    color: '#FFFFFF',
    fontFamily: AdminFonts.bold,
    fontSize: 13,
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontFamily: AdminFonts.bold,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
  },
  certSize: {
    marginTop: 2,
    fontFamily: AdminFonts.regular,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
  viewDocBtn: {
    height: 38,
    paddingHorizontal: 16,
  },

  // Sticky Bottom Bar
  bottomBarRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomRejectBtn: {
    flex: 1,
  },
  bottomApproveBtn: {
    flex: 1.4,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: ADMIN_THEME.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ADMIN_THEME.radius.dialog,
    padding: 24,
    ...ADMIN_THEME.shadows.card,
  },
  modalTitle: {
    fontFamily: AdminFonts.heading,
    fontSize: 20,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 8,
  },
  modalTitleCenter: {
    fontFamily: AdminFonts.heading,
    fontSize: 20,
    color: ADMIN_THEME.colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalDescriptionCenter: {
    fontFamily: AdminFonts.regular,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  approveIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ADMIN_THEME.colors.statusSuccessBg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalActionBtn: {
    flex: 1,
    height: 48,
  },
});
