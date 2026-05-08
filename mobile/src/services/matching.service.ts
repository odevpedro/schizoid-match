import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { PublicHealthProfile, Match, SwipeDirection } from '../types/match.types';
import { DEMO_TOKEN, mockCandidates } from './mock-data';

const isDemo = async () => (await AsyncStorage.getItem('@wellmatch:token')) === DEMO_TOKEN;

export const matchingService = {
  async getCandidates(): Promise<PublicHealthProfile[]> {
    if (await isDemo()) return [...mockCandidates];
    return api.get('/matching/candidates') as any;
  },

  async swipe(targetUserId: string, direction: SwipeDirection): Promise<{ matched: boolean; matchId?: string }> {
    if (await isDemo()) return { matched: direction === 'like' && targetUserId === 'u3', matchId: 'match-demo' };
    return api.post('/matching/swipe', { targetUserId, direction }) as any;
  },

  async getMatches(): Promise<Match[]> {
    if (await isDemo()) return [];
    return api.get('/matching/matches') as any;
  },
};
