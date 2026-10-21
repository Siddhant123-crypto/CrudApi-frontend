import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { resetPassword } from '../services/authService';

const parseTokenFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  try {
    const queryPart = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(queryPart);
    const token = params.get('token');
    if (token) return token.trim();
  } catch {
    // fallback
  }
  const match = url.match(/[?&]token=([^&]+)/);
  return match ? decodeURIComponent(match[1]).trim() : null;
};

const ResetPasswordScreen = ({ navigation, route }: any) => {
  const initialToken = route?.params?.token || '';
  const initialEmail = route?.params?.email || '';

  const [token, setToken] = useState<string>(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    newPassword?: string | null;
    confirmPassword?: string | null;
    token?: string | null;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Deep Link listener (cold start & warm start)
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const extracted = parseTokenFromUrl(url);
      if (extracted) {
        setToken(extracted);
      }
    });

    const subscription = Linking.addEventListener('url', (event) => {
      const extracted = parseTokenFromUrl(event.url);
      if (extracted) {
        setToken(extracted);
        setServerError(null);
        setIsTokenExpired(false);
      }
    });

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 110, animated: true });
        }, 60);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      subscription.remove();
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (route?.params?.token) {
      setToken(route.params.token.trim());
    }
  }, [route?.params?.token]);

  // Criteria calculations for UI chips & strength meter
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const criteriaCount =
    (hasMinLength ? 1 : 0) +
    (hasUppercase ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSymbol ? 1 : 0);

  const getStrengthInfo = () => {
    if (!newPassword) return { label: '', color: '#E0E8E1', activeBars: 0 };
    if (criteriaCount <= 1)
      return { label: 'Weak', color: '#D32F2F', activeBars: 1 };
    if (criteriaCount === 2)
      return { label: 'Fair', color: '#E68A00', activeBars: 2 };
    if (criteriaCount === 3)
      return { label: 'Good', color: '#2A7A40', activeBars: 3 };
    return { label: 'Strong', color: '#165B31', activeBars: 4 };
  };

  const strengthInfo = getStrengthInfo();

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const cleanToken = token.trim();

    if (!cleanToken) {
      newErrors.token = 'Reset token is missing. Please open the link from your email.';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setServerError(null);
    setIsTokenExpired(false);

    const cleanToken = token.trim();

    try {
      await resetPassword(cleanToken, newPassword);
      setIsSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setToken('');
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;

      if (err?.code === 'ERR_NETWORK' || !err?.response) {
        setServerError(
          'Unable to reach server. Please check your internet connection and try again.',
        );
      } else if (typeof backendMessage === 'string' && backendMessage.trim()) {
        setServerError(backendMessage);
        if (
          backendMessage.toLowerCase().includes('invalid') ||
          backendMessage.toLowerCase().includes('expired')
        ) {
          setIsTokenExpired(true);
        }
      } else {
        setServerError('Password reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardVisible && styles.scrollContentKeyboardOpen,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Forest Green Curved Section */}
        <View style={styles.topCurvedSection}>
          {/* Top Bar with back chevron < and FARM2HOME title */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#FFFFFF"
                style={{ marginRight: 2 }}
              />
            </TouchableOpacity>

            <Text style={styles.brandTitle}>F A R M 2 H O M E</Text>

            <View style={styles.topRightPlaceholder} />
          </View>

          {/* Hero Lock Icon - Hides when keyboard opens so form slides right up */}
          {!keyboardVisible && (
            <View style={styles.heroOuterCircle}>
              <Ionicons name="lock-closed-outline" size={32} color="#A8E6BE" />
            </View>
          )}

          {/* Titles */}
          <Text style={styles.headerTitle}>Create new password</Text>
          <Text style={styles.headerSubtitle}>
            Choose a secure password for your{'\n'}Farm2Home account.
          </Text>
        </View>

        {!isSuccess ? (
          /* Form Section */
          <View style={styles.formContainer}>
            {/* Error Banner */}
            {serverError || errors.token ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color="#D32F2F"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorBannerText}>
                    {serverError || errors.token}
                  </Text>
                  {(isTokenExpired || !token.trim()) && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ForgotPassword')}
                      style={{ marginTop: 6 }}
                    >
                      <Text style={styles.requestNewTokenLink}>
                        Request a fresh reset link →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : null}

            {/* Floating White Card */}
            <View style={styles.card}>
              {/* If token is missing, show optional input */}
              {!token.trim() && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>Reset token (from email)</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      !!errors.token && styles.inputWrapperError,
                    ]}
                  >
                    <Ionicons
                      name="key-outline"
                      size={19}
                      color="#165B31"
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={token}
                      onChangeText={(text) => {
                        setToken(text);
                        if (errors.token) setErrors({ ...errors, token: null });
                        if (serverError) setServerError(null);
                      }}
                      placeholder="Paste reset token from email"
                      placeholderTextColor="#8A9E8E"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              )}

              {/* New Password */}
              <Text style={styles.inputLabel}>New password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  !!errors.newPassword && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#165B31"
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: null });
                    }
                    if (serverError) setServerError(null);
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#8A9E8E"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="reset_password_new_input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7F72"
                  />
                </TouchableOpacity>
              </View>

              {errors.newPassword ? (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              ) : null}

              {/* Strength Meter Bars & Label */}
              <View style={styles.strengthRow}>
                <View style={styles.strengthBarsContainer}>
                  {[1, 2, 3, 4].map((barIndex) => (
                    <View
                      key={barIndex}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            barIndex <= strengthInfo.activeBars
                              ? strengthInfo.color
                              : '#E2EBE2',
                        },
                      ]}
                    />
                  ))}
                </View>
                {strengthInfo.label ? (
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: strengthInfo.color },
                    ]}
                  >
                    {strengthInfo.label}
                  </Text>
                ) : (
                  <Text style={styles.strengthLabelEmpty}>Strong</Text>
                )}
              </View>

              {/* Requirement Badges / Chips */}
              <View style={styles.chipsWrap}>
                <View
                  style={[
                    styles.chip,
                    hasMinLength ? styles.chipActive : styles.chipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      hasMinLength
                        ? styles.chipTextActive
                        : styles.chipTextInactive,
                    ]}
                  >
                    {hasMinLength ? '✓' : '○'} 8+ characters
                  </Text>
                </View>

                <View
                  style={[
                    styles.chip,
                    hasUppercase ? styles.chipActive : styles.chipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      hasUppercase
                        ? styles.chipTextActive
                        : styles.chipTextInactive,
                    ]}
                  >
                    {hasUppercase ? '✓' : '○'} Uppercase
                  </Text>
                </View>

                <View
                  style={[
                    styles.chip,
                    hasNumber ? styles.chipActive : styles.chipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      hasNumber ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {hasNumber ? '✓' : '○'} Number
                  </Text>
                </View>

                <View
                  style={[
                    styles.chip,
                    hasSymbol ? styles.chipActive : styles.chipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      hasSymbol ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {hasSymbol ? '✓' : '○'} Symbol
                  </Text>
                </View>
              </View>

              {/* Confirm Password */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                Confirm password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  !!errors.confirmPassword && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#165B31"
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: null });
                    }
                    if (serverError) setServerError(null);
                  }}
                  placeholder="Re-enter your new password"
                  placeholderTextColor="#8A9E8E"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="reset_password_confirm_input"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
                    }
                    size={20}
                    color="#6B7F72"
                  />
                </TouchableOpacity>
              </View>

              {errors.confirmPassword ? (
                <Text style={styles.errorText}>
                  {errors.confirmPassword}
                </Text>
              ) : null}

              {/* Reset Password Button */}
              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={loading}
                style={[
                  styles.resetButton,
                  loading && styles.resetButtonDisabled,
                ]}
                activeOpacity={0.85}
                testID="reset_password_submit_button"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.resetButtonText}>Reset password</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Back to Sign In */}
            <TouchableOpacity
              onPress={() => navigation.navigate('NewUserLogin')}
              style={styles.backToSignInButton}
              activeOpacity={0.7}
            >
              <Text style={styles.backToSignInText}>← Back to sign in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Success View */
          <View style={styles.formContainer}>
            <View style={styles.card}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={54} color="#165B31" />
              </View>
              <Text style={styles.successHeading}>
                Password Reset Successful!
              </Text>
              <Text style={styles.successSubtitle}>
                Your password has been securely updated. You can now sign in to
                Farm2Home with your new credentials.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('NewUserLogin')}
                style={styles.resetButton}
                activeOpacity={0.85}
              >
                <Text style={styles.resetButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F1',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  scrollContentKeyboardOpen: {
    paddingBottom: 280,
  },
  topCurvedSection: {
    backgroundColor: '#165B31',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingTop: Platform.OS === 'ios' ? 54 : 46,
    paddingBottom: 48,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#9FE5B5',
    letterSpacing: 3,
  },
  topRightPlaceholder: {
    width: 44,
  },
  heroOuterCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: '#D4EBD9',
    textAlign: 'center',
    lineHeight: 19.5,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: -26,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EFE8',
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A3320',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.2,
    borderColor: '#DCE5DC',
    borderRadius: 14,
    backgroundColor: '#FCFEFB',
    paddingHorizontal: 14,
  },
  inputWrapperError: {
    borderColor: '#D32F2F',
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1A3320',
  },
  eyeButton: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 6,
    marginLeft: 4,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 14,
  },
  strengthBarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4.5,
    borderRadius: 3,
    marginRight: 6,
  },
  strengthLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  strengthLabelEmpty: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#90A395',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  chipActive: {
    backgroundColor: '#E1F5E8',
  },
  chipInactive: {
    backgroundColor: '#F0F4F0',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#165B31',
  },
  chipTextInactive: {
    color: '#7C8E81',
  },
  resetButton: {
    height: 52,
    backgroundColor: '#165B31',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    elevation: 3,
    shadowColor: '#165B31',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  backToSignInButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  backToSignInText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#165B31',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  errorBannerText: {
    fontSize: 13.5,
    color: '#B71C1C',
    lineHeight: 19,
    fontWeight: '600',
  },
  requestNewTokenLink: {
    fontSize: 13,
    color: '#165B31',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  successIconCircle: {
    alignItems: 'center',
    marginBottom: 14,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#165B31',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13.5,
    color: '#4B6350',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
});

export default ResetPasswordScreen;
