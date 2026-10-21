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
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { Card } from '../components/ui/Card';
import { PrimaryButton, OutlineButton } from '../components/ui/Buttons';
import { THEME } from '../constants/theme';
import { LogoutModal } from '../components/ui/LogoutModal';

import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerInput } from '../components/farmer/FarmerInput';
import { FarmerPrimaryButton, FarmerDeepButton, FarmerOutlineButton } from '../components/farmer/FarmerButtons';
import { FarmerListRow, FarmerBadge, FarmerChip } from '../components/farmer/FarmerUI';
import { FARMER_THEME } from '../constants/farmerTheme';
import { EditIcon, CameraIcon } from '../components/farmer/FarmerIcons';

const ProfileScreen = () => {
  const {user, logout, updateUserData} = useAuth();
  const navigation = useNavigation<any>();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
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
        const profile = data?.response || data;
        setProfileData(profile);
        if (profile) {
          updateUserData({
            profilePhoto: profile.profilePhoto,
            name: profile.name,
          });
        }
      } else if (user?.userId) {
        const data = await getUserById(user.userId);
        const profile = data?.response || data;
        setProfileData(profile);
        if (profile) {
          updateUserData({
            profilePhoto: profile.profilePhoto,
            name: profile.name,
          });
        }
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
    setLogoutModalVisible(true);
  };
  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }
  const photoUrl = profileData?.profilePhoto
    ? `${BASE_URL}/user/image/${profileData.profilePhoto}`
    : null;
  const isFarmer = user?.role === 'FARMER';

  if (isFarmer) {
    return (
      <FarmerPageBackground>
        <FarmerHeader
          variant="tab"
          title="Profile"
          subtitle="Manage your farmer profile & status"
          onNotificationPress={() => navigation.navigate('Notifications')}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.farmerScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Farmer Profile Card */}
            <FarmerCard style={styles.farmerProfileCard}>
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={!isEditing}
                style={styles.farmerAvatarWrapper}
                activeOpacity={0.8}
              >
                {selectedPhotoUri || photoUrl ? (
                  <Image
                    source={{ uri: (selectedPhotoUri || photoUrl) ?? undefined }}
                    style={styles.farmerAvatar}
                  />
                ) : (
                  <View style={styles.farmerAvatarPlaceholder}>
                    <Text style={styles.farmerAvatarText}>
                      {(user?.name || 'F').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                {isEditing && (
                  <View style={styles.farmerCameraBadge}>
                    <CameraIcon size={14} color="#FFFFFF" strokeWidth={2} />
                  </View>
                )}
              </TouchableOpacity>

              <Text
                style={styles.farmerName}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {profileData?.name || user?.name}
              </Text>
              <Text
                style={styles.farmerEmail}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {profileData?.email || user?.email}
              </Text>
              <View style={styles.farmerRoleBadgeRow}>
                <FarmerBadge label="🌾 Farmer" variant="success" />
              </View>
            </FarmerCard>

            {isEditing ? (
              <FarmerCard style={styles.farmerFormCard}>
                <View style={styles.farmerSectionHeaderRow}>
                  <Text
                    style={styles.farmerSectionHeading}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    EDIT PERSONAL INFORMATION
                  </Text>
                  <View style={styles.farmerSectionDivider} />
                </View>

                <FarmerInput
                  label="Name"
                  required
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                />

                <FarmerInput
                  label="Mobile Number"
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Mobile"
                  keyboardType="phone-pad"
                />

                <FarmerInput
                  label="Village"
                  value={village}
                  onChangeText={setVillage}
                  placeholder="Village"
                />

                <FarmerInput
                  label="Address"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Address"
                  multiline
                />

                <FarmerInput
                  label="Postal Code"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="Postal Code"
                  keyboardType="number-pad"
                />

                <FarmerInput
                  label="State"
                  value={stateVal}
                  onChangeText={setStateVal}
                  placeholder="State"
                />

                <View style={styles.farmerStatusSection}>
                  <Text
                    style={styles.farmerStatusLabel}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    Availability Status
                  </Text>
                  <View style={styles.farmerChipsRow}>
                    <FarmerChip
                      label="Active"
                      selected={status !== 'INACTIVE'}
                      onPress={() => setStatus('ACTIVE')}
                    />
                    <FarmerChip
                      label="Inactive"
                      selected={status === 'INACTIVE'}
                      onPress={() => setStatus('INACTIVE')}
                    />
                  </View>
                </View>

                {status === 'INACTIVE' && (
                  <FarmerInput
                    label="Reason for being inactive"
                    value={inactiveReason}
                    onChangeText={setInactiveReason}
                    placeholder="E.g., Out of town for 5 days"
                    multiline
                  />
                )}

                <View style={{ marginTop: 8, gap: 10 }}>
                  <FarmerDeepButton
                    title="Save Changes"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                  />
                  <FarmerOutlineButton
                    title="Cancel"
                    onPress={() => {
                      setIsEditing(false);
                      setSelectedPhotoUri(null);
                    }}
                    disabled={saving}
                  />
                </View>
              </FarmerCard>
            ) : (
              <View style={styles.farmerDetailsSection}>
                <FarmerCard style={styles.farmerInfoCard}>
                  <Text
                    style={styles.farmerCardTitle}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    Personal Details
                  </Text>

                  <FarmerListRow
                    icon={<Ionicons name="call-outline" size={20} color={FARMER_THEME.colors.primaryGreen} />}
                    iconBg={FARMER_THEME.colors.pastelGreen}
                    title="Mobile Number"
                    subtitle={profileData?.mobile || 'Not set'}
                    showChevron={false}
                  />
                  <FarmerListRow
                    icon={<Ionicons name="location-outline" size={20} color={FARMER_THEME.colors.warning} />}
                    iconBg={FARMER_THEME.colors.pastelYellow}
                    title="Village"
                    subtitle={profileData?.village || 'Not set'}
                    showChevron={false}
                  />
                  <FarmerListRow
                    icon={<Ionicons name="home-outline" size={20} color={FARMER_THEME.colors.tealGreen} />}
                    iconBg={FARMER_THEME.colors.pastelTeal}
                    title="Address"
                    subtitle={profileData?.address || 'Not set'}
                    showChevron={false}
                  />
                  <FarmerListRow
                    icon={<Ionicons name="mail-outline" size={20} color="#2F7A3A" />}
                    iconBg={FARMER_THEME.colors.pastelLime}
                    title="Postal Code"
                    subtitle={profileData?.postalCode || 'Not set'}
                    showChevron={false}
                  />
                  <FarmerListRow
                    icon={<Ionicons name="map-outline" size={20} color="#3B6FB6" />}
                    iconBg={FARMER_THEME.colors.pastelBlue}
                    title="State"
                    subtitle={profileData?.state || 'Not set'}
                    showChevron={false}
                  />
                </FarmerCard>

                {/* Status Toggle Card */}
                <FarmerCard style={styles.farmerStatusCard}>
                  <View style={styles.statusRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={styles.statusTitle}
                        maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                      >
                        Account Status
                      </Text>
                      <View style={{ marginTop: 4 }}>
                        <FarmerBadge
                          label={profileData?.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          variant={profileData?.status === 'ACTIVE' ? 'success' : 'error'}
                        />
                      </View>
                    </View>
                    {profileData?.status && (
                      <Switch
                        value={profileData.status === 'ACTIVE'}
                        onValueChange={handleStatusToggleChange}
                        trackColor={{ false: '#FDE6E2', true: '#BFE3CB' }}
                        thumbColor={profileData.status === 'ACTIVE' ? '#2A9560' : '#C0392B'}
                        disabled={statusUpdating}
                      />
                    )}
                  </View>

                  {profileData?.status === 'INACTIVE' && profileData?.inactiveReason && (
                    <View style={styles.farmerReasonBox}>
                      <Text style={styles.farmerReasonLabel}>Inactive Reason:</Text>
                      <Text style={styles.farmerReasonText}>{profileData.inactiveReason}</Text>
                    </View>
                  )}
                </FarmerCard>

                {/* Action Buttons */}
                <View style={styles.farmerActionsContainer}>
                  <FarmerPrimaryButton
                    title="Edit Profile"
                    onPress={startEditing}
                    icon={<EditIcon size={18} color="#FFFFFF" strokeWidth={2} />}
                    style={{ marginBottom: 12 }}
                  />
                  <FarmerOutlineButton
                    title="Logout"
                    onPress={handleLogout}
                    textColor={FARMER_THEME.colors.error}
                    borderColor="#FDE6E2"
                    icon={<Ionicons name="log-out-outline" size={18} color={FARMER_THEME.colors.error} />}
                  />
                </View>
              </View>
            )}

            {/* Inactive Reason Modal */}
            <Modal
              visible={isStatusModalVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setIsStatusModalVisible(false)}
            >
              <View style={styles.farmerModalOverlay}>
                <FarmerCard style={styles.farmerModalContent}>
                  <Text
                    style={styles.farmerModalTitle}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    Set Inactive Status
                  </Text>
                  <Text
                    style={styles.farmerModalSubtitle}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    Please provide a reason and how many days you will be inactive:
                  </Text>

                  <FarmerInput
                    value={tempInactiveReason}
                    onChangeText={setTempInactiveReason}
                    placeholder="E.g., Out of town for 5 days"
                    multiline
                  />

                  <View style={styles.farmerModalButtonsRow}>
                    <FarmerOutlineButton
                      title="Cancel"
                      onPress={() => setIsStatusModalVisible(false)}
                      disabled={statusUpdating}
                      compact
                      style={{ flex: 1 }}
                    />
                    <FarmerDeepButton
                      title="Submit"
                      onPress={() => submitStatusUpdate(false, tempInactiveReason)}
                      disabled={statusUpdating}
                      loading={statusUpdating}
                      compact
                      style={{ flex: 1 }}
                    />
                  </View>
                </FarmerCard>
              </View>
            </Modal>
          </ScrollView>
        </KeyboardAvoidingView>
        <LogoutModal
          visible={logoutModalVisible}
          onClose={() => setLogoutModalVisible(false)}
          onConfirm={async () => {
            setLogoutModalVisible(false);
            await logout();
          }}
        />
      </FarmerPageBackground>
    );
  }

  // Customer Theme View
  return (
    <PageBackground style={{ flex: 1 }}>
      <ThemedHeader
        variant="tab"
        title="Account"
        subtitle="Manage your profile & details"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.customerScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Avatar & Name Card */}
          <Card style={styles.customerProfileCard}>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={!isEditing}
              style={styles.customerAvatarWrapper}
              activeOpacity={0.8}
            >
              {selectedPhotoUri || photoUrl ? (
                <Image
                  source={{ uri: (selectedPhotoUri || photoUrl) ?? undefined }}
                  style={styles.customerAvatar}
                />
              ) : (
                <View style={styles.customerAvatarPlaceholder}>
                  <Text style={styles.customerAvatarText}>
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {isEditing && (
                <View style={styles.customerCameraBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.customerName}>{profileData?.name || user?.name}</Text>
            <Text style={styles.customerEmail}>{profileData?.email || user?.email}</Text>
            <View style={styles.customerRoleBadge}>
              <Text style={styles.customerRoleText}>🏠 Customer</Text>
            </View>
          </Card>

          {isEditing ? (
            <View style={{ marginTop: 16 }}>
              <Card style={{ marginBottom: 16 }}>
                <Text style={styles.customerSectionTitle}>Edit Personal Information</Text>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Full Name"
                    placeholderTextColor="#A08D7E"
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>Mobile Number</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="Mobile"
                    placeholderTextColor="#A08D7E"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>Village</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={village}
                    onChangeText={setVillage}
                    placeholder="Village"
                    placeholderTextColor="#A08D7E"
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>Address</Text>
                  <TextInput
                    style={[styles.customerTextInput, { minHeight: 70, textAlignVertical: 'top' }]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Address"
                    placeholderTextColor="#A08D7E"
                    multiline
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>Postal Code</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="Postal Code"
                    placeholderTextColor="#A08D7E"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>State</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={stateVal}
                    onChangeText={setStateVal}
                    placeholder="State"
                    placeholderTextColor="#A08D7E"
                  />
                </View>
              </Card>

              <View style={{ marginTop: 8 }}>
                <PrimaryButton
                  title={saving ? "Saving..." : "Save Changes"}
                  onPress={handleSave}
                  disabled={saving}
                  style={{ marginBottom: 12 }}
                />
                <OutlineButton
                  title="Cancel"
                  onPress={() => {
                    setIsEditing(false);
                    setSelectedPhotoUri(null);
                  }}
                  disabled={saving}
                />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              <View style={styles.customerSectionHeader}>
                <Text style={styles.customerSectionTitle}>Personal Information</Text>
              </View>

              <CustomerInfoRow
                icon="call-outline"
                label="Mobile"
                value={profileData?.mobile}
              />
              <CustomerInfoRow
                icon="location-outline"
                label="Village"
                value={profileData?.village}
              />
              <CustomerInfoRow
                icon="home-outline"
                label="Address"
                value={profileData?.address}
              />
              <CustomerInfoRow
                icon="mail-outline"
                label="Postal Code"
                value={profileData?.postalCode}
              />
              <CustomerInfoRow
                icon="map-outline"
                label="State"
                value={profileData?.state}
              />

              <View style={{ marginTop: 20, marginBottom: 16 }}>
                <PrimaryButton
                  title="Edit Profile"
                  onPress={startEditing}
                  icon={<Ionicons name="pencil" size={16} color="#FFFFFF" />}
                  style={{ marginBottom: 12 }}
                />
                <OutlineButton
                  title="Logout"
                  onPress={handleLogout}
                  style={{ borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' }}
                  textStyle={{ color: THEME.colors.error }}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <LogoutModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await logout();
        }}
      />
    </PageBackground>
  );
};
const DetailRow = ({label, value}: {label: string, value: string | undefined | null}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const CustomerInfoRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | undefined | null;
}) => (
  <Card style={styles.customerInfoCard}>
    <View style={styles.customerIconTile}>
      <Ionicons name={icon} size={22} color="#B8470F" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.customerInfoLabel}>{label}</Text>
      <Text style={styles.customerInfoValue} numberOfLines={2}>
        {value || 'Not provided'}
      </Text>
    </View>
  </Card>
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
  customerScrollContent: {
    padding: 16,
    paddingBottom: 195,
  },
  customerProfileCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFDF8',
  },
  customerAvatarWrapper: {
    position: 'relative',
    marginBottom: 4,
    shadowColor: '#2A1710',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  customerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  customerAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF1DE',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 26,
    fontFamily: THEME.fonts.bold,
    color: '#B8470F',
  },
  customerCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: THEME.colors.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  customerName: {
    fontSize: 22,
    fontFamily: THEME.fonts.serif,
    color: '#3B1A0E',
    textAlign: 'center',
    marginTop: 10,
  },
  customerEmail: {
    fontSize: 14,
    fontFamily: THEME.fonts.medium,
    color: '#7A6350',
    marginTop: 2,
    textAlign: 'center',
  },
  customerRoleBadge: {
    alignSelf: 'center',
    backgroundColor: '#FFF1DE',
    borderWidth: 1,
    borderColor: '#F3D2B8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  customerRoleText: {
    color: '#B8470F',
    fontSize: 12,
    fontFamily: THEME.fonts.semiBold,
  },
  customerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerSectionTitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.serif,
    color: '#3B1A0E',
  },
  customerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1DE',
    borderWidth: 1,
    borderColor: '#E8A56B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  customerEditText: {
    color: '#8A2E12',
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    marginLeft: 4,
  },
  customerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFDF8',
  },
  customerIconTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF1DE',
    borderWidth: 1,
    borderColor: '#F3D2B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  customerInfoLabel: {
    fontSize: 12,
    fontFamily: THEME.fonts.medium,
    color: '#7A6350',
  },
  customerInfoValue: {
    fontSize: 15,
    fontFamily: THEME.fonts.semiBold,
    color: '#2A1710',
    marginTop: 2,
  },
  customerInputGroup: {
    marginBottom: 14,
  },
  customerInputLabel: {
    fontSize: 13,
    fontFamily: THEME.fonts.semiBold,
    color: '#5C4434',
    marginBottom: 6,
  },
  customerTextInput: {
    backgroundColor: '#FFF9F2',
    borderWidth: 1,
    borderColor: '#F1DCC6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: THEME.fonts.regular,
    color: '#2A1710',
  },

  // Farmer Specific Theme Styles
  farmerScrollContent: {
    paddingHorizontal: FARMER_THEME.spacing.pagePadding,
    paddingTop: 16,
    paddingBottom: FARMER_THEME.spacing.tabBottomPadding,
    gap: FARMER_THEME.spacing.cardGap,
  },
  farmerProfileCard: {
    alignItems: 'center',
    padding: 20,
  },
  farmerAvatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  farmerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...FARMER_THEME.shadows.tile,
  },
  farmerAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...FARMER_THEME.shadows.tile,
  },
  farmerAvatarText: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 28,
    color: FARMER_THEME.colors.headings,
  },
  farmerCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: FARMER_THEME.colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  farmerName: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 22,
    color: FARMER_THEME.colors.headings,
    marginBottom: 4,
    textAlign: 'center',
  },
  farmerEmail: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 13,
    color: FARMER_THEME.colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  farmerRoleBadgeRow: {
    marginBottom: 4,
  },
  farmerFormCard: {
    padding: 18,
  },
  farmerSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  farmerSectionHeading: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: FARMER_THEME.colors.primaryGreen,
  },
  farmerSectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: FARMER_THEME.colors.divider,
  },
  farmerStatusSection: {
    marginBottom: 16,
  },
  farmerStatusLabel: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 13,
    color: FARMER_THEME.colors.headings,
    marginBottom: 8,
  },
  farmerChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  farmerDetailsSection: {
    gap: FARMER_THEME.spacing.cardGap,
  },
  farmerInfoCard: {
    padding: 16,
  },
  farmerCardTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 18,
    color: FARMER_THEME.colors.headings,
    marginBottom: 14,
  },
  farmerStatusCard: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 16,
    color: FARMER_THEME.colors.headings,
  },
  farmerReasonBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: FARMER_THEME.colors.warningBg,
    borderWidth: 1,
    borderColor: '#F3E3D3',
  },
  farmerReasonLabel: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: FARMER_THEME.colors.warning,
    marginBottom: 2,
  },
  farmerReasonText: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 13,
    color: FARMER_THEME.colors.bodyText,
  },
  farmerActionsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  farmerModalOverlay: {
    flex: 1,
    backgroundColor: FARMER_THEME.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  farmerModalContent: {
    width: '100%',
    maxWidth: 340,
    padding: 20,
  },
  farmerModalTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 20,
    color: FARMER_THEME.colors.headings,
    textAlign: 'center',
    marginBottom: 6,
  },
  farmerModalSubtitle: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 13,
    color: FARMER_THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  farmerModalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
});
export default ProfileScreen;
