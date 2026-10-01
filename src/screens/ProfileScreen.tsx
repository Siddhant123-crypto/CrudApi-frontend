import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomButton from '../components/CustomButton';
import LoadingSpinner from '../components/LoadingSpinner';
import {useAuth} from '../context/AuthContext';
import {getUserById, updateUser, uploadUserPhoto} from '../services/userService';
import {getFarmerById, updateFarmerStatus, updateFarmer, uploadFarmerPhoto} from '../services/farmerService';
import {BASE_URL} from '../services/api';
import {useNavigation} from '@react-navigation/native';

const ProfileScreen = () => {
  const {user, logout} = useAuth();
  const navigation = useNavigation<any>();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [status, setStatus] = useState('');
  const [inactiveReason, setInactiveReason] = useState('');
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Status Modal State
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [tempInactiveReason, setTempInactiveReason] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    try {
      if (user?.role === 'FARMER' && user?.farmerId) {
        const data = await getFarmerById(user.farmerId);
        setProfileData(data?.response || data);
      } else if (user?.userId) {
        const data = await getUserById(user.userId);
        setProfileData(data?.response || data);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  const startEditing = () => {
    setName(profileData?.name || '');
    setMobile(profileData?.mobile || '');
    setVillage(profileData?.village || '');
    setAddress(profileData?.address || '');
    setPostalCode(profileData?.postalCode || '');
    setStateVal(profileData?.state || '');
    setStatus(profileData?.status || 'ACTIVE');
    setInactiveReason(profileData?.inactiveReason || '');
    setSelectedPhotoUri(null);
    setIsEditing(true);
  };
  const handlePickImage = async () => {
    if (!isEditing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedPhotoUri(result.assets[0].uri);
    }
  };
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      const updatedData = {
        name,
        mobile,
        village,
        address,
        postalCode,
        state: stateVal,
        email: profileData.email,
        status,
        inactiveReason: status === 'INACTIVE' ? inactiveReason : '',
      };
      if (isFarmer && user?.farmerId) {
        await updateFarmer(user.farmerId, updatedData);
        if (selectedPhotoUri) {
          await uploadFarmerPhoto(user.farmerId, selectedPhotoUri);
        }
      } else if (user?.userId) {
        await updateUser(user.userId, updatedData);
        if (selectedPhotoUri) {
          await uploadUserPhoto(user.userId, selectedPhotoUri);
        }
      }
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      setSelectedPhotoUri(null);
      fetchProfile();
    } catch (error: any) {
      console.log('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggleChange = (value: boolean) => {
    if (value) {
      // Toggle to Active
      submitStatusUpdate(true, '');
    } else {
      // Toggle to Inactive - show modal
      setTempInactiveReason('');
      setIsStatusModalVisible(true);
    }
  };

  const submitStatusUpdate = async (isActive: boolean, reason: string) => {
    if (!isActive && !reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for being inactive.');
      return;
    }
    setStatusUpdating(true);
    try {
      await updateFarmerStatus({ isActive, inactiveReason: reason });
      Alert.alert('Success', `Status updated to ${isActive ? 'Active' : 'Inactive'}`);
      setIsStatusModalVisible(false);
      fetchProfile();
    } catch (error: any) {
      console.log('Error updating status:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: () => logout()},
    ]);
  };
  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }
  const photoUrl = profileData?.profilePhoto
    ? `${BASE_URL}/user/image/${profileData.profilePhoto}`
    : null;
  const isFarmer = user?.role === 'FARMER';
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: !isFarmer ? '#F8FAFC' : '#F9F9F9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, !isFarmer && { backgroundColor: '#1E3A8A' }]}>
        <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={!isEditing}
          style={styles.avatarWrapper}
        >
          {selectedPhotoUri || photoUrl ? (
            <Image source={{uri: (selectedPhotoUri || photoUrl) ?? undefined}} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, !isFarmer && { backgroundColor: '#2563EB' }]}>
              <Text style={styles.avatarText}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isEditing && (
            <View style={[styles.cameraIconContainer, !isFarmer && { backgroundColor: '#1E3A8A' }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{profileData?.name || user?.name}</Text>
        <Text style={[styles.email, !isFarmer && { color: '#BFDBFE' }]}>{profileData?.email || user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'FARMER' ? '🌾 Farmer' : '🏠 Customer'}
          </Text>
        </View>
      </View>
      <ScrollView style={[styles.container, !isFarmer && { backgroundColor: '#F8FAFC' }]} keyboardShouldPersistTaps="handled">
      {isEditing ? (
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Edit Personal Information</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Mobile</Text>
            <TextInput
              style={styles.textInput}
              value={mobile}
              onChangeText={setMobile}
              placeholder="Mobile"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Village</Text>
            <TextInput
              style={styles.textInput}
              value={village}
              onChangeText={setVillage}
              placeholder="Village"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
              multiline
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Postal Code</Text>
            <TextInput
              style={styles.textInput}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="Postal Code"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.textInput}
              value={stateVal}
              onChangeText={setStateVal}
              placeholder="State"
            />
          </View>
          
          {isFarmer && (
            <>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.statusToggleBtn, status !== 'INACTIVE' && styles.statusActiveBtn]}
                    onPress={() => setStatus('ACTIVE')}
                  >
                    <Text style={[styles.statusToggleText, status !== 'INACTIVE' && styles.statusActiveText]}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusToggleBtn, status === 'INACTIVE' && styles.statusInactiveBtn]}
                    onPress={() => setStatus('INACTIVE')}
                  >
                    <Text style={[styles.statusToggleText, status === 'INACTIVE' && styles.statusInactiveText]}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {status === 'INACTIVE' && (
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Reason for being inactive / kitne dino ke liye</Text>
                  <TextInput
                    style={styles.textInput}
                    value={inactiveReason}
                    onChangeText={setInactiveReason}
                    placeholder="E.g., Out of town for 5 days"
                    multiline
                  />
                </View>
              )}
            </>
          )}
        </View>
      ) : (
        <View style={styles.detailsContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]} numberOfLines={1}>Personal Information</Text>
            <TouchableOpacity 
              onPress={startEditing} 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: isFarmer ? '#1E5631' : '#1E3A8A', 
                paddingHorizontal: 10, 
                paddingVertical: 6, 
                borderRadius: 6,
                marginLeft: 10,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', marginLeft: 4, fontSize: 12 }}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          <DetailRow label="Mobile" value={profileData?.mobile || 'N/A'} />
          <DetailRow label="Village" value={profileData?.village || 'N/A'} />
          <DetailRow label="Address" value={profileData?.address || 'N/A'} />
          <DetailRow label="Postal Code" value={profileData?.postalCode || 'N/A'} />
          <DetailRow label="State" value={profileData?.state || 'N/A'} />
          {isFarmer && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.detailValue, { marginRight: 8, color: profileData?.status === 'ACTIVE' ? '#16A34A' : '#DC2626' }]}>
                    {profileData?.status || 'N/A'}
                  </Text>
                  {profileData?.status && (
                    <Switch
                      value={profileData.status === 'ACTIVE'}
                      onValueChange={handleStatusToggleChange}
                      trackColor={{ false: '#FCA5A5', true: '#86EFAC' }}
                      thumbColor={profileData.status === 'ACTIVE' ? '#16A34A' : '#DC2626'}
                      disabled={statusUpdating}
                    />
                  )}
                </View>
              </View>
              {profileData?.status === 'INACTIVE' && profileData?.inactiveReason && (
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>Inactive Reason:</Text>
                  <Text style={styles.reasonText}>{profileData.inactiveReason}</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
      {}
      {isEditing ? (
        <View style={styles.actionButtonsContainer}>
          <CustomButton
            title={saving ? "Saving..." : "Save Changes"}
            onPress={handleSave}
            disabled={saving}
            variant="primary"
            style={{ marginBottom: 12, backgroundColor: '#1E3A8A' }}
          />
          <CustomButton
            title="Cancel"
            onPress={() => {
              setIsEditing(false);
              setSelectedPhotoUri(null);
            }}
            variant="outline"
            disabled={saving}
          />
        </View>
      ) : (
        <View style={styles.actionButtonsContainer}>
          <CustomButton
            title="Test Gifted Chat"
            onPress={() => navigation.navigate('GiftedChatTest')}
            variant="outline"
            style={{ marginBottom: 12, borderColor: '#4CAF50' }}
          />
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            variant="danger"
          />
        </View>
      )}

      {/* Inactive Reason Modal */}
      <Modal
        visible={isStatusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Inactive Status</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason and how many days you will be inactive:</Text>
            
            <TextInput
              style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top', marginTop: 10 }]}
              value={tempInactiveReason}
              onChangeText={setTempInactiveReason}
              placeholder="E.g., Out of town for 5 days"
              multiline
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]} 
                onPress={() => setIsStatusModalVisible(false)}
                disabled={statusUpdating}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSubmitButton]} 
                onPress={() => submitStatusUpdate(false, tempInactiveReason)}
                disabled={statusUpdating}
              >
                {statusUpdating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
const DetailRow = ({label, value}: {label: string, value: string | undefined | null}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1B5E20',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#C8E6C9',
    marginTop: 2,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    maxWidth: '60%',
    textAlign: 'right',
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statusActiveBtn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  statusInactiveBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  statusToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  statusActiveText: {
    color: '#16A34A',
  },
  statusInactiveText: {
    color: '#DC2626',
  },
  reasonBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#7F1D1D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  modalSubmitButton: {
    backgroundColor: '#DC2626',
  },
  modalCancelButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
export default ProfileScreen;
