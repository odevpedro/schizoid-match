import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingIntroScreen } from '../screens/onboarding/OnboardingIntroScreen';
import { OnboardingIntentScreen } from '../screens/onboarding/OnboardingIntentScreen';
import { OnboardingGoalsScreen } from '../screens/onboarding/OnboardingGoalsScreen';
import { OnboardingActivitiesScreen } from '../screens/onboarding/OnboardingActivitiesScreen';
import { OnboardingAvailabilityScreen } from '../screens/onboarding/OnboardingAvailabilityScreen';
import { OnboardingIntensityScreen } from '../screens/onboarding/OnboardingIntensityScreen';
import { OnboardingPrivacyScreen } from '../screens/onboarding/OnboardingPrivacyScreen';
import { OnboardingSourceScreen } from '../screens/onboarding/OnboardingSourceScreen';
import { OnboardingCompletedScreen } from '../screens/onboarding/OnboardingCompletedScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="OnboardingIntro" component={OnboardingIntroScreen} />
    <Stack.Screen name="OnboardingIntent" component={OnboardingIntentScreen} />
    <Stack.Screen name="OnboardingGoals" component={OnboardingGoalsScreen} />
    <Stack.Screen name="OnboardingActivities" component={OnboardingActivitiesScreen} />
    <Stack.Screen name="OnboardingAvailability" component={OnboardingAvailabilityScreen} />
    <Stack.Screen name="OnboardingIntensity" component={OnboardingIntensityScreen} />
    <Stack.Screen name="OnboardingPrivacy" component={OnboardingPrivacyScreen} />
    <Stack.Screen name="OnboardingSource" component={OnboardingSourceScreen} />
    <Stack.Screen name="OnboardingCompleted" component={OnboardingCompletedScreen} />
  </Stack.Navigator>
);
