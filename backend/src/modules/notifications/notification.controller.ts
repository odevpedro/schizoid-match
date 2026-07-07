import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all in-app notifications' })
  async getAll(@Request() req) {
    return this.notificationService.getNotifications(req.user.id);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@Request() req) {
    return { count: await this.notificationService.getUnreadCount(req.user.id) };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Request() req, @Param('id') id: string) {
    await this.notificationService.markAsRead(req.user.id, id);
    return { ok: true };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { ok: true };
  }
}
