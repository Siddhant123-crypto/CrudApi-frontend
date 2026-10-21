import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface FarmerCategoryTileProps {
  name: string;
  index: number;
  iconUrl?: string | null;
  onPress: () => void;
}

const PASTEL_COLORS = [
  '#FFE3DC',
  '#E3EEFF',
  '#DDF3E4',
  '#E4F5D6',
  '#FFF0CC',
  '#F3E3D3',
];

const getCategoryEmoji = (name: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('fruit')) return '🍎';
  if (n.includes('dairy') || n.includes('milk')) return '🥛';
  if (n.includes('forest') || n.includes('wild')) return '🌿';
  if (n.includes('veg')) return '🥬';
  if (n.includes('grain') || n.includes('wheat') || n.includes('rice')) return '🌾';
  if (n.includes('pulse') || n.includes('bean') || n.includes('dal')) return '🫘';
  if (n.includes('honey')) return '🍯';
  if (n.includes('flower')) return '🌸';
  if (n.includes('spice') || n.includes('chilli')) return '🌶️';
  if (n.includes('nut')) return '🥜';
  if (n.includes('root') || n.includes('potato') || n.includes('carrot')) return '🥕';
  if (n.includes('egg') || n.includes('poultry')) return '🥚';
  return '🧺';
};

export const FarmerCategoryTile: React.FC<FarmerCategoryTileProps> = ({
  name,
  index,
  iconUrl,
  onPress,
}) => {
  const bgColor = PASTEL_COLORS[index % PASTEL_COLORS.length];
  const emoji = getCategoryEmoji(name);

  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        {iconUrl ? (
          <Image
            source={{ uri: iconUrl }}
            style={styles.categoryImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.emojiText}>{emoji}</Text>
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: 76,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 5,
    borderRadius: 18,
    backgroundColor: FARMER_THEME.colors.cardBg,
    alignItems: 'center',
    ...FARMER_THEME.shadows.tile,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImage: {
    width: 22,
    height: 22,
  },
  emojiText: {
    fontSize: 22,
    textAlign: 'center',
  },
  label: {
    marginTop: 4,
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 10.5,
    color: FARMER_THEME.colors.darkGreen,
    textAlign: 'center',
  },
});

export default FarmerCategoryTile;
