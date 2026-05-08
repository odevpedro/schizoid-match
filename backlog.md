# Backlog — WellMatch

> Registro vivo do progresso do projeto. Atualizado a cada mudanca de estado de uma funcionalidade.
> **Ultima atualizacao:** 2026-05-08

---

## Sobre o Projeto

Plataforma de match social baseada em dados de saude derivados de smartwatch, conectando pessoas por objetivos de bem-estar, estilo de vida e rotina — sem expor dados medicos sensiveis.

**Versao atual:** `0.1.0-MVP`
**Stack principal:** React Native + NestJS + PostgreSQL + TimescaleDB + Redis

---

## Legenda

| Simbolo | Significado |
|---------|-------------|
| `[ ]`   | Pendente |
| `[~]`   | Em andamento |
| `[x]`   | Concluido |
| `P0`    | Critico — bloqueia outras features |
| `P1`    | Alta prioridade |
| `P2`    | Media prioridade |
| `P3`    | Melhoria / nice-to-have |
| `XS` `S` `M` `L` `XL` | Estimativa de complexidade |

---

## Em Andamento

> Nenhum item em andamento no momento.

---

## Concluidas

### MVP — v0.1.0 (2026-05-07)

- `[x]` P0 / L — Estrutura do projeto (backend NestJS + mobile React Native)
- `[x]` P0 / M — Schema SQL com TimescaleDB (init.sql)
- `[x]` P0 / M — Docker Compose para ambiente local
- `[x]` P0 / L — Autenticacao JWT (registro, login, guards)
- `[x]` P0 / M — Entidades TypeORM (users, preferences, health, match, chat)
- `[x]` P0 / XL — Camada HealthProvider (interface + SimulatedProvider + Factory)
- `[x]` P0 / L — Ingestao de metricas com verificacao de consentimento
- `[x]` P0 / M — HealthProfileProcessor (metricas brutas → bandas derivadas)
- `[x]` P1 / L — CompatibilityCalculator (score ponderado 7 dimensoes)
- `[x]` P1 / L — Sistema de swipe (like/dislike/super_like + rate limiting)
- `[x]` P1 / M — Criacao automatica de match bilateral
- `[x]` P1 / L — Chat via WebSocket (Socket.IO Gateway)
- `[x]` P1 / M — Chat REST fallback + sugestoes wellness
- `[x]` P1 / L — Desafios em dupla (CRUD basico)
- `[x]` P1 / L — Privacidade e LGPD (export, delete health data, delete account)
- `[x]` P1 / L — Consentimento granular por metrica (grant/revoke)
- `[x]` P0 / XL — Telas mobile: Login, Register, Match (swipe), Mensagens, Chat
- `[x]` P0 / L — Telas mobile: Perfil, Privacidade, Conexao de Smartwatch
- `[x]` P1 / L — Componentes: WellnessCard (swipe animado), CompatibilityBar, WellnessBadges
- `[x]` P1 / M — Navegacao por 4 abas (Perfil, Match, Desafios, Mensagens)
- `[x]` P2 / M — Documentacao: README, backlog, architecture.md, system-feature-flows.md

### Correcoes e Infraestrutura Web — v0.1.1 (2026-05-08)

- `[x]` P0 / XS — Fix: `#root` sem `display: flex` causava tela em branco no browser
- `[x]` P0 / XS — Fix: `__DEV__` indefinido no Vite (adicionado em `define` no vite.config.ts)
- `[x]` P1 / S  — Fix: aba Match nao responsiva — `Dimensions.get` estatico substituido por `useWindowDimensions`
- `[x]` P1 / M  — Feature: modo demo com login ficticio (`demo@wellmatch.app` / `demo123`) sem dependencia de backend
- `[x]` P1 / L  — Feature: camada de mock data cobrindo todas as telas (perfil, match, mensagens, desafios, privacidade)

---

## Pendentes

### Integracao Real com Smartwatches — P0

- `[ ]` P0 / XL — HealthKit provider (iOS)
- `[ ]` P0 / XL — Health Connect provider (Android)
- `[ ]` P1 / XL — Garmin Connect API
- `[ ]` P1 / XL — Fitbit API
- `[ ]` P2 / L  — Samsung Health SDK

### Onboarding Completo — P1

- `[ ]` P1 / M — Tela de onboarding multi-step (objetivos, atividades, privacidade)
- `[ ]` P1 / S — Logica de redirecionamento pos-registro para onboarding
- `[ ]` P2 / M — Calculo e publicacao de public_health_profile pos-ingestao

### Perfil e Match — P1

- `[ ]` P1 / M — Upload de foto de perfil (revelada so apos match)
- `[ ]` P1 / L — Filtros de match (distancia real via geolocation, cronotype)
- `[ ]` P2 / M — Desfazer match (unmatch)
- `[ ]` P2 / S — Bloquear usuario

### Desafios — P2

- `[ ]` P2 / L  — Progresso automatico de desafio via metricas do dia
- `[ ]` P2 / M  — Notificacoes de desafio concluido
- `[ ]` P3 / M  — Historico de desafios completados

### Infraestrutura — P1

- `[ ]` P1 / M — Testes de integracao (auth, match, health)
- `[ ]` P1 / L — CI/CD com GitHub Actions
- `[ ]` P1 / M — Migracao TypeORM (substituir synchronize: true)
- `[ ]` P2 / M — Observabilidade (logs estruturados, health check endpoint)
- `[ ]` P2 / L — Deploy em ambiente de producao (Railway, Render ou VPS)

### Machine Learning — P3

- `[ ]` P3 / XL — Modelo de compatibilidade baseado em embeddings de perfil
- `[ ]` P3 / XL — Recomendacao personalizada por comportamento de swipe

---

## Bugs Conhecidos

| ID | Descricao | Severidade | Reportado em |
|----|-----------|------------|--------------|
| B001 | `public_health_profile` nao e populado automaticamente apos ingestao | Alta | 2026-05-07 |
| B002 | Rate limit de swipes usa contagem total, nao diaria | Media | 2026-05-07 |
| B003 | Sugestoes de chat sao deterministicas (sem variacao real) | Baixa | 2026-05-07 |
| B004 | Backend nunca iniciado — docker-compose e variaveis de ambiente nao validados em ambiente real | Alta | 2026-05-08 |

---

## Decisoes Tecnicas Pendentes

- Definir estrategia de geolocation: coordenadas aproximadas ou apenas regiao textual?
- Avaliar Supabase Auth como alternativa ao JWT proprio para facilitar OAuth social
- Definir politica de retencao de `health_metrics_raw` (LGPD exige prazo definido)
- Avaliar Expo vs React Native CLI para build mais facil no MVP

---

## Historico de Versoes

| Versao | Data | Principais entregas |
|--------|------|---------------------|
| `0.1.0` | 2026-05-07 | MVP completo: backend NestJS, mobile React Native, infra Docker, documentacao |
| `0.1.1` | 2026-05-08 | Correcoes web (tela branca, __DEV__, responsividade Match), modo demo com mock data |
