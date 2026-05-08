import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatMessage } from './entities/chat-message.entity';
import { Match } from '../matching/entities/match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, Match]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'wellmatch-dev-secret',
    }),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
