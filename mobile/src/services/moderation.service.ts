import { api } from './api';

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description?: string;
  matchId?: string;
  status: string;
  createdAt: string;
}

export const moderationService = {
  async blockUser(targetUserId: string, reason?: string) {
    return api.post('/moderation/block', { targetUserId, reason });
  },

  async unblockUser(targetUserId: string) {
    return api.delete(`/moderation/block/${targetUserId}`);
  },

  async getBlocks(): Promise<Block[]> {
    return api.get('/moderation/blocks');
  },

  async reportUser(data: {
    targetUserId: string;
    reason: string;
    description?: string;
    matchId?: string;
  }) {
    return api.post('/moderation/report', data);
  },

  async getReports(): Promise<Report[]> {
    return api.get('/moderation/reports');
  },
};
