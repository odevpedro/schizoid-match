import { useAuthStore } from './auth.slice';

jest.mock('../services/auth.service', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getStoredToken: jest.fn(),
  },
}));

jest.mock('../services/onboarding.service', () => ({
  onboardingService: {
    getStatus: jest.fn(),
  },
}));

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  onboardingCompleted: false,
};

describe('auth.slice', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useAuthStore.setState(initialState);
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
    expect(state.onboardingCompleted).toBe(false);
  });

  it('sets user and token on login', async () => {
    const { authService } = require('../services/auth.service');
    const { onboardingService } = require('../services/onboarding.service');

    const mockResult = {
      access_token: 'test-token-123',
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    };
    (authService.login as jest.Mock).mockResolvedValue(mockResult);
    (onboardingService.getStatus as jest.Mock).mockResolvedValue({ completed: true });

    await useAuthStore.getState().login('test@example.com', 'password');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockResult.user);
    expect(state.token).toBe('test-token-123');
    expect(state.isAuthenticated).toBe(true);
  });

  it('sets onboarding completed flag', () => {
    expect(useAuthStore.getState().onboardingCompleted).toBe(false);

    useAuthStore.getState().setOnboardingCompleted(true);
    expect(useAuthStore.getState().onboardingCompleted).toBe(true);

    useAuthStore.getState().setOnboardingCompleted(false);
    expect(useAuthStore.getState().onboardingCompleted).toBe(false);
  });

  it('clears state on logout', async () => {
    const { authService } = require('../services/auth.service');

    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com', name: 'Test User' } as any,
      token: 'test-token',
      isAuthenticated: true,
      onboardingCompleted: true,
      isLoading: false,
    });

    (authService.logout as jest.Mock).mockResolvedValue(undefined);

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.onboardingCompleted).toBe(false);
  });
});
