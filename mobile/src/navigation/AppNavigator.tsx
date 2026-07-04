import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.slice';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { socketService } from '../services/socket.service';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, onboardingCompleted, restoreSession, checkOnboardingStatus } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
      if (!onboardingCompleted) checkOnboardingStatus();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated && <AuthNavigator />}
      {isAuthenticated && !onboardingCompleted && <OnboardingNavigator />}
      {isAuthenticated && onboardingCompleted && <MainNavigator />}
    </NavigationContainer>
  );
};
