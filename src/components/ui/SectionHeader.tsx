import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { THEME } from '../../constants/theme';
import { ArrowRightIcon } from '../CustomerIcons';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText,
  onPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {actionText && onPress ? (
        <TouchableOpacity
          style={styles.link}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>{actionText}</Text>
          <ArrowRightIcon size={14} color={THEME.colors.accent} strokeWidth={2.4} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.sectionGap,
    marginBottom: 14,
  },
  title: {
    fontFamily: THEME.fonts.serif,
    fontSize: 22,
    color: THEME.colors.textHeading,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  linkText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.accent,
  },
});

export default SectionHeader;
