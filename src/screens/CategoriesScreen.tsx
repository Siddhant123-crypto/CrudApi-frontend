import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const CategoriesScreen = ({ navigation }: any) => {
  const categories = [
    { name: 'Vegetable',       icon: 'leaf',       color: '#10B981', bg: '#E6F4EA' },
    { name: 'Fruit',           icon: 'nutrition',  color: '#F59E0B', bg: '#FFF3E0' },
    { name: 'Root Vegetable',  icon: 'rose',       color: '#EC4899', bg: '#FCE4EC' },
    { name: 'Grains',          icon: 'basket',     color: '#D97706', bg: '#FEF3C7' },
    { name: 'Wild Veggies',    icon: 'flower',     color: '#8B5CF6', bg: '#F3E5F5' },
    { name: 'Dairy',           icon: 'water',      color: '#3B82F6', bg: '#DBEAFE' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Categories</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={styles.card}
              onPress={() => navigation.navigate('CategoryDashboard', { category: category.name })}
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
                <Ionicons name={category.icon as any} size={30} color={category.color} />
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
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
