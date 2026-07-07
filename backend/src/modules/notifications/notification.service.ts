import { Injectable, Logger } from '@nestjs/common';

export interface InAppNotification {
  id: string;
  userId: string;
  type: 'match' | 'message' | 'challenge_completed' | 'challenge_progress' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly inAppStore: Map<string, InAppNotification[]> = new Map();

  async send(userId: string, notification: Omit<InAppNotification, 'id' | 'read' | 'createdAt' | 'userId'>): Promise<void> {
    const notif: InAppNotification = {
      ...notification,
      userId,
      id: Math.random().toString(36).substring(2, 15),
      read: false,
      createdAt: new Date(),
    };

    if (!this.inAppStore.has(userId)) {
      this.inAppStore.set(userId, []);
    }
    this.inAppStore.get(userId)!.unshift(notif);

    if (this.inAppStore.get(userId)!.length > 100) {
      this.inAppStore.get(userId)!.length = 100;
    }

    this.logger.log(`Notification sent to ${userId}: ${notification.type} - ${notification.title}`);
  }

  async getNotifications(userId: string): Promise<InAppNotification[]> {
    return this.inAppStore.get(userId) || [];
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const userNotifs = this.inAppStore.get(userId);
    if (!userNotifs) return;
    const notif = userNotifs.find(n => n.id === notificationId);
    if (notif) notif.read = true;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const userNotifs = this.inAppStore.get(userId);
    if (!userNotifs) return;
    userNotifs.forEach(n => n.read = true);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return (this.inAppStore.get(userId) || []).filter(n => !n.read).length;
  }
}
