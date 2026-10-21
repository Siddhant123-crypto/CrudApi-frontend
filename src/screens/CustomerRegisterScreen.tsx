import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  Platform,
  StatusBar,
  Modal,
  Image,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
} from 'react-native-svg';
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_500Medium_Italic,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { userRegister } from '../services/authService';
import { useAuth } from '../context/AuthContext';

// ─── SVG ICONS ─────────────────────────────────────────────────────────────

const LeafIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14z"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 19 13 11"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AvatarPersonIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"
      stroke="#D9651B"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx={12}
      cy={8}
      r={4}
      stroke="#D9651B"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CameraIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8h3l2-3h6l2 3h3v11H4z"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx={12}
      cy={13}
      r={3.5}
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UserIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={12}
      cy={8}
      r={4}
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MailIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3}
      y={5}
      width={18}
      height={14}
      rx={3}
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m4 7 8 6 8-6"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect
      x={7}
      y={2}
      width={10}
      height={20}
      rx={3}
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11 18h2"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HomeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 11 12 3l9 8"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 10v10h14V10"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PinIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx={12}
      cy={10}
      r={2.5}
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HashIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FlagIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 21V4"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 4h12l-2 4 2 4H5"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect
      x={4}
      y={11}
      width={16}
      height={10}
      rx={2.5}
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 11V7a4 4 0 0 1 8 0v4"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShieldCheckIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3z"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m9 12 2 2 4-4"
      stroke="#D9651B"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"
      stroke="#6B7A6F"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx={12}
      cy={12}
      r={3}
      stroke="#6B7A6F"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeOffIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
      stroke="#6B7A6F"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1={1}
      y1={1}
      x2={23}
      y2={23}
      stroke="#6B7A6F"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ArrowRightIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="#FFFFFF"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── REUSABLE COMPONENTS ───────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
    <View style={styles.sectionHeaderLine} />
  </View>
);

const BenefitPill = ({ label }: { label: string }) => (
  <View style={styles.benefitPill}>
    <View style={styles.benefitDot} />
    <Text style={styles.benefitText}>{label}</Text>
  </View>
);

interface FormFieldProps {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  returnKeyType?: any;
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
  error?: string | null;
}

const FormField = ({
  label,
  required = false,
  value,
  placeholder,
  onChangeText,
  icon,
  rightElement,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  multiline = false,
  returnKeyType = 'next',
  onSubmitEditing,
  blurOnSubmit,
  inputRef,
  error,
}: FormFieldProps) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.requiredAsterisk}> *</Text>}
    </Text>
    <View
      style={[
        styles.inputContainer,
        multiline && styles.inputContainerMultiline,
        !!error && styles.inputContainerError,
      ]}
    >
      <View style={[styles.fieldIconWrapper, multiline && styles.fieldIconWrapperMultiline]}>
        {icon}
      </View>
      <TextInput
        ref={inputRef as any}
        style={[styles.textInput, multiline && styles.textInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E9A90"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
        underlineColorAndroid="transparent"
      />
      {rightElement}
    </View>
    {!!error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const CustomerRegisterScreen = ({ route, navigation }: any) => {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const {
    name = '',
    email = '',
    isGoogleSignUp = false,
  } = route?.params || {};

  const { login } = useAuth();

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
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Linked TextInput refs for keyboard next navigation
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const mobileRef = useRef<TextInput>(null);
  const villageRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const postalCodeRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string | null> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = 'Enter a valid mobile number';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    setShowPhotoOptions(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    setShowPhotoOptions(false);
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const pickDocument = async () => {
    setShowPhotoOptions(false);
    const result = await DocumentPicker.getDocumentAsync({
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

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }
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
        const filename = photo.uri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        data.append('photo', {
          uri: photo.uri,
          name: filename,
          type: type,
        } as any);
      }
      console.log('Customer Registration Started');
      const result = await userRegister(data);
      console.log('Customer Registration Result:', result);
      if (
        result &&
        result.message &&
        !result.message.includes('Registration Successful')
      ) {
        setLoading(false);
        Alert.alert('Registration Failed', result.message);
        return;
      }
      if (isGoogleSignUp) {
        console.log('Google Customer Registration Flow');
        const responseData = result.response || result;
        if (!responseData.accessToken) {
          console.warn('Customer registration API did not return accessToken.');
          Alert.alert(
            'Registration Successful',
            'Account created successfully. Please login.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('NewUserLogin'),
              },
            ]
          );
          return;
        }
        const userData = {
          name: responseData.name || formData.name.trim(),
          email: responseData.email || formData.email.trim(),
          role: 'USER' as const,
          userId: responseData.userId || responseData.id,
          profilePhoto: responseData.profilePhoto,
        };
        await login(userData, responseData.accessToken);
        return;
      }
      console.log('Manual Customer Registration Flow');
      Alert.alert(
        'Registration Successful',
        'Your customer account has been created successfully. Please login.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('NewUserLogin');
            },
          },
        ]
      );
    } catch (error: any) {
      console.log('Customer Registration Error Status:', error.response?.status);
      console.log('Customer Registration Error Response:', error.response?.data);
      console.log('Customer Registration Error Message:', error.message);
      let errorMessage = 'Something went wrong. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <KeyboardAwareScrollView
        style={styles.keyboardContainer}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={30}
        extraHeight={120}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        bounces={false}
      >
        {/* ─── 1) HERO SECTION (height 300 + statusBarHeight, SVG drawn) ─── */}
        <View style={[styles.heroContainer, { height: 300 + statusBarHeight }]}>
          <Svg
            width="100%"
            height={300 + statusBarHeight}
            viewBox="0 0 390 300"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFillObject}
          >
            <Defs>
              <SvgLinearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FFD6A0" />
                <Stop offset="60%" stopColor="#FFEAD2" />
                <Stop offset="100%" stopColor="#BFE3C9" />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="390" height="300" fill="url(#heroGrad)" />
            <Circle cx="310" cy="110" r="42" fill="#FFF3D6" opacity={0.9} />
            <Path
              d="M0 190 Q100 140 200 175 T390 160 V300 H0 Z"
              fill="#8FD0A6"
            />
            <Path
              d="M0 220 Q120 175 240 210 T390 200 V300 H0 Z"
              fill="#4FB07A"
            />
            <Path
              d="M0 250 Q140 215 270 245 T390 235 V300 H0 Z"
              fill="#1F8A56"
            />
          </Svg>

          {/* Brand Pill & Tagline */}
          <View style={[styles.heroOverlay, { top: 50 + statusBarHeight }]}>
            <View style={styles.brandPill}>
              <View style={styles.leafCircle}>
                <LeafIcon />
              </View>
              <Text style={styles.brandTitle}>Farm2Home</Text>
            </View>

            <Text style={styles.tagline}>
              Fresh from the farm, straight to your home
            </Text>
          </View>
        </View>

        {/* ─── Spacer so sheet starts at y = 196 + statusBarHeight ─── */}
        <View style={{ height: 196 + statusBarHeight }} />

        {/* ─── 2) WHITE SHEET ─── */}
        <View style={styles.whiteSheet}>
          {/* ─── 3) AVATAR UPLOAD ─── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowPhotoOptions(true)}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarDashedCircle}>
              {photo?.uri ? (
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholderContent}>
                  <AvatarPersonIcon />
                  <Text style={styles.tapToUploadText}>Tap to upload</Text>
                </View>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <LinearGradient
                colors={['#F08A3E', '#C25A14']}
                style={styles.cameraBadgeGradient}
              >
                <CameraIcon />
              </LinearGradient>
            </View>
          </TouchableOpacity>

          {/* ─── 4) TITLE AND BENEFIT PILLS ─── */}
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            Create customer account
          </Text>
          <Text style={styles.subtitle}>
            Get farm-fresh produce delivered to your home
          </Text>

          {/* Benefit pills row: rendered ONLY ONCE below subtitle */}
          <View style={styles.benefitPillsRow}>
            <BenefitPill label="Farm fresh" />
            <BenefitPill label="Local farmers" />
            <BenefitPill label="Home delivery" />
          </View>

          {/* ─── 5) FORM ─── */}
          {/* Section: PERSONAL DETAILS */}
          <SectionHeader title="PERSONAL DETAILS" />

          <FormField
            label="Full name"
            required
            value={formData.name}
            placeholder="Enter your full name"
            onChangeText={v => updateField('name', v)}
            icon={<UserIcon />}
            autoCapitalize="words"
            returnKeyType="next"
            inputRef={nameRef}
            onSubmitEditing={() => emailRef.current?.focus()}
            error={errors.name}
          />

          <FormField
            label="Email"
            required
            value={formData.email}
            placeholder="Enter your email"
            onChangeText={v => updateField('email', v)}
            icon={<MailIcon />}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            inputRef={emailRef}
            onSubmitEditing={() => mobileRef.current?.focus()}
            error={errors.email}
          />

          <FormField
            label="Mobile number"
            required
            value={formData.mobile}
            placeholder="Enter your mobile number"
            onChangeText={v => updateField('mobile', v)}
            icon={<PhoneIcon />}
            keyboardType="phone-pad"
            returnKeyType="next"
            inputRef={mobileRef}
            onSubmitEditing={() => villageRef.current?.focus()}
            error={errors.mobile}
          />

          {/* Section: DELIVERY ADDRESS */}
          <SectionHeader title="DELIVERY ADDRESS" />

          <FormField
            label="Village"
            value={formData.village}
            placeholder="Enter your village"
            onChangeText={v => updateField('village', v)}
            icon={<HomeIcon />}
            returnKeyType="next"
            inputRef={villageRef}
            onSubmitEditing={() => addressRef.current?.focus()}
          />

          <FormField
            label="Address"
            value={formData.address}
            placeholder="Enter your address"
            onChangeText={v => updateField('address', v)}
            icon={<PinIcon />}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            inputRef={addressRef}
          />

          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <FormField
                label="Postal code"
                value={formData.postalCode}
                placeholder="Postal code"
                onChangeText={v => updateField('postalCode', v)}
                icon={<HashIcon />}
                keyboardType="number-pad"
                returnKeyType="next"
                inputRef={postalCodeRef}
                onSubmitEditing={() => stateRef.current?.focus()}
              />
            </View>

            <View style={styles.halfField}>
              <FormField
                label="State"
                value={formData.state}
                placeholder="State"
                onChangeText={v => updateField('state', v)}
                icon={<FlagIcon />}
                returnKeyType="next"
                inputRef={stateRef}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          {/* Section: SECURITY */}
          <SectionHeader title="SECURITY" />

          <FormField
            label="Password"
            required
            value={formData.password}
            placeholder="Create a password"
            onChangeText={v => updateField('password', v)}
            icon={<LockIcon />}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="next"
            inputRef={passwordRef}
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            error={errors.password}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </TouchableOpacity>
            }
          />

          <FormField
            label="Confirm password"
            required
            value={formData.confirmPassword}
            placeholder="Confirm your password"
            onChangeText={v => updateField('confirmPassword', v)}
            icon={<ShieldCheckIcon />}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            returnKeyType="done"
            inputRef={confirmPasswordRef}
            onSubmitEditing={() => Keyboard.dismiss()}
            error={errors.confirmPassword}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(prev => !prev)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </TouchableOpacity>
            }
          />

          {/* ─── 6) SIGN UP BUTTON ─── */}
          <Pressable
            style={({ pressed }) => [
              styles.signUpButtonContainer,
              pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={['#F08A3E', '#BD4F10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signUpButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.signUpButtonRow}>
                  <Text style={styles.signUpButtonText}>Sign up</Text>
                  <View style={styles.arrowCircle}>
                    <ArrowRightIcon />
                  </View>
                </View>
              )}
            </LinearGradient>
          </Pressable>

          {/* ─── 7) FOOTER ─── */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('NewUserLogin')}
              activeOpacity={0.7}
            >
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* ─── PHOTO OPTIONS MODAL ─── */}
      <Modal
        visible={showPhotoOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoOptions(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Photo</Text>

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
              style={[styles.modalOption, styles.modalOptionCancel]}
              onPress={() => setShowPhotoOptions(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ─── STYLES ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EAF4EC',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#EAF4EC',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#EAF4EC',
    paddingBottom: 120, // generous bottom padding so password & submit scroll above keyboard
  },

  // Hero Section
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 18,
    paddingVertical: 8,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0E3B29',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  leafCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17663F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    color: '#0E3B29',
    letterSpacing: -0.3,
  },
  tagline: {
    fontFamily: 'Fraunces_500Medium_Italic',
    fontSize: 13.5,
    color: '#145238',
    textAlign: 'center',
    marginTop: 8,
  },

  // White Sheet
  whiteSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 62,
    paddingHorizontal: 22,
    paddingBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#0E3B29',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.14,
        shadowRadius: 32,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Avatar Upload
  avatarWrapper: {
    position: 'absolute',
    top: -46,
    alignSelf: 'center',
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#FFFFFF',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0E3B29',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatarDashedCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#F2B27D',
    backgroundColor: '#FFF3E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  tapToUploadText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 9.5,
    color: '#5C6B60',
    marginTop: 2,
    textAlign: 'center',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadgeGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Titles
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: '#0E3B29',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#5C6B60',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  // Benefit Pills
  benefitPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 20,
  },
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF1E3',
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8742A',
  },
  benefitText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: '#B8480F',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 14,
  },
  sectionHeaderText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: '#C25A14',
    textTransform: 'uppercase',
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1E3D2',
  },

  // Form Field
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: '#0E3B29',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#D9651B',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  inputContainer: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1DCC6',
    backgroundColor: '#FFF9F2',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputContainerMultiline: {
    height: 90,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  inputContainerError: {
    borderColor: '#D9383A',
  },
  fieldIconWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldIconWrapperMultiline: {
    marginTop: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1B2A22',
    paddingVertical: 0,
  },
  textInputMultiline: {
    height: 54,
    paddingTop: 0,
  },
  eyeButton: {
    padding: 6,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: '#D9383A',
    marginTop: 3,
    marginLeft: 4,
  },

  // Split Row Fields
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },

  // Sign Up Button
  signUpButtonContainer: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#BD4F10',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.38,
        shadowRadius: 26,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  signUpButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  signUpButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#5C6B60',
  },
  signInLink: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#C25A14',
  },

  // Photo Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#F1DCC6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: '#0E3B29',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF3E6',
    alignItems: 'center',
  },
  modalOptionCancel: {
    borderBottomWidth: 0,
    marginTop: 6,
  },
  modalOptionText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#C25A14',
  },
  modalCancelText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#D9383A',
  },
});

export default CustomerRegisterScreen;
