import { Injectable } from '@nestjs/common';
import { HealthProvider } from './health-provider.interface';
import { SimulatedProvider } from './simulated.provider';
import { HealthKitProvider } from './healthkit.provider';
import { HealthConnectProvider } from './health-connect.provider';
import { GarminProvider } from './garmin.provider';
import { FitbitProvider } from './fitbit.provider';

@Injectable()
export class HealthProviderFactory {
  constructor(
    private readonly simulatedProvider: SimulatedProvider,
    private readonly healthKitProvider: HealthKitProvider,
    private readonly healthConnectProvider: HealthConnectProvider,
    private readonly garminProvider: GarminProvider,
    private readonly fitbitProvider: FitbitProvider,
  ) {}

  getProvider(providerName: string): HealthProvider {
    switch (providerName) {
      case 'simulated':
        return this.simulatedProvider;
      case 'healthkit':
        return this.healthKitProvider;
      case 'health_connect':
        return this.healthConnectProvider;
      case 'garmin':
        return this.garminProvider;
      case 'fitbit':
        return this.fitbitProvider;
      default:
        return this.simulatedProvider;
    }
  }

  getAvailableProviders(): string[] {
    return ['simulated', 'healthkit', 'health_connect', 'garmin', 'fitbit'];
  }
}
