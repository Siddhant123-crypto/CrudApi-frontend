import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const FINAL_SPLASH_IMAGE = require('../../assets/farm2home-final-splash.png');
const SPLASH_ASPECT_RATIO = 460 / 1024;
const SPINNER_SIZE = 28;
const SPINNER_STROKE = 2.5;
const SPINNER_RADIUS = (SPINNER_SIZE - SPINNER_STROKE) / 2;
const SPINNER_CIRCUMFERENCE = 2 * Math.PI * SPINNER_RADIUS;

export const PremiumSplashView: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spinValue.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Compute exact rendered rect of resizeMode="contain" artwork so the spinner
  // always sits directly beneath the two-leaf divider (54.0%..58.5% of artwork height).
  const screenAspect = height > 0 ? width / height : SPLASH_ASPECT_RATIO;
  const renderedHeight =
    screenAspect > SPLASH_ASPECT_RATIO ? height : width / SPLASH_ASPECT_RATIO;
  const imageTop = (height - renderedHeight) / 2;
  const spinnerTop = imageTop + renderedHeight * 0.618;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Image
        source={FINAL_SPLASH_IMAGE}
        style={styles.artwork}
        resizeMode="contain"
        fadeDuration={0}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.spinnerContainer,
          {
            top: spinnerTop,
            transform: [{ rotate }],
          },
        ]}
      >
        <Svg width={SPINNER_SIZE} height={SPINNER_SIZE} viewBox={`0 0 ${SPINNER_SIZE} ${SPINNER_SIZE}`}>
          <Circle
            cx={SPINNER_SIZE / 2}
            cy={SPINNER_SIZE / 2}
            r={SPINNER_RADIUS}
            stroke="rgba(154, 230, 53, 0.22)"
            strokeWidth={SPINNER_STROKE}
            fill="none"
          />
          <Circle
            cx={SPINNER_SIZE / 2}
            cy={SPINNER_SIZE / 2}
            r={SPINNER_RADIUS}
            stroke="#9AE635"
            strokeWidth={SPINNER_STROKE}
            strokeDasharray={`${SPINNER_CIRCUMFERENCE * 0.28} ${SPINNER_CIRCUMFERENCE * 0.72}`}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05290F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  spinnerContainer: {
    position: 'absolute',
    alignSelf: 'center',
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PremiumSplashView;
