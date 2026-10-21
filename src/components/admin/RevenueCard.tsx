import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { ADMIN_THEME } from '../../constants/adminTheme';
import { ChevronDownIcon } from './AdminIcons';

interface RevenueCardProps {
  revenue?: string;
  period?: string;
  onPeriodPress?: () => void;
  growthText?: string;
  isGrowthPositive?: boolean;
  chartData?: number[];
}

/**
 * Hardcoded static chart constants.
 * Captures the exact 6 data points [12, 28, 15, 22, 18, 30] and fixed Y-axis (0, 10, 20, 30).
 * Completely decoupled from dynamic revenue data.
 */
export const STATIC_REVENUE_CHART_POINTS = [
  { x: 14, y: 46 },
  { x: 70.4, y: 14 },
  { x: 126.8, y: 40 },
  { x: 183.2, y: 26 },
  { x: 239.6, y: 34 },
  { x: 296, y: 10 },
] as const;

export const STATIC_GRID_LINES = [
  { value: 0, y: 70 },
  { value: 10, y: 50 },
  { value: 20, y: 30 },
  { value: 30, y: 10 },
] as const;

export const STATIC_AREA_PATH =
  'M 14 46 L 70.4 14.0 L 126.8 40.0 L 183.2 26.0 L 239.6 34.0 L 296.0 10.0 L 296.0 72 L 14.0 72 Z';

export const STATIC_LINE_PATH =
  'M 14 46 L 70.4 14.0 L 126.8 40.0 L 183.2 26.0 L 239.6 34.0 L 296.0 10.0';

/**
 * Static frozen revenue chart widget.
 * Stateless and memoized with zero props; will never re-render or re-animate.
 */
const StaticRevenueChart: React.FC = React.memo(() => {
  return (
    <View style={styles.chartWrapper}>
      <Svg
        width="100%"
        height="100%"
        viewBox="-4 -4 312 84"
      >
        <Defs>
          <SvgGradient id="ar" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ADMIN_THEME.colors.gold} stopOpacity="0.35" />
            <Stop offset="1" stopColor={ADMIN_THEME.colors.gold} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Fixed grid horizontal lines & Y-labels (0, 10, 20, 30) */}
        {STATIC_GRID_LINES.map(({ value, y }) => (
          <React.Fragment key={`grid-${value}`}>
            <Line
              x1={14}
              y1={y}
              x2={296}
              y2={y}
              stroke="#FFFFFF"
              strokeOpacity={0.08}
            />
            <SvgText
              x={0}
              y={y + 3.5}
              fontSize={9.5}
              fill="rgba(255,255,255,0.45)"
              fontFamily={ADMIN_THEME.fonts.medium}
            >
              {value}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Static Area Fill & Line Path */}
        <Path d={STATIC_AREA_PATH} fill="url(#ar)" />
        <Path
          d={STATIC_LINE_PATH}
          stroke={ADMIN_THEME.colors.gold}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Static Gold Data Point Circles */}
        {STATIC_REVENUE_CHART_POINTS.map((p, idx) => (
          <Circle
            key={`point-${idx}`}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="#0B1326"
            stroke={ADMIN_THEME.colors.gold}
            strokeWidth={1.8}
          />
        ))}
      </Svg>
    </View>
  );
});

export const RevenueCard: React.FC<RevenueCardProps> = ({
  revenue = '₹17,081',
  period = 'This month',
  onPeriodPress,
  growthText = '↑ 18% from last month',
  isGrowthPositive = true,
}) => {
  return (
    <View style={styles.cardShadow}>
      <LinearGradient
        colors={ADMIN_THEME.colors.revenueCardGradient}
        start={ADMIN_THEME.colors.revenueCardStart}
        end={ADMIN_THEME.colors.revenueCardEnd}
        style={styles.container}
      >
        {/* Decorative circle */}
        <Svg
          width={180}
          height={180}
          style={styles.decorativeCircle}
          pointerEvents="none"
        >
          <Circle cx={90} cy={90} r={90} fill={ADMIN_THEME.colors.gold} opacity={0.12} />
        </Svg>

        {/* Top row */}
        <View style={styles.topRow}>
          <Text style={styles.label}>Revenue overview</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.periodPill}
            onPress={onPeriodPress}
          >
            <Text style={styles.periodText}>{period}</Text>
            <ChevronDownIcon size={12} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* Amount (dynamically updated from live data) */}
        <Text style={styles.amount}>{revenue}</Text>

        {/* Growth chip */}
        {growthText ? (
          <View
            style={[
              styles.growthChip,
              {
                backgroundColor: isGrowthPositive
                  ? ADMIN_THEME.colors.growthPositiveBg
                  : ADMIN_THEME.colors.growthNegativeBg,
              },
            ]}
          >
            <Text
              style={[
                styles.growthText,
                {
                  color: isGrowthPositive
                    ? ADMIN_THEME.colors.growthPositiveText
                    : ADMIN_THEME.colors.growthNegativeText,
                },
              ]}
            >
              {growthText}
            </Text>
          </View>
        ) : null}

        {/* Static Frozen Line Chart */}
        <StaticRevenueChart />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    marginTop: 14,
    borderRadius: ADMIN_THEME.radius.revenueCard,
    ...ADMIN_THEME.shadows.revenueCard,
  },
  container: {
    borderRadius: ADMIN_THEME.radius.revenueCard,
    padding: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle: {
    position: 'absolute',
    right: -50,
    top: -60,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: ADMIN_THEME.fonts.semiBold,
    fontSize: 11.5,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.7)',
  },
  periodPill: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: ADMIN_THEME.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  periodText: {
    fontFamily: ADMIN_THEME.fonts.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  amount: {
    marginTop: 8,
    fontFamily: ADMIN_THEME.fonts.serif,
    fontSize: 28,
    color: '#FFFFFF',
  },
  growthChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: ADMIN_THEME.radius.pill,
  },
  growthText: {
    fontFamily: ADMIN_THEME.fonts.bold,
    fontSize: 11,
  },
  chartWrapper: {
    marginTop: 8,
    width: '100%',
    aspectRatio: 312 / 84,
  },
});
