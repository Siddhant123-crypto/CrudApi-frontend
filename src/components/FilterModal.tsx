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
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (minPrice: number, maxPrice: number) => void;
}
const { width } = Dimensions.get('window');
const FILTER_CATEGORIES = [
  'Brand',
  'Size',
  'Color',
  'Fabric',
  'Pattern',
  'Price',
  'Sleeves',
  'Fit',
  'Customer Ratings',
  'Occasion',
];
const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const [activeCategory, setActiveCategory] = useState('Price');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const priceRanges = [
    'Rs. 249 and Below',
    'Rs. 250 - Rs. 399',
    'Rs. 400 - Rs. 499',
    'Rs. 500 - Rs. 699',
    'Rs. 700 - Rs. 999',
    'Rs. 1000 and above',
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111" />
            <Text style={styles.headerTitle}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
        {}
        <View style={styles.body}>
          {}
          <View style={styles.sidebar}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {FILTER_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.sidebarItem,
                    activeCategory === cat && styles.sidebarItemActive,
                  ]}
                  onPress={() => setActiveCategory(cat)}
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
          {}
          <View style={styles.panel}>
            {activeCategory === 'Price' ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
                {}
                <View style={styles.sliderBox}>
                  <Text style={styles.sliderSubtitle}>Selected Price Range</Text>
                  <Text style={styles.sliderTitle}>
                    Min - ₹{minPrice}{maxPrice >= 2000 ? '+' : ` to ₹${maxPrice}`}
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
                      sliderWidth={width * 0.55}
                    />
                  </View>
                </View>
                {}
                <View style={styles.checkboxContainer}>
                  {priceRanges.map((range, index) => (
                    <TouchableOpacity key={index} style={styles.checkboxRow}>
                      <View style={styles.checkbox} />
                      <Text style={styles.checkboxText}>{range}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.emptyPanel}>
                <Text style={styles.emptyText}>Select Price to view filter options.</Text>
              </View>
            )}
          </View>
        </View>
        {}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>See 50000+ products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginLeft: 10,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: '35%',
    backgroundColor: '#F5F5F5',
  },
  sidebarItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: '#FFFFFF',
    borderLeftColor: '#2874F0',
  },
  sidebarText: {
    fontSize: 14,
    color: '#444',
  },
  sidebarTextActive: {
    color: '#2874F0',
    fontWeight: '700',
  },
  panel: {
    width: '65%',
    backgroundColor: '#FFFFFF',
  },
  panelContent: {
    padding: 16,
  },
  sliderBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sliderSubtitle: {
    fontSize: 12,
    color: '#555',
  },
  sliderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginTop: 6,
    marginBottom: 20,
  },
  sliderWrapper: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  checkboxContainer: {
    marginTop: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#777',
    borderRadius: 4,
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
  },
  emptyPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  applyButton: {
    backgroundColor: '#2874F0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
export default FilterModal;
