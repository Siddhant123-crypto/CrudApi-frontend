import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';

const CategoriesScreen = ({ navigation }: any) => {
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

  const getCategoryStyles = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('veg')) return { icon: 'leaf', color: '#10B981', bg: '#E6F4EA' };
    if (n.includes('fruit')) return { icon: 'nutrition', color: '#F59E0B', bg: '#FFF3E0' };
    if (n.includes('root')) return { icon: 'rose', color: '#EC4899', bg: '#FCE4EC' };
    if (n.includes('grain')) return { icon: 'basket', color: '#D97706', bg: '#FEF3C7' };
    if (n.includes('dairy') || n.includes('milk')) return { icon: 'water', color: '#3B82F6', bg: '#DBEAFE' };
    if (n.includes('spice')) return { icon: 'flame', color: '#EA4335', bg: '#FCE8E6' };
    return { icon: 'grid', color: '#8B5CF6', bg: '#F3E5F5' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Categories</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {categories.map((category) => {
              const stylesObj = getCategoryStyles(category.name);
              return (
                <TouchableOpacity
                  key={category.categoryId || category.name}
                  style={styles.card}
                  onPress={() => navigation.navigate('CategoryDashboard', { category: category.name })}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: stylesObj.bg,
                        borderColor: stylesObj.color,
                        borderWidth: 2,
                      }
                    ]}
                  >
                    <Ionicons name={stylesObj.icon as any} size={30} color={stylesObj.color} />
                  </View>
                  <Text style={styles.name}>{category.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '47%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
});
export default CategoriesScreen;
