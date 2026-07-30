import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import {farmerRegister} from '../services/authService';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const FarmerRegisterScreen = ({navigation}: any) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    village: '',
    address: '',
    postalCode: '',
    state: '',
  });
  
  const [photo, setPhoto] = useState<any>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const updateField = (field: string, value: string) => {
    setFormData({...formData, [field]: value});
    if (errors[field]) {
      setErrors({...errors, [field]: null});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string | null> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (formData.mobile.length < 10) {
      newErrors.mobile = 'Enter a valid mobile number';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    setShowPhotoOptions(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    setShowPhotoOptions(false);
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const pickDocument = async () => {
    setShowPhotoOptions(false);
    let result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
    });
    if (result.canceled === false && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0]);
    }
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const data = new FormData();
      
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        village: formData.village.trim(),
        address: formData.address.trim(),
        postalCode: formData.postalCode.trim(),
        state: formData.state.trim(),
      };

      data.append('data', JSON.stringify(registerData));

      if (photo) {
        const filename = photo.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        
        data.append('photo', {
          uri: photo.uri,
          name: filename,
          type,
        } as any);
      }

      const result = await farmerRegister(data);

      Alert.alert(
        'Success',
        result.message || 'Registration successful! Please login.',
        [{text: 'OK', onPress: () => navigation.navigate('FarmerLogin')}],
      );
    } catch (error: any) {
      console.log('Status:', error.response?.status);
      console.log('Response:', error.response?.data);
      console.log('Message:', error.message);

      Alert.alert(
        'Error',
        JSON.stringify(error.response?.data || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        
        <View style={styles.header}>
          <Text style={styles.logo}>🚜</Text>
          <Text style={styles.appName}>Farm2Home</Text>
          <Text style={styles.subtitle}>Create your farmer account</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          
          {/* Photo Upload Section */}
          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={() => setShowPhotoOptions(true)}>
              {photo ? (
                <Image source={{uri: photo.uri}} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>+ Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <CustomInput
            label="Full Name *"
            value={formData.name}
            onChangeText={v => updateField('name', v)}
            placeholder="Enter your full name"
            error={errors.name}
          />

          <CustomInput
            label="Email *"
            value={formData.email}
            onChangeText={v => updateField('email', v)}
            placeholder="Enter your email"
            keyboardType="email-address"
            error={errors.email}
          />

          <CustomInput
            label="Mobile Number *"
            value={formData.mobile}
            onChangeText={v => updateField('mobile', v)}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            error={errors.mobile}
          />

          <CustomInput
            label="Village"
            value={formData.village}
            onChangeText={v => updateField('village', v)}
            placeholder="Enter your village"
          />

          <CustomInput
            label="Address"
            value={formData.address}
            onChangeText={v => updateField('address', v)}
            placeholder="Enter your address"
            multiline
          />

          <CustomInput
            label="Postal Code"
            value={formData.postalCode}
            onChangeText={v => updateField('postalCode', v)}
            placeholder="Enter postal code"
            keyboardType="numeric"
          />

          <CustomInput
            label="State"
            value={formData.state}
            onChangeText={v => updateField('state', v)}
            placeholder="Enter your state"
          />

          <CustomInput
            label="Password *"
            value={formData.password}
            onChangeText={v => updateField('password', v)}
            placeholder="Create a password"
            secureTextEntry
            error={errors.password}
          />

          <CustomInput
            label="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={v => updateField('confirmPassword', v)}
            placeholder="Confirm your password"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <CustomButton
            title="Sign Up"
            onPress={handleRegister}
            loading={loading}
            style={{marginTop: 16}}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginLabel}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('FarmerLogin')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhotoOptions(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Photo From</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
              <Text style={styles.modalOptionText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={pickDocument}>
              <Text style={styles.modalOptionText}>Document</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, {borderBottomWidth: 0}]} 
              onPress={() => setShowPhotoOptions(false)}>
              <Text style={[styles.modalOptionText, {color: 'red'}]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9', // Light green background
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 44,
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F57F17', // Farmer color
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    color: '#757575',
    fontSize: 12,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginLabel: {
    color: '#757575',
    fontSize: 14,
  },
  loginLink: {
    color: '#F57F17',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#212121',
  },
});

export default FarmerRegisterScreen;
