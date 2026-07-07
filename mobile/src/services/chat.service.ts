import { storage } from './storage';
import { api } from './api';
import { ChatMessage, Conversation } from '../types/chat.types';
import { DEMO_TOKEN, mockConversations, mockMessages } from './mock-data';

const isDemo = async () => (await storage.getItem('@wellmatch:token')) === DEMO_TOKEN;

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    if (await isDemo()) return mockConversations;
    return api.get('/chat/conversations') as any;
  },

  async getMessages(matchId: string, _limit = 50, _offset = 0): Promise<ChatMessage[]> {
    if (await isDemo()) return mockMessages[matchId] ?? [];
    return api.get(`/chat/${matchId}/messages?limit=${_limit}&offset=${_offset}`) as any;
  },

  async sendMessage(matchId: string, message: string, imageUrl?: string): Promise<ChatMessage> {
    if (await isDemo()) {
      return {
        id: `msg-${Date.now()}`,
        matchId,
        senderId: 'demo',
        message,
        imageUrl,
        isRead: false,
        timestamp: new Date().toISOString(),
        sender: { id: 'demo', name: 'Ana Lima' },
      } as any;
    }
    return api.post('/chat/send', { matchId, message, imageUrl }) as any;
  },

  async getSuggestions(matchId: string): Promise<string[]> {
    if (await isDemo()) return ['Quando você costuma treinar?', 'Qual seu esporte favorito?', 'Você usa algum app de saúde?'];
    const result: any = await api.get(`/chat/${matchId}/suggestions`);
    return result?.suggestions ?? [];
  },

  async uploadImage(file: any): Promise<string> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || 'photo.jpg',
    } as any);
    const response: any = await api.post('/chat/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.imageUrl;
  },
};
