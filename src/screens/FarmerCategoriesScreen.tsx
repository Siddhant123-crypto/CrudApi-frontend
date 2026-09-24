import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';

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

  const getCategoryStyles = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('veg')) return { icon: 'leaf', color: '#1E8E3E', bg: '#E6F4EA' };
    if (n.includes('fruit')) return { icon: 'nutrition', color: '#D93025', bg: '#FCE8E6' };
    if (n.includes('root')) return { icon: 'rose', color: '#E8710A', bg: '#FCEFE2' };
    if (n.includes('grain')) return { icon: 'basket', color: '#F9AB00', bg: '#FFF0D4' };
    if (n.includes('dairy') || n.includes('milk')) return { icon: 'water', color: '#1A73E8', bg: '#E8F0FE' };
    if (n.includes('spice')) return { icon: 'flame', color: '#EA4335', bg: '#FCE8E6' };
    return { icon: 'grid', color: '#9334E6', bg: '#F3E8FD' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm Categories</Text>
        <View style={{ width: 32 }} />
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E5631" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Choose a category to manage your products</Text>
          <View style={styles.grid}>
            {categories.map((category) => {
              const stylesObj = getCategoryStyles(category.name);
              return (
                <TouchableOpacity
                  key={category.categoryId || category.name}
                  style={styles.card}
                  onPress={() => navigation.navigate('FarmerCategoryDashboard', { category: category.name })}
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
                    <Ionicons name={stylesObj.icon as any} size={32} color={stylesObj.color} />
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E5631',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '47%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
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
export default FarmerCategoriesScreen;
