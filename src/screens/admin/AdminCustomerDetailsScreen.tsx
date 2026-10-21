import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import api, { BASE_URL } from '../../services/api';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminCard,
  AdminBadge,
  UserIcon,
  MailIcon,
  PhoneIcon,
  LocationIcon,
} from '../../components/admin';

export const AdminCustomerDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const { customerId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    } else {
      setLoading(false);
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const [customerRes, statsRes, ordersRes] = await Promise.all([
        api.get(`/admin/customers/${customerId}`),
        api.get(`/admin/customers/${customerId}/statistics`),
        api.get(`/admin/customers/${customerId}/orders`),
      ]);
      if (customerRes.data?.data) setCustomer(customerRes.data.data);
      if (statsRes.data?.data) setStatistics(statsRes.data.data);
      if (ordersRes.data?.data) setOrders(ordersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileImage = () => {
    if (customer?.profilePhoto) {
      if (customer.profilePhoto.startsWith('http')) {
        return customer.profilePhoto;
      }
      return `${BASE_URL}/user/image/${customer.profilePhoto}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(customer?.name || 'Unknown')}&background=E8EBFF&color=4F5BD5&size=150&bold=true`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>
          Order #{item.orderNumber ? item.orderNumber.slice(-6).toUpperCase() : 'N/A'}
        </Text>
        <AdminBadge status={item.orderStatus} />
      </View>
      <View style={styles.orderBottomRow}>
        <Text style={styles.orderAmount}>Total: {formatCurrency(item.totalAmount)}</Text>
        <Text style={styles.orderDate}>{new Date(item.orderDate).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title="Customer Details" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={ADMIN_THEME.colors.indigo} />
        </View>
      </AdminPageBackground>
    );
  }

  if (!customer) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title="Customer Details" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Customer not found.</Text>
        </View>
      </AdminPageBackground>
    );
  }

  const statusText =
    customer.status === 'ACTIVE'
      ? 'Active'
      : customer.status === 'BLOCKED'
      ? 'Blocked'
      : 'Inactive';

  return (
    <AdminPageBackground>
      <AdminHeader variant="inner" title="Customer Details" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1) PROFILE ADMIN CARD (72px avatar, 3px white ring, shadow, Fraunces 22 name) */}
        <AdminCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: getProfileImage() }} style={styles.profileImage} />
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerEmail}>{customer.email || 'No email registered'}</Text>

          <View style={styles.statusBadgeWrapper}>
            <AdminBadge status={statusText} />
          </View>
        </AdminCard>

        {/* 2) FULL INFORMATION */}
        <AdminCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Full Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <UserIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{customer.name || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MailIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{customer.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <PhoneIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Mobile No.</Text>
              <Text style={styles.infoValue}>{customer.mobile || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <LocationIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{customer.address || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <LocationIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>State & Village</Text>
              <Text style={styles.infoValue}>
                {[customer.village, customer.state].filter(Boolean).join(', ') || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRowLast}>
            <View style={styles.infoIconBox}>
              <LocationIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Postal Code</Text>
              <Text style={styles.infoValue}>{customer.postalCode || 'N/A'}</Text>
            </View>
          </View>
        </AdminCard>

        {/* 3) CUSTOMER ACTIVITY STATS */}
        {statistics && (
          <AdminCard style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Customer Activity</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{statistics.totalOrders || 0}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatCurrency(statistics.totalSpent || 0)}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{statistics.deliveredOrders || 0}</Text>
                <Text style={styles.statLabel}>Delivered</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{statistics.cancelledOrders || 0}</Text>
                <Text style={styles.statLabel}>Cancelled</Text>
              </View>
            </View>
          </AdminCard>
        )}

        {/* 4) ORDER HISTORY */}
        <AdminCard style={styles.ordersCard}>
          <Text style={styles.sectionTitle}>Order History</Text>
          {orders.length > 0 ? (
            orders.map((order) => (
              <React.Fragment key={order.orderId}>
                {renderOrderItem({ item: order })}
              </React.Fragment>
            ))
          ) : (
            <Text style={styles.emptyTextSmall}>No orders yet.</Text>
          )}
        </AdminCard>
      </ScrollView>
    </AdminPageBackground>
  );
};

export default AdminCustomerDetailsScreen;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: AdminFonts.medium,
    color: ADMIN_THEME.colors.textSecondary,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: ADMIN_THEME.colors.indigoTint,
    ...ADMIN_THEME.shadows.card,
    marginBottom: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  customerName: {
    fontFamily: AdminFonts.heading,
    fontSize: 22,
    color: ADMIN_THEME.colors.ink,
    textAlign: 'center',
  },
  customerEmail: {
    marginTop: 3,
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
    textAlign: 'center',
  },
  statusBadgeWrapper: {
    marginTop: 12,
  },

  // Info Card
  infoCard: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: AdminFonts.heading,
    fontSize: 18,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_THEME.colors.divider,
  },
  infoRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ADMIN_THEME.colors.indigoTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: AdminFonts.regular,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
  },

  // Stats Card
  statsCard: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderRadius: ADMIN_THEME.radius.input,
    padding: 14,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: AdminFonts.heading,
    fontSize: 20,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: AdminFonts.medium,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.textSecondary,
    textAlign: 'center',
  },

  // Orders Card
  ordersCard: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    fontFamily: AdminFonts.bold,
    fontSize: 13,
    color: ADMIN_THEME.colors.ink,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderAmount: {
    fontFamily: AdminFonts.bold,
    fontSize: 13,
    color: ADMIN_THEME.colors.ink,
  },
  orderDate: {
    fontFamily: AdminFonts.regular,
    fontSize: 11,
    color: ADMIN_THEME.colors.muted,
  },
  emptyTextSmall: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
    marginVertical: 10,
  },
});
