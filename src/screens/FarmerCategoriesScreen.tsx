import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
const FarmerCategoriesScreen = ({ navigation }: any) => {
  const categories = [
    { name: 'Vegetable',       icon: 'leaf',       color: '#1E8E3E', bg: '#E6F4EA' },
    { name: 'Fruit',           icon: 'nutrition',  color: '#D93025', bg: '#FCE8E6' },
    { name: 'Root Veg',        icon: 'rose',       color: '#E8710A', bg: '#FCEFE2' },
    { name: 'Grains',          icon: 'basket',     color: '#F9AB00', bg: '#FFF0D4' },
    { name: 'Wild Veg',        icon: 'flower',     color: '#9334E6', bg: '#F3E8FD' },
    { name: 'Dairy',           icon: 'water',      color: '#1A73E8', bg: '#E8F0FE' },
  ];
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm Categories</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Choose a category to manage your products</Text>
        <View style={styles.grid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={styles.card}
              onPress={() => navigation.navigate('FarmerCategoryDashboard', { category: category.name })}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: category.bg,
                    borderColor: category.color,
                    borderWidth: 2,
                  }
                ]}
              >
                <Ionicons name={category.icon as any} size={32} color={category.color} />
              </View>
              <Text style={styles.name}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#176B2C',
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
