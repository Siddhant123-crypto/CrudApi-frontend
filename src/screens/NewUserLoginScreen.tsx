import React, { useState, useEffect } from 'react';
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
import { newUserLogin, keycloakLogin } from '../services/authService';

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

type UserData = {
  name: string;
  email: string;
  role: 'FARMER' | 'USER';
  farmerId?: string;
  userId?: string;
  profilePhoto?: string;
};

const NewUserLoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [errors, setErrors] = useState<{
    identifier?: string | null;
    password?: string | null;
  }>({});

  /*
   * KEYCLOAK DISCOVERY
   */

  const discovery = AuthSession.useAutoDiscovery(
    'http://172.16.20.43:9090/realms/farm2home',
  );

  /*
   * GOOGLE LOGIN REQUEST
   */

  const [request, response, promptAsync] =
    AuthSession.useAuthRequest(
      {
        clientId: 'farm2home-app',

        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'farm2home',
        }),

        scopes: ['openid', 'profile', 'email'],

        extraParams: {
          kc_idp_hint: 'google',
          prompt: 'select_account',
        },
      },
      discovery,
    );

  /*
   * GOOGLE LOGIN RESPONSE
   */

  useEffect(() => {
    if (
      response?.type === 'success' &&
      response.params.code &&
      discovery
    ) {
      setLoading(true);

      AuthSession.exchangeCodeAsync(
        {
          clientId: 'farm2home-app',

          code: response.params.code,

          redirectUri: AuthSession.makeRedirectUri({
            scheme: 'farm2home',
          }),

          extraParams:
            request?.codeChallenge &&
              request.codeVerifier
              ? {
                code_verifier:
                  request.codeVerifier,
              }
              : undefined,
        },

        discovery,
      )
        .then(tokenResult => {
          handleBackendKeycloakLogin(
            tokenResult.accessToken,
          );
        })
        .catch(() => {
          setLoading(false);

          Alert.alert(
            'Auth Error',
            'Failed to exchange token with Keycloak',
          );
        });
    } else if (response?.type === 'error') {
      Alert.alert(
        'Error',
        'Google login failed or was cancelled',
      );
    }
  }, [response, discovery, request]);

  /*
   * KEYCLOAK -> BACKEND LOGIN
   */

  const handleBackendKeycloakLogin = async (
    accessToken: string,
  ) => {
    setLoading(true);

    try {
      const result =
        await keycloakLogin(accessToken);

      if (
        result.message &&
        result.message.includes(
          'Login Successful',
        ) &&
        result.response
      ) {
        const userData: UserData = {
          name: result.response.name,

          email: result.response.email,

          role:
            result.response.role === 'Farmer' ||
              result.response.role === 'FARMER'
              ? 'FARMER'
              : 'USER',

          farmerId:
            result.response.role === 'Farmer' ||
              result.response.role === 'FARMER'
              ? result.response.id
              : undefined,

          userId:
            result.response.role === 'Customer' ||
              result.response.role === 'USER'
              ? result.response.id
              : undefined,

          profilePhoto: undefined,
        };

        await login(userData);
      } else if (
        result.message === 'NEW_USER' &&
        result.response
      ) {
        navigation.navigate(
          'RoleSelection',
          {
            email: result.response.email,
            name: result.response.name,
          },
        );
      } else {
        Alert.alert(
          'Login Failed',
          result.message || 'Login failed',
        );
      }
    } catch (error: any) {
      console.error(error);

      Alert.alert(
        'Error',
        'Unable to login with server: ' +
        (error.message || 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * VALIDATION
   */

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

  /*
   * NORMAL LOGIN
   */

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const result = await newUserLogin(
        identifier.trim(),
        password,
      );

      if (
        result.message &&
        result.message.includes(
          'Login Successful',
        ) &&
        result.response
      ) {
        const userData: UserData = {
          name: result.response.name,

          email: result.response.email,

          role:
            result.response.role === 'Farmer' ||
              result.response.role === 'FARMER'
              ? 'FARMER'
              : 'USER',

          farmerId:
            result.response.role === 'Farmer' ||
              result.response.role === 'FARMER'
              ? result.response.id
              : undefined,

          userId:
            result.response.role === 'Customer' ||
              result.response.role === 'USER'
              ? result.response.id
              : undefined,

          profilePhoto: undefined,
        };

        await login(userData);
      } else {
        Alert.alert(
          'Login Failed',
          result.message ||
          'Invalid credentials',
        );
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        'Unable to connect to server. Please try again.';

      Alert.alert(
        'Error',
        typeof msg === 'string'
          ? msg
          : 'Login failed',
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * GOOGLE LOGIN
   */

  const handleGoogleLogin = async () => {
    if (!request || !discovery) {
      Alert.alert(
        'Error',
        'Authentication not ready. Please wait a moment and try again.',
      );

      return;
    }

    try {
      setGoogleLoading(true);

      await promptAsync();
    } catch (e) {
      console.error(
        'Google login error',
        e,
      );

      Alert.alert(
        'Error',
        'Failed to start Google login',
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  /*
   * UI
   */

  return (
    <ImageBackground
      source={require('../../assets/Tractor.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* HEADER */}

          <View style={styles.header}>

            <View style={styles.logoWrapper}>
              <Image
                source={require('../farm2home_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.welcomeText}>Welcome to</Text>
              <Text style={styles.appName}>Farm2Home!</Text>
            </View>

          <Text style={styles.tagline}>
            Fresh from the farm, straight to
            your home
          </Text>

        </View>

        {/* LOGIN CARD */}

        <View style={styles.formContainer}>

          <Text style={styles.formTitle}>
            Sign In
          </Text>

          <Text style={styles.formSubtitle}>
            Use your Farm2Home Account
          </Text>

          {/* EMAIL / MOBILE */}

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
            leftIcon={<Ionicons name="person-outline" size={20} color="#757575" />}
          />

          {/* PASSWORD */}

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
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#757575" />}
          />

          {/* FORGOT PASSWORD */}

          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                'ForgotPassword',
              )
            }
            style={styles.forgotButton}>

            <Text style={styles.forgotText}>
              Forgot Password?
            </Text>

          </TouchableOpacity>

          {/* SIGN IN + CREATE ACCOUNT */}

          <View style={styles.actionColumn}>

            <CustomButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={{ width: '80%', alignSelf: 'center', backgroundColor: '#C8E6C9', paddingVertical: 12 }}
              textStyle={{ fontSize: 16, color: '#1B5E20', fontWeight: 'bold' }}
            />

            <View style={styles.buttonSpacerVertical} />

            <CustomButton
              title="Create account"
              onPress={() => navigation.navigate('RoleSelection')}
              style={{ width: '80%', alignSelf: 'center', backgroundColor: '#E8F5E9', paddingVertical: 12, borderWidth: 1, borderColor: '#C8E6C9' }}
              textStyle={{ fontSize: 15, color: '#1B5E20', fontWeight: 'bold' }}
            />

          </View>

          {/* OR */}

          <View
            style={
              styles.dividerContainer
            }>

            <View style={styles.divider} />

            <Text style={styles.orText}>
              OR
            </Text>

            <View style={styles.divider} />

          </View>

          {/* GOOGLE LOGIN */}

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={
              googleLoading || !request
            }>

            <Image 
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png' }}
              style={styles.googleIconImage}
              resizeMode="contain"
            />

            <Text
              style={
                styles.googleButtonText
              }>
              {googleLoading
                ? 'Opening Google...'
                : 'Continue with Google'}
            </Text>

          </TouchableOpacity>

        </View>

        </ScrollView>

      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

/*
 * STYLES
 */

const styles = StyleSheet.create({

  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // To ensure readability over the background image
  },

  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    paddingBottom: 60, // Added padding to prevent Google button from getting clipped
  },

  /*
   * HEADER
   */

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logoWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: '#C8E6C9',

    marginBottom: 12,
  },

  logoImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },

  titleContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },

  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#212121',
  },

  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.3,
    marginTop: -4,
  },

  tagline: {
    fontSize: 14,
    color: '#4E7D50',

    marginTop: 4,

    textAlign: 'center',

    fontWeight: '500',
  },

  /*
   * LOGIN CARD
   */

  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    padding: 24,
    paddingTop: 28,
    width: '92%',
    alignSelf: 'center',
    shadowColor: '#000',

    borderWidth: 1,
    borderColor: '#E4E4E4',

    elevation: 3,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.08,

    shadowRadius: 8,
  },

  formTitle: {
    fontSize: 28,

    fontWeight: '700',

    color: '#212121',
  },

  formSubtitle: {
    fontSize: 15,

    color: '#757575',

    marginTop: 3,

    marginBottom: 20,

    fontWeight: '500',
  },

  /*
   * FORGOT PASSWORD
   */

  forgotButton: {
    alignSelf: 'flex-start',

    marginTop: -8,

    marginBottom: 16,
  },

  forgotText: {
    color: '#1B5E20',

    fontSize: 14,

    fontWeight: '600',
  },

  /*
   * ACTION ROW
   */

  actionColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },

  buttonSpacerVertical: {
    height: 12,
  },

  /*
   * DIVIDER
   */

  dividerContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    marginVertical: 22,
  },

  divider: {
    flex: 1,

    height: 1,

    backgroundColor: '#DDDDDD',
  },

  orText: {
    marginHorizontal: 12,

    fontSize: 13,

    color: '#777777',

    fontWeight: '600',
  },

  /*
   * GOOGLE BUTTON
   */

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