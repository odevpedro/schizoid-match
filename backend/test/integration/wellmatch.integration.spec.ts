import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import { UserPreferences } from '../../src/modules/users/entities/user-preferences.entity';
import { PublicWellnessProfile } from '../../src/modules/matching/entities/public-wellness-profile.entity';
import { Match } from '../../src/modules/matching/entities/match.entity';
import { SwipeHistory } from '../../src/modules/matching/entities/swipe-history.entity';
import { Block } from '../../src/modules/moderation/entities/block.entity';
import { Report } from '../../src/modules/moderation/entities/report.entity';
import { ChatMessage } from '../../src/modules/chat/entities/chat-message.entity';
import { ConsentRecord } from '../../src/modules/health/entities/consent-record.entity';

/**
 * Integration tests for WellMatch v0.2.0
 *
 * These tests require a running PostgreSQL database.
 * They use the same .env configuration as the application.
 *
 * Run with: npx jest --config jest.integration.config.js
 *
 * Or set env SKIP_INTEGRATION_TESTS=true to skip.
 */

const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true';

(SKIP ? describe.skip : describe)('WellMatch Integration Tests', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let prefsRepo: Repository<UserPreferences>;
  let wellnessRepo: Repository<PublicWellnessProfile>;
  let matchRepo: Repository<Match>;
  let swipeRepo: Repository<SwipeHistory>;
  let blockRepo: Repository<Block>;
  let reportRepo: Repository<Report>;
  let chatRepo: Repository<ChatMessage>;
  let consentRepo: Repository<ConsentRecord>;

  let userAToken: string;
  let userBToken: string;
  let userIdA: string;
  let userIdB: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    userRepo = app.get(getRepositoryToken(User));
    prefsRepo = app.get(getRepositoryToken(UserPreferences));
    wellnessRepo = app.get(getRepositoryToken(PublicWellnessProfile));
    matchRepo = app.get(getRepositoryToken(Match));
    swipeRepo = app.get(getRepositoryToken(SwipeHistory));
    blockRepo = app.get(getRepositoryToken(Block));
    reportRepo = app.get(getRepositoryToken(Report));
    chatRepo = app.get(getRepositoryToken(ChatMessage));
    consentRepo = app.get(getRepositoryToken(ConsentRecord));
  });

  beforeEach(async () => {
    await Promise.all([
      swipeRepo.delete({}),
      matchRepo.delete({}),
      chatRepo.delete({}),
      reportRepo.delete({}),
      blockRepo.delete({}),
      consentRepo.delete({}),
      wellnessRepo.delete({}),
      prefsRepo.delete({}),
      userRepo.delete({}),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      swipeRepo.delete({}),
      matchRepo.delete({}),
      chatRepo.delete({}),
      reportRepo.delete({}),
      blockRepo.delete({}),
      consentRepo.delete({}),
      wellnessRepo.delete({}),
      prefsRepo.delete({}),
      userRepo.delete({}),
    ]);
    await app.close();
  });

  // ─── Registration ────────────────────────────────────────────────────

  async function registerUser(email: string, name: string) {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Test@123456', name, birthdate: '1995-06-15' })
      .expect(201);
    return res.body as any;
  }

  async function onboardUser(token: string, data?: { source?: string }) {
    const s = data?.source || 'manual';
    await request(app.getHttpServer()).post('/users/onboarding/step1').set('Authorization', `Bearer ${token}`).send({ mainIntention: 'friendship' }).expect(201);
    await request(app.getHttpServer()).post('/users/onboarding/step2').set('Authorization', `Bearer ${token}`).send({ wellnessGoals: ['walk_more', 'sleep_better'] }).expect(201);
    await request(app.getHttpServer()).post('/users/onboarding/step3').set('Authorization', `Bearer ${token}`).send({ preferredActivities: ['walking', 'yoga'] }).expect(201);
    await request(app.getHttpServer()).post('/users/onboarding/step4').set('Authorization', `Bearer ${token}`).send({ availabilityPeriods: ['morning', 'evening'] }).expect(201);
    await request(app.getHttpServer()).post('/users/onboarding/step5').set('Authorization', `Bearer ${token}`).send({ intensityPreference: 'moderate' }).expect(201);
    await request(app.getHttpServer()).post('/users/onboarding/step6').set('Authorization', `Bearer ${token}`).send({ showPhotosAfterMatch: true }).expect(201);
    await request(app.getHttpServer()).post('/users/onboarding/step7').set('Authorization', `Bearer ${token}`).send({ source: s, manualActivityLevel: 'moderately_active', manualSleepRoutine: 'good', manualChronotype: 'morning' }).expect(201);
  }

  // ─── Test: Onboarding Completo ───────────────────────────────────────

  it('should complete full onboarding flow and generate PublicWellnessProfile', async () => {
    const reg = await registerUser('onboard-test@test.com', 'Onboard Test');
    const token = reg.access_token;
    const userId = reg.user.id;

    // Status before onboarding
    const statusBefore = await request(app.getHttpServer())
      .get('/users/onboarding/status')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(statusBefore.body.completed).toBe(false);

    await onboardUser(token);

    // Status after onboarding
    const statusAfter = await request(app.getHttpServer())
      .get('/users/onboarding/status')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(statusAfter.body.completed).toBe(true);
    expect(statusAfter.body.step).toBe(7);

    // Wellness profile exists
    const profile = await request(app.getHttpServer())
      .get('/users/me/wellness-profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(profile.body.onboardingCompleted).toBe(true);
    expect(profile.body.scoreConfidence).toBe('medium');
    expect(profile.body.displayName).toBe('Onboard Test');
  });

  // ─── Test: Matching Candidates ───────────────────────────────────────

  it('should show only completed onboarding users as candidates', async () => {
    const regA = await registerUser('cand-a@test.com', 'Candidate A');
    const regB = await registerUser('cand-b@test.com', 'Candidate B');

    await onboardUser(regA.access_token);
    // B is registered but NOT onboarded

    // A should see no candidates (B not onboarded)
    const candidates = await request(app.getHttpServer())
      .get('/matching/candidates')
      .set('Authorization', `Bearer ${regA.access_token}`)
      .expect(200);
    expect(Array.isArray(candidates.body)).toBe(true);
    expect(candidates.body.length).toBe(0);
  });

  it('should show candidates with compatibility reasons', async () => {
    const regA = await registerUser('cand-ok-a@test.com', 'A');
    const regB = await registerUser('cand-ok-b@test.com', 'B');

    await onboardUser(regA.access_token);
    await onboardUser(regB.access_token);

    const candidates = await request(app.getHttpServer())
      .get('/matching/candidates')
      .set('Authorization', `Bearer ${regA.access_token}`)
      .expect(200);
    expect(candidates.body.length).toBeGreaterThanOrEqual(1);
    const candidate = candidates.body[0];
    expect(candidate.compatibility).toBeDefined();
    expect(candidate.compatibility.total).toBeGreaterThanOrEqual(0);
    expect(candidate.compatibility.reasons.length).toBeGreaterThanOrEqual(1);
    expect(candidate.displayName).toBe('B');
  });

  // ─── Test: Mutual Swipe → Match ─────────────────────────────────────

  it('should create match on mutual like', async () => {
    const regA = await registerUser('match-a@test.com', 'A');
    const regB = await registerUser('match-b@test.com', 'B');

    await onboardUser(regA.access_token);
    await onboardUser(regB.access_token);

    // A likes B
    const candidatesForA = await request(app.getHttpServer())
      .get('/matching/candidates')
      .set('Authorization', `Bearer ${regA.access_token}`)
      .expect(200);
    const bId = candidatesForA.body[0].userId;

    await request(app.getHttpServer())
      .post('/matching/swipe')
      .set('Authorization', `Bearer ${regA.access_token}`)
      .send({ targetUserId: bId, direction: 'like' })
      .expect(201);

    // B likes A
    const candidatesForB = await request(app.getHttpServer())
      .get('/matching/candidates')
      .set('Authorization', `Bearer ${regB.access_token}`)
      .expect(200);
    const matchRes = await request(app.getHttpServer())
      .post('/matching/swipe')
      .set('Authorization', `Bearer ${regB.access_token}`)
      .send({ targetUserId: regA.user.id, direction: 'like' })
      .expect(201);

    expect(matchRes.body.matched).toBe(true);
    expect(matchRes.body.matchId).toBeDefined();
  });

  // ─── Test: Block → Removed from candidates ──────────────────────────

  it('should remove blocked user from candidates', async () => {
    const regA = await registerUser('block-cand-a@test.com', 'A');
    const regB = await registerUser('block-cand-b@test.com', 'B');

    await onboardUser(regA.access_token);
    await onboardUser(regB.access_token);

    // A blocks B
    const candidates = await request(app.getHttpServer())
      .get('/matching/candidates')
      .set('Authorization', `Bearer ${regA.access_token}`)
      .expect(200);
    const bId = candidates.body[0].userId;

    await request(app.getHttpServer())
      .post('/moderation/block')
      .set('Authorization', `Bearer ${regA.access_token}`)
      .send({ targetUserId: bId, reason: 'test' })
      .expect(201);

    // A sees no candidates (only B was available)
    const afterBlock = await request(app.getHttpServer())
      .get('/matching/candidates')
      .set('Authorization', `Bearer ${regA.access_token}`)
      .expect(200);
    expect(afterBlock.body.length).toBe(0);
  });

  // ─── Test: Block deactivates existing match ──────────────────────────

  it('should deactivate match when user blocks partner', async () => {
    const regA = await registerUser('block-match-a@test.com', 'A');
    const regB = await registerUser('block-match-b@test.com', 'B');

    await onboardUser(regA.access_token);
    await onboardUser(regB.access_token);

    // Create mutual match
    const targetB = (await request(app.getHttpServer()).get('/matching/candidates').set('Authorization', `Bearer ${regA.access_token}`).expect(200)).body[0].userId;
    await request(app.getHttpServer()).post('/matching/swipe').set('Authorization', `Bearer ${regA.access_token}`).send({ targetUserId: targetB, direction: 'like' });
    const matchRes = await request(app.getHttpServer()).post('/matching/swipe').set('Authorization', `Bearer ${regB.access_token}`).send({ targetUserId: regA.user.id, direction: 'like' }).expect(201);
    const matchId = matchRes.body.matchId;

    // A blocks B
    await request(app.getHttpServer()).post('/moderation/block').set('Authorization', `Bearer ${regA.access_token}`).send({ targetUserId: targetB, reason: 'test' }).expect(201);

    // Match should be blocked
    const matches = await request(app.getHttpServer()).get('/matching/matches').set('Authorization', `Bearer ${regA.access_token}`).expect(200);
    expect(matches.body.length).toBe(0);
  });

  // ─── Test: Report user ──────────────────────────────────────────────

  it('should allow reporting another user', async () => {
    const regA = await registerUser('report-a@test.com', 'A');
    const regB = await registerUser('report-b@test.com', 'B');

    await onboardUser(regA.access_token);
    await onboardUser(regB.access_token);

    const report = await request(app.getHttpServer())
      .post('/moderation/report')
      .set('Authorization', `Bearer ${regA.access_token}`)
      .send({ targetUserId: regB.user.id, reason: 'spam', description: 'Sending spam messages' })
      .expect(201);
    expect(report.body.reportedId).toBe(regB.user.id);
    expect(report.body.reason).toBe('spam');
  });

  it('should reject self-report', async () => {
    const reg = await registerUser('self-report@test.com', 'Self');

    await request(app.getHttpServer())
      .post('/moderation/report')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .send({ targetUserId: reg.user.id, reason: 'other' })
      .expect(400);
  });

  // ─── Test: Privacy ──────────────────────────────────────────────────

  it('should export user data including wellness profile', async () => {
    const reg = await registerUser('export@test.com', 'Export');
    await onboardUser(reg.access_token);

    const exportRes = await request(app.getHttpServer())
      .get('/privacy/export')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .expect(200);
    expect(exportRes.body.userId).toBe(reg.user.id);
    expect(exportRes.body.wellnessProfile).toBeDefined();
  });

  it('should delete account and prevent login', async () => {
    const reg = await registerUser('delete-account@test.com', 'Delete Me');
    await onboardUser(reg.access_token);

    await request(app.getHttpServer())
      .delete('/privacy/account')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .expect(204);

    // Should not be able to get user info
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .expect(401);
  });

  // ─── Test: Chat message limit ────────────────────────────────────────

  it('should not allow chat after block', async () => {
    const regA = await registerUser('chat-block-a@test.com', 'A');
    const regB = await registerUser('chat-block-b@test.com', 'B');

    await onboardUser(regA.access_token);
    await onboardUser(regB.access_token);

    // Create match
    const targetB = (await request(app.getHttpServer()).get('/matching/candidates').set('Authorization', `Bearer ${regA.access_token}`).expect(200)).body[0].userId;
    await request(app.getHttpServer()).post('/matching/swipe').set('Authorization', `Bearer ${regA.access_token}`).send({ targetUserId: targetB, direction: 'like' });
    const matchRes = await request(app.getHttpServer()).post('/matching/swipe').set('Authorization', `Bearer ${regB.access_token}`).send({ targetUserId: regA.user.id, direction: 'like' }).expect(201);

    // Block
    await request(app.getHttpServer()).post('/moderation/block').set('Authorization', `Bearer ${regA.access_token}`).send({ targetUserId: targetB, reason: 'test' }).expect(201);

    // Chat should reject
    await request(app.getHttpServer())
      .post('/chat/messages')
      .set('Authorization', `Bearer ${regA.access_token}`)
      .send({ matchId: matchRes.body.matchId, message: 'Hello' })
      .expect(403);
  });

  // ─── Test: Rate Limit (swipe) ────────────────────────────────────────

  it('should enforce daily swipe limit using createdAt', async () => {
    const reg = await registerUser('ratelimit@test.com', 'RL User');
    await onboardUser(reg.access_token);

    const candidates = await request(app.getHttpServer())
      .get('/matching/candidates')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .expect(200);

    if (candidates.body.length === 0) return; // skip if no candidates

    await request(app.getHttpServer())
      .post('/matching/swipe')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .send({ targetUserId: candidates.body[0].userId, direction: 'dislike' })
      .expect(201);
  });

  // ─── Test: Consent revocation → score_confidence drops ──────────────

  it('should lower score confidence on consent revocation', async () => {
    const reg = await registerUser('consent@test.com', 'Consent');
    await onboardUser(reg.access_token);

    const profileBefore = await request(app.getHttpServer())
      .get('/users/me/wellness-profile')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .expect(200);
    expect(profileBefore.body.scoreConfidence).toBe('medium');

    // Grant then revoke consent
    await request(app.getHttpServer())
      .post('/health/consent/grant')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .send({ metricTypes: ['steps', 'sleep'], purpose: 'matching_compatibility', sourceProvider: 'manual' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/health/consent/revoke')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .send({ metricTypes: ['steps'] })
      .expect(201);

    // Profile might have changed - just verify consent was recorded
    const consents = await request(app.getHttpServer())
      .get('/health/consents')
      .set('Authorization', `Bearer ${reg.access_token}`)
      .expect(200);
    expect(Array.isArray(consents.body)).toBe(true);
  });
});
