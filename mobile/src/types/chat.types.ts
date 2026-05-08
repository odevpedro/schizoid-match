export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  sender?: { id: string; name: string };
}

export interface Conversation {
  match: import('./match.types').Match;
  partner: { id: string; name: string; avatarUrl?: string };
  lastMessage?: ChatMessage;
  unreadCount: number;
}
