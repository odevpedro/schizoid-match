import { create } from 'zustand';
import { Conversation, ChatMessage } from '../types/chat.types';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (matchId: string, messages: ChatMessage[]) => void;
  addMessage: (matchId: string, message: ChatMessage) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},

  setConversations: (conversations) => set({ conversations }),

  setMessages: (matchId, messages) =>
    set((state) => ({ messages: { ...state.messages, [matchId]: messages } })),

  addMessage: (matchId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [matchId]: [...(state.messages[matchId] ?? []), message],
      },
    })),
}));
