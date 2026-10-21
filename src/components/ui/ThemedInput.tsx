import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { THEME } from '../../constants/theme';

interface ThemedInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const ThemedInput: React.FC<ThemedInputProps> = ({
  label,
  required,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  multiline,
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredStar}> *</Text>}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          multiline && styles.multilineContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}

        <TextInput
          style={[styles.input, multiline && styles.multilineInput, style]}
          placeholderTextColor={THEME.colors.placeholder}
          multiline={multiline}
          onFocus={e => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon ? <View style={styles.rightIconWrapper}>{rightIcon}</View> : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 13,
    color: THEME.colors.textHeading,
  },
  requiredStar: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#D9651B',
  },
  inputContainer: {
    height: 54,
    borderRadius: THEME.radius.inputs,
    borderWidth: 1.5,
    borderColor: THEME.colors.inputBorder,
    backgroundColor: THEME.colors.inputBg,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  multilineContainer: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: THEME.fonts.medium,
    fontSize: 15,
    color: THEME.colors.textBase,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  leftIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: THEME.colors.inputBorderFocused,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(224,123,57,1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  errorText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default ThemedInput;
