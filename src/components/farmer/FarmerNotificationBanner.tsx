import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';
import { FARMER_THEME } from '../../constants/farmerTheme';

export const FarmerNotificationBanner = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { latestAddressChangeEvent, clearAddressChangeEvent } = useNotification();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (latestAddressChangeEvent) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();

      // Auto-dismiss after 14 seconds if untouched
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, 14000);
    } else {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [latestAddressChangeEvent]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      clearAddressChangeEvent();
    });
  };

  const handleOpenOrder = () => {
    if (!latestAddressChangeEvent) return;
    const orderId = latestAddressChangeEvent.orderId;
    const notif = latestAddressChangeEvent;
    handleDismiss();

    if (orderId) {
      navigation.navigate('FarmerOrderDetails', {
        orderId,
        addressUpdated: true,
        previousAddress: notif.previousAddress,
        newAddress: notif.newAddress,
      });
    } else {
      navigation.navigate('Notifications');
    }
  };

  if (!latestAddressChangeEvent) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handleOpenOrder}
        activeOpacity={0.9}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={20} color="#FFFFFF" />
        </View>

        <View style={styles.contentCol}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {t('notifications.deliveryAddressUpdated', 'Delivery Address Updated')}
            </Text>
            {latestAddressChangeEvent.orderNumber && (
              <View style={styles.orderNumberBadge}>
                <Text style={styles.orderNumberText}>
                  #{latestAddressChangeEvent.orderNumber.substring(0, 14)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.messageText} numberOfLines={2}>
            {latestAddressChangeEvent.message ||
              t('notifications.customerUpdatedAddress', 'A customer updated their delivery address for an active order.')}
          </Text>
          <Text style={styles.actionPromptText}>
            {t('notifications.tapToReviewAddress', 'Tap to review updated delivery details →')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={18} color="#6B7280" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 14,
    right: 14,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
    marginRight: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064E3B',
    flex: 1,
  },
  orderNumberBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  orderNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  messageText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
    marginTop: 2,
  },
  actionPromptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 4,
  },
});
