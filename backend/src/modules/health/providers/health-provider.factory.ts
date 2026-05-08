import { Injectable } from '@nestjs/common';
import { HealthProvider } from './health-provider.interface';
import { SimulatedProvider } from './simulated.provider';

@Injectable()
export class HealthProviderFactory {
  constructor(private readonly simulatedProvider: SimulatedProvider) {}

  getProvider(providerName: string): HealthProvider {
    switch (providerName) {
      case 'simulated':
        return this.simulatedProvider;
      case 'healthkit':
        // Placeholder for HealthKit integration (iOS only)
        throw new Error('HealthKit integration not yet available in MVP');
      case 'health_connect':
        // Placeholder for Health Connect integration (Android only)
        throw new Error('Health Connect integration not yet available in MVP');
      case 'garmin':
        throw new Error('Garmin integration not yet available in MVP');
      case 'fitbit':
        throw new Error('Fitbit integration not yet available in MVP');
      default:
        return this.simulatedProvider;
    }
  }

  getAvailableProviders(): string[] {
    return ['simulated'];
  }
}
