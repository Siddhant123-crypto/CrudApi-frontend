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
  Image,
} from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import {useAuth} from '../context/AuthContext';
import {newUserLogin} from '../services/authService';

const NewUserLoginScreen = ({navigation}: any) => {
  const {login} = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validate = () => {
    const newErrors: Record<string, string | null> = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await newUserLogin(email.trim(), password);

      if (result.message && result.message.includes('Login Successful') && result.response) {
        // Prepare userdata with details returned from the unified /newuser/login
        const userData = {
          name: result.response.name,
          email: result.response.email,
          role: (result.response.role === 'Farmer' ? 'FARMER' : 'USER') as 'USER' | 'FARMER',
          farmerId: result.response.role === 'Farmer' ? result.response.id : undefined,
          userId: result.response.role === 'Customer' ? result.response.id : undefined,
          profilePhoto: undefined,
        };
        await login(userData);
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        'Unable to connect to server. Please try again.';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Login failed');
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
          <Image 
            source={require('../farm2home_logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={styles.appName}>Farm2Home</Text>
          <Text style={styles.tagline}>
            Fresh from the farm, straight to your home
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Sign In</Text>
          <Text style={styles.formSubtitle}>Login to your Account</Text>

          <CustomInput
            label="Email Address"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (errors.email) setErrors({...errors, email: null});
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
            error={errors.email}
          />

          <CustomInput
            label="Password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (errors.password) setErrors({...errors, password: null});
            }}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <CustomButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerLabel}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('RoleSelection')}>
              <Text style={styles.registerLink}>Register Here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 12,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#4E7D50',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
    marginBottom: 20,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#1B5E20',
    fontSize: 14,
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerLabel: {
    color: '#757575',
    fontSize: 14,
  },
  registerLink: {
    color: '#1B5E20',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default NewUserLoginScreen;
