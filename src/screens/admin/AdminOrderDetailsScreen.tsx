import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAdminOrderById } from '../../services/adminService';
import { BASE_URL } from '../../services/api';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminCard,
  AdminBadge,
  AdminEmptyState,
  ShoppingBagIcon,
  LeafIcon,
  UserIcon,
  PhoneIcon,
  LocationIcon,
  CalendarIcon,
} from '../../components/admin';
import { OrderTimeline } from '../../components/orders/OrderTimeline';
import { PaymentStatusBadge } from '../../components/orders/PaymentStatusBadge';

export const AdminOrderDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orderId } = route.params || {};

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await getAdminOrderById(orderId);
      if (res && res.data) {
        setOrder(res.data);
      }
    } catch (error) {
      console.error('Error fetching admin order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title="Order Details" showBackButton={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ADMIN_THEME.colors.indigo} />
        </View>
      </AdminPageBackground>
    );
  }

  if (!order) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title="Order Details" showBackButton={true} />
        <AdminEmptyState
          icon={<ShoppingBagIcon size={44} color={ADMIN_THEME.colors.indigo} strokeWidth={1.8} />}
          title="Order not found"
          subtitle="The requested order could not be located."
        />
      </AdminPageBackground>
    );
  }

  const shortId = `#ORD-${order.orderId?.substring(0, 5).toUpperCase()}`;
  const dateObj = new Date(order.orderDate);
  const dateStr = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' at ' +
      dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : String(order.orderDate || '');

  return (
    <AdminPageBackground>
      {/* 1) INNER HEADER */}
      <AdminHeader variant="inner" title="Order Details" showBackButton={true} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2) ORDER STATUS & TIMELINE CARD */}
        <AdminCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.orderIdText}>{shortId}</Text>
            <AdminBadge status={order.orderStatus} size="medium" />
          </View>

          <View style={styles.dateRow}>
            <CalendarIcon size={14} color="#8A93AB" strokeWidth={1.9} />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          <View style={styles.divider} />

          {/* Timeline: navy/gold dots, pending steps #E3E7F2, completed lines #1F2F6B */}
          <OrderTimeline status={order.orderStatus} variant="admin" />
        </AdminCard>

        {/* 3) CUSTOMER & DELIVERY INFO */}
        <AdminCard style={styles.card}>
          <Text style={styles.cardSectionTitle}>Customer & Delivery</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <UserIcon size={16} color={ADMIN_THEME.colors.indigo} />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{order.customerName || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <PhoneIcon size={16} color={ADMIN_THEME.colors.indigo} />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>{order.customerMobile || 'N/A'}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <View style={[styles.infoIconCircle, { marginTop: 2 }]}>
              <LocationIcon size={16} color={ADMIN_THEME.colors.indigo} />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoValue}>{order.customerAddress || 'N/A'}</Text>
            </View>
          </View>
        </AdminCard>

        {/* 4) PRODUCTS LIST */}
        <AdminCard style={styles.card}>
          <Text style={styles.cardSectionTitle}>Products ({order.items?.length || 0})</Text>

          {order.items?.map((item: any, index: number) => (
            <View
              key={item.productId || index}
              style={[
                styles.productItemRow,
                index !== (order.items?.length || 0) - 1 && styles.productItemBorder,
              ]}
            >
              {/* 56x56 pastel tile radial/gradient #FFFFFF -> #F1F3FA -> #E3E7F2 */}
              <LinearGradient
                colors={['#FFFFFF', '#F1F3FA', '#E3E7F2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.itemImageTile}
              >
                {item.productPhoto ? (
                  <Image
                    source={{
                      uri: item.productPhoto.startsWith('http')
                        ? item.productPhoto
                        : `${BASE_URL}/product/image/${item.productPhoto}`,
                    }}
                    style={styles.itemImage}
                  />
                ) : (
                  <LeafIcon size={24} color={ADMIN_THEME.colors.indigo} />
                )}
              </LinearGradient>

              <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={styles.farmerName}>
                  Farmer: {item.farmerName || 'Unknown'}
                </Text>
                <Text style={styles.productQuantityPrice}>
                  ₹{item.price}/{item.unit || 'unit'} • Qty: {item.quantity}
                </Text>
              </View>

              <View style={styles.subtotalContainer}>
                <Text style={styles.subtotalText}>₹{item.subtotal}</Text>
              </View>
            </View>
          ))}
        </AdminCard>

        {/* 5) PAYMENT SUMMARY */}
        <AdminCard style={styles.card}>
          <Text style={styles.cardSectionTitle}>Payment Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Status</Text>
            <PaymentStatusBadge status={order.paymentStatus} variant="admin" />
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
          </View>
        </AdminCard>
      </ScrollView>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 16,
    fontFamily: AdminFonts.bold,
    color: '#0B1326',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12.5,
    color: '#8A93AB',
    fontFamily: AdminFonts.medium,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF0F7',
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontFamily: AdminFonts.bold,
    color: '#0B1326',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF0F8',
    marginBottom: 8,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: AdminFonts.medium,
    color: '#8A93AB',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 13.5,
    fontFamily: AdminFonts.semiBold,
    color: '#0B1326',
  },
  productItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  productItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F7',
  },
  itemImageTile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E7F2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14.5,
    fontFamily: AdminFonts.bold,
    color: '#0B1326',
    marginBottom: 2,
  },
  farmerName: {
    fontSize: 12,
    fontFamily: AdminFonts.regular,
    color: '#5B6580',
    marginBottom: 2,
  },
  productQuantityPrice: {
    fontSize: 12.5,
    fontFamily: AdminFonts.medium,
    color: '#5B6580',
  },
  subtotalContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  subtotalText: {
    fontSize: 15.5,
    fontFamily: AdminFonts.bold,
    color: '#0B1326',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: AdminFonts.medium,
    color: '#5B6580',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF0F7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: AdminFonts.bold,
    color: '#5B6580',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: AdminFonts.heading,
    color: '#0B1326',
  },
});

export default AdminOrderDetailsScreen;
