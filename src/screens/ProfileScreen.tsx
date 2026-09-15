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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomButton from '../components/CustomButton';
import LoadingSpinner from '../components/LoadingSpinner';
import {useAuth} from '../context/AuthContext';
import {getUserById, updateUser, uploadUserPhoto} from '../services/userService';
import {getFarmerById} from '../services/farmerService';
import {BASE_URL} from '../services/api';
const ProfileScreen = () => {
  const {user, logout} = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    try {
      if (user?.role === 'FARMER' && user?.farmerId) {
        const data = await getFarmerById(user.farmerId);
        setProfileData(data);
      } else if (user?.userId) {
        const data = await getUserById(user.userId);
        setProfileData(data);
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
      };
      if (user?.userId) {
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
    <ScrollView style={[styles.container, !isFarmer && { backgroundColor: '#F8FAFC' }]}>
      {}
      <View style={[styles.header, !isFarmer && { backgroundColor: '#1E3A8A' }]}>
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
      {}
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
        </View>
      ) : (
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <DetailRow label="Mobile" value={profileData?.mobile || 'N/A'} />
          <DetailRow label="Village" value={profileData?.village || 'N/A'} />
          <DetailRow label="Address" value={profileData?.address || 'N/A'} />
          <DetailRow label="Postal Code" value={profileData?.postalCode || 'N/A'} />
          <DetailRow label="State" value={profileData?.state || 'N/A'} />
          <DetailRow label="Status" value={profileData?.status || 'N/A'} />
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
          {!isFarmer && (
            <CustomButton
              title="Edit Profile"
              onPress={startEditing}
              variant="primary"
              style={{ marginBottom: 12, backgroundColor: '#1E3A8A' }}
            />
          )}
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            variant="danger"
          />
        </View>
      )}
    </ScrollView>
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
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
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
  },
  email: {
    fontSize: 14,
    color: '#C8E6C9',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  roleText: {
    color: '#FFFFFF',
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
    paddingBottom: 40,
  },
});
export default ProfileScreen;
