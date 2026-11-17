export const GOOGLE_PASSWORD_HELPER_TEXT =
  'This is not your Google password. Create a new password for Farm2Home.';

export const shouldShowGooglePasswordGuidance = (isGoogleSignUp?: boolean): boolean => {
  return Boolean(isGoogleSignUp);
};

export const validatePasswordPolicy = (password: string): { valid: boolean; message?: string } => {
  if (!password || password.trim().length === 0) {
    return { valid: false, message: 'Password is required' };
  }
  const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).{6,}$/;
  if (!regex.test(password)) {
    return {
      valid: false,
      message: 'Password must contain uppercase, lowercase, number and special character, min 6 characters',
    };
  }
  return { valid: true };
};

export const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return Boolean(password && confirmPassword && password === confirmPassword);
};
