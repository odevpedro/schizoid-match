import { api } from './api';

export const notificationService = {
  async getAll(): Promise<any[]> {
    return api.get('/notifications');
  },
  async getUnreadCount(): Promise<number> {
    const res: any = await api.get('/notifications/unread/count');
    return res.count;
  },
  async markAsRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/read`);
  },
  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};
