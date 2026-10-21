import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, StyleProp } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { THEME } from '../constants/theme';
import { PrimaryButton } from './ui/Buttons';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onButtonPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  imageUrl?: any;
  style?: StyleProp<ViewStyle>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  buttonText,
  onButtonPress,
  iconName,
  imageUrl,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={imageUrl} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.iconCircle}>
            <Svg width={120} height={120} style={StyleSheet.absoluteFill}>
              <Defs>
                <RadialGradient id="emptyPeachRadial" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={THEME.colors.tileRadialStart} />
                  <Stop offset="65%" stopColor={THEME.colors.tileRadialMiddle} />
                  <Stop offset="100%" stopColor={THEME.colors.tileRadialEnd} />
                </RadialGradient>
              </Defs>
              <Circle cx={60} cy={60} r={58} fill="url(#emptyPeachRadial)" />
            </Svg>
            <Ionicons
              name={iconName || 'basket-outline'}
              size={48}
              color={THEME.colors.accent}
            />
          </View>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.buttonWrapper}>
        <PrimaryButton title={buttonText} onPress={onButtonPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    marginBottom: 20,
  },
  image: {
    width: 180,
    height: 180,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: THEME.fonts.serif,
    fontSize: 20,
    color: THEME.colors.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: THEME.fonts.regular,
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 26,
    lineHeight: 20,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 220,
  },
});

export default EmptyState;
