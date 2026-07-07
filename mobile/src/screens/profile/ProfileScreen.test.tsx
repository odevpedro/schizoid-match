import React from 'react';
import { render } from '@testing-library/react-native';
import { ProfileScreen } from './ProfileScreen';

const mockNavigate = jest.fn();

jest.mock('../../store/auth.slice', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../../services/onboarding.service', () => ({
  onboardingService: {
    getWellnessProfile: jest.fn(),
  },
}));

jest.mock('../../services/avatar.service', () => ({
  avatarService: {
    upload: jest.fn(),
  },
}));

jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

function mockStoreUser(user: any) {
  const { useAuthStore } = require('../../store/auth.slice');
  (useAuthStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      user,
      logout: jest.fn(),
      setOnboardingCompleted: jest.fn(),
    };
    return selector(state);
  });
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders without crashing', () => {
    mockStoreUser({ id: '1', name: 'Ana', email: 'ana@test.com' });

    const { toJSON } = render(
      <ProfileScreen navigation={{ navigate: mockNavigate } as any} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('shows loading indicator initially', () => {
    mockStoreUser({ id: '1', name: 'Ana', email: 'ana@test.com' });

    const { UNSAFE_getByType } = render(
      <ProfileScreen navigation={{ navigate: mockNavigate } as any} />,
    );
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('displays user name and email when loaded', async () => {
    mockStoreUser({ id: '1', name: 'Ana', email: 'ana@test.com' });
    const { onboardingService } = require('../../services/onboarding.service');
    (onboardingService.getWellnessProfile as jest.Mock).mockResolvedValue(null);

    const { findByText } = render(
      <ProfileScreen navigation={{ navigate: mockNavigate } as any} />,
    );

    expect(await findByText('Ana')).toBeTruthy();
    expect(await findByText('ana@test.com')).toBeTruthy();
  });
});
