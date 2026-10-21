import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { ArrowRightIcon } from './AdminIcons';
import { AdminBadge } from './StatusBadge';

export interface AdminListRowProps {
  title: string;
  subtitle?: string;
  metaText?: string;
  avatarText?: string;
  avatarUri?: string;
  icon?: React.ReactNode;
  badgeStatus?: string;
  badgeLabel?: string;
  trailingValue?: string;
  showChevron?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AdminListRow: React.FC<AdminListRowProps> = ({
  title,
  subtitle,
  metaText,
  avatarText,
  avatarUri,
  icon,
  badgeStatus,
  badgeLabel,
  trailingValue,
  showChevron = true,
  onPress,
  rightElement,
  style,
}) => {
  const renderLeftMedia = () => {
    if (avatarUri) {
      return (
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        </View>
      );
    }

    if (avatarText) {
      return (
        <View style={styles.initialsCircle}>
          <Text style={styles.initialsText} numberOfLines={1}>
            {avatarText.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      );
    }

    if (icon) {
      return (
        <LinearGradient
          colors={ADMIN_THEME.colors.navyGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.iconTile}
        >
          {icon}
        </LinearGradient>
      );
    }

    return null;
  };

  const content = (
    <View style={[styles.card, style]}>
      {renderLeftMedia()}

      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {metaText ? (
          <Text style={styles.metaText} numberOfLines={1}>
            {metaText}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {trailingValue ? (
          <Text style={styles.trailingValue} numberOfLines={1}>
            {trailingValue}
          </Text>
        ) : null}

        {badgeStatus ? (
          <AdminBadge status={badgeLabel || badgeStatus} style={styles.badge} />
        ) : null}

        {rightElement}

        {showChevron && !rightElement && !trailingValue && !badgeStatus ? (
          <ArrowRightIcon size={16} color={ADMIN_THEME.colors.muted} strokeWidth={2} />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ADMIN_THEME.colors.card,
    borderRadius: ADMIN_THEME.radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...ADMIN_THEME.shadows.card,
  },
  avatarWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: ADMIN_THEME.colors.indigoTint,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initialsCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ADMIN_THEME.colors.indigoTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontFamily: AdminFonts.bold,
    fontSize: 16,
    color: ADMIN_THEME.colors.indigo,
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middle: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  title: {
    fontFamily: AdminFonts.bold,
    fontSize: 14.5,
    color: ADMIN_THEME.colors.ink,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: AdminFonts.regular,
    fontSize: 12.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
  metaText: {
    marginTop: 2,
    fontFamily: AdminFonts.medium,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.muted,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  trailingValue: {
    fontFamily: AdminFonts.bold,
    fontSize: 15.5,
    color: ADMIN_THEME.colors.ink,
  },
  badge: {
    marginTop: 4,
  },
});
