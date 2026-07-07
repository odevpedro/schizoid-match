import { avatarService } from './avatar.service';

jest.mock('./api', () => ({
  api: {
    post: jest.fn(),
  },
}));

describe('avatarService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('upload sends multipart/form-data and returns avatarUrl', async () => {
    const { api } = require('./api');
    const mockUrl = '/uploads/avatars/test-avatar.jpg';
    (api.post as jest.Mock).mockResolvedValue({ avatarUrl: mockUrl });

    const file = new Blob(['fake-image-data'], { type: 'image/jpeg' });
    const result = await avatarService.upload(file, 'test-avatar.jpg');

    expect(api.post).toHaveBeenCalledWith(
      '/users/me/avatar',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    );

    const formData = (api.post as jest.Mock).mock.calls[0][1];
    const appendedFile = formData.get('file');
    expect(appendedFile.size).toBe(file.size);
    expect(appendedFile.type).toBe(file.type);
    expect(appendedFile.name).toBe('test-avatar.jpg');

    expect(result).toBe(mockUrl);
  });

  it('upload throws when api.post fails', async () => {
    const { api } = require('./api');
    (api.post as jest.Mock).mockRejectedValue(new Error('Upload failed'));

    const file = new Blob(['data'], { type: 'image/png' });

    await expect(avatarService.upload(file, 'fail.png')).rejects.toThrow('Upload failed');
  });
});
