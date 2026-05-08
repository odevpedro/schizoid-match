import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  async getConversations(@Request() req) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get(':matchId/messages')
  @ApiOperation({ summary: 'Get messages from a match conversation' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getMessages(
    @Request() req,
    @Param('matchId') matchId: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.chatService.getMessages(req.user.id, matchId, +limit, +offset);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto);
  }

  @Get(':matchId/suggestions')
  @ApiOperation({ summary: 'Get wellness-based conversation suggestions' })
  async getSuggestions(@Param('matchId') matchId: string) {
    return { suggestions: this.chatService.getWellnessSuggestions(matchId) };
  }
}
