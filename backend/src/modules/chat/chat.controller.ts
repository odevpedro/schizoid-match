import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const multer = require('multer');
const diskStorage = require('multer/storage/disk');

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload image for chat' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.cwd() + '/uploads/chat',
        filename: (_req: any, file: any, cb: any) => {
          const ext = extname(file.originalname);
          cb(null, `chat-${Date.now()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          cb(new BadRequestException('Only image files (jpg, png, gif, webp) are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const imageUrl = `/uploads/chat/${file.filename}`;
    return { imageUrl };
  }

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
