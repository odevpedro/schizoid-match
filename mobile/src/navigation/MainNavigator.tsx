import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../theme/colors';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MatchScreen } from '../screens/match/MatchScreen';
import { ChallengesScreen } from '../screens/challenges/ChallengesScreen';
import { MessagesScreen } from '../screens/chat/MessagesScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { PrivacyScreen } from '../screens/privacy/PrivacyScreen';
import { WatchConnectionScreen } from '../screens/onboarding/WatchConnectionScreen';
import { ReportUserScreen } from '../screens/moderation/ReportUserScreen';
import { BlockedUsersScreen } from '../screens/moderation/BlockedUsersScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Profile: '👤',
  Match: '♥',
  Challenges: '🏆',
  Messages: '💬',
};

const MessagesStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
    <Stack.Screen name="MessagesList" component={MessagesScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacidade' }} />
    <Stack.Screen name="WatchConnection" component={WatchConnectionScreen} options={{ title: 'Smartwatch' }} />
    <Stack.Screen name="ReportUser" component={ReportUserScreen} options={{ title: 'Denunciar' }} />
    <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ title: 'Bloqueados' }} />
  </Stack.Navigator>
);

const MatchStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
    <Stack.Screen name="MatchMain" component={MatchScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

export const MainNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarIcon: ({ focused }) => (
        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
          {TAB_ICONS[route.name] ?? '●'}
        </Text>
      ),
    })}
  >
    <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: 'Perfil' }} />
    <Tab.Screen name="Match" component={MatchStack} options={{ tabBarLabel: 'Match' }} />
    <Tab.Screen name="Challenges" component={ChallengesScreen} options={{ tabBarLabel: 'Desafios' }} />
    <Tab.Screen name="Messages" component={MessagesStack} options={{ tabBarLabel: 'Mensagens' }} />
  </Tab.Navigator>
);
