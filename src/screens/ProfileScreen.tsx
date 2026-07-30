import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import LoadingSpinner from '../components/LoadingSpinner';
import {useAuth} from '../context/AuthContext';
import {getUserById} from '../services/userService';
import {getFarmerById} from '../services/farmerService';
import {BASE_URL} from '../services/api';

const ProfileScreen = () => {
  const {user, logout} = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {photoUrl ? (
            <Image source={{uri: photoUrl}} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{profileData?.name || user?.name}</Text>
        <Text style={styles.email}>{profileData?.email || user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'FARMER' ? '🌾 Farmer' : '🏠 Customer'}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <DetailRow label="Mobile" value={profileData?.mobile || 'N/A'} />
        <DetailRow label="Village" value={profileData?.village || 'N/A'} />
        <DetailRow label="Address" value={profileData?.address || 'N/A'} />
        <DetailRow
          label="Postal Code"
          value={profileData?.postalCode || 'N/A'}
        />
        <DetailRow label="State" value={profileData?.state || 'N/A'} />
        <DetailRow
          label="Status"
          value={profileData?.status || 'N/A'}
        />
      </View>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <CustomButton
          title="Logout"
          onPress={handleLogout}
          variant="danger"
        />
      </View>
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
  avatarContainer: {
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
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default ProfileScreen;
