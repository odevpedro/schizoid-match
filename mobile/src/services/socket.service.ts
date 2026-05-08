import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ? 'http://localhost:3001' : 'https://api.wellmatch.app';

class SocketService {
  private socket: Socket | null = null;

  async connect(): Promise<void> {
    const token = await AsyncStorage.getItem('@wellmatch:token');
    if (!token) return;

    this.socket = io(`${BASE_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => console.log('Socket connected'));
    this.socket.on('disconnect', () => console.log('Socket disconnected'));
    this.socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinMatch(matchId: string): void {
    this.socket?.emit('join:match', { matchId });
  }

  sendMessage(matchId: string, message: string): void {
    this.socket?.emit('message:send', { matchId, message });
  }

  onMessage(callback: (message: any) => void): void {
    this.socket?.on('message:received', callback);
  }

  onMatch(callback: (data: { matchId: string }) => void): void {
    this.socket?.on('match:new', callback);
  }

  offMessage(): void {
    this.socket?.off('message:received');
  }
}

export const socketService = new SocketService();
