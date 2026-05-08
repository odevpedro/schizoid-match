import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { MatchingModule } from './modules/matching/matching.module';
import { ChatModule } from './modules/chat/chat.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['../.env', '.env'], isGlobal: true, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions =>
        config.getOrThrow<TypeOrmModuleOptions>('database'),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AuthModule,
    UsersModule,
    HealthModule,
    MatchingModule,
    ChatModule,
    ChallengesModule,
    PrivacyModule,
  ],
})
export class AppModule {}
