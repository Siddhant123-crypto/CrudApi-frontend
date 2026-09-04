import React, {useState, useRef, useEffect} from 'react';
import {View, StyleSheet, PanResponder, Animated} from 'react-native';

interface CustomRangeSliderProps {
  min: number;
  max: number;
  initialMin: number;
  initialMax: number;
  onValuesChange: (values: [number, number]) => void;
  sliderWidth: number;
}

const CustomRangeSlider: React.FC<CustomRangeSliderProps> = ({
  min,
  max,
  initialMin,
  initialMax,
  onValuesChange,
  sliderWidth,
}) => {
  const range = max - min;
  const thumbWidth = 24;
  const usableWidth = sliderWidth - thumbWidth;

  const getPosition = (val: number) => {
    return ((val - min) / range) * usableWidth;
  };

  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(initialMax);

  const minValRef = useRef(initialMin);
  const maxValRef = useRef(initialMax);

  useEffect(() => {
    minValRef.current = minVal;
    maxValRef.current = maxVal;
  }, [minVal, maxVal]);

  // Sync state if props change externally
  useEffect(() => {
    setMinVal(initialMin);
    setMaxVal(initialMax);
    minValRef.current = initialMin;
    maxValRef.current = initialMax;
    position1.setValue(getPosition(initialMin));
    position2.setValue(getPosition(initialMax));
  }, [initialMin, initialMax]);

  const position1 = useRef(new Animated.Value(getPosition(initialMin))).current;
  const position2 = useRef(new Animated.Value(getPosition(initialMax))).current;

  // Track the actual positions in JS so PanResponder can use them synchronously
  const pos1Value = useRef(getPosition(initialMin));
  const pos2Value = useRef(getPosition(initialMax));

  useEffect(() => {
    const id1 = position1.addListener(({value}) => {
      pos1Value.current = value;
    });
    const id2 = position2.addListener(({value}) => {
      pos2Value.current = value;
    });
    return () => {
      position1.removeListener(id1);
      position2.removeListener(id2);
    };
  }, [position1, position2]);

  const panResponder1 = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        position1.setOffset(pos1Value.current);
        position1.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        let newX = gestureState.dx;
        const projectedAbsoluteX = pos1Value.current + newX;
        
        // Boundaries
        if (projectedAbsoluteX < 0) newX = -pos1Value.current;
        if (projectedAbsoluteX > pos2Value.current - thumbWidth) {
          newX = pos2Value.current - thumbWidth - pos1Value.current;
        }

        position1.setValue(newX);
        
        // Calculate real-time value to display
        const absolutePos = pos1Value.current + newX;
        const val = Math.round((absolutePos / usableWidth) * range + min);
        setMinVal(val);
      },
      onPanResponderRelease: () => {
        position1.flattenOffset();
        const val = Math.round((pos1Value.current / usableWidth) * range + min);
        onValuesChange([val, maxValRef.current]);
      },
    })
  ).current;

  const panResponder2 = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        position2.setOffset(pos2Value.current);
        position2.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        let newX = gestureState.dx;
        const projectedAbsoluteX = pos2Value.current + newX;
        
        // Boundaries
        if (projectedAbsoluteX > usableWidth) newX = usableWidth - pos2Value.current;
        if (projectedAbsoluteX < pos1Value.current + thumbWidth) {
          newX = pos1Value.current + thumbWidth - pos2Value.current;
        }

        position2.setValue(newX);
        
        // Calculate real-time value to display
        const absolutePos = pos2Value.current + newX;
        const val = Math.round((absolutePos / usableWidth) * range + min);
        setMaxVal(val);
      },
      onPanResponderRelease: () => {
        position2.flattenOffset();
        const val = Math.round((pos2Value.current / usableWidth) * range + min);
        onValuesChange([minValRef.current, val]);
      },
    })
  ).current;

  return (
    <View style={[styles.container, {width: sliderWidth}]}>
      {/* Background Track */}
      <View style={styles.track} />

      {/* Selected Range Fill */}
      <Animated.View
        style={[
          styles.fill,
          {
            left: position1.interpolate({
              inputRange: [0, usableWidth],
              outputRange: [thumbWidth / 2, usableWidth + thumbWidth / 2],
            }),
            width: Animated.subtract(position2, position1),
          },
        ]}
      />

      {/* Thumb 1 (Min) */}
      <Animated.View
        style={[styles.thumb, {transform: [{translateX: position1}]}]}
        {...panResponder1.panHandlers}>
        <View style={styles.thumbInner} />
      </Animated.View>

      {/* Thumb 2 (Max) */}
      <Animated.View
        style={[styles.thumb, {transform: [{translateX: position2}]}]}
        {...panResponder2.panHandlers}>
        <View style={styles.thumbInner} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  fill: {
    height: 4,
    backgroundColor: '#1B5E20',
    borderRadius: 2,
    position: 'absolute',
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  thumbInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1B5E20',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default CustomRangeSlider;
