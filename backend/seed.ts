import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './src/modules/users/entities/user.entity';
import { UserPreferences } from './src/modules/users/entities/user-preferences.entity';
import { PublicWellnessProfile } from './src/modules/matching/entities/public-wellness-profile.entity';
import { Match } from './src/modules/matching/entities/match.entity';
import { SwipeHistory } from './src/modules/matching/entities/swipe-history.entity';
import { ChatMessage } from './src/modules/chat/entities/chat-message.entity';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const prefsRepo = app.get<Repository<UserPreferences>>(getRepositoryToken(UserPreferences));
  const wellnessRepo = app.get<Repository<PublicWellnessProfile>>(getRepositoryToken(PublicWellnessProfile));
  const matchRepo = app.get<Repository<Match>>(getRepositoryToken(Match));
  const swipeRepo = app.get<Repository<SwipeHistory>>(getRepositoryToken(SwipeHistory));
  const chatRepo = app.get<Repository<ChatMessage>>(getRepositoryToken(ChatMessage));

  const passwordHash = await bcrypt.hash('Test@123456', 4);

  const usersData = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'ana@wellmatch.app',
      name: 'Ana Beatriz',
      birthdate: new Date('1998-03-12'),
      genderOptional: 'feminino',
      bio: 'Adoro caminhar ao ar livre e praticar yoga pela manhã.',
      locationRegion: 'São Paulo, SP',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'carlos@wellmatch.app',
      name: 'Carlos Eduardo',
      birthdate: new Date('1995-07-22'),
      genderOptional: 'masculino',
      bio: 'Corredor amador, treino 5x por semana. Busco parceiro para corridas.',
      locationRegion: 'São Paulo, SP',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'julia@wellmatch.app',
      name: 'Júlia Martins',
      birthdate: new Date('2000-11-05'),
      genderOptional: 'feminino',
      bio: 'Yoga e meditação fazem parte da minha rotina. Quero conhecer pessoas com hábitos saudáveis.',
      locationRegion: 'Rio de Janeiro, RJ',
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'demo@wellmatch.app',
      name: 'Usuário Demo',
      birthdate: new Date('1993-05-18'),
      genderOptional: null,
      bio: 'Usuário de demonstração para testar o WellMatch.',
      locationRegion: 'Belo Horizonte, MG',
    },
  ];

  const prefsData = [
    { userId: usersData[0].id, wellnessGoals: ['walk_more', 'meet_people_safely'], preferredActivities: ['walking', 'yoga'], preferredIntensity: 'low', availabilityPeriods: ['morning', 'evening'], showPhotosAfterMatch: true },
    { userId: usersData[1].id, wellnessGoals: ['exercise_consistently', 'find_training_partner'], preferredActivities: ['running', 'gym', 'cycling'], preferredIntensity: 'high', availabilityPeriods: ['early_morning', 'morning', 'evening'], showPhotosAfterMatch: true },
    { userId: usersData[2].id, wellnessGoals: ['sleep_better', 'build_routine'], preferredActivities: ['yoga', 'stretching', 'walking'], preferredIntensity: 'low', availabilityPeriods: ['morning', 'afternoon', 'weekends'], showPhotosAfterMatch: false },
    { userId: usersData[3].id, wellnessGoals: ['walk_more', 'exercise_consistently', 'reduce_sedentary_habits'], preferredActivities: ['walking', 'casual_wellness', 'outdoor_activity'], preferredIntensity: 'moderate', availabilityPeriods: ['afternoon', 'evening', 'weekends'], showPhotosAfterMatch: true },
  ];

  const wellnessData = [
    { userId: usersData[0].id, activityLevel: 'moderate', activityConsistencyBand: 'medium', sleepRoutineBand: 'regular', chronotypeBand: 'morning', intensityPreference: 'low', mainIntention: 'walking_partner', preferredActivities: ['walking', 'yoga'], wellnessGoals: ['walk_more', 'meet_people_safely'], availabilityPeriods: ['morning', 'evening'], publicBadges: ['early_bird', 'yoga_lover'], scoreConfidence: 'medium', source: 'manual', isVisible: true, onboardingCompleted: true },
    { userId: usersData[1].id, activityLevel: 'very_active', activityConsistencyBand: 'high', sleepRoutineBand: 'consistent', chronotypeBand: 'early', intensityPreference: 'high', mainIntention: 'training_partner', preferredActivities: ['running', 'gym', 'cycling'], wellnessGoals: ['exercise_consistently', 'find_training_partner'], availabilityPeriods: ['early_morning', 'morning', 'evening'], publicBadges: ['marathon_runner', 'gym_rat'], scoreConfidence: 'high', source: 'manual', isVisible: true, onboardingCompleted: true },
    { userId: usersData[2].id, activityLevel: 'low', activityConsistencyBand: 'medium', sleepRoutineBand: 'irregular', chronotypeBand: 'flexible', intensityPreference: 'low', mainIntention: 'friendship', preferredActivities: ['yoga', 'stretching', 'walking'], wellnessGoals: ['sleep_better', 'build_routine'], availabilityPeriods: ['morning', 'afternoon', 'weekends'], publicBadges: ['yoga_lover', 'meditation'], scoreConfidence: 'medium', source: 'manual', isVisible: true, onboardingCompleted: true },
    { userId: usersData[3].id, activityLevel: 'moderate', activityConsistencyBand: 'medium', sleepRoutineBand: 'regular', chronotypeBand: 'flexible', intensityPreference: 'moderate', mainIntention: 'friendship', preferredActivities: ['walking', 'casual_wellness', 'outdoor_activity'], wellnessGoals: ['walk_more', 'exercise_consistently', 'reduce_sedentary_habits'], availabilityPeriods: ['afternoon', 'evening', 'weekends'], publicBadges: ['nature_lover'], scoreConfidence: 'medium', source: 'manual', isVisible: true, onboardingCompleted: true },
  ];

  console.log('Limpando dados existentes...');
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.query('DELETE FROM chat_messages');
  await queryRunner.query('DELETE FROM matches');
  await queryRunner.query('DELETE FROM swipe_history');
  await queryRunner.query('DELETE FROM public_wellness_profile');
  await queryRunner.query('DELETE FROM user_preferences');
  await queryRunner.query('DELETE FROM users');
  await queryRunner.release();

  console.log('Criando usuários...');
  for (const u of usersData) {
    await userRepo.save({ ...u, passwordHash, role: 'user', isDeleted: false });
  }

  console.log('Criando preferências...');
  for (const p of prefsData) {
    await prefsRepo.save(p);
  }

  console.log('Criando perfis públicos de bem-estar...');
  for (const w of wellnessData) {
    await wellnessRepo.save(w as any);
  }

  // Likes recíprocos entre Ana e Júlia (match)
  console.log('Criando swipes e match entre Ana e Júlia...');
  const now = new Date();
  await swipeRepo.save({ userId: usersData[0].id, targetUserId: usersData[2].id, direction: 'like' as const, timestamp: now });
  await swipeRepo.save({ userId: usersData[2].id, targetUserId: usersData[0].id, direction: 'like' as const, timestamp: now });

  const [u1, u2] = [usersData[0].id, usersData[2].id].sort();
  const match1 = await matchRepo.save({ userId1: u1, userId2: u2, scoreCompatibility: 82, status: 'active' });
  console.log(`  Match criado: ${match1.id}`);

  await chatRepo.save({ matchId: match1.id, senderId: usersData[0].id, message: 'Oi Júlia! Vi que você também gosta de yoga. Que tal caminharmos juntas esse fim de semana?', isRead: false, timestamp: new Date(now.getTime() - 3600000) });

  // Carlos curtiu Ana (não recíproco)
  console.log('Criando swipe não recíproco (Carlos → Ana)...');
  await swipeRepo.save({ userId: usersData[1].id, targetUserId: usersData[0].id, direction: 'like' as const, timestamp: new Date(now.getTime() - 7200000) });

  // Ana passou Carlos (dislike)
  await swipeRepo.save({ userId: usersData[0].id, targetUserId: usersData[1].id, direction: 'dislike' as const, timestamp: new Date(now.getTime() - 7200000) });

  console.log('\n=== Seed concluído! ===');
  console.log('\nUsuários criados:');
  console.log('  ana@wellmatch.app / Test@123456  — Ana Beatriz (SP, yoga/caminhada)');
  console.log('  carlos@wellmatch.app / Test@123456  — Carlos Eduardo (SP, corrida/academia)');
  console.log('  julia@wellmatch.app / Test@123456  — Júlia Martins (RJ, yoga/meditação)');
  console.log('  demo@wellmatch.app / Test@123456  — Usuário Demo (BH, geral)');
  console.log('\nMatch pré-criado: Ana ↔ Júlia (com 1 mensagem no chat)');
  console.log('\nLogin como demo@wellmatch.app para ver candidatos e testar todo o fluxo.\n');

  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
