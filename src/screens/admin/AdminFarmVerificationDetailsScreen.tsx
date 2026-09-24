import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput, Alert, Linking, SafeAreaView, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getAdminFarmDetails, getAdminFarmGallery, verifyFarmer, requestFarmerAdditionalInfo } from '../../services/adminService';
import { BASE_URL } from '../../services/api';

const VideoCard = ({ style }: { style: any }) => (
  <View style={[style, { backgroundColor: '#0F3320', justifyContent: 'center', alignItems: 'center' }]}>
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.20)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.70)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
      <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
    </View>
    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>VIDEO</Text>
    </View>
  </View>
);

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
        getAdminFarmGallery(verificationId).catch(() => ({ data: [] }))
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
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!farmData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ textAlign: 'center', marginTop: 50, color: '#6B7280' }}>Farm details not found.</Text>
      </SafeAreaView>
    );
  }

  const profilePhotoUri = farmData.profilePhoto 
    ? `${BASE_URL}/user/image/${farmData.profilePhoto}` 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(farmData.name || 'F')}&background=10B981&color=fff`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.customHeader, { backgroundColor: '#17212F' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Farm Verification</Text>
        <View style={[styles.badgePending, farmData.verified && { backgroundColor: '#10B981', shadowColor: '#10B981' }]}>
          <Text style={styles.badgePendingText}>
            {farmData.verified ? 'VERIFIED' : 'PENDING'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image source={{ uri: profilePhotoUri }} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{farmData.name}</Text>
            
            <View style={styles.profileRow}>
              <Ionicons name="call" size={14} color="#10B981" />
              <Text style={styles.profileDetail}>{farmData.mobile}</Text>
            </View>
            
            <View style={styles.profileRow}>
              <Ionicons name="mail-outline" size={14} color="#6B7280" />
              <Text style={styles.profileDetail}>{farmData.email || 'N/A'}</Text>
            </View>
            
            <View style={styles.profileRow}>
              <Ionicons name="location" size={14} color="#10B981" />
              <Text style={styles.profileDetail}>{farmData.location || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Farmer Information */}
        <View style={styles.sectionContainer}>
          <View style={[styles.sectionHeader, { justifyContent: 'flex-start' }]}>
            <Text style={styles.sectionTitle}>Farmer Information</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Farmer Name : </Text>{farmData.name}</Text>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Mobile : </Text>{farmData.mobile}</Text>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Email : </Text>{farmData.email || 'N/A'}</Text>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Village : </Text>{farmData.village || 'N/A'}</Text>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>State : </Text>{farmData.state || 'N/A'}</Text>
          </View>
        </View>

        {/* Farm Information */}
        <View style={styles.sectionContainer}>
          <View style={[styles.sectionHeader, { justifyContent: 'flex-start' }]}>
            <Text style={styles.sectionTitle}>Farm Information</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Farm Name : </Text>{farmData.farmName || 'N/A'}</Text>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Farm Area : </Text>{farmData.farmArea ? `${farmData.farmArea} ${farmData.farmAreaUnit}` : 'N/A'}</Text>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Farm Type : </Text>{farmData.farmingType || 'N/A'}</Text>
            <Text style={styles.infoText}><Text style={styles.infoLabel}>Location : </Text>{farmData.location || 'N/A'}</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.infoLabel}>About Farm : </Text>
              <Text style={[styles.infoText, { marginTop: 4, lineHeight: 20 }]}>{farmData.aboutFarm || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Farm Gallery */}
        <View style={styles.sectionContainer}>
          <View style={[styles.sectionHeader, { justifyContent: 'flex-start' }]}>
            <Text style={styles.sectionTitle}>Farm Gallery</Text>
          </View>
          {gallery.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {gallery.map(img => {
                const isVideo = img.fileType === 'VIDEO';
                const fileUrl = `${BASE_URL}/${img.filePath ? img.filePath.replace(/\\/g, '/') : ''}`;
                return (
                  <TouchableOpacity
                    key={img.id}
                    onPress={() => {
                      if (isVideo) {
                        Linking.openURL(fileUrl).catch(() => Alert.alert('Error', 'Could not open video.'));
                      }
                    }}
                    activeOpacity={isVideo ? 0.7 : 1}
                  >
                    {isVideo ? (
                      <VideoCard style={styles.galleryImage} />
                    ) : (
                      <Image source={{ uri: fileUrl }} style={styles.galleryImage} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={{ color: '#6B7280', fontSize: 14, marginLeft: 8 }}>No gallery available.</Text>
          )}
        </View>

        {/* Certificate */}
        {farmData.certificateFile && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#3B82F6" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: '#1B2430' }]}>Certificate</Text>
            </View>
            
            <View style={styles.certificateCard}>
              <View style={styles.pdfIconBox}>
                <Text style={styles.pdfIconText}>PDF</Text>
              </View>
              <View style={styles.certInfo}>
                <Text style={styles.certName}>Farm Certificate.pdf</Text>
                <Text style={styles.certSize}>1.2 MB</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewBtn} 
                onPress={() => Linking.openURL(`${BASE_URL}/${farmData.certificateFile.replace(/\\/g, '/')}`)}
              >
                <Text style={styles.viewBtnText}>View Certificate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {!farmData.verified && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => setShowRejectModal(true)} disabled={actionLoading}>
            <Ionicons name="close" size={20} color="#EF4444" />
            <Text style={styles.rejectBtnText}>Reject Farm</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} disabled={actionLoading}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.approveBtnText}>Approve Farm</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reject Verification</Text>
            <Text style={styles.modalSub}>Please provide a reason so the farmer can fix the issue.</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Certificate is blurry"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleRejectSubmit} disabled={actionLoading}>
                <Text style={styles.submitBtnText}>{actionLoading ? 'Sending...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve Modal */}
      <Modal visible={showApproveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.approveIconContainer}>
              <Ionicons name="shield-checkmark" size={60} color="#10B981" />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center', fontSize: 24, marginTop: 10 }]}>Verify Farm</Text>
            <Text style={[styles.modalSub, { textAlign: 'center', marginBottom: 28, fontSize: 16, lineHeight: 24 }]}>
              Are you sure you want to approve and verify this farm? The farmer will be notified.
            </Text>
            
            <View style={styles.modalActionsFull}>
              <TouchableOpacity style={styles.cancelBtnFull} onPress={() => setShowApproveModal(false)} disabled={actionLoading}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtnFull} onPress={confirmApprove} disabled={actionLoading}>
                <Text style={styles.approveBtnTextFull}>{actionLoading ? 'Verifying...' : 'Yes, Verify Farm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={90} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Farm Verified Successfully!</Text>
            <Text style={styles.successMessage}>
              {farmData?.name}'s farm has been verified and moved to the Verified list.
            </Text>
            <TouchableOpacity 
              style={styles.successOkBtn}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successOkBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6FCF8', paddingTop: Platform.OS === 'android' ? 0 : 0 },
  
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'android' ? 48 : 45,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    marginLeft: 0,
  },
  badgePending: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  badgePendingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  content: { padding: 16, backgroundColor: '#F6FCF8' },

  profileSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  profileImage: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginRight: 18,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1B2430',
    marginBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  profileDetail: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    fontWeight: '600',
  },

  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
  },
  
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECFDF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoText: {
    fontSize: 15,
    color: '#1B2430',
    fontWeight: '700',
    marginBottom: 10,
  },
  infoLabel: {
    color: '#6B7280',
    fontWeight: '600',
  },

  tableBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ECFDF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableLabel: {
    width: 120,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '700',
  },
  tableValue: {
    flex: 1,
    fontSize: 15,
    color: '#1B2430',
    fontWeight: '700',
  },

  galleryImage: {
    width: 120,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },

  certificateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pdfIconBox: {
    width: 40,
    height: 48,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pdfIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2430',
  },
  certSize: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  viewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  bottomBar: { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0, 
    backgroundColor: '#FFFFFF', 
    flexDirection: 'row', 
    padding: 16, paddingBottom: 32, 
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    justifyContent: 'center',
  },
  rejectBtn: { 
    flex: 1, flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, borderColor: '#EF4444',
    height: 48, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', 
    marginRight: 8,
  },
  rejectBtnText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  
  approveBtn: { 
    flex: 1, flexDirection: 'row', 
    backgroundColor: '#10B981', 
    height: 48, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', 
    marginLeft: 8,
  },
  approveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B2430', marginBottom: 10 },
  modalSub: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
  reasonInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, minHeight: 120, textAlignVertical: 'top', fontSize: 16, color: '#1B2430', marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelBtnText: { color: '#6B7280', fontWeight: '700', fontSize: 16 },
  submitBtn: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, marginLeft: 12 },
  submitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  
  approveIconContainer: { alignItems: 'center', justifyContent: 'center', width: 90, height: 90, borderRadius: 45, backgroundColor: '#ECFDF5', alignSelf: 'center', marginBottom: 10 },
  modalActionsFull: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  
  successModalOverlay: {
    flex: 1,
    backgroundColor: '#F3FBF6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successIconWrapper: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  successOkBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '60%',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successOkBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtnFull: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  approveBtnFull: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  approveBtnTextFull: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 }
});
