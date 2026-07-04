import { User } from '../types/user.types';
import { ConsentRecord, HealthMetricType } from '../types/health.types';
import { HealthProfileDaily } from '../types/health.types';
import { MatchCandidate, Match } from '../types/match.types';
import { Conversation, ChatMessage } from '../types/chat.types';

export const DEMO_TOKEN = 'demo-token-local';

export const mockUser: User = {
  id: 'demo',
  email: 'demo@wellmatch.app',
  name: 'Ana Lima',
  birthdate: '1995-04-12',
  locationRegion: 'São Paulo, SP',
  bio: 'Apaixonada por corrida e meditação. Buscando parceiros de bem-estar.',
  createdAt: '2025-01-15T10:00:00Z',
};

export const mockHealthProfile: HealthProfileDaily = {
  id: 'hp-demo-1',
  userId: 'demo',
  date: '2026-05-07',
  activityLevel: 'high',
  avgStepsBand: 'high',
  sleepQualityBand: 'good',
  chronotype: 'morning',
  recoveryBand: 'great',
  stressBand: 'moderate',
  cardioFitnessBand: 'good',
  consistencyScore: 78,
};

const compatibilityTemplate: MatchCandidate = {
  userId: '',
  activityLevel: null,
  activityConsistencyBand: null,
  sleepRoutineBand: null,
  chronotypeBand: null,
  intensityPreference: null,
  mainIntention: null,
  preferredActivities: [],
  wellnessGoals: [],
  availabilityPeriods: [],
  publicBadges: [],
  scoreConfidence: 'high',
  source: 'manual',
  isVisible: true,
  onboardingCompleted: true,
  compatibility: { total: 0, confidence: 'high', reasons: [], dimensions: [] },
};

export const mockCandidates: MatchCandidate[] = [
  {
    ...compatibilityTemplate,
    userId: 'u1',
    chronotypeBand: 'morning',
    activityLevel: 'active',
    preferredActivities: ['running', 'meditation'],
    wellnessGoals: ['fitness', 'stress_reduction'],
    publicBadges: ['7 dias consecutivos', 'Maratonista'],
    compatibility: { total: 91, confidence: 'high', reasons: ['Cronotipos alinhados e rotina de exercícios compatível.'], dimensions: [] },
  },
  {
    ...compatibilityTemplate,
    userId: 'u2',
    chronotypeBand: 'flexible',
    activityLevel: 'moderate',
    preferredActivities: ['yoga', 'walking'],
    wellnessGoals: ['mindfulness', 'better_sleep'],
    publicBadges: ['Consistência 30 dias', 'Zen Master'],
    compatibility: { total: 84, confidence: 'medium', reasons: ['Metas complementares e ritmo de vida similar.'], dimensions: [] },
  },
  {
    ...compatibilityTemplate,
    userId: 'u3',
    chronotypeBand: 'morning',
    activityLevel: 'very_active',
    preferredActivities: ['gym', 'cycling'],
    wellnessGoals: ['fitness', 'social_activity'],
    publicBadges: ['Atleta Elite', 'VO2 Max Alto'],
    compatibility: { total: 79, confidence: 'high', reasons: ['Alta energia e foco em performance física.'], dimensions: [] },
  },
  {
    ...compatibilityTemplate,
    userId: 'u4',
    chronotypeBand: 'evening',
    activityLevel: 'moderate',
    preferredActivities: ['yoga', 'dancing'],
    wellnessGoals: ['flexibility', 'stress_reduction'],
    publicBadges: ['Equilíbrio Perfeito'],
    compatibility: { total: 72, confidence: 'medium', reasons: ['Foco em equilíbrio mente-corpo.'], dimensions: [] },
  },
  {
    ...compatibilityTemplate,
    userId: 'u5',
    chronotypeBand: 'morning',
    activityLevel: 'active',
    preferredActivities: ['running', 'swimming'],
    wellnessGoals: ['fitness', 'weight_loss'],
    publicBadges: ['Madrugador', '10k Finisher'],
    compatibility: { total: 88, confidence: 'high', reasons: ['Cronotipos idênticos e objetivos de condicionamento alinhados.'], dimensions: [] },
  },
];

const mockMatch: Match = {
  id: 'match-1',
  userId1: 'demo',
  userId2: 'u1',
  scoreCompatibility: 91,
  status: 'active',
  createdAt: '2026-05-06T14:22:00Z',
};

const mockLastMessage: ChatMessage = {
  id: 'msg-2',
  matchId: 'match-1',
  senderId: 'u1',
  message: 'Que legal! Eu corro na Aclimação todo sábado cedo.',
  isRead: false,
  timestamp: '2026-05-08T08:15:00Z',
  sender: { id: 'u1', name: 'Carlos Mendes' },
};

export const mockConversations: Conversation[] = [
  {
    match: mockMatch,
    partner: { id: 'u1', name: 'Carlos Mendes' },
    lastMessage: mockLastMessage,
    unreadCount: 1,
  },
  {
    match: {
      id: 'match-2',
      userId1: 'demo',
      userId2: 'u2',
      scoreCompatibility: 84,
      status: 'active',
      createdAt: '2026-05-05T10:00:00Z',
    },
    partner: { id: 'u2', name: 'Beatriz Costa' },
    lastMessage: {
      id: 'msg-3',
      matchId: 'match-2',
      senderId: 'demo',
      message: 'Oi! Vi que você também pratica yoga de manhã :)',
      isRead: true,
      timestamp: '2026-05-07T07:30:00Z',
    },
    unreadCount: 0,
  },
];

const GRANTED: HealthMetricType[] = ['steps', 'sleep', 'calories', 'heart_rate', 'hrv', 'stress'];
const REVOKED: HealthMetricType[] = ['vo2max', 'blood_oxygen', 'skin_temp'];

export const mockConsents: ConsentRecord[] = [
  ...GRANTED.map((m, i) => ({
    id: `consent-${i}`,
    userId: 'demo',
    metricType: m,
    permissionStatus: 'granted' as const,
    grantedAt: '2026-04-01T10:00:00Z',
    sourceProvider: 'simulated',
  })),
  ...REVOKED.map((m, i) => ({
    id: `consent-rev-${i}`,
    userId: 'demo',
    metricType: m,
    permissionStatus: 'revoked' as const,
    sourceProvider: 'simulated',
  })),
];

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  challengeType: string;
  targetValue?: number;
  targetUnit?: string;
  endDate?: string;
  status: string;
}

export const mockChallenges: Challenge[] = [
  {
    id: 'ch-1',
    title: '10.000 Passos por Dia',
    description: 'Você e Carlos competem para manter a média acima de 10k passos durante 7 dias.',
    challengeType: 'steps',
    targetValue: 10000,
    targetUnit: 'passos/dia',
    endDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: 'active',
  },
  {
    id: 'ch-2',
    title: 'Semana do Sono Reparador',
    description: 'Durma pelo menos 7h por 5 noites seguidas.',
    challengeType: 'sleep_streak',
    targetValue: 7,
    targetUnit: 'horas/noite',
    endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'active',
  },
  {
    id: 'ch-3',
    title: 'Atividade Semanal em Dupla',
    description: 'Acumule 150 minutos de atividade física moderada na semana.',
    challengeType: 'weekly_activity',
    targetValue: 150,
    targetUnit: 'minutos',
    endDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    status: 'active',
  },
  {
    id: 'ch-4',
    title: 'Check-in de Bem-estar',
    description: 'Registre seu humor por 7 dias consecutivos.',
    challengeType: 'wellness_checkin',
    endDate: new Date(Date.now() - 86400000).toISOString(),
    status: 'completed',
  },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  'match-1': [
    {
      id: 'msg-1',
      matchId: 'match-1',
      senderId: 'demo',
      message: 'Oi Carlos! Vi que você também corre de manhã. Onde costuma treinar?',
      isRead: true,
      timestamp: '2026-05-08T07:50:00Z',
      sender: { id: 'demo', name: 'Ana Lima' },
    },
    mockLastMessage,
  ],
  'match-2': [
    {
      id: 'msg-3',
      matchId: 'match-2',
      senderId: 'demo',
      message: 'Oi! Vi que você também pratica yoga de manhã :)',
      isRead: true,
      timestamp: '2026-05-07T07:30:00Z',
      sender: { id: 'demo', name: 'Ana Lima' },
    },
  ],
};
