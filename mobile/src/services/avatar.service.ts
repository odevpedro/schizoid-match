import { api } from './api';

export const avatarService = {
  async upload(file: File | Blob, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file, filename);
    const response = await api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (response as any).avatarUrl;
  },
};
