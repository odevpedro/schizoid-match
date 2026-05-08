import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { Match } from '../matching/entities/match.entity';
import { SendMessageDto } from './dto/send-message.dto';

const WELLNESS_SUGGESTIONS = [
  'Voces dois tem rotina matinal. Que tal combinar uma caminhada?',
  'Voces compartilham o objetivo de melhorar o condicionamento fisico.',
  'Voces tem disponibilidade parecida no fim de semana.',
  'Ambos preferem atividades de intensidade moderada. Que tal um treino juntos?',
  'Voces dois valorizam uma boa noite de sono. Que tal criar um desafio de sono?',
  'Voces compartilham interesse em atividades ao ar livre.',
];

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  private async validateMatchAccess(matchId: string, userId: string): Promise<Match> {
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
    await this.validateMatchAccess(dto.matchId, userId);

    const message = this.messageRepo.create({
      matchId: dto.matchId,
      senderId: userId,
      message: dto.message,
    });

    return this.messageRepo.save(message);
  }

  async getMessages(userId: string, matchId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    await this.validateMatchAccess(matchId, userId);

    const messages = await this.messageRepo.find({
      where: { matchId },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['sender'],
    });

    await this.messageRepo.update(
      { matchId, isRead: false },
      { isRead: true },
    );

    return messages.reverse();
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
    const idx = matchId.charCodeAt(0) % WELLNESS_SUGGESTIONS.length;
    return WELLNESS_SUGGESTIONS.slice(idx, idx + 2).concat(WELLNESS_SUGGESTIONS.slice(0, Math.max(0, 2 - (WELLNESS_SUGGESTIONS.length - idx))));
  }
}
