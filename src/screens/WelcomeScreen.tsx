import React, { useEffect } from 'react';
import { hasUserSelectedLanguage, initAppLanguage } from '../i18n';
import { PremiumSplashView } from '../components/PremiumSplashView';

const WelcomeScreen = ({ navigation }: any) => {
  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const prepareAndNavigate = async () => {
      try {
        await initAppLanguage();
        const hasSelected = await hasUserSelectedLanguage();

        timer = setTimeout(() => {
          if (!isMounted) return;
          if (!hasSelected) {
            navigation.replace('LanguageSelection', { fromSettings: false });
          } else {
            navigation.replace('NewUserLogin');
          }
        }, 2200);
      } catch (err) {
        timer = setTimeout(() => {
          if (isMounted) {
            navigation.replace('NewUserLogin');
          }
        }, 2200);
      }
    };

    prepareAndNavigate();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [navigation]);

  return <PremiumSplashView />;
};

export default WelcomeScreen;
