# Arquitetura do Sistema — WellMatch

## Visao Geral

WellMatch e uma plataforma de match social baseada em habitos e dados de saude derivados de smartwatches. O sistema e construido com foco em privacidade: dados brutos nunca sao expostos publicamente; apenas faixas e badges derivados sao usados para compatibilidade.

---

## Diagrama de Arquitetura

```
+-----------------------------+
|    React Native Mobile App  |
|  (iOS / Android / Expo Dev) |
|                             |
|  [Auth] [Match] [Chat]      |
|  [Challenges] [Profile]     |
|  [Privacy / LGPD]           |
+-------------|---------------+
              |
     REST API / WebSocket (Socket.IO)
              |
+-----------------------------+
|       NestJS Backend        |
|                             |
|  [AuthModule]               |
|  [UsersModule]              |
|  [HealthModule]             |
|  [MatchingModule]           |
|  [ChatModule + Gateway]     |
|  [ChallengesModule]         |
|  [PrivacyModule]            |
+-------|---------|--------|--+
        |         |        |
  [PostgreSQL  [TimescaleDB]  [Redis]
  + TypeORM]  (health_metrics_raw)
                             |
+-----------------------------+
|    HealthProvider Layer     |
|                             |
|  [SimulatedProvider]  (MVP) |
|  [HealthKit]          (iOS) |
|  [Health Connect] (Android) |
|  [Garmin]        (futuro)   |
|  [Fitbit]        (futuro)   |
+-----------------------------+
```

---

## Camadas do Sistema

### Mobile (React Native + TypeScript)
- Zustand para estado global (auth, match, chat)
- Axios com interceptor de token JWT
- Socket.IO client para mensagens em tempo real
- react-navigation com 4 abas principais
- Tema escuro com acentos teal/azul

### Backend (NestJS + TypeScript)
- Arquitetura modular com separacao clara por dominio
- JWT para autenticacao (PassportJS)
- TypeORM para mapeamento de entidades
- Socket.IO Gateway para WebSockets em tempo real
- Throttler para rate limiting de swipes
- Swagger para documentacao da API

### Banco de Dados (PostgreSQL 15 + TimescaleDB)
- `health_metrics_raw`: hypertable TimescaleDB, nunca exposta via API
- `health_profile_daily`: perfil derivado seguro (bandas, nao valores brutos)
- `public_health_profile`: dados visiveis para match (tags, badges, cronotype)
- `consent_records`: log de consentimento LGPD

### Cache (Redis 7)
- Sessoes de socket
- Rate limiting de swipes
- Cache de candidatos de match

---

## Fluxo de Dados de Saude (Privacy Pipeline)

```
Smartwatch / Provider
        |
  HealthProvider.fetchMetrics()
        |
  health_metrics_raw    <-- Tabela protegida, acesso apenas interno
        |
  HealthProfileProcessor.processMetrics()
        |
  health_profile_daily  <-- Apenas bandas: "alto", "moderado", "baixo"
        |
  public_health_profile <-- Tags, badges, cronotype (sem valores sensiveis)
        |
  CompatibilityCalculator
        |
  Score de Compatibilidade (0-100)
        |
  Card de Match (visivel ao usuario)
```

---

## Modelo de Privacidade

### O que outros usuarios NUNCA verao:
- Batimentos cardiacos brutos
- HRV (variabilidade da frequencia cardiaca)
- VO2 Max especifico
- Oxigenacao sanguinea
- Temperatura cutanea
- Nivel de estresse exato
- Score de sono exato

### O que aparece no match (dados derivados):
- "Perfil Matutino" (cronotype)
- "Alta Atividade" (band de passos)
- "Sono Consistente" (band de sleep quality)
- "Recuperacao Boa" (band de HRV)
- "Objetivo: Fitness" (goals declarados)
- Score de compatibilidade (0-100%)

---

## Sistema de Compatibilidade

### Pesos
| Dimensao | Peso |
|----------|------|
| Objetivos wellness | 25% |
| Atividades preferidas | 20% |
| Cronotype | 15% |
| Intensidade preferida | 15% |
| Disponibilidade | 10% |
| Distancia | 10% |
| Consistencia de habitos | 5% |

### Calculo
Cada dimensao e normalizada para 0-100 usando regras de correspondencia:
- Objetivos e atividades: indice de Jaccard (intersecao / uniao)
- Cronotype e intensidade: pontuacao por proximidade na escala ordinal
- Distancia: penalidade linear pelo limite maximo definido pelo usuario

---

## Seguranca

- Senhas com bcrypt (12 rounds)
- JWT com expiracao de 7 dias
- Todos os endpoints protegidos por JwtAuthGuard
- health_metrics_raw com Row Level Security (PostgreSQL)
- Rate limiting: 60 req/min por IP e 50 swipes/dia por usuario
- Soft delete de conta (anonimizacao de dados pessoais)
- Exclusao permanente de dados de saude via endpoint LGPD

---

## Eventos WebSocket

| Evento | Direcao | Descricao |
|--------|---------|-----------|
| `join:match` | Client → Server | Entrar na sala de um match |
| `message:send` | Client → Server | Enviar mensagem |
| `message:received` | Server → Client | Mensagem recebida no match |
| `match:new` | Server → Client | Novo match criado |

---

## Integracao com Smartwatch (HealthProvider)

A interface `HealthProvider` abstrai todas as fontes de dados:

```typescript
interface HealthProvider {
  providerName: string;
  isAvailable(): Promise<boolean>;
  requestPermissions(metrics: string[]): Promise<Record<string, boolean>>;
  fetchMetrics(userId: string, from: Date, to: Date): Promise<RawHealthMetrics[]>;
}
```

No MVP: `SimulatedProvider` gera dados consistentes baseados no hash do userId.
Futuro: HealthKit (iOS), Health Connect (Android), Garmin Connect, Fitbit API.
