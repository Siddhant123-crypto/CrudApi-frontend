import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomRangeSlider from './CustomRangeSlider';

const {height} = Dimensions.get('window');

type FilterTab = 'State' | 'Village' | 'Category' | 'Price' | 'Customer Ratings' | 'Discount' | 'Delivery in 1 Day';

const TABS: FilterTab[] = [
  'State',
  'Village',
  'Category',
  'Price',
  'Customer Ratings',
  'Discount',
  'Delivery in 1 Day',
];

const CATEGORIES = [
  'Leafy Vegetables',
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Others',
];

const PRICE_RANGES = [
  'Rs. 10 - Rs. 100',
  'Rs. 101 - Rs. 200',
  'Rs. 201 - Rs. 300',
  'Rs. 301 - Rs. 400',
  'Rs. 401 - Rs. 500',
  'Rs. 500 and above',
];

export interface FilterCriteria {
  state: string;
  village: string;
  categories: string[];
  priceRanges: string[];
  minPrice: number;
  maxPrice: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply?: (criteria: FilterCriteria) => void;
  initialTab?: FilterTab;
}

const FilterModal: React.FC<FilterModalProps> = ({visible, onClose, onApply, initialTab = 'State'}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>(initialTab);

  // Form States
  const [stateForm, setStateForm] = useState('');
  const [villageForm, setVillageForm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);

  // Slider State
  const [customMinPrice, setCustomMinPrice] = useState(10);
  const [customMaxPrice, setCustomMaxPrice] = useState(500);

  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const togglePriceRange = (range: string) => {
    if (selectedPriceRanges.includes(range)) {
      setSelectedPriceRanges(selectedPriceRanges.filter(r => r !== range));
    } else {
      setSelectedPriceRanges([...selectedPriceRanges, range]);
    }
  };

  // Derive min/max for display from checkboxes if they are selected, otherwise use custom slider state
  let displayMinPrice = customMinPrice;
  let displayMaxPrice = customMaxPrice;
  
  if (selectedPriceRanges.length > 0) {
    const minValues = selectedPriceRanges.map(r => {
      const matches = r.match(/\d+/g);
      return matches && matches.length > 0 ? parseInt(matches[0]) : 10;
    });
    const maxValues = selectedPriceRanges.map(r => {
      const matches = r.match(/\d+/g);
      return matches && matches.length > 1 ? parseInt(matches[1]) : 500;
    });
    displayMinPrice = Math.min(...minValues);
    displayMaxPrice = Math.max(...maxValues);
  }

  const handleSliderChange = (values: [number, number]) => {
    setCustomMinPrice(values[0]);
    setCustomMaxPrice(values[1]);
    // Clear checkboxes if user interacts with custom slider
    if (selectedPriceRanges.length > 0) {
      setSelectedPriceRanges([]);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'State':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.contentTitle}>Find Farmers by State</Text>
            <Text style={styles.contentSubtitle}>Enter your state to find local farmers</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#757575" />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Maharashtra"
                placeholderTextColor="#9E9E9E"
                value={stateForm}
                onChangeText={setStateForm}
              />
            </View>
          </View>
        );
      case 'Village':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.contentTitle}>Find Farmers by Village</Text>
            <Text style={styles.contentSubtitle}>Search for farmers in a specific village</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="home-outline" size={20} color="#757575" />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Ralegan Siddhi"
                placeholderTextColor="#9E9E9E"
                value={villageForm}
                onChangeText={setVillageForm}
              />
            </View>
          </View>
        );
      case 'Category':
        return (
          <ScrollView style={styles.contentSection} showsVerticalScrollIndicator={false}>
            <Text style={styles.contentTitle}>Product Categories</Text>
            <View style={styles.listContainer}>
              {CATEGORIES.map((cat, index) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.checkboxRow}
                    activeOpacity={0.7}
                    onPress={() => toggleCategory(cat)}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        );
      case 'Price':
        // Calculate the width available for the slider. 
        // Screen -> Sidebar (35%) -> Content Area (65%)
        // Content Area padding (40) -> Card Padding (32)
        const sliderAreaWidth = (Dimensions.get('window').width * 0.65) - 40 - 32;

        return (
          <ScrollView style={styles.contentSection} showsVerticalScrollIndicator={false}>
            <Text style={styles.contentTitle}>Price</Text>
            
            {/* Selected Price Range Card */}
            <View style={styles.priceRangeCard}>
              <Text style={styles.priceRangeLabel}>Selected Price Range</Text>
              <Text style={styles.priceRangeValue}>₹{displayMinPrice} - ₹{displayMaxPrice}{displayMaxPrice === 500 ? '+' : ''}</Text>
              
              {/* Functional Custom Slider */}
              <View style={{marginTop: 10, marginBottom: 10}}>
                <CustomRangeSlider
                  min={10}
                  max={500}
                  initialMin={displayMinPrice}
                  initialMax={displayMaxPrice}
                  onValuesChange={handleSliderChange}
                  sliderWidth={sliderAreaWidth}
                />
              </View>
            </View>

            <View style={styles.listContainer}>
              {PRICE_RANGES.map((range, index) => {
                const isSelected = selectedPriceRanges.includes(range);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.checkboxRow}
                    activeOpacity={0.7}
                    onPress={() => togglePriceRange(range)}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelActive]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        );
      default:
        return (
          <View style={styles.contentSectionCenter}>
            <Text style={styles.comingSoonText}>Filter options for {activeTab} coming soon.</Text>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="#424242" />
              <Text style={styles.headerTitle}>Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setStateForm('');
                setVillageForm('');
                setSelectedCategories([]);
                setSelectedPriceRanges([]);
                setCustomMinPrice(10);
                setCustomMaxPrice(500);
              }}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Two-Column Layout */}
          <View style={styles.mainLayout}>
            {/* Left Sidebar */}
            <View style={styles.sidebar}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {TABS.map(tab => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                      onPress={() => setActiveTab(tab)}>
                      <Text style={[styles.sidebarText, isActive && styles.sidebarTextActive]}>
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Right Content */}
            <View style={styles.contentArea}>
              {renderContent()}
            </View>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.applyButton} onPress={() => {
              if (onApply) {
                onApply({
                  state: stateForm,
                  village: villageForm,
                  categories: selectedCategories,
                  priceRanges: selectedPriceRanges,
                  minPrice: displayMinPrice,
                  maxPrice: displayMaxPrice
                });
              }
              onClose();
            }}>
              <Text style={styles.applyButtonText}>See 50000+ products</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    backgroundColor: '#F1F8E9',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginLeft: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#424242',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: '35%',
    backgroundColor: '#E8F5E9', // Light Green background
    borderRightWidth: 1,
    borderRightColor: '#C8E6C9',
  },
  sidebarItem: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: '#FFFFFF',
    borderLeftColor: '#1B5E20', // Green accent
  },
  sidebarText: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '500',
  },
  sidebarTextActive: {
    color: '#1B5E20',
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentSection: {
    padding: 20,
    flex: 1,
  },
  contentSectionCenter: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
  },
  contentSubtitle: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#212121',
  },
  listContainer: {
    marginTop: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9E9E9E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkboxActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#424242',
    flexShrink: 1,
  },
  checkboxLabelActive: {
    fontWeight: '600',
    color: '#212121',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -3},
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  applyButton: {
    backgroundColor: '#1B5E20', // Green Button
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  priceRangeCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  priceRangeLabel: {
    fontSize: 13,
    color: '#616161',
    marginBottom: 8,
  },
  priceRangeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 20,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#1B5E20',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1B5E20',
    top: -10, // Center thumb vertically on track
    marginLeft: -12, // Offset by half width to center on position
  },
  sliderDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 10,
  },
  sliderDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BDBDBD',
  },
});

export default FilterModal;
