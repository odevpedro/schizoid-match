import { onboardingService } from './onboarding.service';

jest.mock('./api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('onboardingService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('getStatus calls GET /users/onboarding/status', async () => {
    const { api } = require('./api');
    const mockStatus = { completed: false, step: 0, profile: null };
    (api.get as jest.Mock).mockResolvedValue(mockStatus);

    const result = await onboardingService.getStatus();

    expect(api.get).toHaveBeenCalledWith('/users/onboarding/status');
    expect(result).toEqual(mockStatus);
  });

  it('getWellnessProfile calls GET /users/me/wellness-profile', async () => {
    const { api } = require('./api');
    const mockProfile = {
      userId: '1',
      activityLevel: 'moderate',
      preferredActivities: ['yoga', 'walking'],
      wellnessGoals: ['fitness'],
      availabilityPeriods: ['morning'],
      publicBadges: [],
      scoreConfidence: 'medium',
      source: 'manual',
      isVisible: true,
      onboardingCompleted: true,
    };
    (api.get as jest.Mock).mockResolvedValue(mockProfile);

    const result = await onboardingService.getWellnessProfile();

    expect(api.get).toHaveBeenCalledWith('/users/me/wellness-profile');
    expect(result).toEqual(mockProfile);
  });

  it('getWellnessProfile returns null on error', async () => {
    const { api } = require('./api');
    (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const result = await onboardingService.getWellnessProfile();

    expect(result).toBeNull();
  });

  it('saveStep1 posts to /users/onboarding/step1', async () => {
    const { api } = require('./api');
    const data = { mainIntention: 'friendship' };
    (api.post as jest.Mock).mockResolvedValue({ success: true });

    await onboardingService.saveStep1(data);

    expect(api.post).toHaveBeenCalledWith('/users/onboarding/step1', data);
  });

  it('saveStep2 posts to /users/onboarding/step2', async () => {
    const { api } = require('./api');
    const data = { wellnessGoals: ['fitness', 'stress_reduction'] };

    await onboardingService.saveStep2(data);

    expect(api.post).toHaveBeenCalledWith('/users/onboarding/step2', data);
  });

  it('saveStep3 posts to /users/onboarding/step3', async () => {
    const { api } = require('./api');
    const data = { preferredActivities: ['running', 'yoga'] };

    await onboardingService.saveStep3(data);

    expect(api.post).toHaveBeenCalledWith('/users/onboarding/step3', data);
  });

  it('saveStep7 posts to /users/onboarding/step7 with source config', async () => {
    const { api } = require('./api');
    const data = {
      source: 'manual' as const,
      manualActivityLevel: 'moderate',
      manualSleepRoutine: 'regular',
      manualChronotype: 'morning',
    };

    await onboardingService.saveStep7(data);

    expect(api.post).toHaveBeenCalledWith('/users/onboarding/step7', data);
  });
});
