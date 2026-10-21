import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Image,
  ViewStyle,
  Platform,
} from 'react-native';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { CameraIcon } from './FarmerIcons';

interface FarmerInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  onPressContainer?: () => void;
  isTouchable?: boolean;
}

export const FarmerInput = React.memo(
  React.forwardRef<TextInput, FarmerInputProps>(
    (
      {
        label,
        required,
        error,
        leftIcon,
        rightIcon,
        containerStyle,
        inputStyle,
        onPressContainer,
        isTouchable = false,
        multiline,
        onFocus,
        onBlur,
        ...rest
      },
      ref
    ) => {
      const [isFocused, setIsFocused] = useState(false);

      const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
      };

      const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
      };

      const content = (
        <View
          style={[
            styles.inputBox,
            multiline && styles.multilineBox,
            isFocused && styles.inputFocused,
            !!error && styles.inputError,
            inputStyle,
          ]}
        >
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[styles.textInput, multiline && styles.multilineInput]}
            placeholderTextColor={FARMER_THEME.colors.placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            editable={!isTouchable}
            maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            {...rest}
          />
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      );

      return (
        <View style={[styles.wrapper, containerStyle]}>
          {label ? (
            <View style={styles.labelRow}>
              <Text
                style={styles.label}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {label}
                {required && <Text style={styles.requiredStar}> *</Text>}
              </Text>
            </View>
          ) : null}

          {isTouchable && onPressContainer ? (
            <TouchableOpacity activeOpacity={0.8} onPress={onPressContainer}>
              {content}
            </TouchableOpacity>
          ) : (
            content
          )}

          {error ? (
            <Text
              style={styles.errorText}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {error}
            </Text>
          ) : null}
        </View>
      );
    }
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.label === nextProps.label &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.keyboardType === nextProps.keyboardType &&
      prevProps.editable === nextProps.editable &&
      prevProps.multiline === nextProps.multiline &&
      prevProps.isTouchable === nextProps.isTouchable &&
      prevProps.required === nextProps.required &&
      prevProps.rightIcon === nextProps.rightIcon &&
      prevProps.leftIcon === nextProps.leftIcon
    );
  }
);

interface ImageUploadTileProps {
  label?: string;
  imageUri?: string | null;
  onPress: () => void;
  style?: ViewStyle;
  sublabel?: string;
}

export const FarmerImageUploadTile: React.FC<ImageUploadTileProps> = React.memo(
  ({
    label = 'Upload Image',
    imageUri,
    onPress,
    style,
    sublabel = 'Tap to select photo from gallery',
  }) => {
    return (
      <View style={[styles.uploadWrapper, style]}>
        {label ? (
          <Text
            style={styles.label}
            maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
          >
            {label}
          </Text>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={styles.uploadBox}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
          ) : (
            <View style={styles.placeholderBox}>
              <View style={styles.cameraIconCircle}>
                <CameraIcon size={24} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2} />
              </View>
              <Text
                style={styles.uploadTitle}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {label}
              </Text>
              <Text
                style={styles.uploadSubtitle}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                {sublabel}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  },
  (prev, next) => prev.imageUri === next.imageUri && prev.label === next.label && prev.sublabel === next.sublabel
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  label: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 13,
    color: FARMER_THEME.colors.headings,
  },
  requiredStar: {
    color: '#D9651B',
    fontFamily: FARMER_THEME.fonts.bold,
  },
  inputBox: {
    minHeight: 54,
    borderRadius: FARMER_THEME.radius.inputs,
    borderWidth: 1.5,
    borderColor: FARMER_THEME.colors.inputBorder,
    backgroundColor: FARMER_THEME.colors.inputBg,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  multilineBox: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputFocused: {
    borderColor: FARMER_THEME.colors.inputFocusBorder,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(42,149,96,0.18)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {},
    }),
  },
  inputError: {
    borderColor: FARMER_THEME.colors.error,
  },
  textInput: {
    flex: 1,
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 15,
    color: FARMER_THEME.colors.textDark,
    paddingVertical: 8,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  leftIconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 12,
    color: FARMER_THEME.colors.error,
    marginTop: 5,
    marginLeft: 4,
  },
  uploadWrapper: {
    marginBottom: 18,
  },
  uploadBox: {
    height: 150,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: FARMER_THEME.colors.uploadTileBorder,
    borderStyle: 'dashed',
    backgroundColor: FARMER_THEME.colors.uploadTileBg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cameraIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...FARMER_THEME.shadows.tile,
  },
  uploadTitle: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 14,
    color: FARMER_THEME.colors.headings,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 12,
    color: FARMER_THEME.colors.textSecondary,
    textAlign: 'center',
  },
});

export default FarmerInput;
