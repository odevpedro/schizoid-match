import React, { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LoginScreen } from './screens/auth/LoginScreen';
import { RegisterScreen } from './screens/auth/RegisterScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { MatchScreen } from './screens/match/MatchScreen';
import { ChallengesScreen } from './screens/challenges/ChallengesScreen';
import { MessagesScreen } from './screens/chat/MessagesScreen';
import { ChatScreen } from './screens/chat/ChatScreen';
import { PrivacyScreen } from './screens/privacy/PrivacyScreen';
import { WatchConnectionScreen } from './screens/onboarding/WatchConnectionScreen';
import { OnboardingIntroScreen } from './screens/onboarding/OnboardingIntroScreen';
import { OnboardingIntentScreen } from './screens/onboarding/OnboardingIntentScreen';
import { OnboardingGoalsScreen } from './screens/onboarding/OnboardingGoalsScreen';
import { OnboardingActivitiesScreen } from './screens/onboarding/OnboardingActivitiesScreen';
import { OnboardingAvailabilityScreen } from './screens/onboarding/OnboardingAvailabilityScreen';
import { OnboardingIntensityScreen } from './screens/onboarding/OnboardingIntensityScreen';
import { OnboardingPrivacyScreen } from './screens/onboarding/OnboardingPrivacyScreen';
import { OnboardingSourceScreen } from './screens/onboarding/OnboardingSourceScreen';
import { OnboardingCompletedScreen } from './screens/onboarding/OnboardingCompletedScreen';
import { colors } from './theme/colors';
import { useAuthStore } from './store/auth.slice';

type AuthRoute = 'Login' | 'Register';
type AppRoute = 'Profile' | 'Match' | 'Challenges' | 'Messages' | 'Chat' | 'Privacy' | 'WatchConnection';
type OnboardingRoute =
  | 'OnboardingIntro'
  | 'OnboardingIntent'
  | 'OnboardingGoals'
  | 'OnboardingActivities'
  | 'OnboardingAvailability'
  | 'OnboardingIntensity'
  | 'OnboardingPrivacy'
  | 'OnboardingSource'
  | 'OnboardingCompleted';
type RouteParams = Record<string, any> | undefined;

const queryClient = new QueryClient();

const TABS: Array<{ route: AppRoute; label: string }> = [
  { route: 'Profile', label: 'Perfil' },
  { route: 'Match', label: 'Match' },
  { route: 'Challenges', label: 'Desafios' },
  { route: 'Messages', label: 'Mensagens' },
];

const WebShell = () => {
  const [authRoute, setAuthRoute] = useState<AuthRoute>('Login');
  const [appRoute, setAppRoute] = useState<AppRoute>('Profile');
  const [onboardingRoute, setOnboardingRoute] = useState<OnboardingRoute>('OnboardingIntro');
  const [routeParams, setRouteParams] = useState<RouteParams>();
  const { isAuthenticated, isLoading, onboardingCompleted, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isAuthenticated && !onboardingCompleted) {
      setOnboardingRoute('OnboardingIntro');
    }
  }, [isAuthenticated, onboardingCompleted]);

  const authNavigation = useMemo(
    () => ({
      navigate: (route: AuthRoute) => setAuthRoute(route),
      goBack: () => setAuthRoute('Login'),
    }),
    [],
  );

  const appNavigation = useMemo(
    () => ({
      navigate: (route: AppRoute, params?: RouteParams) => {
        setRouteParams(params);
        setAppRoute(route);
      },
      goBack: () => {
        setRouteParams(undefined);
        setAppRoute(appRoute === 'Chat' ? 'Messages' : 'Profile');
      },
      setOptions: () => {},
    }),
    [appRoute],
  );

  const onboardingNavigation = useMemo(
    () => ({
      navigate: (route: OnboardingRoute) => setOnboardingRoute(route),
      goBack: () => setOnboardingRoute('OnboardingIntro'),
      setOptions: () => {},
    }),
    [],
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return authRoute === 'Register'
      ? <RegisterScreen navigation={authNavigation} />
      : <LoginScreen navigation={authNavigation} />;
  }

  if (!onboardingCompleted) {
    const OnboardingScreen =
      onboardingRoute === 'OnboardingIntent' ? OnboardingIntentScreen
        : onboardingRoute === 'OnboardingGoals' ? OnboardingGoalsScreen
          : onboardingRoute === 'OnboardingActivities' ? OnboardingActivitiesScreen
            : onboardingRoute === 'OnboardingAvailability' ? OnboardingAvailabilityScreen
              : onboardingRoute === 'OnboardingIntensity' ? OnboardingIntensityScreen
                : onboardingRoute === 'OnboardingPrivacy' ? OnboardingPrivacyScreen
                  : onboardingRoute === 'OnboardingSource' ? OnboardingSourceScreen
                    : onboardingRoute === 'OnboardingCompleted' ? OnboardingCompletedScreen
                      : OnboardingIntroScreen;

    return <OnboardingScreen navigation={onboardingNavigation as any} />;
  }

  const Screen =
    appRoute === 'Match' ? MatchScreen
      : appRoute === 'Challenges' ? ChallengesScreen
        : appRoute === 'Messages' ? MessagesScreen
          : appRoute === 'Chat' ? ChatScreen
            : appRoute === 'Privacy' ? PrivacyScreen
              : appRoute === 'WatchConnection' ? WatchConnectionScreen
                : ProfileScreen;

  const route = { params: routeParams ?? {} };

  return (
    <View style={styles.app}>
      <View style={styles.screen}>
        <Screen navigation={appNavigation as any} route={route as any} />
      </View>
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.route}
            onPress={() => setAppRoute(tab.route)}
            style={[styles.tab, appRoute === tab.route && styles.activeTab]}
          >
            <Text style={[styles.tabText, appRoute === tab.route && styles.activeTabText]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export const WebApp = () => (
  <QueryClientProvider client={queryClient}>
    <WebShell />
  </QueryClientProvider>
);

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, minHeight: 0 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textMuted, fontSize: 16 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
  },
  activeTab: { backgroundColor: colors.primaryDim },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  activeTabText: { color: colors.primary },
});
