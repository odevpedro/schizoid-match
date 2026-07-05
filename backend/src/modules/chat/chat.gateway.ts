import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);

      this.connectedUsers.set(client.id, payload.sub);
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('join:match')
  async handleJoinMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return { error: 'Not authenticated' };

    const hasAccess = await this.chatService.validateMatchAccess(data.matchId, userId);
    if (!hasAccess) {
      return { error: 'Access denied' };
    }

    client.join(`match:${data.matchId}`);
    return { success: true };
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: { matchId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return { error: 'Not authenticated' };

    if (!data.message?.trim()) return { error: 'Message cannot be empty' };
    if (data.message.length > 2000) return { error: 'Message too long' };

    const message = await this.chatService.sendMessage(userId, { matchId: data.matchId, message: data.message });

    this.server.to(`match:${data.matchId}`).emit('message:received', message);

    return message;
  }

  @SubscribeMessage('message:read')
  async handleRead(
    @MessageBody() data: { matchId: string; messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return { error: 'Not authenticated' };

    const result = await this.chatService.markAsRead(data.messageId, userId, data.matchId);
    return result;
  }

  notifyMatch(userId1: string, userId2: string, matchId: string) {
    if (!this.server) return;
    this.server.to(`user:${userId1}`).emit('match:new', { matchId });
    this.server.to(`user:${userId2}`).emit('match:new', { matchId });
  }
}
