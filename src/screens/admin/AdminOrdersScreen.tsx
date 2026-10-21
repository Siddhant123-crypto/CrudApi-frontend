import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllAdminOrders } from '../../services/orderService';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminChip,
  AdminBadge,
  AdminEmptyState,
  AdminListSkeleton,
  ShoppingBagIcon,
  SearchIcon,
  CalendarIcon,
} from '../../components/admin';

export const AdminOrdersScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const tabs = ['All', 'Processing', 'Delivered', 'Cancelled'];

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAllAdminOrders();
      if (res && res.data) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error('Error fetching admin orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders
    .filter(o => {
      // 1. Search filter
      const shortId = `#ORD-${o.orderId.substring(0, 5).toUpperCase()}`;
      if (searchQuery && !shortId.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // 2. Tab filter
      if (activeTab === 'All') {
        return true;
      } else if (activeTab === 'Processing') {
        return ['CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY'].includes(o.orderStatus);
      } else if (activeTab === 'Delivered') {
        return o.orderStatus === 'DELIVERED';
      } else if (activeTab === 'Cancelled') {
        return o.orderStatus === 'CANCELLED';
      }

      return false;
    })
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  const formatOrderDate = (dateVal: any) => {
    if (!dateVal) return '';
    const dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) return String(dateVal);
    const dayMonth = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const time = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dayMonth}, ${time}`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const shortId = `#ORD-${item.orderId.substring(0, 5).toUpperCase()}`;
    const dateStr = formatOrderDate(item.orderDate);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.orderCard}
        onPress={() => navigation.navigate('AdminOrderDetails', { orderId: item.orderId })}
      >
        {/* Row 1: Tile (46x46 gradient) + Middle (orderId, customer) + Right (amount) */}
        <View style={styles.cardRow1}>
          <LinearGradient
            colors={['#1F2F6B', '#0B1326']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.orderTile}
          >
            <ShoppingBagIcon size={22} color={ADMIN_THEME.colors.gold} strokeWidth={1.8} />
          </LinearGradient>

          <View style={styles.middleCol}>
            <Text style={styles.orderId} numberOfLines={1}>
              {shortId}
            </Text>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customerName || 'Customer'}
            </Text>
          </View>

          <Text style={styles.amount}>₹{item.totalAmount}</Text>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Row 2: Left (calendar icon + date) + Right (status pill) */}
        <View style={styles.cardRow2}>
          <View style={styles.dateRow}>
            <CalendarIcon size={14} color="#8A93AB" strokeWidth={1.9} />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          <AdminBadge status={item.orderStatus} size="small" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AdminPageBackground>
      {/* 1) HEADER (shows "Orders" title in Fraunces 600 22, back button preserved, no separate big heading) */}
      <AdminHeader
        variant="tab"
        title="Orders"
        subtitle="Manage customer orders"
        showBackButton={true}
      />

      <View style={styles.contentWrapper}>
        {/* 2) SEARCH BAR */}
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor="#8A93AB"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* 3) FILTER CHIPS */}
        <View style={styles.chipsBleed}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {tabs.map(tab => (
              <AdminChip
                key={tab}
                label={tab}
                active={activeTab === tab}
                onPress={() => setActiveTab(tab)}
              />
            ))}
          </ScrollView>
        </View>

        {/* 4) ORDERS LIST / SKELETON / EMPTY STATE */}
        {loading && orders.length === 0 ? (
          <AdminListSkeleton rows={5} />
        ) : filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.orderId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchOrders}
                colors={[ADMIN_THEME.colors.indigo]}
                tintColor={ADMIN_THEME.colors.indigo}
              />
            }
          />
        ) : (
          <AdminEmptyState
            icon={<ShoppingBagIcon size={44} color={ADMIN_THEME.colors.indigo} strokeWidth={1.8} />}
            title="No orders found"
            subtitle="Looks like you don't have any orders matching your criteria."
          />
        )}
      </View>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginTop: 18,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E7F2',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: 'rgba(15,25,60,1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0B1326',
    fontFamily: AdminFonts.medium,
    padding: 0,
  },
  chipsBleed: {
    marginHorizontal: -20,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 130, // Clearance for bottom floating navigation
    paddingTop: 4,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3E7F2',
    shadowColor: 'rgba(15,25,60,1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 4,
  },
  cardRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderTile: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleCol: {
    flex: 1,
    minWidth: 0,
  },
  orderId: {
    fontFamily: AdminFonts.bold,
    fontSize: 14.5,
    color: '#0B1326',
  },
  customerName: {
    marginTop: 2,
    fontFamily: AdminFonts.regular,
    fontSize: 12.5,
    color: '#5B6580',
  },
  amount: {
    fontFamily: AdminFonts.bold,
    fontSize: 15.5,
    color: '#0B1326',
  },
  cardDivider: {
    marginTop: 12,
    height: 1,
    backgroundColor: '#EEF0F7',
  },
  cardRow2: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#8A93AB',
    fontFamily: AdminFonts.medium,
  },
});

export default AdminOrdersScreen;
