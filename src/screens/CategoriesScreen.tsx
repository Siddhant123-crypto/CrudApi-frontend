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
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { THEME } from '../constants/theme';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { Card } from '../components/ui/Card';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 40 - 12) / 2;

const CategoriesScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { cartCount } = useCart();

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

  const getCategoryEmojiOrIcon = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('fruit')) return { emoji: '🍎', icon: 'nutrition' };
    if (n.includes('dairy') || n.includes('milk')) return { emoji: '🥛', icon: 'water' };
    if (n.includes('wild') || n.includes('forest')) return { emoji: '🌿', icon: 'leaf' };
    if (n.includes('veg')) return { emoji: '🥬', icon: 'leaf' };
    if (n.includes('grain') || n.includes('wheat') || n.includes('rice')) return { emoji: '🌾', icon: 'basket' };
    if (n.includes('pulse') || n.includes('dal') || n.includes('bean')) return { emoji: '🫘', icon: 'basket' };
    if (n.includes('spice')) return { emoji: '🌶️', icon: 'flame' };
    return { emoji: '🌱', icon: 'grid' };
  };

  return (
    <PageBackground>
      <ThemedHeader
        variant="tab"
        title="Categories"
        subtitle="Explore fresh farm produce"
        titleStyle={{ fontSize: 21 }}
        showCart
        cartCount={cartCount}
        showBell
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.accentDeep} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {categories.map((category) => {
              const info = getCategoryEmojiOrIcon(category.name);
              return (
                <Card
                  key={category.categoryId || category.name}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('CategoryDashboard', { category: category.name })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.iconTile}>
                    <Svg width={72} height={72} style={StyleSheet.absoluteFill}>
                      <Defs>
                        <RadialGradient id={`catRadial-${category.name}`} cx="50%" cy="50%" r="50%">
                          <Stop offset="0%" stopColor={THEME.colors.tileRadialStart} />
                          <Stop offset="65%" stopColor={THEME.colors.tileRadialMiddle} />
                          <Stop offset="100%" stopColor={THEME.colors.tileRadialEnd} />
                        </RadialGradient>
                      </Defs>
                      <Rect
                        x="0"
                        y="0"
                        width="72"
                        height="72"
                        rx="20"
                        fill={`url(#catRadial-${category.name})`}
                      />
                    </Svg>
                    <Text style={styles.emojiText}>{info.emoji}</Text>
                  </View>
                  <Text style={styles.name} numberOfLines={2}>
                    {category.name}
                  </Text>
                </Card>
              );
            })}
          </View>
        </ScrollView>
      )}
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.pageHorizontal,
    paddingTop: 18,
    paddingBottom: 130, // Space for floating bottom nav
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.cardGap,
  },
  card: {
    width: CARD_WIDTH,
    height: 146,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: THEME.radius.cards,
  },
  iconTile: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  emojiText: {
    fontSize: 34,
  },
  name: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: THEME.colors.textHeading,
    textAlign: 'center',
  },
});

export default CategoriesScreen;
