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
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { forgotPassword } from '../services/authService';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
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
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setError('Please enter your email address');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSendResetLink = async () => {
    if (loading) return;
    if (!validateEmail(email)) return;

    setLoading(true);
    setError(null);

    const targetEmail = email.trim();

    try {
      await forgotPassword(targetEmail);
      setSubmittedEmail(targetEmail);
      setSuccess(true);
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;

      if (err?.code === 'ERR_NETWORK' || !err?.response) {
        setError(
          'Unable to reach server. Please check your internet connection and try again.',
        );
      } else if (typeof backendMessage === 'string' && backendMessage.trim()) {
        setError(backendMessage);
      } else {
        setError('Failed to send reset link. Please try again.');
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
      {/* Background Decorative Soft Green Shape */}
      <View style={styles.topDecorativeCircle} pointerEvents="none" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardVisible && styles.scrollContentKeyboardOpen,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#184D2B" style={{ marginRight: 2 }} />
          </TouchableOpacity>

          {/* Farm2Home Brand */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandFarm}>
              Farm<Text style={styles.brandTwo}>2</Text>Home
            </Text>
          </View>

          <View style={styles.topRightPlaceholder} />
        </View>

        {!success ? (
          /* Main Input View */
          <View style={styles.centerContainer}>
            {/* Concentric Mail Hero Graphic - hides when typing so form moves completely up */}
            {!keyboardVisible && (
              <View style={styles.heroOuterCircle}>
                <View style={styles.heroInnerCircle}>
                  <Ionicons name="mail-outline" size={36} color="#184D2B" />
                </View>
              </View>
            )}

            {/* Title & Translated Subtitle */}
            <Text style={styles.heading}>Forgot password?</Text>
            <Text style={styles.subheading}>
              No worries. Enter your registered email, and we will send you a
              secure link to reset your password.
            </Text>

            {/* Floating Form Card */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Registered email</Text>

              <View
                style={[
                  styles.inputWrapper,
                  !!error && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#2A7340"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor="#8A9E8E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="forgot_password_email_input"
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Primary Action Button */}
              <TouchableOpacity
                onPress={handleSendResetLink}
                disabled={loading}
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                activeOpacity={0.85}
                testID="send_reset_link_button"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.submitButtonText}>Send reset link</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#FFFFFF"
                      style={{ marginLeft: 6 }}
                    />
                  </View>
                )}
              </TouchableOpacity>

              {/* Expiry Note */}
              <View style={styles.expiryNoteRow}>
                <Ionicons
                  name="shield-outline"
                  size={13.5}
                  color="#4A6E53"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.expiryNoteText}>
                  Link will remain valid for 15 minutes
                </Text>
              </View>
            </View>

            {/* Back to Sign In Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('NewUserLogin')}
              style={styles.backToSignInButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={14}
                color="#184D2B"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.backToSignInText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Success View */
          <View style={styles.centerContainer}>
            <View style={styles.heroOuterCircle}>
              <View style={styles.heroInnerCircle}>
                <Ionicons name="checkmark-circle" size={42} color="#18532D" />
              </View>
            </View>

            <Text style={styles.heading}>Email Sent Successfully!</Text>
            <Text style={styles.subheading}>
              A secure password reset link has been sent to{' '}
              <Text style={styles.boldEmail}>{submittedEmail}</Text>. Please open
              your email and tap the link to reset your password.
            </Text>

            <View style={styles.card}>
              <TouchableOpacity
                onPress={() => navigation.navigate('NewUserLogin')}
                style={styles.submitButton}
                activeOpacity={0.85}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.submitButtonText}>Back to Sign In</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginLeft: 6 }}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.expiryNoteRow}>
                <Ionicons
                  name="shield-outline"
                  size={13.5}
                  color="#4A6E53"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.expiryNoteText}>
                  Link will remain valid for 15 minutes
                </Text>
              </View>
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
  topDecorativeCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#E2EBE0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingBottom: 30,
  },
  scrollContentKeyboardOpen: {
    paddingBottom: 280,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandFarm: {
    fontSize: 21,
    fontWeight: '800',
    color: '#134626',
    letterSpacing: -0.2,
  },
  brandTwo: {
    color: '#D48B28',
    fontWeight: '900',
  },
  topRightPlaceholder: {
    width: 44,
  },
  centerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  heroOuterCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#DEE8DA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroInnerCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  heading: {
    fontSize: 27,
    fontWeight: '800',
    color: '#134626',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#4B6350',
    textAlign: 'center',
    lineHeight: 20.5,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  boldEmail: {
    fontWeight: '700',
    color: '#134626',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF2EC',
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
    height: 52,
    borderWidth: 1.2,
    borderColor: '#DCE5DC',
    borderRadius: 14,
    backgroundColor: '#FCFEFB',
    paddingHorizontal: 14,
  },
  inputWrapperError: {
    borderColor: '#D32F2F',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1A3320',
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    height: 52,
    backgroundColor: '#18532D',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#18532D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  expiryNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  expiryNoteText: {
    fontSize: 12,
    color: '#4A6E53',
    fontWeight: '500',
  },
  backToSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backToSignInText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#134626',
  },
  tryAgainButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  tryAgainText: {
    fontSize: 13,
    color: '#4B6350',
  },
  tryAgainHighlight: {
    color: '#134626',
    fontWeight: '700',
  },
});

export default ForgotPasswordScreen;
