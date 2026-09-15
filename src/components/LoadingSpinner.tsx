import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
interface LoadingSpinnerProps {
  message?: string;
}
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({message = 'Loading...'}) => {
  return (
    <View style={styles.container}>
      <View style={styles.spinnerBox}>
        <ActivityIndicator size="large" color="#1B5E20" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  spinnerBox: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  message: {
    marginTop: 14,
    fontSize: 15,
    color: '#616161',
    fontWeight: '500',
  },
});
export default LoadingSpinner;
