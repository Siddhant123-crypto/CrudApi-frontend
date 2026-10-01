import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Ionicons from '@expo/vector-icons/Ionicons';
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
const NewUserLoginScreen = ({
  navigation,
}: any) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] =
    useState('');
  const [password, setPassword] =
    useState('');
  const [loading, setLoading] =
    useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);
  const [errors, setErrors] =
    useState<{
      identifier?: string | null;
      password?: string | null;
    }>({});
  const validate = () => {
    const newErrors: Record<
      string,
      string | null
    > = {};
    if (!identifier.trim()) {
      newErrors.identifier =
        'Email or Mobile is required';
    }
    if (!password.trim()) {
      newErrors.password =
        'Password is required';
    }
    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 0
    );
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
          } else if (adminResult?.message && adminResult.message !== 'Account not found' && adminResult.message !== 'Email not found') {
            Alert.alert('Login Failed', adminResult.message);
            return;
          }
        }
      }
      if (
        result?.message?.includes(
          'Login Successful',
        ) &&
        result?.response
      ) {
        const response =
          result.response;
        const isFarmer =
          response.role === 'FARMER' ||
          response.role === 'Farmer';
        const isAdmin =
          response.role === 'ADMIN' ||
          response.role === 'Admin';
        const userData: UserData = {
          name:
            response.name,
          email:
            response.email,
          role: isAdmin
            ? 'ADMIN'
            : isFarmer
              ? 'FARMER'
              : 'USER',
          farmerId: isFarmer
            ? response.farmerId ||
              response.id
            : undefined,
          userId: (!isFarmer && !isAdmin)
            ? response.userId ||
              response.id
            : undefined,
          profilePhoto:
            response.profilePhoto,
        };
        console.log(
          'NORMAL LOGIN USER:',
          userData,
        );
        console.log(
          'NORMAL LOGIN TOKEN:',
          result.accessToken
            ? 'YES'
            : 'NO',
        );
        if (!result.accessToken) {
          Alert.alert(
            'Login Error',
            'Login successful but access token was not received.',
          );
          return;
        }
        await login(
          userData,
          result.accessToken,
        );
        console.log(
          'NORMAL LOGIN COMPLETED',
        );
        return;
      }
      Alert.alert(
        'Login Failed',
        result?.message ||
          'Invalid credentials',
      );
    } catch (error: any) {
      console.log(
        'Normal Login Error:',
        error,
      );
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        'Unable to connect to server.';
      Alert.alert(
        'Login Error',
        typeof msg === 'string'
          ? msg
          : 'Login failed',
      );
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
        console.log(
          'No previous Google session',
        );
      }
      const googleResult =
        await GoogleSignin.signIn();
      console.log(
        'GOOGLE RESULT:',
        googleResult,
      );
      const idToken =
        googleResult.data?.idToken;
      if (!idToken) {
        Alert.alert(
          'Google Login Failed',
          'Google ID token was not received.',
        );
        return;
      }
      console.log(
        'GOOGLE ID TOKEN RECEIVED',
      );
      const backendResult =
        await googleLogin(idToken);
      console.log(
        'GOOGLE BACKEND RESPONSE:',
        backendResult,
      );
      if (
        backendResult?.message?.includes(
          'Login Successful',
        ) &&
        backendResult?.response
      ) {
        const response =
          backendResult.response;
        const isFarmer =
          response.role === 'FARMER' ||
          response.role === 'Farmer';
        const isAdmin =
          response.role === 'ADMIN' ||
          response.role === 'Admin';
        const userData: UserData = {
          name:
            response.name,
          email:
            response.email,
          role: isAdmin
            ? 'ADMIN'
            : isFarmer
              ? 'FARMER'
              : 'USER',
          farmerId: isFarmer
            ? response.farmerId ||
              response.id
            : undefined,
          userId: (!isFarmer && !isAdmin)
            ? response.userId ||
              response.id
            : undefined,
          profilePhoto:
            response.profilePhoto,
        };
        console.log(
          'GOOGLE EXISTING USER:',
          userData,
        );
        console.log(
          'GOOGLE JWT:',
          backendResult.accessToken
            ? 'YES'
            : 'NO',
        );
        if (
          !backendResult.accessToken
        ) {
          Alert.alert(
            'Google Login Error',
            'Backend login successful but JWT token was not received.',
          );
          return;
        }
        await login(
          userData,
          backendResult.accessToken,
        );
        console.log(
          'GOOGLE EXISTING USER LOGIN SUCCESS',
        );
        return;
      }
      if (
        backendResult?.message ===
          'NEW_USER' &&
        backendResult?.response
      ) {
        console.log(
          'NEW GOOGLE USER',
        );
        navigation.navigate(
          'RoleSelection',
          {
            email:
              backendResult.response.email,
            name:
              backendResult.response.name,
            isGoogleSignUp: true,
          },
        );
        return;
      }
      Alert.alert(
        'Google Login Failed',
        backendResult?.message ||
          'Google login failed.',
      );
    } catch (error: any) {
      console.log(
        'Google Login Error:',
        error,
      );
      Alert.alert(
        'Google Login Error',
        error?.message ||
          'Unable to login with Google.',
      );
    } finally {
      setGoogleLoading(false);
    }
  };
  return (
    <ImageBackground
      source={require('../../assets/Tractor.png')}
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {}
          <View style={styles.header}>
            <View
              style={styles.logoWrapper}
            >
              <Image
                source={require(
                  '../farm2home_logo.png',
                )}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text
              style={styles.welcomeText}
            >
              Welcome to
            </Text>
            <Text
              style={styles.appName}
            >
              Farm2Home!
            </Text>
            <Text
              style={styles.tagline}
            >
              Fresh from the farm, straight
              to your home
            </Text>
          </View>
          {}
          <View
            style={styles.formContainer}
          >
            <Text
              style={styles.formTitle}
            >
              Sign In
            </Text>
            {/* Removed Subtitle */}
            {}
            <CustomInput
              label="Email or Mobile"
              value={identifier}
              onChangeText={text => {
                setIdentifier(text);
                if (errors.identifier) {
                  setErrors({
                    ...errors,
                    identifier: null,
                  });
                }
              }}
              placeholder="Enter email or mobile"
              keyboardType="email-address"
              error={errors.identifier}
              leftIcon={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#757575"
                />
              }
            />
            {}
            <CustomInput
              label="Password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (errors.password) {
                  setErrors({
                    ...errors,
                    password: null,
                  });
                }
              }}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#757575"
                />
              }
            />
            {}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(
                  'ForgotPassword',
                )
              }
              style={
                styles.forgotButton
              }
            >
              <Text
                style={styles.forgotText}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>
            {}
            <View
              style={styles.actionColumn}
            >
              <CustomButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={{
                  width: '80%',
                  alignSelf: 'center',
                  backgroundColor:
                    '#C8E6C9',
                  paddingVertical: 12,
                }}
                textStyle={{
                  fontSize: 16,
                  color: '#1B5E20',
                  fontWeight: 'bold',
                }}
              />
              <View
                style={
                  styles.buttonSpacerVertical
                }
              />
              <CustomButton
                title="Create account"
                onPress={() =>
                  navigation.navigate(
                    'RoleSelection',
                  )
                }
                style={{
                  width: '80%',
                  alignSelf: 'center',
                  backgroundColor:
                    '#E8F5E9',
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor:
                    '#C8E6C9',
                }}
                textStyle={{
                  fontSize: 15,
                  color: '#1B5E20',
                  fontWeight: 'bold',
                }}
              />
            </View>
            {}
            <View
              style={
                styles.dividerContainer
              }
            >
              <View
                style={styles.divider}
              />
              <Text
                style={styles.orText}
              >
                OR
              </Text>
              <View
                style={styles.divider}
              />
            </View>
            {}
            <TouchableOpacity
              style={
                styles.googleButton
              }
              onPress={
                handleGoogleLogin
              }
              disabled={googleLoading}
            >
              <Image
                source={{
                  uri: 'https://img.icons8.com/color/48/000000/google-logo.png',
                }}
                style={
                  styles.googleIconImage
                }
              />
              <Text
                style={
                  styles.googleButtonText
                }
              >
                {googleLoading
                  ? 'Signing in...'
                  : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 40,
  },
  logoWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C8E6C9',
    marginBottom: 12,
  },
  logoImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B5E20',
    marginTop: -4,
  },
  tagline: {
    fontSize: 14,
    color: '#4E7D50',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  formContainer: {
    backgroundColor:
      'rgba(255,255,255,0.6)',
    borderRadius: 24,
    padding: 24,
    paddingTop: 28,
    width: '92%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E4',
    elevation: 3,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 20,
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#1B5E20',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  forgotText: {
    color: '#1B5E20',
    fontWeight: '700',
    fontSize: 14,
  },
  actionColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  buttonSpacerVertical: {
    height: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDDDDD',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 15,
    color: '#333333',
    fontWeight: 'bold',
  },
  googleButton: {
    height: 52,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#DADCE0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  googleIconImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
});
export default NewUserLoginScreen;
