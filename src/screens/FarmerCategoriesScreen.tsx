import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerEmptyState } from '../components/farmer/FarmerUI';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const FarmerCategoriesScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.data && res.data.data) {
        setCategories(res.data.data.filter((c: any) => c.isActive));
      }
    } catch (error) {
      console.log('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTheme = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('root') || n.includes('tuber')) {
      return { icon: 'nutrition-outline', color: '#C2410C', bg: '#FFEDD5' };
    }
    if (n.includes('wild') || n.includes('forest')) {
      return { icon: 'leaf-outline', color: '#047857', bg: '#D1FAE5' };
    }
    if (n.includes('veg')) {
      return { icon: 'leaf', color: FARMER_THEME.colors.forestGreen, bg: FARMER_THEME.colors.pastelGreen };
    }
    if (n.includes('fruit')) {
      return { icon: 'nutrition', color: '#B91C1C', bg: '#FEE2E2' };
    }
    if (n.includes('grain') || n.includes('pulse')) {
      return { icon: 'basket', color: '#B45309', bg: FARMER_THEME.colors.pastelGold };
    }
    if (n.includes('dairy') || n.includes('milk')) {
      return { icon: 'water', color: '#0369A1', bg: '#E0F2FE' };
    }
    if (n.includes('spice') || n.includes('herb')) {
      return { icon: 'flame', color: '#DC2626', bg: '#FFE4E6' };
    }
    return { icon: 'grid', color: FARMER_THEME.colors.forestGreen, bg: FARMER_THEME.colors.pastelMint };
  };

  return (
    <FarmerPageBackground>
      {/* Inner FarmerHeader */}
      <FarmerHeader
        variant="inner"
        title="Farm Categories"
        titleAlign="left"
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={FARMER_THEME.colors.emeraldPrimary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.guideText}>
            Select a category to view and manage your farm products
          </Text>

          {categories.length === 0 ? (
            <FarmerEmptyState
              icon={<Ionicons name="grid-outline" size={48} color={FARMER_THEME.colors.sageText} />}
              title="No Categories Available"
              subtitle="Categories configured on the marketplace will appear here."
              style={{ marginTop: 40 }}
            />
          ) : (
            <View style={styles.grid}>
              {categories.map((category) => {
                const theme = getCategoryTheme(category.name);
                return (
                  <TouchableOpacity
                    key={category.categoryId || category.name}
                    style={styles.cardTouchable}
                    onPress={() =>
                      navigation.navigate('FarmerCategoryDashboard', { category: category.name })
                    }
                    activeOpacity={0.8}
                  >
                    <FarmerCard style={styles.categoryCard}>
                      <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
                        <Ionicons name={theme.icon as any} size={24} color={theme.color} />
                      </View>
                      <View style={styles.nameContainer}>
                        <Text style={styles.categoryName} numberOfLines={2}>
                          {category.name}
                        </Text>
                      </View>
                      <View style={styles.viewBadge}>
                        <Text style={styles.viewBadgeText}>Browse</Text>
                        <Ionicons name="chevron-forward" size={11} color={FARMER_THEME.colors.forestGreen} />
                      </View>
                    </FarmerCard>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  guideText: {
    fontFamily: FARMER_THEME.typography.fontFamilyRegular,
    fontSize: 13,
    color: FARMER_THEME.colors.sageText,
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardTouchable: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  categoryCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  nameContainer: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    paddingHorizontal: 2,
  },
  categoryName: {
    fontFamily: FARMER_THEME.typography.fontFamilyBold,
    fontSize: 13,
    lineHeight: 17,
    color: FARMER_THEME.colors.forestGreen,
    textAlign: 'center',
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  viewBadgeText: {
    fontFamily: FARMER_THEME.typography.fontFamilyMedium,
    fontSize: 10.5,
    color: FARMER_THEME.colors.forestGreen,
    marginRight: 2,
  },
});

export default FarmerCategoriesScreen;
