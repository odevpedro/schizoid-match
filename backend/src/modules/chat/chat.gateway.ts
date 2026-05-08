import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

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

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'wellmatch-dev-secret',
      });

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
    if (!userId) return;
    client.join(`match:${data.matchId}`);
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;

    const message = await this.chatService.sendMessage(userId, dto);

    this.server.to(`match:${dto.matchId}`).emit('message:received', message);

    return message;
  }

  notifyMatch(userId1: string, userId2: string, matchId: string) {
    this.server.to(`user:${userId1}`).emit('match:new', { matchId });
    this.server.to(`user:${userId2}`).emit('match:new', { matchId });
  }
}
