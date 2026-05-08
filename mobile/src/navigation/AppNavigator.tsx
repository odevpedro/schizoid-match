import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.slice';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { socketService } from '../services/socket.service';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
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
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
