import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
export const OrderSkeleton = () => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {[1, 2, 3, 4].map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.header}>
            <Skeleton style={styles.idSkeleton} />
            <Skeleton style={styles.badgeSkeleton} />
          </View>
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Skeleton style={styles.imageSkeleton} />
            <View style={styles.itemInfo}>
              <Skeleton style={styles.textSkeleton} />
              <Skeleton style={styles.textSkeletonSmall} />
            </View>
          </View>
          <View style={styles.footer}>
            <Skeleton style={styles.dateSkeleton} />
            <Skeleton style={styles.priceSkeleton} />
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  },
  badgeSkeleton: {
    width: 70,
    height: 24,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
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
  itemInfo: {
    flex: 1,
  },
  textSkeleton: {
    width: '80%',
    height: 16,
    marginBottom: 8,
  },
  textSkeletonSmall: {
    width: '40%',
    height: 14,
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
  },
  priceSkeleton: {
    width: 80,
    height: 20,
  },
});
