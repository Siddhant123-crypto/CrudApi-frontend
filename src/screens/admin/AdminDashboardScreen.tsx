import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { StatCard } from '../../components/admin/StatCard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StatusBadge } from '../../components/admin/StatusBadge';

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <AdminHeader />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeLeft}>
            <View>
              <Text style={styles.welcomeText}>Hello, Admin</Text>
              <Text style={styles.welcomeSubtitle}>Here's what's happening today</Text>
            </View>
          </View>
          <View style={styles.dateCard}>
            <Ionicons name="calendar-outline" size={14} color="#1B2430" style={styles.dateIcon} />
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard title="Farmers" value="165" growth="↑ 12 this month" icon="people" />
          <StatCard title="Customers" value="82" growth="↑ 8 this month" icon="people-outline" />
          <StatCard title="Products" value="86" growth="↑ 10 this month" icon="cube" />
          <StatCard title="Orders" value="23" growth="↑ 5 this month" icon="cart" />
        </View>

        {/* Order Summary Row */}
        <View style={styles.orderSummaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={16} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Pending Orders</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>7</Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Completed Orders</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>16</Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Cancelled Orders</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>2</Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="wallet-outline" size={16} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>Total Revenue</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>₹17,081</Text>
            </View>
          </View>
        </View>

        {/* Revenue Overview & Recent Orders Row */}
        <View style={styles.middleRow}>
          
          {/* Revenue Card */}
          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <Text style={styles.revenueTitle} numberOfLines={1} adjustsFontSizeToFit>Revenue Overview</Text>
              <View style={styles.dropdown}>
                <Text style={styles.dropdownText} numberOfLines={1} adjustsFontSizeToFit>This Month</Text>
                <Ionicons name="chevron-down" size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.revenueAmount} numberOfLines={1} adjustsFontSizeToFit>₹17,081</Text>
            <Text style={styles.revenueGrowth} numberOfLines={1} adjustsFontSizeToFit>↑ 18% from last month</Text>
            
            {/* Simple Line Graph Visual */}
            <View style={styles.chartContainer}>
              <View style={styles.yAxis}>
                <Text style={styles.axisText}>30k</Text>
                <Text style={styles.axisText}>20k</Text>
                <Text style={styles.axisText}>10k</Text>
                <Text style={styles.axisText}>0</Text>
              </View>
              <View style={styles.lineChartContainer}>
                {[12, 28, 15, 22, 18, 30].map((val, idx, data) => {
                  if (idx === data.length - 1) return null;
                  const nextVal = data[idx + 1];
                  
                  const stepX = 22; // 5 steps fit in ~110px width
                  const maxHeight = 100;
                  
                  const x1 = idx * stepX;
                  const y1 = maxHeight - (val / 30) * maxHeight;
                  const x2 = (idx + 1) * stepX;
                  const y2 = maxHeight - (nextVal / 30) * maxHeight;

                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                  const cx = (x1 + x2) / 2;
                  const cy = (y1 + y2) / 2;

                  return (
                    <View key={`line-${idx}`} style={{
                      position: 'absolute',
                      left: cx - length / 2,
                      top: cy - 1,
                      width: length,
                      height: 2,
                      backgroundColor: '#F5C16C',
                      transform: [{ rotate: `${angle}deg` }]
                    }} />
                  );
                })}
                {[12, 28, 15, 22, 18, 30].map((val, idx) => {
                  const stepX = 22;
                  const maxHeight = 100;
                  const x1 = idx * stepX;
                  const y1 = maxHeight - (val / 30) * maxHeight;
                  return (
                    <View key={`dot-${idx}`} style={{
                      position: 'absolute',
                      left: x1 - 3,
                      top: y1 - 3,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#17212F',
                      borderWidth: 1.5,
                      borderColor: '#F5C16C',
                    }} />
                  );
                })}
              </View>
            </View>
          </View>

          {/* Recent Orders Card */}
          <View style={styles.recentOrdersCard}>
            <View style={styles.recentOrdersHeader}>
              <Text style={styles.recentOrdersTitle} numberOfLines={1} adjustsFontSizeToFit>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AdminOrders')}>
                <Text style={styles.viewAllText} numberOfLines={1} adjustsFontSizeToFit>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.orderList}>
              {/* Order 1 */}
              <View style={styles.orderItem}>
                <View style={styles.orderLeft}>
                  <View style={styles.orderIconBg}>
                    <Ionicons name="bag-handle-outline" size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flexShrink: 1, marginRight: 8 }}>
                    <Text style={styles.orderId} numberOfLines={1}>#ORD-123</Text>
                    <Text style={styles.orderCustomer} numberOfLines={1}>Rahul Patil</Text>
                  </View>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount} numberOfLines={1} adjustsFontSizeToFit>₹850</Text>
                  <StatusBadge status="Delivered" />
                </View>
              </View>
              
              <View style={styles.orderDivider} />

              {/* Order 2 */}
              <View style={styles.orderItem}>
                <View style={styles.orderLeft}>
                  <View style={styles.orderIconBg}>
                    <Ionicons name="bag-handle-outline" size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flexShrink: 1, marginRight: 8 }}>
                    <Text style={styles.orderId} numberOfLines={1}>#ORD-122</Text>
                    <Text style={styles.orderCustomer} numberOfLines={1}>Sneha Sharma</Text>
                  </View>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount} numberOfLines={1} adjustsFontSizeToFit>₹650</Text>
                  <StatusBadge status="Processing" />
                </View>
              </View>

              <View style={styles.orderDivider} />

              {/* Order 3 */}
              <View style={styles.orderItem}>
                <View style={styles.orderLeft}>
                  <View style={styles.orderIconBg}>
                    <Ionicons name="bag-handle-outline" size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flexShrink: 1, marginRight: 8 }}>
                    <Text style={styles.orderId} numberOfLines={1}>#ORD-121</Text>
                    <Text style={styles.orderCustomer} numberOfLines={1}>Amit Kumar</Text>
                  </View>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount} numberOfLines={1} adjustsFontSizeToFit>₹1,250</Text>
                  <StatusBadge status="Pending" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="person-add-outline" size={24} color="#F5C16C" />
              <Text style={styles.actionText}>Add Farmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add-circle-outline" size={24} color="#F5C16C" />
              <Text style={styles.actionText}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="grid-outline" size={24} color="#F5C16C" />
              <Text style={styles.actionText}>Add Category</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AdminOrders')}>
              <Ionicons name="receipt-outline" size={24} color="#F5C16C" />
              <Text style={styles.actionText}>All Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Analytics')}>
              <Ionicons name="bar-chart-outline" size={24} color="#F5C16C" />
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F1E6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // For bottom tabs
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B2430',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateIcon: {
    marginRight: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B2430',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B2430',
    textAlign: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  revenueCard: {
    flex: 0.9,
    backgroundColor: '#17212F',
    borderRadius: 16,
    padding: 16,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2B3A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 1,
    marginLeft: 4,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginRight: 4,
    flexShrink: 1,
  },
  revenueAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  revenueGrowth: {
    color: '#F5C16C',
    fontSize: 13,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120,
  },
  yAxis: {
    justifyContent: 'space-between',
    marginRight: 8,
    paddingBottom: 20,
  },
  axisText: {
    color: '#6B7280',
    fontSize: 9,
  },
  lineChartContainer: {
    flex: 1,
    height: 100,
    position: 'relative',
    marginLeft: 8,
    marginTop: 10, // Align with Y-axis properly
  },
  recentOrdersCard: {
    flex: 1.1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  recentOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentOrdersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B2430',
    flexShrink: 1,
  },
  viewAllText: {
    fontSize: 14,
    color: '#F5C16C',
    fontWeight: '600',
    marginLeft: 4,
  },
  orderList: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#17212F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  orderId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1B2430',
  },
  orderCustomer: {
    fontSize: 11,
    color: '#6B7280',
  },
  orderRight: {
    alignItems: 'center',
    flexShrink: 0,
  },
  orderAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1B2430',
    marginBottom: 4,
    textAlign: 'center',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B2430',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#17212F',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '18%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;
