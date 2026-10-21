import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';

export interface AdminInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  onPress?: () => void; // for select/date picker triggers
}

export const AdminInput = React.memo(
  React.forwardRef<TextInput, AdminInputProps>(
    (
      {
        label,
        required = false,
        error,
        leftIcon,
        rightIcon,
        containerStyle,
        inputStyle,
        onPress,
        multiline,
        onFocus,
        onBlur,
        ...props
      },
      ref
    ) => {
      const [isFocused, setIsFocused] = useState(false);
      const handleFocus = (e: any) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
      };

      const handleBlur = (e: any) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
      };

      const containerBorderColor = error
        ? ADMIN_THEME.colors.inputErrorBorder
        : isFocused
        ? ADMIN_THEME.colors.inputFocusedBorder
        : ADMIN_THEME.colors.inputBorder;

      const content = (
        <View
          style={[
            styles.inputContainer,
            multiline ? styles.multilineContainer : styles.singleLineContainer,
            { borderColor: containerBorderColor },
            isFocused && styles.focusedShadow,
          ]}
        >
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.textInput,
              multiline ? styles.multilineInput : styles.singleLineInput,
              inputStyle,
            ]}
            placeholderTextColor={ADMIN_THEME.colors.placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline={multiline}
            scrollEnabled={multiline ? true : undefined}
            editable={onPress ? false : props.editable}
            pointerEvents={onPress ? 'none' : 'auto'}
            {...props}
          />
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      );

      return (
        <View style={[styles.wrapper, containerStyle]}>
          {label && (
            <Text style={styles.label}>
              {label}
              {required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
          )}

          {onPress ? (
            <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
              {content}
            </TouchableOpacity>
          ) : (
            content
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      );
    }
  )
);

AdminInput.displayName = 'AdminInput';
export default AdminInput;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 13,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 6,
  },
  requiredStar: {
    color: ADMIN_THEME.colors.statusError,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderRadius: ADMIN_THEME.radius.input,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: 'row',
  },
  singleLineContainer: {
    height: 54,
    alignItems: 'center',
  },
  multilineContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 12,
  },
  focusedShadow: {
    backgroundColor: '#FFFFFF',
  },
  leftIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontFamily: AdminFonts.regular,
    fontSize: 14,
    color: ADMIN_THEME.colors.ink,
    paddingVertical: 0,
  },
  singleLineInput: {
    height: '100%',
    textAlignVertical: 'center',
  },
  multilineInput: {
    height: 96,
    textAlignVertical: 'top',
  },
  errorText: {
    marginTop: 4,
    fontFamily: AdminFonts.medium,
    fontSize: 12,
    color: ADMIN_THEME.colors.statusError,
  },
});
