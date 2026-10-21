import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomRangeSlider from './CustomRangeSlider';
import { THEME } from '../constants/theme';
import { PrimaryButton } from './ui/Buttons';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (minPrice: number, maxPrice: number) => void;
}

const { width } = Dimensions.get('window');

const FILTER_CATEGORIES = [
  'Price',
  'Customer Ratings',
  'Category',
  'Availability',
  'Organic Certified',
];

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const [activeCategory, setActiveCategory] = useState('Price');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);

  const priceRanges = [
    '₹50 and Below',
    '₹50 - ₹100',
    '₹100 - ₹200',
    '₹200 - ₹500',
    '₹500 - ₹1000',
    '₹1000 and above',
  ];

  const handleApply = () => {
    onApply(minPrice, maxPrice);
    onClose();
  };

  const handleClearAll = () => {
    setMinPrice(0);
    setMaxPrice(2000);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={THEME.colors.textHeading} />
            <Text style={styles.headerTitle}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {FILTER_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.sidebarItem,
                    activeCategory === cat && styles.sidebarItemActive,
                  ]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.sidebarText,
                      activeCategory === cat && styles.sidebarTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Panel */}
          <View style={styles.panel}>
            {activeCategory === 'Price' ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
                <View style={styles.sliderBox}>
                  <Text style={styles.sliderSubtitle}>Selected Price Range</Text>
                  <Text style={styles.sliderTitle}>
                    ₹{minPrice} - {maxPrice >= 2000 ? '₹2000+' : `₹${maxPrice}`}
                  </Text>
                  <View style={styles.sliderWrapper}>
                    <CustomRangeSlider
                      min={0}
                      max={2000}
                      initialMin={minPrice}
                      initialMax={maxPrice}
                      onValuesChange={([min, max]) => {
                        setMinPrice(min);
                        setMaxPrice(max);
                      }}
                      sliderWidth={width * 0.52}
                    />
                  </View>
                </View>

                <View style={styles.checkboxContainer}>
                  {priceRanges.map((range, index) => (
                    <TouchableOpacity key={index} style={styles.checkboxRow} activeOpacity={0.7}>
                      <View style={styles.checkbox} />
                      <Text style={styles.checkboxText}>{range}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.emptyPanel}>
                <Text style={styles.emptyText}>Select Price to configure filters.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <PrimaryButton title="Apply Filters" onPress={handleApply} />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.cardBg,
    borderTopLeftRadius: THEME.radius.bottomSheets,
    borderTopRightRadius: THEME.radius.bottomSheets,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: THEME.fonts.serif,
    fontSize: 20,
    color: THEME.colors.textHeading,
  },
  clearText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.accent,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: '36%',
    backgroundColor: THEME.colors.inputBg,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.divider,
  },
  sidebarItem: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: THEME.colors.selectedBg,
    borderLeftColor: THEME.colors.accentDeep,
  },
  sidebarText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  sidebarTextActive: {
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.selectedText,
  },
  panel: {
    width: '64%',
    backgroundColor: THEME.colors.cardBg,
  },
  panelContent: {
    padding: 16,
  },
  sliderBox: {
    backgroundColor: THEME.colors.inputBg,
    borderRadius: THEME.radius.inputs,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  sliderSubtitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  sliderTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16,
    color: THEME.colors.textHeading,
    marginTop: 4,
    marginBottom: 16,
  },
  sliderWrapper: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  checkboxContainer: {
    marginTop: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: THEME.colors.inputBg,
  },
  checkboxText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13.5,
    color: THEME.colors.textBase,
  },
  emptyPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: THEME.fonts.medium,
    color: THEME.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.divider,
    backgroundColor: THEME.colors.cardBg,
  },
});

export default FilterModal;
