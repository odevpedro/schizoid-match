import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { Match } from '../matching/entities/match.entity';
import { User } from '../users/entities/user.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';

const DAILY_MESSAGE_LIMIT = parseInt(process.env.DAILY_MESSAGE_LIMIT || '200');
const WELLNESS_SUGGESTIONS = [
  'Voces dois tem rotina matinal. Que tal combinar uma caminhada?',
  'Voces compartilham o objetivo de melhorar o condicionamento fisico.',
  'Voces tem disponibilidade parecida no fim de semana.',
  'Ambos preferem atividades de intensidade moderada. Que tal um treino juntos?',
  'Voces dois valorizam uma boa noite de sono. Que tal criar um desafio de sono?',
  'Voces compartilham interesse em atividades ao ar livre.',
  'Que tal marcar uma sessao de alongamento juntos?',
  'Experimentem uma caminhada em um parque novo esse fim de semana.',
  'Combinem de preparar uma refeicao saudavel juntos.',
  'Que tal um desafio de 7 dias de meditacao?',
];

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async validateMatchAccess(matchId: string, userId: string): Promise<boolean> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) return false;
    if (match.userId1 !== userId && match.userId2 !== userId) return false;
    if (match.status !== 'active') return false;
    return true;
  }

  private async ensureMatchAccess(matchId: string, userId: string): Promise<Match> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.userId1 !== userId && match.userId2 !== userId) {
      throw new ForbiddenException('You are not part of this match');
    }
    if (match.status !== 'active') {
      throw new ForbiddenException('Match is no longer active');
    }
    return match;
  }

  async sendMessage(userId: string, dto: SendMessageDto): Promise<ChatMessage> {
    await this.ensureMatchAccess(dto.matchId, userId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await this.messageRepo.count({
      where: { senderId: userId },
    });
    if (todayCount >= DAILY_MESSAGE_LIMIT) {
      throw new BadRequestException(`Daily message limit of ${DAILY_MESSAGE_LIMIT} reached`);
    }

    const message = this.messageRepo.create({
      matchId: dto.matchId,
      senderId: userId,
      message: dto.message,
      imageUrl: dto.imageUrl,
    });

    const saved = await this.messageRepo.save(message);
    await this.auditService.record({ userId, eventType: 'message_sent', resourceType: 'message', resourceId: saved.id, metadata: { matchId: dto.matchId } });

    const match = await this.matchRepo.findOne({ where: { id: dto.matchId }, relations: ['user1', 'user2'] });
    if (match) {
      const recipientId = match.userId1 === userId ? match.userId2 : match.userId1;
      const senderUser = match.userId1 === userId ? match.user1 : match.user2;
      const senderName = senderUser?.name || 'Usuário';
      await this.notificationService.send(recipientId, {
        type: 'message',
        title: senderName,
        body: dto.message.length > 100 ? dto.message.substring(0, 100) + '...' : dto.message,
        data: { matchId: dto.matchId, messageId: saved.id },
      });
    }

    return saved;
  }

  async getMessages(userId: string, matchId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    const match = await this.ensureMatchAccess(matchId, userId);

    const messages = await this.messageRepo.find({
      where: { matchId },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['sender'],
    });

    const now = new Date();
    await this.messageRepo.update(
      { matchId, isRead: false, senderId: match.userId1 === userId ? match.userId2 : match.userId1 },
      { isRead: true, readAt: now },
    );

    return messages.reverse();
  }

  async markAsRead(messageId: string, userId: string, matchId: string): Promise<{ success: boolean }> {
    const msg = await this.messageRepo.findOne({ where: { id: messageId, matchId } });
    if (!msg) return { success: false };
    if (msg.senderId === userId) return { success: true };

    await this.messageRepo.update({ id: messageId }, { isRead: true, readAt: new Date() });
    await this.auditService.record({ userId, eventType: 'message_read', resourceType: 'message', resourceId: messageId, metadata: { matchId } });
    return { success: true };
  }

  async getConversations(userId: string) {
    const matches = await this.matchRepo.find({
      where: [{ userId1: userId, status: 'active' }, { userId2: userId, status: 'active' }],
      relations: ['user1', 'user2'],
    });

    const conversations = await Promise.all(
      matches.map(async (match) => {
        const lastMessage = await this.messageRepo.findOne({
          where: { matchId: match.id },
          order: { timestamp: 'DESC' },
        });

        const unreadCount = await this.messageRepo.count({
          where: { matchId: match.id, isRead: false, senderId: match.userId1 === userId ? match.userId2 : match.userId1 },
        });

        const partner = match.userId1 === userId ? match.user2 : match.user1;
        return { match, partner, lastMessage, unreadCount };
      }),
    );

    return conversations.sort((a, b) =>
      (b.lastMessage?.timestamp?.getTime() ?? 0) - (a.lastMessage?.timestamp?.getTime() ?? 0),
    );
  }

  getWellnessSuggestions(matchId: string): string[] {
    const hash = this.simpleHash(matchId);
    const count = Math.min(3, WELLNESS_SUGGESTIONS.length);
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(WELLNESS_SUGGESTIONS[(hash + i * 7) % WELLNESS_SUGGESTIONS.length]);
    }
    return result;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
