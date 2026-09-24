import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createAdminMarket, updateAdminMarket } from '../../services/adminService';

export const AdminAddEditMarketScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const market = route.params?.market;
  const isEdit = !!market;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    marketName: market?.marketName || '',
    description: market?.description || '',
    address: market?.address || '',
    village: market?.village || '',
    taluka: market?.taluka || '',
    district: market?.district || '',
    state: market?.state || '',
    pincode: market?.pincode || '',
    latitude: market?.latitude ? market.latitude.toString() : '',
    longitude: market?.longitude ? market.longitude.toString() : '',
    openingTime: market?.openingTime || '',
    closingTime: market?.closingTime || '',
    marketContactName: market?.marketContactName || '',
    contactNumber: market?.contactNumber || '',
    isActive: market?.isActive !== undefined ? market.isActive : true,
  });

  const handleChange = (key: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!formData.marketName.trim()) {
      Alert.alert('Validation Error', 'Market Name is required.');
      return false;
    }
    
    if (formData.latitude) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        Alert.alert('Validation Error', 'Latitude must be a valid number between -90 and 90.');
        return false;
      }
    } else {
      Alert.alert('Validation Error', 'Latitude is required.');
      return false;
    }

    if (formData.longitude) {
      const lon = parseFloat(formData.longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        Alert.alert('Validation Error', 'Longitude must be a valid number between -180 and 180.');
        return false;
      }
    } else {
      Alert.alert('Validation Error', 'Longitude is required.');
      return false;
    }

    return true;
  };

  const formatTimeTo24Hr = (timeStr?: string): string | null => {
    if (!timeStr || !timeStr.trim()) return null;
    const str = timeStr.trim();

    // Already 24-hr format HH:mm or HH:mm:ss
    const match24 = str.match(/^([01]?\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/);
    if (match24) {
      const hours = match24[1].padStart(2, '0');
      const minutes = match24[2];
      const seconds = match24[4] || '00';
      return `${hours}:${minutes}:${seconds}`;
    }

    // 12-hr format e.g. 06:00 AM, 6:30 PM, 6:00am
    const match12 = str.match(/^(\d{1,2}):([0-5]\d)\s*([APap][Mm])$/);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2];
      const period = match12[3].toUpperCase();
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      const hoursStr = hours.toString().padStart(2, '0');
      return `${hoursStr}:${minutes}:00`;
    }

    // Just hour input e.g. "6" or "6 PM"
    const matchHourOnly = str.match(/^(\d{1,2})\s*([APap][Mm])?$/);
    if (matchHourOnly) {
      let hours = parseInt(matchHourOnly[1], 10);
      const period = matchHourOnly[2]?.toUpperCase();
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      if (hours >= 0 && hours <= 23) {
        return `${hours.toString().padStart(2, '0')}:00:00`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const payload: any = {
        marketName: formData.marketName.trim(),
        description: formData.description.trim() || null,
        address: formData.address.trim() || null,
        village: formData.village.trim() || null,
        taluka: formData.taluka.trim() || null,
        district: formData.district.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        openingTime: formatTimeTo24Hr(formData.openingTime),
        closingTime: formatTimeTo24Hr(formData.closingTime),
        marketContactName: formData.marketContactName.trim() || null,
        contactNumber: formData.contactNumber.trim() || null,
        isActive: formData.isActive,
      };

      if (isEdit) {
        await updateAdminMarket(market.id, payload);
        Alert.alert('Success', 'Market updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createAdminMarket(payload);
        Alert.alert('Success', 'Market created successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      console.log('Error saving market', error);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to save market.';
      Alert.alert('Error', serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, key: keyof typeof formData, placeholder: string, keyboardType: any = 'default', multiline = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={String(formData[key])}
        onChangeText={(text) => handleChange(key, text)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <AdminHeader showBackButton />
      <Text style={styles.pageTitle}>{isEdit ? 'Edit Market' : 'Add Market'}</Text>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {renderInput('Market Name *', 'marketName', 'e.g., APMC Vashi')}
          {renderInput('Description', 'description', 'Optional details...', 'default', true)}
          
          <Text style={styles.sectionTitle}>Location Details</Text>
          {renderInput('Address', 'address', 'Street address')}
          <View style={styles.row}>
            <View style={styles.flex1}>{renderInput('Village', 'village', 'Village')}</View>
            <View style={styles.spacing} />
            <View style={styles.flex1}>{renderInput('Taluka', 'taluka', 'Taluka')}</View>
          </View>
          <View style={styles.row}>
            <View style={styles.flex1}>{renderInput('District', 'district', 'District')}</View>
            <View style={styles.spacing} />
            <View style={styles.flex1}>{renderInput('State', 'state', 'State')}</View>
          </View>
          {renderInput('Pincode', 'pincode', 'e.g. 400703', 'numeric')}

          <Text style={styles.sectionTitle}>Map Coordinates</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>{renderInput('Latitude *', 'latitude', 'e.g. 19.0760', 'numeric')}</View>
            <View style={styles.spacing} />
            <View style={styles.flex1}>{renderInput('Longitude *', 'longitude', 'e.g. 72.8777', 'numeric')}</View>
          </View>

          <Text style={styles.sectionTitle}>Operations & Contact</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>{renderInput('Opening Time', 'openingTime', 'e.g. 06:00 AM')}</View>
            <View style={styles.spacing} />
            <View style={styles.flex1}>{renderInput('Closing Time', 'closingTime', 'e.g. 06:00 PM')}</View>
          </View>
          {renderInput('Contact Person', 'marketContactName', 'Name of manager')}
          {renderInput('Contact Number', 'contactNumber', 'Phone number', 'phone-pad')}

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Active Status</Text>
            <TouchableOpacity 
              style={[styles.toggleBtn, formData.isActive ? styles.toggleActive : styles.toggleInactive]}
              onPress={() => handleChange('isActive', !formData.isActive)}
            >
              <Text style={styles.toggleText}>{formData.isActive ? 'Active' : 'Inactive'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#1B2430" />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? 'Update Market' : 'Save Market'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#F5C16C',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacing: {
    width: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleInactive: {
    backgroundColor: '#EF4444',
  },
  toggleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#F5C16C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  saveBtnText: {
    color: '#1B2430',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminAddEditMarketScreen;
