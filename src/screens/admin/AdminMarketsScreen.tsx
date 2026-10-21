import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { deleteAdminMarket, updateAdminMarketStatus } from '../../services/adminService';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminBadge,
  AdminEmptyState,
  AdminListSkeleton,
  StoreIcon,
  LocationIcon,
  PhoneIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from '../../components/admin';

export const AdminMarketsScreen: React.FC = () => {
  const [markets, setMarkets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
          },
        },
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
          },
        },
      ]
    );
  };

  const filteredMarkets = markets.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = m.marketName?.toLowerCase().includes(q);
    const distMatch = m.district?.toLowerCase().includes(q);
    const stateMatch = m.state?.toLowerCase().includes(q);
    return nameMatch || distMatch || stateMatch;
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => navigation.navigate('MarketDetails', { market: item, variant: 'admin' })}
    >
      <View style={styles.cardTopRow}>
        {/* Navy gradient tile with gold store icon */}
        <LinearGradient
          colors={['#1F2F6B', '#0B1326']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.iconTile}
        >
          <StoreIcon size={22} color={ADMIN_THEME.colors.gold} strokeWidth={1.8} />
        </LinearGradient>

        <View style={styles.titleWrapper}>
          <Text style={styles.marketName} numberOfLines={1}>
            {item.marketName}
          </Text>
          <View style={styles.locationRow}>
            <LocationIcon size={13} color="#8A93AB" strokeWidth={1.8} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.district ? `${item.district}, ` : ''}{item.state || 'N/A'}
            </Text>
          </View>
        </View>

        <AdminBadge status={item.isActive ? 'Active' : 'Inactive'} size="small" />
      </View>

      {item.contactNumber ? (
        <View style={styles.contactRow}>
          <PhoneIcon size={13} color="#8A93AB" strokeWidth={1.8} />
          <Text style={styles.contactText}>{item.contactNumber}</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.editBtn}
          onPress={() => navigation.navigate('AdminAddEditMarket', { market: item })}
        >
          <EditIcon size={14} color={ADMIN_THEME.colors.indigo} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.toggleBtn,
            item.isActive ? styles.toggleInactiveBg : styles.toggleActiveBg,
          ]}
          onPress={() => handleToggleStatus(item.id, item.isActive)}
        >
          <Text
            style={[
              styles.toggleText,
              { color: item.isActive ? ADMIN_THEME.colors.danger : ADMIN_THEME.colors.success },
            ]}
          >
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
        >
          <TrashIcon size={14} color={ADMIN_THEME.colors.danger} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <AdminPageBackground>
      {/* 1) TAB ADMIN HEADER WITH SEARCH & NAVY "+" BUTTON */}
      <AdminHeader
        variant="tab"
        title="Markets"
        subtitle="All mandis & market hubs"
        showBackButton={true}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by market or location..."
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerAddButton}
            onPress={() => navigation.navigate('AdminAddEditMarket')}
          >
            <PlusIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        }
      />

      {/* 2) MARKETS LIST */}
      {loading ? (
        <AdminListSkeleton rows={5} />
      ) : filteredMarkets.length === 0 ? (
        <AdminEmptyState
          icon={<StoreIcon size={44} color={ADMIN_THEME.colors.indigo} strokeWidth={1.8} />}
          title="No markets found"
          subtitle="There are no markets matching your search."
        />
      ) : (
        <FlatList
          data={filteredMarkets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  headerAddButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 130, // Clearance for tab bar
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3E7F2',
    shadowColor: 'rgba(15,25,60,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 8,
  },
  marketName: {
    fontSize: 15.5,
    fontFamily: AdminFonts.bold,
    color: '#0B1326',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12.5,
    fontFamily: AdminFonts.regular,
    color: '#5B6580',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginLeft: 58,
  },
  contactText: {
    fontSize: 12,
    fontFamily: AdminFonts.medium,
    color: '#8A93AB',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF0F7',
    marginTop: 12,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EEF0FB',
  },
  editText: {
    fontSize: 12,
    fontFamily: AdminFonts.semiBold,
    color: ADMIN_THEME.colors.indigo,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleActiveBg: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  toggleInactiveBg: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  toggleText: {
    fontSize: 11,
    fontFamily: AdminFonts.bold,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteText: {
    fontSize: 12,
    fontFamily: AdminFonts.semiBold,
    color: ADMIN_THEME.colors.danger,
  },
});

export default AdminMarketsScreen;
