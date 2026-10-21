import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../constants/theme';
import { PrimaryButton, MaroonButton } from './Buttons';

interface StickyCheckoutBarProps {
  label?: string;
  total: number | string;
  buttonTitle: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'orange' | 'maroon';
  style?: StyleProp<ViewStyle>;
}

export const StickyCheckoutBar: React.FC<StickyCheckoutBarProps> = ({
  label = 'Total Amount',
  total,
  buttonTitle,
  onPress,
  loading,
  disabled,
  variant = 'orange',
  style,
}) => {
  const insets = useSafeAreaInsets();
  const formattedTotal = typeof total === 'number'
    ? (total % 1 === 0 ? `₹${Math.round(total)}` : `₹${total.toFixed(2).replace(/\.00$/, '')}`)
    : (typeof total === 'string' && !isNaN(Number(total))
      ? (Number(total) % 1 === 0 ? `₹${Math.round(Number(total))}` : `₹${Number(total).toFixed(2).replace(/\.00$/, '')}`)
      : total);

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom + 10, 26) },
        THEME.shadows.stickyBar,
        style,
      ]}
    >
      <View style={styles.totalInfo}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.totalAmount}>{formattedTotal}</Text>
      </View>

      <View style={styles.buttonWrapper}>
        {variant === 'maroon' ? (
          <MaroonButton
            title={buttonTitle}
            onPress={onPress}
            loading={loading}
            disabled={disabled}
          />
        ) : (
          <PrimaryButton
            title={buttonTitle}
            onPress={onPress}
            loading={loading}
            disabled={disabled}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  totalInfo: {
    flex: 1,
  },
  label: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 2,
  },
  totalAmount: {
    fontFamily: THEME.fonts.bold,
    fontSize: 20,
    color: THEME.colors.textBase,
  },
  buttonWrapper: {
    flex: 1.3,
  },
});

export default StickyCheckoutBar;
