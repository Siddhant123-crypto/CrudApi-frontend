import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useAuth } from '../context/AuthContext';
import {
  newUserLogin,
  googleLogin,
  adminLogin,
} from '../services/authService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId:
    '159078840279-7slmnqaleckksrrtr1i35lfnqj0g23v0.apps.googleusercontent.com',
});

type UserData = {
  name: string;
  email: string;
  role: 'FARMER' | 'USER' | 'ADMIN';
  farmerId?: string;
  userId?: string;
  profilePhoto?: string;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const PersonIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke="#17663F"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx={12}
      cy={7}
      r={4}
      stroke="#17663F"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3}
      y={11}
      width={18}
      height={11}
      rx={2}
      ry={2}
      stroke="#17663F"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke="#17663F"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
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

const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"
    />
    <Path
      fill="#34A853"
      d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10 10 0 0 0 12 22z"
    />
    <Path
      fill="#FBBC05"
      d="M6.2 13.6a6 6 0 0 1 0-3.8V7.1H2.7a10 10 0 0 0 0 9.2z"
    />
    <Path
      fill="#EA4335"
      d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 2.7 7.1l3.5 2.7C7 7.8 9.3 6 12 6z"
    />
  </Svg>
);

// ─── COMPONENT ─────────────────────────────────────────────────────────────

const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const NewUserLoginScreen = ({ navigation }: any) => {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const { login } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string | null;
    password?: string | null;
  }>({});

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const validate = () => {
    const newErrors: Record<string, string | null> = {};
    if (!identifier.trim()) {
      newErrors.identifier = 'Email or Mobile is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      let result;
      const email = identifier.trim().toLowerCase();
      const isSystemAdmin = email === 'admin@gmail.com' || email.includes('admin');
      if (isSystemAdmin) {
        result = await adminLogin(identifier.trim(), password);
        console.log('ADMIN LOGIN RESPONSE:', result);
        if (result?.message?.includes('successful') || result?.data?.role === 'ADMIN') {
          const data = result.data || {};
          const userData: UserData = {
            name: data.name || 'System Admin',
            email: data.email || identifier.trim(),
            role: 'ADMIN',
            userId: data.adminId,
          };
          if (!data.token) {
            Alert.alert('Login Error', 'Login successful but access token was not received.');
            return;
          }
          await login(userData, data.token);
          console.log('ADMIN LOGIN COMPLETED');
          return;
        } else {
          Alert.alert('Login Failed', result?.message || 'Invalid credentials');
          return;
        }
      } else {
        result = await newUserLogin(identifier.trim(), password);
        console.log('NORMAL LOGIN RESPONSE:', result);

        if (result?.message === 'Account Not Found') {
          const adminResult = await adminLogin(identifier.trim(), password);
          console.log('ADMIN LOGIN FALLBACK RESPONSE:', adminResult);

          if (adminResult?.message?.includes('successful') || adminResult?.data?.role === 'ADMIN') {
            const data = adminResult.data || {};
            const userData: UserData = {
              name: data.name || 'System Admin',
              email: data.email || identifier.trim(),
              role: 'ADMIN',
              userId: data.adminId,
            };
            if (!data.token) {
              Alert.alert('Login Error', 'Login successful but access token was not received.');
              return;
            }
            await login(userData, data.token);
            console.log('ADMIN LOGIN COMPLETED');
            return;
          } else if (
            adminResult?.message &&
            adminResult.message !== 'Account not found' &&
            adminResult.message !== 'Email not found'
          ) {
            Alert.alert('Login Failed', adminResult.message);
            return;
          }
        }
      }
      if (result?.message?.includes('Login Successful') && result?.response) {
        const response = result.response;
        const isFarmer = response.role === 'FARMER' || response.role === 'Farmer';
        const isAdmin = response.role === 'ADMIN' || response.role === 'Admin';
        const userData: UserData = {
          name: response.name,
          email: response.email,
          role: isAdmin ? 'ADMIN' : isFarmer ? 'FARMER' : 'USER',
          farmerId: isFarmer ? response.farmerId || response.id : undefined,
          userId: !isFarmer && !isAdmin ? response.userId || response.id : undefined,
          profilePhoto: response.profilePhoto,
        };
        console.log('NORMAL LOGIN USER:', userData);
        console.log('NORMAL LOGIN TOKEN:', result.accessToken ? 'YES' : 'NO');
        if (!result.accessToken) {
          Alert.alert('Login Error', 'Login successful but access token was not received.');
          return;
        }
        await login(userData, result.accessToken);
        console.log('NORMAL LOGIN COMPLETED');
        return;
      }
      Alert.alert('Login Failed', result?.message || 'Invalid credentials');
    } catch (error: any) {
      console.log('Normal Login Error:', error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        'Unable to connect to server.';
      Alert.alert('Login Error', typeof msg === 'string' ? msg : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading) {
      return;
    }
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        console.log('No previous Google session');
      }
      const googleResult = await GoogleSignin.signIn();
      console.log('GOOGLE RESULT:', googleResult);
      const idToken = googleResult.data?.idToken;
      if (!idToken) {
        Alert.alert('Google Login Failed', 'Google ID token was not received.');
        return;
      }
      console.log('GOOGLE ID TOKEN RECEIVED');
      const backendResult = await googleLogin(idToken);
      console.log('GOOGLE BACKEND RESPONSE:', backendResult);
      if (backendResult?.message?.includes('Login Successful') && backendResult?.response) {
        const response = backendResult.response;
        const isFarmer = response.role === 'FARMER' || response.role === 'Farmer';
        const isAdmin = response.role === 'ADMIN' || response.role === 'Admin';
        const userData: UserData = {
          name: response.name,
          email: response.email,
          role: isAdmin ? 'ADMIN' : isFarmer ? 'FARMER' : 'USER',
          farmerId: isFarmer ? response.farmerId || response.id : undefined,
          userId: !isFarmer && !isAdmin ? response.userId || response.id : undefined,
          profilePhoto: response.profilePhoto,
        };
        console.log('GOOGLE EXISTING USER:', userData);
        console.log('GOOGLE JWT:', backendResult.accessToken ? 'YES' : 'NO');
        if (!backendResult.accessToken) {
          Alert.alert('Google Login Error', 'Backend login successful but JWT token was not received.');
          return;
        }
        await login(userData, backendResult.accessToken);
        console.log('GOOGLE EXISTING USER LOGIN SUCCESS');
        return;
      }
      if (backendResult?.message === 'NEW_USER' && backendResult?.response) {
        console.log('NEW GOOGLE USER');
        navigation.navigate('RoleSelection', {
          email: backendResult.response.email,
          name: backendResult.response.name,
          isGoogleSignUp: true,
        });
        return;
      }
      Alert.alert('Google Login Failed', backendResult?.message || 'Google login failed.');
    } catch (error: any) {
      console.log('Google Login Error:', error);
      Alert.alert('Google Login Error', error?.message || 'Unable to login with Google.');
    } finally {
      setGoogleLoading(false);
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
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ─── 1) HERO SECTION (height 300 + statusBarHeight, full width, absolutely positioned) ─── */}
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
                  <Stop offset="0%" stopColor="#FFE3B8" />
                  <Stop offset="60%" stopColor="#DDEFD9" />
                  <Stop offset="100%" stopColor="#BFE3C9" />
                </SvgLinearGradient>
              </Defs>
              <Rect x="0" y="0" width="390" height="300" fill="url(#heroGrad)" />
              <Circle cx="300" cy="120" r="44" fill="#FFF3D6" opacity={0.9} />
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
              <Path
                d="M20 300 Q90 255 160 262"
                stroke="#2FA066"
                strokeWidth={2}
                opacity={0.7}
                fill="none"
              />
              <Path
                d="M80 300 Q150 262 230 268"
                stroke="#2FA066"
                strokeWidth={2}
                opacity={0.7}
                fill="none"
              />
              <Path
                d="M150 300 Q220 268 300 274"
                stroke="#2FA066"
                strokeWidth={2}
                opacity={0.7}
                fill="none"
              />
              <Path
                d="M230 300 Q290 272 370 276"
                stroke="#2FA066"
                strokeWidth={2}
                opacity={0.7}
                fill="none"
              />
            </Svg>

            {/* Brand Pill & Tagline Overlay */}
            <View style={styles.heroOverlay}>
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

          {/* ─── 2) WHITE SHEET (starts at y=218) ─── */}
          <View style={styles.whiteSheet}>
            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in to continue to your account.
            </Text>

            {/* Email or mobile */}
            <Text style={styles.inputLabel}>Email or mobile</Text>
            <View style={styles.inputContainer}>
              <PersonIcon />
              <TextInput
                style={styles.textInput}
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (errors.identifier) {
                    setErrors((prev) => ({ ...prev, identifier: null }));
                  }
                }}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 160, animated: true });
                  }, 120);
                }}
                placeholder="Enter email or mobile"
                placeholderTextColor="#8E9A90"
                keyboardType="email-address"
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                testID="customer_email_input"
              />
            </View>
            {errors.identifier ? (
              <Text style={styles.errorText}>{errors.identifier}</Text>
            ) : null}

            {/* 16px gap */}
            <View style={{ height: 16 }} />

            {/* Password */}
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <LockIcon />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: null }));
                  }
                }}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 240, animated: true });
                  }, 120);
                }}
                placeholder="Enter your password"
                placeholderTextColor="#8E9A90"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                testID="customer_password_input"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            {/* Forgot password? */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign in Button */}
            <Pressable
              style={[styles.signInButtonContainer, loading && { opacity: 0.85 }]}
              onPress={handleLogin}
              disabled={loading}
              testID="customer_sign_in_button"
            >
              <LinearGradient
                colors={['#2A9560', '#17663F']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.signInButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign in</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Continue with Google */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              <GoogleIcon />
              <Text style={styles.googleButtonText}>
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerRegularText}>New to Farm2Home? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('RoleSelection')}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLinkText}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFE3B8',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  // ─── HERO ───
  heroContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 52 + statusBarHeight,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 18,
    paddingVertical: 8,
    gap: 10,
    shadowColor: '#0E3B29',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
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
    fontSize: 19,
    color: '#0E3B29',
  },
  tagline: {
    marginTop: 14,
    fontFamily: 'Fraunces_500Medium_Italic',
    fontSize: 15,
    color: '#145238',
    textAlign: 'center',
  },
  // ─── WHITE SHEET ───
  whiteSheet: {
    marginTop: 218 + statusBarHeight,
    flex: 1,
    minHeight: SCREEN_HEIGHT - 218,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 40,
    shadowColor: '#0E3B29',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
  },
  welcomeTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    color: '#0E3B29',
  },
  welcomeSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#5C6B60',
    marginTop: 4,
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#0E3B29',
    marginBottom: 8,
  },
  inputContainer: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D3E5D8',
    backgroundColor: '#F5FBF7',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#1B2A22',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 18,
  },
  forgotPasswordText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#17663F',
  },
  signInButtonContainer: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    shadowColor: '#17663F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  signInButtonGradient: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCE8DF',
  },
  orText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: '#7A887D',
  },
  googleButton: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D3E5D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#1B2A22',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  footerRegularText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#5C6B60',
  },
  footerLinkText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#17663F',
  },
});

export default NewUserLoginScreen;
