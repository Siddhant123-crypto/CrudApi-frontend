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
  ImageBackground,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

import {userRegister} from '../services/authService';
import {useAuth} from '../context/AuthContext';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const CustomerRegisterScreen = ({route, navigation}: any) => {

  const {
    name = '',
    email = '',
    isGoogleSignUp = false,
  } = route?.params || {};

  const {login} = useAuth();

  const [formData, setFormData] = useState<Record<string, string>>({
    name: name,
    email: email,
    mobile: '',
    password: '',
    confirmPassword: '',
    village: '',
    address: '',
    postalCode: '',
    state: '',
  });

  const [photo, setPhoto] = useState<any>(null);

  const [showPhotoOptions, setShowPhotoOptions] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<
    Record<string, string | null>
  >({});

  // =========================
  // UPDATE FIELD
  // =========================

  const updateField = (
    field: string,
    value: string,
  ) => {

    setFormData({
      ...formData,
      [field]: value,
    });

    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  // =========================
  // VALIDATION
  // =========================

  const validate = () => {

    const newErrors: Record<
      string,
      string | null
    > = {};

    // NAME

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // EMAIL

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (
      !/\S+@\S+\.\S+/.test(
        formData.email,
      )
    ) {
      newErrors.email =
        'Enter a valid email';
    }

    // MOBILE

    if (!formData.mobile.trim()) {

      newErrors.mobile =
        'Mobile number is required';

    } else if (
      !/^[6-9]\d{9}$/.test(
        formData.mobile,
      )
    ) {

      newErrors.mobile =
        'Enter a valid mobile number';
    }

    // PASSWORD

    if (!formData.password.trim()) {

      newErrors.password =
        'Password is required';

    } else if (
      formData.password.length < 6
    ) {

      newErrors.password =
        'Password must be at least 6 characters';
    }

    // CONFIRM PASSWORD

    if (
      !formData.confirmPassword.trim()
    ) {

      newErrors.confirmPassword =
        'Confirm password is required';

    } else if (
      formData.password !==
      formData.confirmPassword
    ) {

      newErrors.confirmPassword =
        'Passwords do not match';
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // =========================
  // PICK IMAGE FROM GALLERY
  // =========================

  const pickImage = async () => {

    setShowPhotoOptions(false);

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  // =========================
  // TAKE PHOTO
  // =========================

  const takePhoto = async () => {

    setShowPhotoOptions(false);

    const result =
      await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  // =========================
  // PICK PHOTO DOCUMENT
  // =========================

  const pickDocument = async () => {

    setShowPhotoOptions(false);

    const result =
      await DocumentPicker.getDocumentAsync({
        type: 'image/*',
      });

    if (
      result.canceled === false &&
      result.assets &&
      result.assets.length > 0
    ) {

      setPhoto(result.assets[0]);
    }
  };

  // =========================
  // REGISTER
  // =========================

  const handleRegister = async () => {

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {

      const data =
        new FormData();

      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        village: formData.village.trim(),
        address: formData.address.trim(),
        postalCode:
          formData.postalCode.trim(),
        state:
          formData.state.trim(),
      };

      data.append(
        'data',
        JSON.stringify(registerData),
      );

      // =========================
      // PROFILE PHOTO
      // =========================

      if (photo) {

        const filename =
          photo.uri.split('/').pop() ||
          'profile.jpg';

        const match =
          /\.(\w+)$/.exec(filename);

        const type = match
          ? `image/${match[1]}`
          : 'image/jpeg';

        data.append(
          'photo',
          {
            uri: photo.uri,
            name: filename,
            type: type,
          } as any,
        );
      }

      console.log(
        'Customer Registration Started',
      );

      const result =
        await userRegister(data);

      console.log(
        'Customer Registration Result:',
        result,
      );

      // =========================
      // BACKEND VALIDATION ERROR
      // =========================

      if (
        result &&
        result.message &&
        !result.message.includes(
          'Registration Successful',
        )
      ) {

        setLoading(false);

        Alert.alert(
          'Registration Failed',
          result.message,
        );

        return;
      }

      // =========================
      // GOOGLE SIGN-UP
      // =========================

      if (isGoogleSignUp) {

        console.log(
          'Google Customer Registration Flow',
        );

        const responseData =
          result.response || result;

        if (
          !responseData.accessToken
        ) {

          console.warn(
            'Customer registration API did not return accessToken.',
          );

          Alert.alert(
            'Registration Successful',
            'Account created successfully. Please login.',
            [
              {
                text: 'OK',
                onPress: () =>
                  navigation.navigate(
                    'NewUserLogin',
                  ),
              },
            ],
          );

          return;
        }

        const userData = {
          name:
            responseData.name ||
            formData.name.trim(),

          email:
            responseData.email ||
            formData.email.trim(),

          role: 'USER' as const,

          userId:
            responseData.userId ||
            responseData.id,

          profilePhoto:
            responseData.profilePhoto,
        };

        await login(
          userData,
          responseData.accessToken,
        );

        return;
      }

      // =========================
      // MANUAL REGISTRATION
      // =========================

      console.log(
        'Manual Customer Registration Flow',
      );

      Alert.alert(
        'Registration Successful',
        'Your customer account has been created successfully. Please login.',
        [
          {
            text: 'OK',

            onPress: () => {

              navigation.navigate(
                'NewUserLogin',
              );

            },
          },
        ],
      );

    } catch (error: any) {

      console.log(
        'Customer Registration Error Status:',
        error.response?.status,
      );

      console.log(
        'Customer Registration Error Response:',
        error.response?.data,
      );

      console.log(
        'Customer Registration Error Message:',
        error.message,
      );

      let errorMessage =
        'Something went wrong. Please try again.';

      if (error.response?.data) {

        if (
          typeof error.response.data ===
          'string'
        ) {

          errorMessage =
            error.response.data;

        } else if (
          error.response.data.message
        ) {

          errorMessage =
            error.response.data.message;

        } else {

          errorMessage =
            JSON.stringify(
              error.response.data,
            );
        }

      } else if (error.message) {

        errorMessage =
          error.message;
      }

      Alert.alert(
        'Registration Failed',
        errorMessage,
      );

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (

    <ImageBackground
      source={require('../../assets/Farmerreg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios'
            ? 0
            : 20
        }
      >

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
        >

          {/* =========================
              HEADER
          ========================= */}

          <View style={styles.header}>

            <Image
              source={require(
                '../farm2home_logo.png',
              )}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <Text style={styles.appName}>
              Farm2Home
            </Text>

            <Text style={styles.subtitle}>
              Create your customer account
            </Text>

          </View>

          {/* =========================
              FORM
          ========================= */}

          <View style={styles.formContainer}>

            {/* PHOTO */}

            <View
              style={styles.photoContainer}
            >

              <TouchableOpacity
                onPress={() =>
                  setShowPhotoOptions(
                    true,
                  )
                }
              >

                {photo ? (

                  <Image
                    source={{
                      uri: photo.uri,
                    }}
                    style={
                      styles.photoPreview
                    }
                  />

                ) : (

                  <View
                    style={
                      styles.photoPlaceholder
                    }
                  >

                    <Ionicons
                      name="person-outline"
                      size={50}
                      color="#BDBDBD"
                    />

                    <View
                      style={
                        styles.cameraIconBadge
                      }
                    >

                      <Ionicons
                        name="camera"
                        size={16}
                        color="#FFFFFF"
                      />

                    </View>

                    <Text
                      style={
                        styles.photoPlaceholderText
                      }
                    >
                      Tap to upload
                    </Text>

                  </View>
                )}

              </TouchableOpacity>

            </View>

            {/* NAME */}

            <CustomInput
              label="Full Name *"
              value={formData.name}
              onChangeText={value =>
                updateField(
                  'name',
                  value,
                )
              }
              placeholder="Enter your full name"
              error={errors.name}
            />

            {/* EMAIL */}

            <CustomInput
              label="Email *"
              value={formData.email}
              onChangeText={value =>
                updateField(
                  'email',
                  value,
                )
              }
              placeholder="Enter your email"
              keyboardType="email-address"
              error={errors.email}
            />

            {/* MOBILE */}

            <CustomInput
              label="Mobile Number *"
              value={formData.mobile}
              onChangeText={value =>
                updateField(
                  'mobile',
                  value,
                )
              }
              placeholder="Enter your mobile number"
              keyboardType="phone-pad"
              error={errors.mobile}
            />

            {/* VILLAGE */}

            <CustomInput
              label="Village"
              value={formData.village}
              onChangeText={value =>
                updateField(
                  'village',
                  value,
                )
              }
              placeholder="Enter your village"
            />

            {/* ADDRESS */}

            <CustomInput
              label="Address"
              value={formData.address}
              onChangeText={value =>
                updateField(
                  'address',
                  value,
                )
              }
              placeholder="Enter your address"
              multiline
            />

            {/* POSTAL CODE */}

            <CustomInput
              label="Postal Code"
              value={formData.postalCode}
              onChangeText={value =>
                updateField(
                  'postalCode',
                  value,
                )
              }
              placeholder="Enter postal code"
              keyboardType="numeric"
            />

            {/* STATE */}

            <CustomInput
              label="State"
              value={formData.state}
              onChangeText={value =>
                updateField(
                  'state',
                  value,
                )
              }
              placeholder="Enter your state"
            />

            {/* PASSWORD */}

            <CustomInput
              label="Password *"
              value={formData.password}
              onChangeText={value =>
                updateField(
                  'password',
                  value,
                )
              }
              placeholder="Create a password"
              secureTextEntry
              error={errors.password}
            />

            {/* CONFIRM PASSWORD */}

            <CustomInput
              label="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={value =>
                updateField(
                  'confirmPassword',
                  value,
                )
              }
              placeholder="Confirm your password"
              secureTextEntry
              error={
                errors.confirmPassword
              }
            />

            {/* SIGN UP BUTTON */}

            <CustomButton
              title="Sign Up"
              onPress={handleRegister}
              loading={loading}
              style={{
                marginTop: 16,
                backgroundColor:
                  '#F59E0B',
              }}
              textStyle={{
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
            />

            {/* LOGIN */}

            <View
              style={styles.loginRow}
            >

              <Text
                style={styles.loginLabel}
              >
                Already have an account?{' '}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    'NewUserLogin',
                  )
                }
              >

                <Text
                  style={styles.loginLink}
                >
                  Sign In
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </ScrollView>

        {/* =========================
            PHOTO OPTIONS MODAL
        ========================= */}

        <Modal
          visible={showPhotoOptions}
          transparent={true}
          animationType="slide"
          onRequestClose={() =>
            setShowPhotoOptions(
              false,
            )
          }
        >

          <View
            style={styles.modalOverlay}
          >

            <View
              style={styles.modalContent}
            >

              <Text
                style={styles.modalTitle}
              >
                Choose Photo From
              </Text>

              {/* TAKE PHOTO */}

              <TouchableOpacity
                style={styles.modalOption}
                onPress={takePhoto}
              >

                <Text
                  style={
                    styles.modalOptionText
                  }
                >
                  Take Photo
                </Text>

              </TouchableOpacity>

              {/* GALLERY */}

              <TouchableOpacity
                style={styles.modalOption}
                onPress={pickImage}
              >

                <Text
                  style={
                    styles.modalOptionText
                  }
                >
                  Gallery
                </Text>

              </TouchableOpacity>

              {/* DOCUMENT */}

              <TouchableOpacity
                style={styles.modalOption}
                onPress={pickDocument}
              >

                <Text
                  style={
                    styles.modalOptionText
                  }
                >
                  Document
                </Text>

              </TouchableOpacity>

              {/* CANCEL */}

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  {
                    borderBottomWidth: 0,
                  },
                ]}
                onPress={() =>
                  setShowPhotoOptions(
                    false,
                  )
                }
              >

                <Text
                  style={[
                    styles.modalOptionText,
                    {
                      color: 'red',
                    },
                  ]}
                >
                  Cancel
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </Modal>

      </KeyboardAvoidingView>

    </ImageBackground>
  );
};

export default CustomerRegisterScreen;

const styles = StyleSheet.create({

  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    paddingBottom: 60,
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
    borderRadius: 40,
  },

  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },

  formContainer: {
    backgroundColor:
      'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    padding: 24,

    elevation: 2,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.08,
    shadowRadius: 8,

    borderWidth: 1,

    borderColor:
      'rgba(255, 255, 255, 0.5)',
  },

  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F5F5F5',

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',

    position: 'relative',
  },

  photoPlaceholderText: {
    marginTop: 6,
    fontSize: 12,
    color: '#757575',
  },

  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,

    backgroundColor: '#1E3A8A',

    width: 32,
    height: 32,
    borderRadius: 16,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  photoPreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },

  loginLabel: {
    color: '#212121',
    fontSize: 14,
  },

  loginLink: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
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
