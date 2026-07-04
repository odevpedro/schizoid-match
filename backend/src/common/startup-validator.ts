import { Logger } from '@nestjs/common';

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL',
];

const OPTIONAL_VARS_WITH_DEFAULTS: Record<string, string> = {
  JWT_EXPIRES_IN: '7d',
  BCRYPT_ROUNDS: '12',
  MAX_SWIPES_PER_DAY: '50',
  DAILY_MESSAGE_LIMIT: '200',
  PORT: '3001',
  NODE_ENV: 'development',
  CORS_ORIGIN: '*',
};

export function validateEnvironment(): void {
  const logger = new Logger('StartupValidator');
  let hasError = false;

  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      logger.error(`Missing required environment variable: ${varName}`);
      hasError = true;
    }
  }

  if (hasError) {
    logger.error('Environment validation failed. Set missing variables in .env file.');
    process.exit(1);
  }

  for (const [varName, defaultValue] of Object.entries(OPTIONAL_VARS_WITH_DEFAULTS)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      logger.warn(`Missing ${varName}, using default: ${defaultValue}`);
    }
  }

  logger.log('All required environment variables are set');
}
