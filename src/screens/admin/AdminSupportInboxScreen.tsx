import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { adminSupportService, SupportRequestResponse } from '../../services/adminSupportService';
import { useNotification } from '../../context/NotificationContext';
import { AdminPageBackground } from '../../components/admin/AdminPageBackground';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import { AdminBadge } from '../../components/admin/StatusBadge';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { AdminPrimaryButton, AdminOutlineButton } from '../../components/admin/AdminButtons';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { ChatIcon } from '../../components/admin/AdminIcons';

type Tab = 'UNASSIGNED' | 'MY_CHATS' | 'RESOLVED';

export const AdminSupportInboxScreen = () => {
  const navigation = useNavigation<any>();
  const {
    refreshUnreadCount,
    adminSupportUnreadCount,
    adminSupportUnassignedCount,
    adminSupportUserCounts,
  } = useNotification();

  const [activeTab, setActiveTab] = useState<Tab>('UNASSIGNED');
  const [requests, setRequests] = useState<SupportRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [requestToTransfer, setRequestToTransfer] = useState<string | null>(null);

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
      setRequests(data?.data || data || []);
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
      setActiveTab('MY_CHATS');
      refreshUnreadCount();
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        'Assignment Failed',
        error?.response?.data?.message || 'Conversation may have been assigned to another admin.'
      );
      fetchRequests();
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
      Alert.alert(
        'Transfer Failed',
        error?.response?.data?.message || 'Could not transfer the conversation.'
      );
    } finally {
      setLoading(false);
      setRequestToTransfer(null);
    }
  };

  const handleOpenChat = (request: SupportRequestResponse) => {
    navigation.navigate('AdminSupportChatScreen', {
      farmerId: request.userId,
      farmerName: request.userName || 'Farmer',
      supportRequestId: request.supportRequestId,
    });
  };

  const renderTab = (title: string, tab: Tab, count?: number) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{title}</Text>
        {count !== undefined && count > 0 && (
          <View style={styles.unreadCounterBadge}>
            <Text style={styles.unreadCounterText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const formatCardDate = (dateStr?: string, fallbackStr?: string) => {
    const raw = dateStr || fallbackStr;
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return '';
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const renderItem = ({ item }: { item: SupportRequestResponse }) => {
    const unreadCountForUser = adminSupportUserCounts?.[item.userId] || 0;
    const hasUnread = unreadCountForUser > 0 || !!item.hasUnreadTransfer;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleOpenChat(item)}
      >
        <AdminCard style={styles.requestCard}>
          <View style={styles.cardHeader}>
            <View style={styles.nameRow}>
              {hasUnread && <View style={styles.unreadDot} />}
              <Text style={styles.farmerName} numberOfLines={1}>
                {item.userName || 'User ' + item.userId.substring(0, 4)}
              </Text>
            </View>
            <Text style={styles.timeText}>
              {formatCardDate(item.updatedAt, item.createdAt)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <AdminBadge status={item.status} size="small" />
            {item.transferredByAdminName ? (
              <Text style={styles.transferredText} numberOfLines={1}>
                Transfer from {item.transferredByAdminName}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionContainer}>
            {activeTab === 'UNASSIGNED' && (
              <AdminPrimaryButton
                title="Assign to Me"
                onPress={() => handleAssignToMe(item.supportRequestId)}
                icon={<Ionicons name="person-add-outline" size={13} color="#FFFFFF" />}
                compact
              />
            )}

            {activeTab === 'MY_CHATS' && (
              <View style={styles.myChatActionContainer}>
                <View style={styles.myChatIndicators}>
                  <AdminBadge label="Assigned to You" variant="info" size="small" />
                </View>
                <AdminOutlineButton
                  title="Transfer"
                  onPress={() => handleOpenTransferModal(item.supportRequestId)}
                  icon={<Ionicons name="swap-horizontal" size={13} color="#4F5BD5" />}
                  compact
                />
              </View>
            )}

            {activeTab === 'RESOLVED' && (
              <AdminOutlineButton
                title="View Chat"
                onPress={() => handleOpenChat(item)}
                icon={<Ionicons name="chatbubble-ellipses-outline" size={13} color="#4F5BD5" />}
                compact
              />
            )}
          </View>
        </AdminCard>
      </TouchableOpacity>
    );
  };

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="inner"
        title="Support Inbox"
        titleAlign="left"
        titleSize={18}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabsContainer}>
        {renderTab('Unassigned', 'UNASSIGNED', adminSupportUnassignedCount)}
        {renderTab('My Chats', 'MY_CHATS', adminSupportUnreadCount)}
        {renderTab('Resolved', 'RESOLVED')}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F5BD5" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.supportRequestId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4F5BD5']}
              tintColor="#4F5BD5"
            />
          }
          ListEmptyComponent={
            <AdminEmptyState
              title="No Conversations"
              message={
                activeTab === 'UNASSIGNED'
                  ? 'There are no pending unassigned support queries.'
                  : activeTab === 'MY_CHATS'
                  ? 'You do not have any active chats assigned.'
                  : 'No resolved support tickets found.'
              }
              icon={<ChatIcon size={36} color="#4F5BD5" />}
            />
          }
        />
      )}

      {/* Transfer Admin Modal */}
      <Modal
        visible={transferModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Transfer Conversation</Text>
                <Text style={styles.modalSubtitle}>
                  Select an admin to transfer this support chat to:
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseTextButton}
                onPress={() => setTransferModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.adminList} showsVerticalScrollIndicator={false}>
              {admins.map((admin) => (
                <TouchableOpacity
                  key={admin.id}
                  style={styles.adminItem}
                  activeOpacity={0.7}
                  onPress={() => handleTransfer(admin.id)}
                >
                  <View style={styles.adminAvatar}>
                    <Text style={styles.adminAvatarText}>
                      {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                    </Text>
                  </View>
                  <View style={styles.adminInfo}>
                    <Text style={styles.adminName}>{admin.name}</Text>
                    {admin.email ? <Text style={styles.adminEmail}>{admin.email}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#8A93AB" />
                </TouchableOpacity>
              ))}
              {admins.length === 0 && (
                <ActivityIndicator size="small" color="#4F5BD5" style={{ marginTop: 20 }} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F7',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabButtonActive: {
    borderBottomColor: '#4F5BD5',
  },
  tabText: {
    fontFamily: AdminFonts.medium,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.inkMuted,
  },
  tabTextActive: {
    fontFamily: AdminFonts.bold,
    color: '#4F5BD5',
  },
  unreadCounterBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E7C06A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCounterText: {
    fontFamily: AdminFonts.bold,
    fontSize: 10.5,
    color: '#0B1326',
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
  requestCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  farmerName: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: ADMIN_THEME.colors.ink,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#E7C06A',
    borderWidth: 1.5,
    borderColor: '#C9CEF5',
    marginRight: 8,
  },
  timeText: {
    fontFamily: AdminFonts.regular,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.inkMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  transferredText: {
    fontFamily: AdminFonts.regular,
    fontSize: 12,
    color: ADMIN_THEME.colors.inkMuted,
    fontStyle: 'italic',
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF0F7',
    paddingTop: 10,
  },
  actionBtnPrimary: {
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  actionBtnOutline: {
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 38, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
    ...ADMIN_THEME.shadows.stickyBar,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: AdminFonts.bold,
    fontSize: 18,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.inkMuted,
  },
  modalCloseTextButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FDE7E7',
    borderRadius: 8,
    marginLeft: 12,
  },
  modalCloseText: {
    fontFamily: AdminFonts.bold,
    fontSize: 12.5,
    color: '#D64545',
  },
  adminList: {
    maxHeight: 320,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F7',
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C9CEF5',
  },
  adminAvatarText: {
    fontFamily: AdminFonts.bold,
    fontSize: 16,
    color: '#4F5BD5',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 14.5,
    color: ADMIN_THEME.colors.ink,
  },
  adminEmail: {
    fontFamily: AdminFonts.regular,
    fontSize: 12,
    color: ADMIN_THEME.colors.inkMuted,
    marginTop: 2,
  },
});

export default AdminSupportInboxScreen;
