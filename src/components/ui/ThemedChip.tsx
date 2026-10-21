import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { THEME } from '../../constants/theme';

interface ThemedChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  count?: number;
}

export const ThemedChip: React.FC<ThemedChipProps> = ({
  label,
  selected,
  onPress,
  style,
  textStyle,
  count,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipInactive,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text
        style={[styles.chipText, selected ? styles.textSelected : styles.textInactive, textStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.badge, selected ? styles.badgeSelected : styles.badgeInactive]}>
          <Text style={[styles.badgeText, selected ? styles.badgeTextSelected : styles.badgeTextInactive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface SegmentedTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: { [key: string]: number };
  containerStyle?: StyleProp<ViewStyle>;
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  counts,
  containerStyle,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.tabsContainer, containerStyle]}
    >
      {tabs.map(tab => (
        <ThemedChip
          key={tab}
          label={tab}
          selected={activeTab === tab}
          onPress={() => onTabChange(tab)}
          count={counts?.[tab]}
          style={styles.tabSpacing}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 36,
    borderRadius: THEME.radius.chips,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  chipInactive: {
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  chipSelected: {
    backgroundColor: THEME.colors.selectedBg,
    borderWidth: 1,
    borderColor: THEME.colors.selectedBorder,
  },
  chipText: {
    fontSize: 13,
  },
  textInactive: {
    fontFamily: THEME.fonts.semiBold,
    color: THEME.colors.textSecondary,
  },
  textSelected: {
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.selectedText,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeInactive: {
    backgroundColor: '#F0E1CF',
  },
  badgeSelected: {
    backgroundColor: '#E8A56B',
  },
  badgeText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 10,
  },
  badgeTextInactive: {
    color: THEME.colors.textSecondary,
  },
  badgeTextSelected: {
    color: THEME.colors.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.pageHorizontal,
    paddingVertical: 10,
  },
  tabSpacing: {
    marginRight: 8,
  },
});

export default ThemedChip;
