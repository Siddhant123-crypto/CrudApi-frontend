import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { createAdminMarket, updateAdminMarket } from '../../services/adminService';
import { AdminPageBackground } from '../../components/admin/AdminPageBackground';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import { AdminInput } from '../../components/admin/AdminInput';
import { AdminPrimaryButton } from '../../components/admin/AdminButtons';
import { AdminStickyBar } from '../../components/admin/AdminStickyBar';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { CheckIcon } from '../../components/admin/AdminIcons';

export const AdminAddEditMarketScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const market = route.params?.market;
  const isEdit = !!market;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    marketName: market?.marketName || '',
    description: market?.description || '',
    address: market?.address || '',
    village: market?.village || '',
    taluka: market?.taluka || '',
    district: market?.district || '',
    state: market?.state || '',
    pincode: market?.pincode || '',
    latitude: market?.latitude ? market.latitude.toString() : '',
    longitude: market?.longitude ? market.longitude.toString() : '',
    openingTime: market?.openingTime || '',
    closingTime: market?.closingTime || '',
    marketContactName: market?.marketContactName || '',
    contactNumber: market?.contactNumber || '',
    isActive: market?.isActive !== undefined ? market.isActive : true,
  });

  const handleChange = (key: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!formData.marketName.trim()) {
      Alert.alert(t('common.validationError'), t('admin.marketNameRequired'));
      return false;
    }

    if (formData.latitude) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        Alert.alert(t('common.validationError'), t('admin.latValidRange'));
        return false;
      }
    } else {
      Alert.alert(t('common.validationError'), t('admin.latRequired'));
      return false;
    }

    if (formData.longitude) {
      const lon = parseFloat(formData.longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        Alert.alert(t('common.validationError'), t('admin.lngValidRange'));
        return false;
      }
    } else {
      Alert.alert(t('common.validationError'), t('admin.lngRequired'));
      return false;
    }

    return true;
  };

  const formatTimeTo24Hr = (timeStr?: string): string | null => {
    if (!timeStr || !timeStr.trim()) return null;
    const str = timeStr.trim();

    // Already 24-hr format HH:mm or HH:mm:ss
    const match24 = str.match(/^([01]?\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/);
    if (match24) {
      const hours = match24[1].padStart(2, '0');
      const minutes = match24[2];
      const seconds = match24[4] || '00';
      return `${hours}:${minutes}:${seconds}`;
    }

    // 12-hr format e.g. 06:00 AM, 6:30 PM, 6:00am
    const match12 = str.match(/^(\d{1,2}):([0-5]\d)\s*([APap][Mm])$/);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2];
      const period = match12[3].toUpperCase();
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      const hoursStr = hours.toString().padStart(2, '0');
      return `${hoursStr}:${minutes}:00`;
    }

    // Just hour input e.g. "6" or "6 PM"
    const matchHourOnly = str.match(/^(\d{1,2})\s*([APap][Mm])?$/);
    if (matchHourOnly) {
      let hours = parseInt(matchHourOnly[1], 10);
      const period = matchHourOnly[2]?.toUpperCase();
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      if (hours >= 0 && hours <= 23) {
        return `${hours.toString().padStart(2, '0')}:00:00`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const payload: any = {
        marketName: formData.marketName.trim(),
        description: formData.description.trim() || null,
        address: formData.address.trim() || null,
        village: formData.village.trim() || null,
        taluka: formData.taluka.trim() || null,
        district: formData.district.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        openingTime: formatTimeTo24Hr(formData.openingTime),
        closingTime: formatTimeTo24Hr(formData.closingTime),
        marketContactName: formData.marketContactName.trim() || null,
        contactNumber: formData.contactNumber.trim() || null,
        isActive: formData.isActive,
      };

      if (isEdit) {
        await updateAdminMarket(market.id, payload);
        Alert.alert(t('common.success'), t('admin.marketUpdatedSuccess'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() },
        ]);
      } else {
        await createAdminMarket(payload);
        Alert.alert(t('common.success'), t('admin.marketCreatedSuccess'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.log('Error saving market', error);
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        t('admin.failedSaveMarket');
      Alert.alert(t('common.error'), serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeaderWrapper}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      <View style={styles.sectionHeaderDivider} />
    </View>
  );

  return (
    <AdminPageBackground>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AdminHeader
          variant="inner"
          title={isEdit ? t('admin.editMarket') : t('admin.addMarket')}
          subtitle={isEdit ? market?.marketName : t('admin.newApmc')}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information */}
          {renderSectionHeader(t('admin.basicInfo'))}
          <AdminCard style={styles.card}>
            <AdminInput
              label={t('admin.marketName')}
              required
              placeholder={t('admin.egApmcVashi')}
              value={formData.marketName}
              onChangeText={(text) => handleChange('marketName', text)}
            />
            <AdminInput
              label={t('common.description')}
              placeholder={t('admin.descPlaceholder')}
              value={formData.description}
              onChangeText={(text) => handleChange('description', text)}
              multiline
              containerStyle={{ marginBottom: 0 }}
            />
          </AdminCard>

          {/* Location Details */}
          {renderSectionHeader(t('admin.locationDetails'))}
          <AdminCard style={styles.card}>
            <AdminInput
              label={t('common.address')}
              placeholder={t('admin.streetAreaPlaceholder')}
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
            />
            <View style={styles.row}>
              <View style={styles.flex1}>
                <AdminInput
                  label={t('admin.village')}
                  placeholder={t('admin.village')}
                  value={formData.village}
                  onChangeText={(text) => handleChange('village', text)}
                />
              </View>
              <View style={styles.spacing} />
              <View style={styles.flex1}>
                <AdminInput
                  label={t('admin.taluka')}
                  placeholder={t('admin.taluka')}
                  value={formData.taluka}
                  onChangeText={(text) => handleChange('taluka', text)}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <AdminInput
                  label={t('admin.district')}
                  placeholder={t('admin.district')}
                  value={formData.district}
                  onChangeText={(text) => handleChange('district', text)}
                />
              </View>
              <View style={styles.spacing} />
              <View style={styles.flex1}>
                <AdminInput
                  label={t('admin.state')}
                  placeholder={t('admin.state')}
                  value={formData.state}
                  onChangeText={(text) => handleChange('state', text)}
                />
              </View>
            </View>
            <AdminInput
              label={t('admin.pincode')}
              placeholder={t('admin.egPincode')}
              value={formData.pincode}
              onChangeText={(text) => handleChange('pincode', text)}
              keyboardType="numeric"
              containerStyle={{ marginBottom: 0 }}
            />
          </AdminCard>

          {/* Map Coordinates */}
          {renderSectionHeader(t('admin.mapCoordinates'))}
          <AdminCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <AdminInput
                  label={t('admin.lat')}
                  required
                  placeholder={t('admin.egLat')}
                  value={formData.latitude}
                  onChangeText={(text) => handleChange('latitude', text)}
                  keyboardType="numeric"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={styles.spacing} />
              <View style={styles.flex1}>
                <AdminInput
                  label={t('admin.lng')}
                  required
                  placeholder={t('admin.egLng')}
                  value={formData.longitude}
                  onChangeText={(text) => handleChange('longitude', text)}
                  keyboardType="numeric"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </View>
          </AdminCard>

          {/* Operations & Contact */}
          {renderSectionHeader(t('admin.operationsContact'))}
          <AdminCard style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <AdminInput
                  label={t('admin.openingTime')}
                  placeholder={t('admin.egTimeAm')}
                  value={formData.openingTime}
                  onChangeText={(text) => handleChange('openingTime', text)}
                />
              </View>
              <View style={styles.spacing} />
              <View style={styles.flex1}>
                <AdminInput
                  label={t('admin.closingTime')}
                  placeholder={t('admin.egTimePm')}
                  value={formData.closingTime}
                  onChangeText={(text) => handleChange('closingTime', text)}
                />
              </View>
            </View>
            <AdminInput
              label={t('admin.contactPerson')}
              placeholder={t('admin.marketManagerName')}
              value={formData.marketContactName}
              onChangeText={(text) => handleChange('marketContactName', text)}
            />
            <AdminInput
              label={t('admin.contactNumber')}
              placeholder={t('admin.phoneNumber')}
              value={formData.contactNumber}
              onChangeText={(text) => handleChange('contactNumber', text)}
              keyboardType="phone-pad"
              containerStyle={{ marginBottom: 0 }}
            />
          </AdminCard>

          {/* Status */}
          {renderSectionHeader(t('admin.marketStatus'))}
          <AdminCard style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>{t('admin.marketActive')}</Text>
                <Text style={styles.statusSubtext}>
                  {formData.isActive
                    ? t('admin.marketActiveVisible')
                    : t('admin.marketActiveHidden')}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleChange('isActive', !formData.isActive)}
                style={[
                  styles.toggleBadge,
                  formData.isActive ? styles.toggleBadgeActive : styles.toggleBadgeInactive,
                ]}
              >
                {formData.isActive && <CheckIcon size={12} color="#1F8F89" />}
                <Text
                  style={[
                    styles.toggleBadgeText,
                    formData.isActive
                      ? styles.toggleBadgeTextActive
                      : styles.toggleBadgeTextInactive,
                  ]}
                >
                  {formData.isActive ? t('common.active') : t('common.inactive')}
                </Text>
              </TouchableOpacity>
            </View>
          </AdminCard>
        </ScrollView>

        <AdminStickyBar>
          <AdminPrimaryButton
            title={isEdit ? t('admin.updateMarket') : t('admin.saveMarket')}
            onPress={handleSave}
            loading={loading}
          />
        </AdminStickyBar>
      </KeyboardAvoidingView>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeaderWrapper: {
    marginBottom: 8,
    marginTop: 8,
  },
  sectionHeaderTitle: {
    fontFamily: AdminFonts.bold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: '#4F5BD5',
    marginBottom: 6,
  },
  sectionHeaderDivider: {
    height: 1,
    backgroundColor: '#EEF0F7',
    marginBottom: 4,
  },
  card: {
    marginBottom: 14,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacing: {
    width: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flex: 1,
    paddingRight: 16,
  },
  statusLabel: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 14,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 2,
  },
  statusSubtext: {
    fontFamily: AdminFonts.regular,
    fontSize: 12,
    color: ADMIN_THEME.colors.inkMuted,
  },
  toggleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleBadgeActive: {
    backgroundColor: '#D9F3F1',
    borderColor: '#A0E4E0',
  },
  toggleBadgeInactive: {
    backgroundColor: '#FDE7E7',
    borderColor: '#FAC4C4',
  },
  toggleBadgeText: {
    fontFamily: AdminFonts.bold,
    fontSize: 12,
  },
  toggleBadgeTextActive: {
    color: '#1F8F89',
  },
  toggleBadgeTextInactive: {
    color: '#D64545',
  },
});

export default AdminAddEditMarketScreen;
