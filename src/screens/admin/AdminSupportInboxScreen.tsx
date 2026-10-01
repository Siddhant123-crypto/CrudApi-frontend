import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl, Modal, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { adminSupportService, SupportRequestResponse } from '../../services/adminSupportService';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useNotification } from '../../context/NotificationContext';

type Tab = 'UNASSIGNED' | 'MY_CHATS' | 'RESOLVED';

export const AdminSupportInboxScreen = () => {
  const navigation = useNavigation<any>();
  const { refreshUnreadCount, adminSupportUnreadCount, adminSupportUnassignedCount, adminSupportUserCounts } = useNotification();
  
  const [activeTab, setActiveTab] = useState<Tab>('UNASSIGNED');
  const [requests, setRequests] = useState<SupportRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]); // To load admins for transfer
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [requestToTransfer, setRequestToTransfer] = useState<string | null>(null);
  
  // Custom polling interval based on active tab
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests(false);
      refreshUnreadCount();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
      refreshUnreadCount();
    }, [activeTab])
  );

  const fetchRequests = async (showLoading = true) => {
    if (showLoading && !refreshing) setLoading(true);
    try {
      let data: any = null;
      if (activeTab === 'UNASSIGNED') {
        data = await adminSupportService.getUnassignedSupportRequests();
      } else if (activeTab === 'MY_CHATS') {
        data = await adminSupportService.getMyAssignedSupportRequests();
      } else {
        data = await adminSupportService.getResolvedSupportRequests();
      }
      setRequests(data?.data || data || []); // The backend wraps in 'data'
    } catch (error) {
      console.log('Error fetching support requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests(false);
    refreshUnreadCount();
  };

  const handleAssignToMe = async (requestId: string) => {
    try {
      setLoading(true);
      await adminSupportService.assignSupportRequest(requestId);
      Alert.alert('Success', 'Conversation assigned to you successfully.');
      setActiveTab('MY_CHATS'); // Switch tab to see it
      refreshUnreadCount();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Assignment Failed', error?.response?.data?.message || 'Conversation may have been assigned to another admin.');
      fetchRequests(); // Refresh current list
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTransferModal = async (requestId: string) => {
    setRequestToTransfer(requestId);
    setTransferModalVisible(true);
    try {
      const response = await adminSupportService.getAvailableAdmins();
      setAdmins(response.data || []);
    } catch (e) {
      console.log('Failed to fetch admins for transfer', e);
      Alert.alert('Error', 'Failed to fetch available admins.');
    }
  };

  const handleTransfer = async (newAdminId: string) => {
    if (!requestToTransfer) return;
    try {
      setTransferModalVisible(false);
      setLoading(true);
      await adminSupportService.transferSupportRequest(requestToTransfer, newAdminId);
      Alert.alert('Success', 'Conversation transferred successfully.');
      fetchRequests();
      refreshUnreadCount();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Transfer Failed', error?.response?.data?.message || 'Could not transfer the conversation.');
    } finally {
      setLoading(false);
      setRequestToTransfer(null);
    }
  };

  const handleOpenChat = (request: SupportRequestResponse) => {
    navigation.navigate('AdminSupportChatScreen', {
      farmerId: request.userId,
      farmerName: request.userName || 'Farmer',
      supportRequestId: request.supportRequestId
    });
  };

  const renderTab = (title: string, tab: Tab, count?: number) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity 
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {title}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.badge, isActive && styles.badgeActive]}>
            <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: SupportRequestResponse }) => {
    const unreadCountForUser = adminSupportUserCounts?.[item.userId] || 0;
    const hasUnread = unreadCountForUser > 0 || !!item.hasUnreadTransfer;
    
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleOpenChat(item)}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {hasUnread && <View style={styles.unreadDot} />}
            <Text style={[styles.farmerName, hasUnread && { fontWeight: '900', color: '#000000' }]}>
              {item.userName || 'Farmer ' + item.userId.substring(0, 4)}
            </Text>
          </View>
          <Text style={styles.timeText}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
        </View>
        
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.statusText}>
            Status: <Text style={styles.statusValue}>{item.status}</Text>
          </Text>
          {item.transferredByAdminName && (
            <Text style={styles.transferredText}>
              Transferred by: <Text style={{fontWeight: 'bold'}}>{item.transferredByAdminName}</Text>
            </Text>
          )}
        </View>

        <View style={styles.actionContainer}>
          {activeTab === 'UNASSIGNED' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleAssignToMe(item.supportRequestId)}
            >
              <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Assign to Me</Text>
            </TouchableOpacity>
          )}
          
          {activeTab === 'MY_CHATS' && (
            <View style={styles.myChatActionContainer}>
              <View style={styles.myChatIndicators}>
                <Text style={styles.assignedBadge}>Assigned to You</Text>
              </View>
              <TouchableOpacity 
                style={styles.transferButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleOpenTransferModal(item.supportRequestId);
                }}
              >
                <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
                <Text style={styles.transferButtonText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader showBackButton={true} />
      
      <View style={styles.tabsContainer}>
        {renderTab('Unassigned', 'UNASSIGNED', adminSupportUnassignedCount)}
        {renderTab('My Chats', 'MY_CHATS', adminSupportUnreadCount)}
        {renderTab('Resolved', 'RESOLVED')}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5C16C" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.supportRequestId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F5C16C']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No conversations found.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={transferModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Transfer Conversation</Text>
                <Text style={styles.modalSubtitle}>Select an admin to transfer this chat to:</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseTextButton}
                onPress={() => setTransferModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.adminList}>
              {admins.map((admin) => (
                <TouchableOpacity 
                  key={admin.id} 
                  style={styles.adminItem}
                  onPress={() => handleTransfer(admin.id)}
                >
                  <View style={styles.adminAvatar}>
                    <Text style={styles.adminAvatarText}>{admin.name ? admin.name.charAt(0) : 'A'}</Text>
                  </View>
                  <Text style={styles.adminName}>{admin.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
              {admins.length === 0 && (
                <ActivityIndicator size="small" color="#F5C16C" style={{ marginTop: 20 }} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#F5C16C',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#17212F',
  },
  badge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#17212F',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444', // Red dot for unread messages
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
  },
  statusValue: {
    fontWeight: '600',
    color: '#F5C16C',
  },
  transferredText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: '#17212F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  myChatActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  myChatIndicators: {
    flexDirection: 'row',
  },
  assignedBadge: {
    backgroundColor: '#F0FDF4',
    color: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6', // Prominent Blue background
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  transferButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  adminList: {
    maxHeight: 300,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5C16C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalCloseTextButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginLeft: 16,
  },
  modalCloseText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adminName: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
});

export default AdminSupportInboxScreen;
