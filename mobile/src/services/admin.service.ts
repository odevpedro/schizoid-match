import { api } from './api';

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  totalBans: number;
  activeUsers: number;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description?: string;
  matchId?: string;
  status: string;
  createdAt: string;
  reporter?: { id: string; name: string; email: string };
  reported?: { id: string; name: string; email: string };
}

export interface AuditEntry {
  id: string;
  userId: string | null;
  eventType: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface PaginatedAudit {
  data: AuditEntry[];
  total: number;
  page: number;
  limit: number;
}

export const adminService = {
  async getDashboard(): Promise<DashboardStats> {
    return api.get('/admin/dashboard');
  },

  async getReports(): Promise<AdminReport[]> {
    return api.get('/admin/reports');
  },

  async getReport(id: string): Promise<AdminReport> {
    return api.get(`/admin/reports/${id}`);
  },

  async resolveReport(id: string, action: 'warn' | 'ban' | 'dismiss') {
    return api.post(`/admin/reports/${id}/resolve`, { action });
  },

  async getAuditLog(page: number = 1, limit: number = 20): Promise<PaginatedAudit> {
    return api.get(`/admin/audit?page=${page}&limit=${limit}`);
  },
};
