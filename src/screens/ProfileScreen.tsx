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
  Keyboard,
  TouchableWithoutFeedback,
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
import { ProfileSuccessModal } from '../components/ProfileSuccessModal';

import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerInput } from '../components/farmer/FarmerInput';
import { FarmerPrimaryButton, FarmerDeepButton, FarmerOutlineButton } from '../components/farmer/FarmerButtons';
import { FarmerListRow, FarmerBadge, FarmerChip } from '../components/farmer/FarmerUI';
import { FARMER_THEME } from '../constants/farmerTheme';
import { EditIcon, CameraIcon } from '../components/farmer/FarmerIcons';
import { useTranslation } from 'react-i18next';

const ProfileScreen = () => {
  const { t } = useTranslation();
  const {user, logout, updateUserData} = useAuth();
  const navigation = useNavigation<any>();
  const isFarmer = user?.role === 'FARMER';
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

  // Profile Success Modal State
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalConfig, setSuccessModalConfig] = useState({
    title: 'Profile Updated!',
    message: 'Your profile details have been saved successfully.',
    synchronizedOrdersCount: 0,
  });

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
      Alert.alert(t('common.permissionDenied'), t('profile.cameraRollPermissionDesc'));
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
      Alert.alert(t('common.error'), t('profile.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const updatedData = {
        name: name.trim(),
        mobile: mobile.trim(),
        village: village.trim(),
        address: address.trim(),
        postalCode: postalCode.trim(),
        state: stateVal.trim(),
        email: profileData?.email,
        status,
        inactiveReason: status === 'INACTIVE' ? inactiveReason : '',
        latitude: profileData?.latitude !== undefined ? profileData.latitude : null,
        longitude: profileData?.longitude !== undefined ? profileData.longitude : null,
      };
      if (isFarmer && user?.farmerId) {
        await updateFarmer(user.farmerId, updatedData);
        if (selectedPhotoUri) {
          await uploadFarmerPhoto(user.farmerId, selectedPhotoUri);
        }
        setSuccessModalConfig({
          title: t('profile.updatedTitle', 'Profile Updated!'),
          message: t('profile.farmSavedDesc', 'Your farm profile and details have been saved successfully.'),
          synchronizedOrdersCount: 0,
        });
        setSuccessModalVisible(true);
      } else if (user?.userId) {
        const updateRes: any = await updateUser(user.userId, updatedData);
        if (selectedPhotoUri) {
          await uploadUserPhoto(user.userId, selectedPhotoUri);
        }
        const syncCount = updateRes?.synchronizedOrdersCount || 0;
        setSuccessModalConfig({
          title: t('profile.updatedTitle', 'Profile Updated!'),
          message: syncCount > 0
            ? t('profile.savedWithSync', 'Your profile details have been saved successfully and your delivery address is in sync.')
            : t('profile.savedSuccessfully', 'Your profile details have been saved successfully.'),
          synchronizedOrdersCount: syncCount,
        });
        setSuccessModalVisible(true);
      }
      setIsEditing(false);
      setSelectedPhotoUri(null);
      fetchProfile();
    } catch (error: any) {
      console.log('Error updating profile:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('profile.failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggleChange = (value: boolean) => {
    if (value) {
      // Toggle to Active with confirmation
      Alert.alert(
        t('profile.reactivateTitle', 'Reactivate Account?'),
        t('profile.reactivateDesc', 'Your farm status will become Active and your eligible products will be visible to customers again.'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('profile.reactivateBtn', 'Reactivate'),
            onPress: () => submitStatusUpdate(true, ''),
          },
        ]
      );
    } else {
      // Toggle to Inactive - show modal
      setTempInactiveReason('');
      setIsStatusModalVisible(true);
    }
  };

  const submitStatusUpdate = async (isActive: boolean, reason: string) => {
    const trimmedReason = reason.trim();
    if (!isActive) {
      if (!trimmedReason) {
        Alert.alert(
          t('profile.reasonRequired', 'Reason Required'),
          t('profile.reasonRequiredDesc', 'Please provide a valid reason for deactivating your account.')
        );
        return;
      }
      if (trimmedReason.length < 10) {
        Alert.alert(
          t('profile.reasonTooShort', 'Reason Too Short'),
          t('profile.reasonTooShortDesc', 'Please enter at least 10 characters explaining your deactivation reason.')
        );
        return;
      }
      if (trimmedReason.length > 500) {
        Alert.alert(
          t('profile.reasonTooLong', 'Reason Too Long'),
          t('profile.reasonTooLongDesc', 'Deactivation reason must be 500 characters or less.')
        );
        return;
      }
    }
    setStatusUpdating(true);
    try {
      await updateFarmerStatus({ isActive, inactiveReason: trimmedReason });
      setSuccessModalConfig({
        title: isActive ? t('profile.accountReactivated', 'Account Reactivated!') : t('profile.accountDeactivated', 'Account Deactivated'),
        message: isActive
          ? t('profile.accountReactivatedDesc', 'Your farm status is now Active. Customers can see and order your fresh produce!')
          : `${t('profile.accountDeactivatedDesc', 'Your farm status is now Inactive. All products have been hidden from customer view.')}\nReason: ${trimmedReason}`,
        synchronizedOrdersCount: 0,
      });
      setSuccessModalVisible(true);
      setIsStatusModalVisible(false);
      await fetchProfile();
    } catch (error: any) {
      console.log('Error updating status:', error);
      Alert.alert(t('common.error', 'Error'), error.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };
  if (loading) {
    return <LoadingSpinner message={t('common.loading', 'Loading profile...')} />;
  }
  const photoUrl = profileData?.profilePhoto
    ? `${BASE_URL}/user/image/${profileData.profilePhoto}`
    : null;

  if (isFarmer) {
    return (
      <FarmerPageBackground>
        <FarmerHeader
          variant="tab"
          title={t('nav.profile', 'Profile')}
          subtitle={t('profile.manageStatus', 'Manage your farmer profile & status')}
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
                <FarmerBadge label={`🌾 ${t('auth.farmer', 'Farmer')}`} variant="success" />
              </View>
            </FarmerCard>

            {isEditing ? (
              <FarmerCard style={styles.farmerFormCard}>
                <View style={styles.farmerSectionHeaderRow}>
                  <Text
                    style={styles.farmerSectionHeading}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    {t('profile.editPersonalInfo', 'EDIT PERSONAL INFORMATION')}
                  </Text>
                  <View style={styles.farmerSectionDivider} />
                </View>

                <FarmerInput
                  label={t('auth.fullName', 'Name')}
                  required
                  value={name}
                  onChangeText={setName}
                  placeholder={t('auth.fullNamePlaceholder', 'Full Name')}
                />

                <FarmerInput
                  label={t('auth.mobile', 'Mobile Number')}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder={t('auth.mobilePlaceholder', 'Mobile')}
                  keyboardType="phone-pad"
                />

                <FarmerInput
                  label={t('auth.village', 'Village')}
                  value={village}
                  onChangeText={setVillage}
                  placeholder={t('auth.villagePlaceholder', 'Village')}
                />

                <FarmerInput
                  label={t('auth.address', 'Address')}
                  value={address}
                  onChangeText={setAddress}
                  placeholder={t('auth.addressPlaceholder', 'Address')}
                  multiline
                />

                <FarmerInput
                  label={t('auth.postalCode', 'Postal Code')}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder={t('auth.postalCodePlaceholder', 'Postal Code')}
                  keyboardType="number-pad"
                />

                <FarmerInput
                  label={t('auth.state', 'State')}
                  value={stateVal}
                  onChangeText={setStateVal}
                  placeholder={t('auth.statePlaceholder', 'State')}
                />

                <View style={[styles.farmerStatusSection, { backgroundColor: '#F8FAF9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }]}>
                  <Text
                    style={styles.farmerStatusLabel}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    {t('profile.accountStatus', 'Account Status')}: {(profileData?.status === 'ACTIVE' && profileData?.isActive !== false) ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    {t('profile.statusToggleHelper', 'To activate or deactivate your farm, use the Account Status toggle on your main profile screen.')}
                  </Text>
                </View>

                <View style={{ marginTop: 8, gap: 10 }}>
                  <FarmerDeepButton
                    title={t('common.save', 'Save Changes')}
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                  />
                  <FarmerOutlineButton
                    title={t('common.cancel', 'Cancel')}
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
                    {t('auth.personalDetails', 'Personal Details')}
                  </Text>

                  <FarmerListRow
                    icon={<Ionicons name="call-outline" size={20} color={FARMER_THEME.colors.primaryGreen} />}
                    iconBg={FARMER_THEME.colors.pastelGreen}
                    title={t('auth.mobile', 'Mobile Number')}
                    subtitle={profileData?.mobile || t('common.optional', 'Not set')}
                    showChevron={false}
                  />
                  <FarmerListRow
                    icon={<Ionicons name="location-outline" size={20} color={FARMER_THEME.colors.warning} />}
                    iconBg={FARMER_THEME.colors.pastelYellow}
                    title={t('auth.village', 'Village')}
                    subtitle={profileData?.village || t('common.optional', 'Not set')}
                    showChevron={false}
                  />
                  <FarmerListRow
                    icon={<Ionicons name="home-outline" size={20} color={FARMER_THEME.colors.tealGreen} />}
                    iconBg={FARMER_THEME.colors.pastelTeal}
                    title={t('auth.address', 'Address')}
                    subtitle={profileData?.address || t('common.optional', 'Not set')}
                    showChevron={false}
                  />
                  <FarmerListRow
                    icon={<Ionicons name="mail-outline" size={20} color="#2F7A3A" />}
                    iconBg={FARMER_THEME.colors.pastelLime}
                    title={t('auth.postalCode', 'Postal Code')}
                    subtitle={profileData?.postalCode || t('common.optional', 'Not set')}
                    showChevron={false}
                  />
                  <FarmerListRow
                    icon={<Ionicons name="map-outline" size={20} color="#3B6FB6" />}
                    iconBg={FARMER_THEME.colors.pastelBlue}
                    title={t('auth.state', 'State')}
                    subtitle={profileData?.state || t('common.optional', 'Not set')}
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
                        {t('profile.accountStatus', 'Account Status')}
                      </Text>
                      <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <FarmerBadge
                          label={(profileData?.status === 'ACTIVE' && profileData?.isActive !== false) ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                          variant={(profileData?.status === 'ACTIVE' && profileData?.isActive !== false) ? 'success' : 'error'}
                        />
                        {!(profileData?.status === 'ACTIVE' && profileData?.isActive !== false) && (
                          <Text style={{ fontSize: 12, color: '#C0392B', fontWeight: '600' }}>
                            {t('profile.productsHidden', 'Products Hidden')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Switch
                      value={profileData?.status === 'ACTIVE' && profileData?.isActive !== false}
                      onValueChange={handleStatusToggleChange}
                      trackColor={{ false: '#FDE6E2', true: '#BFE3CB' }}
                      thumbColor={(profileData?.status === 'ACTIVE' && profileData?.isActive !== false) ? '#2A9560' : '#C0392B'}
                      disabled={statusUpdating}
                    />
                  </View>

                  {(!(profileData?.status === 'ACTIVE' && profileData?.isActive !== false) && profileData?.inactiveReason) && (
                    <View style={styles.farmerReasonBox}>
                      <Text style={styles.farmerReasonLabel}>{t('profile.deactivationReason', 'Deactivation Reason:')}</Text>
                      <Text style={styles.farmerReasonText}>{profileData.inactiveReason}</Text>
                      {profileData.inactiveSince && (
                        <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                          {t('profile.deactivatedOn', {
                            date: new Date(profileData.inactiveSince).toLocaleDateString(),
                            time: new Date(profileData.inactiveSince).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            defaultValue: `Deactivated on: ${new Date(profileData.inactiveSince).toLocaleDateString()} at ${new Date(profileData.inactiveSince).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          })}
                        </Text>
                      )}
                    </View>
                  )}
                </FarmerCard>

                {/* Action Buttons */}
                <View style={styles.farmerActionsContainer}>
                  <FarmerPrimaryButton
                    title={t('profile.editProfile', 'Edit Profile')}
                    onPress={startEditing}
                    icon={<EditIcon size={18} color="#FFFFFF" strokeWidth={2} />}
                    style={{ marginBottom: 12 }}
                  />
                  <FarmerOutlineButton
                    title={t('profile.changeLanguage', 'Change Language')}
                    onPress={() => navigation.navigate('LanguageSelection', { fromSettings: true })}
                    textColor={FARMER_THEME.colors.primaryGreen}
                    borderColor={FARMER_THEME.colors.cardBorder}
                    icon={<Ionicons name="language" size={18} color={FARMER_THEME.colors.primaryGreen} />}
                    style={{ marginBottom: 12 }}
                  />
                  <FarmerOutlineButton
                    title={t('profile.logout', 'Logout')}
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
              onRequestClose={() => {
                Keyboard.dismiss();
                setIsStatusModalVisible(false);
              }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
              >
                <ScrollView
                  contentContainerStyle={styles.farmerModalOverlay}
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.farmerModalOverlayTouchable}>
                      <FarmerCard style={styles.farmerModalContent}>
                        <Text
                          style={styles.farmerModalTitle}
                          maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                        >
                          {t('profile.confirmDeactivate', 'Confirm Deactivation')}
                        </Text>
                        <Text
                          style={styles.farmerModalSubtitle}
                          maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                        >
                          {t('profile.confirmDeactivateDesc', 'Your products will be hidden from customers and orders paused.')}
                        </Text>

                        <View style={{ marginVertical: 6 }}>
                          <FarmerInput
                            value={tempInactiveReason}
                            onChangeText={setTempInactiveReason}
                            placeholder={t('profile.explainDeactivate', 'Explain why you are deactivating (10–500 characters)...')}
                            multiline
                            maxLength={500}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: tempInactiveReason.trim().length >= 10 ? '#2A9560' : '#DC2626',
                              textAlign: 'right',
                              marginTop: 4,
                            }}
                          >
                            {tempInactiveReason.trim().length} / 500 characters (min 10)
                          </Text>
                        </View>

                        <View style={styles.farmerModalButtonsRow}>
                          <FarmerOutlineButton
                            title={t('common.cancel', 'Cancel')}
                            onPress={() => {
                              Keyboard.dismiss();
                              setIsStatusModalVisible(false);
                            }}
                            disabled={statusUpdating}
                            compact
                            style={styles.farmerCancelButton}
                            textColor={FARMER_THEME.colors.cancelledText}
                            borderColor="#FCA5A5"
                            icon={
                              <Ionicons
                                name="close-circle-outline"
                                size={16}
                                color={FARMER_THEME.colors.cancelledText}
                              />
                            }
                            textStyle={styles.farmerCancelButtonText}
                          />
                          <FarmerDeepButton
                            title={t('profile.confirmDeactivate', 'Confirm Deactivate')}
                            onPress={() => {
                              Keyboard.dismiss();
                              submitStatusUpdate(false, tempInactiveReason);
                            }}
                            disabled={statusUpdating || tempInactiveReason.trim().length < 10}
                            loading={statusUpdating}
                            compact
                            style={styles.farmerConfirmButton}
                            textStyle={styles.farmerConfirmButtonText}
                          />
                        </View>
                      </FarmerCard>
                    </View>
                  </TouchableWithoutFeedback>
                </ScrollView>
              </KeyboardAvoidingView>
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
        <ProfileSuccessModal
          visible={successModalVisible}
          onClose={() => setSuccessModalVisible(false)}
          title={successModalConfig.title}
          message={successModalConfig.message}
          synchronizedOrdersCount={successModalConfig.synchronizedOrdersCount}
          isFarmer={true}
        />
      </FarmerPageBackground>
    );
  }

  // Customer Theme View
  return (
    <PageBackground style={{ flex: 1 }}>
      <ThemedHeader
        variant="tab"
        title={t('profile.myProfile', 'Account')}
        subtitle={t('profile.manageCustomer', 'Manage your profile & details')}
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
              <Text style={styles.customerRoleText}>🏠 {t('auth.customer', 'Customer')}</Text>
            </View>
          </Card>

          {isEditing ? (
            <View style={{ marginTop: 16 }}>
              <Card style={{ marginBottom: 16 }}>
                <Text style={styles.customerSectionTitle}>{t('profile.editProfile', 'Edit Personal Information')}</Text>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>{t('auth.fullName', 'Full Name')}</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('auth.fullName', 'Full Name')}
                    placeholderTextColor="#A08D7E"
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>{t('auth.mobile', 'Mobile Number')}</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder={t('auth.mobile', 'Mobile')}
                    placeholderTextColor="#A08D7E"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>{t('auth.village', 'Village')}</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={village}
                    onChangeText={setVillage}
                    placeholder={t('auth.village', 'Village')}
                    placeholderTextColor="#A08D7E"
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>{t('auth.address', 'Address')}</Text>
                  <TextInput
                    style={[styles.customerTextInput, { minHeight: 70, textAlignVertical: 'top' }]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder={t('auth.address', 'Address')}
                    placeholderTextColor="#A08D7E"
                    multiline
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>{t('auth.postalCode', 'Postal Code')}</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder={t('auth.postalCode', 'Postal Code')}
                    placeholderTextColor="#A08D7E"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.customerInputGroup}>
                  <Text style={styles.customerInputLabel}>{t('auth.state', 'State')}</Text>
                  <TextInput
                    style={styles.customerTextInput}
                    value={stateVal}
                    onChangeText={setStateVal}
                    placeholder={t('auth.state', 'State')}
                    placeholderTextColor="#A08D7E"
                  />
                </View>
              </Card>

              <View style={{ marginTop: 8 }}>
                <PrimaryButton
                  title={saving ? t('common.loading', 'Saving...') : t('common.save', 'Save Changes')}
                  onPress={handleSave}
                  disabled={saving}
                  style={{ marginBottom: 12 }}
                />
                <OutlineButton
                  title={t('common.cancel', 'Cancel')}
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
                <Text style={styles.customerSectionTitle}>{t('profile.personalInfo', 'Personal Information')}</Text>
              </View>

              <CustomerInfoRow
                icon="call-outline"
                label={t('auth.mobile', 'Mobile')}
                value={profileData?.mobile}
              />
              <CustomerInfoRow
                icon="location-outline"
                label={t('auth.village', 'Village')}
                value={profileData?.village}
              />
              <CustomerInfoRow
                icon="home-outline"
                label={t('auth.address', 'Address')}
                value={profileData?.address}
              />
              <CustomerInfoRow
                icon="mail-outline"
                label={t('auth.postalCode', 'Postal Code')}
                value={profileData?.postalCode}
              />
              <CustomerInfoRow
                icon="map-outline"
                label={t('auth.state', 'State')}
                value={profileData?.state}
              />

              <View style={{ marginTop: 20, marginBottom: 16 }}>
                <PrimaryButton
                  title={t('profile.editProfile', 'Edit Profile')}
                  onPress={startEditing}
                  icon={<Ionicons name="pencil" size={16} color="#FFFFFF" />}
                  style={{ marginBottom: 12 }}
                />
                <OutlineButton
                  title={t('profile.changeLanguage', 'Change Language')}
                  onPress={() => navigation.navigate('LanguageSelection', { fromSettings: true })}
                  icon={<Ionicons name="language" size={16} color={THEME.colors.accent} />}
                  style={{ marginBottom: 12 }}
                />
                <OutlineButton
                  title={t('profile.logout', 'Logout')}
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
      <ProfileSuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title={successModalConfig.title}
        message={successModalConfig.message}
        synchronizedOrdersCount={successModalConfig.synchronizedOrdersCount}
        isFarmer={false}
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
    flexGrow: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  farmerModalOverlayTouchable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerModalContent: {
    width: '100%',
    maxWidth: 350,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  farmerModalTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 20,
    color: FARMER_THEME.colors.headings,
    textAlign: 'center',
    marginBottom: 4,
  },
  farmerModalSubtitle: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 13,
    color: FARMER_THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  farmerModalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  farmerCancelButton: {
    flex: 1,
    backgroundColor: FARMER_THEME.colors.cancelledBg,
    borderColor: '#F87171',
    borderWidth: 1.5,
    borderRadius: 14,
  },
  farmerCancelButtonText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  farmerConfirmButton: {
    flex: 1.45,
    borderRadius: 14,
  },
  farmerConfirmButtonText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
export default ProfileScreen;
