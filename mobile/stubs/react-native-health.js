module.exports = {
  isHealthKitAvailable: async () => false,
  requestAuthorization: async () => ({}),
  getHeartRateSamples: async () => [],
  getStepCount: async () => 0,
  getSleepSamples: async () => [],
};
