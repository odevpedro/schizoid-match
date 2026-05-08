import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { ChatMessage, Conversation } from '../types/chat.types';
import { DEMO_TOKEN, mockConversations, mockMessages } from './mock-data';

const isDemo = async () => (await AsyncStorage.getItem('@wellmatch:token')) === DEMO_TOKEN;

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    if (await isDemo()) return mockConversations;
    return api.get('/chat/conversations') as any;
  },

  async getMessages(matchId: string, _limit = 50, _offset = 0): Promise<ChatMessage[]> {
    if (await isDemo()) return mockMessages[matchId] ?? [];
    return api.get(`/chat/${matchId}/messages?limit=${_limit}&offset=${_offset}`) as any;
  },

  async sendMessage(matchId: string, message: string): Promise<ChatMessage> {
    if (await isDemo()) {
      return {
        id: `msg-${Date.now()}`,
        matchId,
        senderId: 'demo',
        message,
        isRead: false,
        timestamp: new Date().toISOString(),
        sender: { id: 'demo', name: 'Ana Lima' },
      };
    }
    return api.post('/chat/send', { matchId, message }) as any;
  },

  async getSuggestions(matchId: string): Promise<string[]> {
    if (await isDemo()) return ['Quando você costuma treinar?', 'Qual seu esporte favorito?', 'Você usa algum app de saúde?'];
    const result: any = await api.get(`/chat/${matchId}/suggestions`);
    return result?.suggestions ?? [];
  },
};
