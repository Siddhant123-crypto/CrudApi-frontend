import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import {forgotPassword} from '../services/authService';

const ForgotPasswordScreen = ({navigation}: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!password.trim()) {
      newErrors.password = 'New password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await forgotPassword(
        email.trim(),
        password,
        confirmPassword,
      );
      Alert.alert('Success', result || 'Password reset successfully!', [
        {text: 'OK', onPress: () => navigation.navigate('Login')},
      ]);
    } catch (error) {
      const msg =
        (error as any).response?.data || 'Failed to reset password. Please try again.';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Reset failed');
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
        <View style={styles.header}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email and set a new password
          </Text>
        </View>

        <View style={styles.formContainer}>
          <CustomInput
            label="Email"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (errors.email) setErrors({...errors, email: null});
            }}
            placeholder="Enter your registered email"
            keyboardType="email-address"
            error={errors.email}
          />

          <CustomInput
            label="New Password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (errors.password) setErrors({...errors, password: null});
            }}
            placeholder="Enter new password"
            secureTextEntry
            error={errors.password}
          />

          <CustomInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              if (errors.confirmPassword)
                setErrors({...errors, confirmPassword: null});
            }}
            placeholder="Confirm new password"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <CustomButton
            title="Reset Password"
            onPress={handleResetPassword}
            loading={loading}
            style={{marginTop: 16}}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Text style={styles.backText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 6,
    textAlign: 'center',
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
  backButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
  backText: {
    color: '#1B5E20',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
