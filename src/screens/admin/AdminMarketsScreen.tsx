import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { deleteAdminMarket, updateAdminMarketStatus } from '../../services/adminService';
import { StatusBadge } from '../../components/admin/StatusBadge';

export const AdminMarketsScreen: React.FC = () => {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/markets');
      if (response.data && response.data.data) {
        setMarkets(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      Alert.alert('Error', 'Failed to fetch markets.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMarkets();
    }, [])
  );

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    Alert.alert(
      'Confirm Status Change',
      `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this market?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              setLoading(true);
              await updateAdminMarketStatus(id, !currentStatus);
              await fetchMarkets();
              Alert.alert('Success', `Market ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
            } catch (e) {
              console.log(e);
              Alert.alert('Error', 'Failed to update status.');
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this market? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAdminMarket(id);
              await fetchMarkets();
              Alert.alert('Success', 'Market deleted successfully.');
            } catch (e) {
              console.log(e);
              Alert.alert('Error', 'Failed to delete market.');
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.marketName}>{item.marketName}</Text>
        <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.detailsText}>
          <Ionicons name="location-outline" size={14} color="#6B7280" /> {item.district}, {item.state}
        </Text>
        {item.contactNumber && (
          <Text style={styles.detailsText}>
            <Ionicons name="call-outline" size={14} color="#6B7280" /> {item.contactNumber}
          </Text>
        )}
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AdminAddEditMarket', { market: item })}
        >
          <Ionicons name="create-outline" size={18} color="#3B82F6" />
          <Text style={[styles.actionText, { color: '#3B82F6' }]}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleToggleStatus(item.id, item.isActive)}
        >
          <Ionicons name={item.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'} size={18} color={item.isActive ? '#F59E0B' : '#10B981'} />
          <Text style={[styles.actionText, { color: item.isActive ? '#F59E0B' : '#10B981' }]}>
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AdminHeader showBackButton />
      <Text style={styles.pageTitle}>Markets</Text>
      
      <View style={styles.headerControls}>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('AdminAddEditMarket')}
        >
          <Ionicons name="add" size={20} color="#1B2430" />
          <Text style={styles.addBtnText}>Add Market</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F5C16C" />
        </View>
      ) : markets.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="storefront-outline" size={48} color="#374151" />
          <Text style={styles.emptyText}>No markets found.</Text>
        </View>
      ) : (
        <FlatList
          data={markets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerControls: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addBtn: {
    backgroundColor: '#F5C16C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#1B2430',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  marketName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    flex: 1,
  },
  cardBody: {
    marginBottom: 16,
  },
  detailsText: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 15,
  },
});

export default AdminMarketsScreen;
