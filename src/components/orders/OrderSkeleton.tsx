import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { THEME } from '../../constants/theme';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface OrderSkeletonProps {
  variant?: 'default' | 'customer' | 'farmer' | 'admin';
}

export const OrderSkeleton: React.FC<OrderSkeletonProps> = ({ variant = 'default' }) => {
  const isCustomer = variant === 'customer';
  const isFarmer = variant === 'farmer';
  const isAdmin = variant === 'admin';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        isCustomer && styles.customerContainer,
        isFarmer && styles.farmerContainer,
        isAdmin && styles.adminContainer,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {[1, 2, 3, 4].map((key) => (
        <View
          key={key}
          style={[
            styles.card,
            isCustomer && styles.customerCard,
            isFarmer && styles.farmerCard,
            isAdmin && styles.adminCard,
          ]}
        >
          <View style={styles.header}>
            <Skeleton variant={variant} style={styles.idSkeleton} />
            <Skeleton variant={variant} style={styles.badgeSkeleton} />
          </View>
          <View
            style={[
              styles.divider,
              isCustomer && styles.customerDivider,
              isFarmer && styles.farmerDivider,
            ]}
          />
          <View style={styles.itemRow}>
            <Skeleton
              variant={variant}
              style={[
                styles.imageSkeleton,
                isCustomer && styles.customerImageSkeleton,
                isFarmer && styles.farmerImageSkeleton,
              ]}
            />
            <View style={styles.itemInfo}>
              <Skeleton variant={variant} style={styles.textSkeleton} />
              <Skeleton variant={variant} style={styles.textSkeletonSmall} />
            </View>
          </View>
          <View style={styles.footer}>
            <Skeleton variant={variant} style={styles.dateSkeleton} />
            <Skeleton variant={variant} style={styles.priceSkeleton} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  customerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customerCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.cards,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    ...THEME.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idSkeleton: {
    width: 100,
    height: 16,
    borderRadius: 6,
  },
  badgeSkeleton: {
    width: 70,
    height: 24,
    borderRadius: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  customerDivider: {
    backgroundColor: THEME.colors.divider,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  customerImageSkeleton: {
    width: 58,
    height: 58,
    borderRadius: 14,
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  textSkeleton: {
    width: '80%',
    height: 16,
    marginBottom: 8,
    borderRadius: 6,
  },
  textSkeletonSmall: {
    width: '40%',
    height: 14,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateSkeleton: {
    width: 120,
    height: 14,
    borderRadius: 6,
  },
  priceSkeleton: {
    width: 80,
    height: 20,
    borderRadius: 6,
  },
  farmerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 130,
  },
  farmerCard: {
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    ...FARMER_THEME.shadows.card,
  },
  farmerDivider: {
    backgroundColor: FARMER_THEME.colors.divider,
  },
  farmerImageSkeleton: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 12,
  },
  adminContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3E7F2',
    shadowColor: 'rgba(15,25,60,1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 4,
  },
  adminDivider: {
    backgroundColor: '#EEF0F7',
  },
});

