import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GOOGLE_PASSWORD_HELPER_TEXT } from '../utils/googleAuthUtils';

export { GOOGLE_PASSWORD_HELPER_TEXT };

interface Props {
  isGoogleSignUp?: boolean;
}

export const GoogleRegistrationPasswordHelper: React.FC<Props> = ({ isGoogleSignUp }) => {
  if (!isGoogleSignUp) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.helperText}>{GOOGLE_PASSWORD_HELPER_TEXT}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  helperText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: '#D9651B',
  },
});
