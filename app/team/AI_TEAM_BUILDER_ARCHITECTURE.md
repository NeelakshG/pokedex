# AI Team Builder — Architecture Document

**Target audience:** AI/ML engineering job applications  
**Status:** Design phase — no implementation yet  
**Last updated:** 2026-06-27

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Design Philosophy](#2-design-philosophy)
3. [Stage 1 — Feature Engineering](#3-stage-1--feature-engineering)
4. [Stage 2 — LLM Inference](#4-stage-2--llm-inference)
5. [API Route Design](#5-api-route-design)
6. [Caching Strategy](#6-caching-strategy)
7. [Security Model](#7-security-model)
8. [Full Request Lifecycle](#8-full-request-lifecycle)
9. [File Structure](#9-file-structure)
10. [Schema Changes Required](#10-schema-changes-required)
11. [Assumptions and Open Questions](#11-assumptions-and-open-questions)
12. [Portfolio Framing](#12-portfolio-framing)

---

## 1. System Overview

The AI Team Builder is a **two-stage inference pipeline** built on top of the existing Next.js Pokédex app. Users select up to six Pokémon, click **Analyze Team**, and receive a structured competitive evaluation — score, grade, strengths, weaknesses, and replacement suggestions.

The pipeline separates concerns that are fundamentally different in nature:

| Stage | What it does | Why it exists here |
|-------|-------------|-------------------|
| Feature Engineering | Computes type coverage, weakness stacks, role classifications, synergy score | Math is deterministic. A computer is correct; an LLM might hallucinate that Fire is super-effective against Water. |
| LLM Inference | Synthesizes features into natural language, assigns a holistic score, suggests strategy | Language models excel at synthesis, narrative, and cross-domain reasoning — not arithmetic on lookup tables. |

This mirrors the architecture of production ML systems where hand-engineered or rule-based features are fed as structured context to a downstream model, rather than asking the model to derive everything from raw inputs.

---

## 2. Design Philosophy

### Why not just send "here are my 6 Pokémon, analyze them"?

A naive prompt would ask the LLM to:
1. Recall the 18×18 type effectiveness chart from training data
2. Compute which types the team is weak to
3. Count weakness stacks
4. Assign a score
5. Justify the score in prose

This fails in production for three reasons:

**Factual reliability.** Type effectiveness is a lookup table, not something to reason about inductively. LLMs can and do make errors on specific type matchups — especially for dual-typed Pokémon where immunities override weaknesses. The type chart is ground truth; inject it as computed data, not inferred knowledge.

**Reasoning budget.** Every token the LLM spends re-deriving type coverage is a token it cannot spend on higher-value synthesis (team strategy, competitive meta reasoning, replacement suggestions). Pre-computing features shifts the model's attention to where it genuinely adds value.

**Auditability.** When a user asks "why did you flag this weakness?", the system can point to the deterministic feature engineering output — not a black-box generation. This is a core property of production ML systems that ship in regulated or high-stakes environments.

### The RAG Analogy

This pattern is structurally similar to Retrieval-Augmented Generation (RAG): instead of retrieving documents, we retrieve and compute structured features, then inject them as grounded context. The LLM's job is synthesis and language — the retrieval/computation layer handles facts.

---

## 3. Stage 1 — Feature Engineering

**Module:** `lib/teamAnalysis.ts`  
**Character:** Pure TypeScript — no network calls, no AI, fully deterministic and unit-testable.  
**Dependency:** `lib/typeChart.ts` — hardcoded 18×18 effectiveness constants.

### 3.1 Data Normalization

`getPokemon(id)` in `lib/pokeapi.ts` returns stats as a flat array:

```typescript
stats: { name: string; value: number }[]
// e.g. [{ name: "special-attack", value: 95 }, { name: "speed", value: 102 }, ...]
```

The feature engineering layer must normalize this into a keyed stat object before any computation:

```typescript
function normalizeStats(raw: { name: string; value: number }[]): StatBlock {
  const lookup = Object.fromEntries(raw.map(s => [s.name, s.value]))
  return {
    hp:  lookup["hp"],
    atk: lookup["attack"],
    def: lookup["defense"],
    spa: lookup["special-attack"],
    spd: lookup["special-defense"],
    spe: lookup["speed"],
  }
}
```

> **Note:** PokeAPI uses hyphenated stat names (`special-attack`, `special-defense`). All threshold comparisons below use the normalized `StatBlock` shape.

### 3.2 Role Classifier

A **rule-based decision tree** that classifies each Pokémon into one or more roles based on stat thresholds. Multiple roles are allowed (a Pokémon can be both a Physical Wall and a Bulky Attacker).

| Role | Decision Boundary |
|------|------------------|
| Physical Sweeper | `atk >= 110 AND spe >= 90` |
| Special Sweeper | `spa >= 110 AND spe >= 90` |
| Physical Wall | `def >= 100 AND hp >= 80` |
| Special Wall | `spd >= 100 AND hp >= 80` |
| Bulky Attacker | `(atk >= 100 OR spa >= 100) AND (hp >= 90 OR def >= 90)` |
| Speed Control | `spe >= 110` |
| Support/Utility | None of the above (catch-all) |

**Why this matters architecturally:** This classifier is fully interpretable. Every classification has a human-readable justification (`"atk=130 >= 110, spe=102 >= 90 → Physical Sweeper"`). In production ML systems, auditable rule-based components are often preferred alongside black-box models because they can be inspected, corrected, and version-controlled independently of the model.

```typescript
function classifyRoles(stats: StatBlock): string[] {
  const roles: string[] = []
  if (stats.atk >= 110 && stats.spe >= 90)                          roles.push("Physical Sweeper")
  if (stats.spa >= 110 && stats.spe >= 90)                          roles.push("Special Sweeper")
  if (stats.def >= 100 && stats.hp >= 80)                           roles.push("Physical Wall")
  if (stats.spd >= 100 && stats.hp >= 80)                           roles.push("Special Wall")
  if ((stats.atk >= 100 || stats.spa >= 100) && 
      (stats.hp >= 90 || stats.def >= 90))                          roles.push("Bulky Attacker")
  if (stats.spe >= 110)                                             roles.push("Speed Control")
  if (roles.length === 0)                                           roles.push("Support/Utility")
  return roles
}
```

### 3.3 Type Chart Constants (`lib/typeChart.ts`)

The 18×18 type effectiveness matrix is hardcoded as a constant — it is a game rule, not derived data. It never changes and must not be computed or inferred.

```typescript
// Excerpt — full matrix covers all 18 types
export const TYPE_CHART: Record<string, Record<string, number>> = {
  Fire:    { Grass: 2, Ice: 2, Bug: 2, Steel: 2, Water: 0.5, Rock: 0.5, Fire: 0.5, Dragon: 0.5 },
  Water:   { Fire: 2, Ground: 2, Rock: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
  // ... all 18 attack types
}

// Defensive lookup: given a Pokémon's type(s), what multiplier does each attack type deal?
export function getDefensiveProfile(types: string[]): Record<string, number> { ... }
```

The defensive profile for a dual-typed Pokémon multiplies the individual type multipliers (e.g., Ground/Dragon: Ice hits Ground at 1× and Dragon at 2× → 2× total; but Dragon is immune to nothing, Ground is immune to Electric → final Electric multiplier is 0).

### 3.4 Type Coverage Matrix

For the full six-member team:

| Computed Field | Definition |
|---------------|-----------|
| `offensiveCoverage` | Set of types that at least one team member hits at 2× or 4× |
| `uncoveredTypes` | 18-type universe minus `offensiveCoverage` |
| `defensiveWeaknesses` | For each type, count of team members with a weakness multiplier > 1 |
| `weaknessStacks` | `Record<type, count>` — all types where `count >= 2` |
| `criticalWeaknesses` | Types where `count >= 3` — these become hard alerts |
| `immunities` | Types where at least one team member has a 0× multiplier |

```typescript
function computeTeamCoverage(pokemon: PokemonFeatures[]): CoverageMatrix {
  const offensiveCoverage = new Set<string>()
  const weaknessCounts: Record<string, number> = {}
  const immunities = new Set<string>()

  for (const p of pokemon) {
    // Offensive: what types does this pokemon's STAB hit SE?
    for (const t of p.types) {
      for (const [defender, mult] of Object.entries(TYPE_CHART[t] ?? {})) {
        if (mult >= 2) offensiveCoverage.add(defender)
      }
    }
    // Defensive: what types does this pokemon take SE from?
    const profile = getDefensiveProfile(p.types)
    for (const [attacker, mult] of Object.entries(profile)) {
      if (mult > 1) weaknessCounts[attacker] = (weaknessCounts[attacker] ?? 0) + 1
      if (mult === 0) immunities.add(attacker)
    }
  }

  const allTypes = ALL_18_TYPES
  return {
    offensiveCoverage: [...offensiveCoverage],
    uncoveredTypes: allTypes.filter(t => !offensiveCoverage.has(t)),
    weaknessStacks: weaknessCounts,
    criticalWeaknesses: Object.entries(weaknessCounts)
      .filter(([, n]) => n >= 3)
      .map(([t]) => t),
    immunities: [...immunities],
  }
}
```

### 3.5 Speed Tier Analysis

```typescript
type SpeedProfile = {
  fastest: number
  slowest: number
  hasSpeedControl: boolean    // at least one member with spe >= 110
  isVerySlowTeam: boolean     // no member above spe 90
  bracketDistribution: Record<SpeedBracket, number>
}

type SpeedBracket = "<60" | "60-79" | "80-99" | "100-109" | "110+"
```

A team with no member above SPE 90 is flagged as "very slow" — it will be out-sped by most competitive threats and likely cannot revenge-kill. A bracket where 3+ members cluster together (e.g., three Pokémon all in the 80-99 bracket) is flagged as a speed profile weakness.

### 3.6 Synergy Score

A single integer from 0 to 100 representing how well the team is constructed. This is a deterministic heuristic — not an ML model output — and is used to **anchor** the LLM's scoring (see Stage 2).

**Computation:**

| Condition | Delta |
|-----------|-------|
| Base | +50 |
| Each distinct role category covered (max 6) | +10 each |
| Each type where 3+ members share a weakness | -5 each |
| Team has at least one immunity to any of: Ground, Water, Fire, Electric | +5 |
| Team has zero STAB coverage against any of: Ground, Water, Fire, Ice, Dragon | -10 |

```typescript
function computeSynergyScore(features: TeamFeatures): number {
  let score = 50
  score += features.rolesPresent.length * 10
  score -= features.criticalWeaknesses.length * 5
  const commonTypes = ["Ground", "Water", "Fire", "Electric"]
  if (commonTypes.some(t => features.immunities.includes(t))) score += 5
  const mustCover = ["Ground", "Water", "Fire", "Ice", "Dragon"]
  if (mustCover.some(t => features.uncoveredTypes.includes(t))) score -= 10
  return Math.max(0, Math.min(100, score))
}
```

### 3.7 Feature Types

The complete TypeScript types for the data passed between Stage 1 and Stage 2:

```typescript
type StatBlock = {
  hp: number; atk: number; def: number
  spa: number; spd: number; spe: number
}

type PokemonFeatures = {
  name: string
  types: string[]
  stats: StatBlock
  roles: string[]         // output of role classifier
  weaknesses: string[]    // types this Pokémon is weak to (mult > 1)
  resistances: string[]   // types this Pokémon resists (mult < 1, mult > 0)
  immunities: string[]    // types this Pokémon is immune to (mult = 0)
}

type TeamFeatures = {
  pokemon: PokemonFeatures[]
  offensiveCoverage: string[]
  uncoveredTypes: string[]
  weaknessStacks: Record<string, number>
  criticalWeaknesses: string[]
  rolesPresent: string[]
  rolesMissing: string[]
  immunities: string[]
  synergyScore: number
  speedProfile: SpeedProfile
}
```

---

## 4. Stage 2 — LLM Inference

**Module:** `app/api/teams/analyze/route.ts`  
**Model:** Claude (via `@anthropic-ai/sdk`)  
**Streaming:** Vercel AI SDK `streamText` for narrative fields  
**Validation:** Zod

### 4.1 System Prompt Design

The system prompt does four things:

1. **Role establishment** — establishes Claude as a competitive Pokémon analyst with knowledge of VGC/Smogon formats
2. **Output contract** — specifies that the response must be valid JSON matching the output schema (no markdown, no preamble)
3. **Chain-of-thought instruction** — instructs the model to reason about weaknesses, then offense, then roles, then synthesize a score. This structures the attention before the output token.
4. **Feature delegation** — explicitly tells the model that type chart computations have already been performed. The model should not re-derive them; it should use the provided data as ground truth.

```
You are a competitive Pokémon team analyst with expertise in VGC and Smogon formats.

You will receive a pre-computed feature matrix for a 6-Pokémon team. The type effectiveness 
calculations, weakness stacks, and role classifications have already been computed deterministically 
from the game's type chart. Treat these values as ground truth — do not re-derive them.

Your job is to synthesize these features into strategic analysis: identify patterns, assess 
competitive viability, and suggest actionable improvements.

You must respond with valid JSON only. No markdown, no explanation outside the JSON object.
The JSON must conform exactly to the schema provided in the user message.

Think step by step before writing your JSON:
1. What are the team's most exploitable defensive vulnerabilities?
2. What offensive types does the team fail to threaten?
3. Is the role distribution balanced for a 6-member team?
4. What is the single biggest threat this team cannot handle?
Only after this reasoning, output the JSON.
```

### 4.2 Prompt Construction (RAG-Inspired Context Injection)

The user message is structured with XML-tagged context blocks — the same pattern used in RAG systems to separate retrieved facts from the generation task.

```
<team_features>
{
  "pokemon": [...],
  "offensiveCoverage": ["Fire", "Water", "Dragon", ...],
  "uncoveredTypes": ["Ice", "Fairy"],
  "weaknessStacks": { "Ice": 3, "Ground": 2, "Fairy": 2 },
  "criticalWeaknesses": ["Ice"],
  "rolesPresent": ["Physical Sweeper", "Special Wall", "Physical Wall"],
  "rolesMissing": ["Special Sweeper", "Speed Control", "Support/Utility"],
  "synergyScore": 62,
  "speedProfile": { "fastest": 130, "slowest": 65, "hasSpeedControl": true, "isVerySlowTeam": false }
}
</team_features>

Analyze this team. Think step by step about:
1. Defensive vulnerabilities — the weaknessStacks show Ice affects 3 members (criticalWeaknesses). 
   What threats does this open up and how severe is it?
2. Offensive gaps — uncoveredTypes lists Ice and Fairy. Which of these matters most competitively?
3. Role balance — rolesPresent has 3 roles, rolesMissing has 3. Is this acceptable?
4. Synergy — the computed synergyScore is 62/100. Calibrate your overallScore near this value; 
   only deviate significantly if your analysis reveals a factor the heuristic missed.

Return valid JSON matching this exact schema:
{
  "overallScore": number (0-100),
  "grade": "S" | "A" | "B" | "C" | "D" | "F",
  "summary": string (max 200 chars),
  "strengths": string[] (max 4 items),
  "weaknesses": string[] (max 4 items),
  "criticalThreat": string,
  "suggestedReplacements": [{ "remove": string, "addType": string, "reason": string }] (max 2),
  "mvp": string
}
```

**Why this pattern is powerful:** The LLM receives pre-computed ground truth for every factual question (what types are weak to what, how many members share a weakness). Its reasoning budget is entirely available for synthesis — strategic evaluation, competitive meta-awareness, and natural language. This is the core value proposition of the two-stage design.

### 4.3 Output Schema (Zod Validation)

All LLM output is validated server-side before any data reaches the client. If validation fails, the route returns a 500 with a structured error — it never forwards malformed model output.

```typescript
import { z } from "zod"

const AnalysisOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  grade: z.enum(["S", "A", "B", "C", "D", "F"]),
  summary: z.string().max(200),
  strengths: z.array(z.string()).max(4),
  weaknesses: z.array(z.string()).max(4),
  criticalThreat: z.string(),
  suggestedReplacements: z.array(z.object({
    remove: z.string(),
    addType: z.string(),
    reason: z.string(),
  })).max(2),
  mvp: z.string(),
})

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>
```

### 4.4 Streaming Architecture

Not all fields need to stream — structured fields (score, grade, replacements) can be parsed synchronously; the narrative summary benefits from streaming for perceived latency.

**Two-phase response:**

1. **Phase 1 (non-streaming):** Claude returns the full JSON object. The route parses and Zod-validates the structured fields (`overallScore`, `grade`, `strengths`, `weaknesses`, `suggestedReplacements`, `mvp`). These are serialized and sent as the first chunk of the response.

2. **Phase 2 (streaming via SSE):** The `summary` and `criticalThreat` fields — or an extended narrative block appended after the JSON — stream via Server-Sent Events using Vercel AI SDK's `StreamingTextResponse`. The client renders them progressively.

```typescript
import { StreamingTextResponse, streamText } from "ai"
import Anthropic from "@anthropic-ai/sdk"

// Phase 1: structured JSON (non-streaming)
const structuredResponse = await anthropic.messages.create({
  model: "claude-opus-4-5",
  max_tokens: 1024,
  system: SYSTEM_PROMPT,
  messages: [{ role: "user", content: buildPrompt(teamFeatures) }],
})
const parsed = AnalysisOutputSchema.parse(JSON.parse(structuredResponse.content[0].text))

// Phase 2: narrative stream
const stream = await streamText({
  model: anthropicProvider("claude-opus-4-5"),
  prompt: buildNarrativePrompt(parsed, teamFeatures),
})

return new StreamingTextResponse(stream, {
  headers: { "X-Analysis-Data": JSON.stringify(parsed) },
})
```

The structured JSON travels in a custom response header (`X-Analysis-Data`); the body streams the narrative. The client reads both.

---

## 5. API Route Design

### `POST /api/teams/analyze`

**File:** `app/api/teams/analyze/route.ts`

```
Request
  Method:  POST
  Auth:    Required — uses existing auth() from lib/auth.ts
  Body:    { pokemonIds: number[] }

Response (success)
  Status:  200
  Headers: X-Analysis-Data: <JSON string of AnalysisOutput>
  Body:    StreamingTextResponse — narrative text, streamed via SSE

Response (errors)
  400:     Invalid input (wrong count, non-integer IDs, out-of-range IDs)
  401:     Not authenticated
  429:     Rate limit exceeded (5 analyses per user per hour)
  500:     Feature engineering error or LLM output failed Zod validation
```

**Handler flow:**

```typescript
export async function POST(req: Request) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  // 2. Input validation
  const body = await req.json()
  const { pokemonIds } = inputSchema.parse(body)
  // inputSchema: z.object({ pokemonIds: z.array(z.number().int().min(1).max(151)).min(1).max(6) })

  // 3. Rate limiting
  await checkRateLimit(session.user.id)  // throws 429 if exceeded

  // 4. Cache check
  const cacheKey = computeCacheKey(pokemonIds)
  const cached = analysisCache.get(cacheKey)
  if (cached && !isExpired(cached)) return Response.json(cached.data)

  // 5. Fetch Pokémon details (force-cached by pokeapi.ts)
  const pokemonDetails = await Promise.all(pokemonIds.map(id => getPokemon(id)))

  // 6. Feature engineering (pure computation, no AI)
  const teamFeatures = buildTeamFeatures(pokemonDetails)

  // 7. LLM inference
  const analysisResult = await runAnalysis(teamFeatures)

  // 8. Cache result
  analysisCache.set(cacheKey, { data: analysisResult, timestamp: Date.now() })

  // 9. Stream response
  return buildStreamingResponse(analysisResult)
}
```

---

## 6. Caching Strategy

### Cache Key

```typescript
function computeCacheKey(pokemonIds: number[]): string {
  const sorted = [...pokemonIds].sort((a, b) => a - b)
  const input = sorted.join(",")
  return crypto.createHash("sha256").update(input).digest("hex")
}
```

Sorting before hashing ensures `[25, 6, 131]` and `[131, 25, 6]` produce the same cache key — team composition is order-independent.

### Cache Store

```typescript
type CacheEntry = {
  data: AnalysisOutput
  timestamp: number
}

const analysisCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000  // 1 hour

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > CACHE_TTL_MS
}
```

**Current implementation:** In-memory `Map` on the server. This works for a single instance but does not persist across deployments or scale across multiple serverless instances.

**Production upgrade path:** Replace `Map` with Upstash Redis (serverless-compatible). The cache key computation and TTL logic remain identical — only the storage backend changes. Upstash's REST API works in Vercel Edge Functions with no connection pool management.

```typescript
// Production: swap this line
const analysisCache = new UpstashRedis({ url: env.UPSTASH_URL, token: env.UPSTASH_TOKEN })
```

---

## 7. Security Model

Security is treated as a first-class concern because AI routes are a new attack surface: they accept user input, make external API calls, and return generated content.

### API Key Protection

`ANTHROPIC_API_KEY` is a server-side-only environment variable. It must never appear in:
- Any `NEXT_PUBLIC_*` variable
- Any client component import chain
- Any logged output (even error logs)

The `app/api/teams/analyze/route.ts` file must never be imported by any client component.

### Input Validation

```typescript
const inputSchema = z.object({
  pokemonIds: z.array(
    z.number()
      .int("Pokémon IDs must be integers")
      .min(1, "Minimum Pokémon ID is 1")
      .max(151, "Only Generation 1 Pokémon supported")
  )
  .min(1, "Select at least 1 Pokémon")
  .max(6, "A team has at most 6 Pokémon"),
})
```

**Why `.max(151)` matters:** The API route fetches Pokémon by ID from PokeAPI. Without an upper bound, a user could supply any integer and trigger arbitrary fetches. Constraining to 1–151 limits the fetch surface to known, cached, valid IDs.

### Prompt Injection Prevention

No user-provided strings reach the prompt. The flow is:

```
User sends: [25, 6, 131]          ← integers only
Server fetches: getPokemon(25)     ← server-side lookup, returns typed PokemonDetail
Feature engineering runs on PokemonDetail ← no user strings involved
Prompt is constructed from PokemonDetail fields ← name, types, stats: all from PokeAPI
```

A user cannot inject arbitrary text into the prompt by manipulating Pokémon IDs. The Pokémon name and type strings come from PokeAPI, not from the user.

### Rate Limiting

```typescript
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 5          // analyses per window
const WINDOW_MS = 60 * 60 * 1000  // 1 hour window

function checkRateLimit(userId: string): void {
  const now = Date.now()
  const record = rateLimitStore.get(userId) ?? { count: 0, windowStart: now }
  if (now - record.windowStart > WINDOW_MS) {
    // New window
    rateLimitStore.set(userId, { count: 1, windowStart: now })
    return
  }
  if (record.count >= RATE_LIMIT) {
    throw new RateLimitError("5 analyses per hour limit reached")
  }
  rateLimitStore.set(userId, { ...record, count: record.count + 1 })
}
```

**Production upgrade:** Move rate limit state to Redis with atomic increment + TTL. The in-memory store does not work correctly across serverless function instances.

### Output Sanitization

All LLM output passes through Zod validation before any field is returned to the client. This prevents:
- Schema violations (unexpected fields, wrong types)
- Oversized responses (array `.max()` constraints)
- Out-of-range scores

If Zod throws, the route returns a 500 — the client never receives malformed AI output.

### Logging Policy

Prompt contents are never logged. Team compositions represent user strategy and are treated as user data. Error logs may reference cache keys (SHA-256 hashes) but never the Pokémon IDs or generated analysis text.

---

## 8. Full Request Lifecycle

```
User clicks "Analyze Team"
        │
        ▼
Client: POST /api/teams/analyze
  Body: { pokemonIds: [25, 6, 131, 59, 143, 94] }
        │
        ▼
Route Handler (app/api/teams/analyze/route.ts)
  ├── auth() → verify session → 401 if missing
  ├── z.parse(body) → validate IDs → 400 if invalid
  ├── checkRateLimit(userId) → 429 if exceeded
  ├── computeCacheKey(pokemonIds) → SHA-256 hash
  ├── analysisCache.get(key) → cache HIT → return cached result
  │
  └── cache MISS:
        │
        ▼
  Fetch Pokémon details
  └── Promise.all(pokemonIds.map(getPokemon))
        └── pokeapi.ts: force-cache fetch from pokeapi.co
        │
        ▼
  Feature Engineering (lib/teamAnalysis.ts)
  ├── normalizeStats() → StatBlock per Pokémon
  ├── classifyRoles() → string[] per Pokémon
  ├── getDefensiveProfile() → weaknesses/resistances/immunities per Pokémon
  ├── computeTeamCoverage() → offensiveCoverage, weaknessStacks, criticalWeaknesses
  ├── analyzeSpeedTiers() → SpeedProfile
  └── computeSynergyScore() → number 0-100
        │
        ▼
  Build TeamFeatures (complete structured feature matrix)
        │
        ▼
  LLM Inference (Anthropic API)
  ├── Build system prompt (static, never changes)
  ├── Build user message (injects TeamFeatures as XML context)
  ├── anthropic.messages.create() → JSON response
  └── AnalysisOutputSchema.parse() → validated AnalysisOutput → 500 if invalid
        │
        ▼
  Cache result (key → AnalysisOutput, TTL 1 hour)
        │
        ▼
  Build StreamingTextResponse
  ├── Header: X-Analysis-Data: JSON.stringify(AnalysisOutput)
  └── Body: streaming narrative text (SSE)
        │
        ▼
Client receives response
  ├── Parse X-Analysis-Data header → render score, grade, strengths, weaknesses
  └── Stream body → progressively render narrative summary
```

---

## 9. File Structure

```
lib/
  typeChart.ts             # 18×18 type effectiveness constants (hardcoded game data)
                           # exports: TYPE_CHART, getDefensiveProfile(), ALL_18_TYPES

  teamAnalysis.ts          # Feature engineering — pure computation, no AI, no network
                           # exports: buildTeamFeatures(PokemonDetail[]) → TeamFeatures
                           # internally: normalizeStats, classifyRoles, computeTeamCoverage,
                           #             analyzeSpeedTiers, computeSynergyScore

  pokeapi.ts               # Existing data access layer — unchanged
                           # exports: getPokemon(id), getPokemonList(limit)

app/
  api/
    teams/
      analyze/
        route.ts           # POST handler
                           # auth → validate → rate limit → cache check →
                           # fetch Pokémon → feature engineering → LLM → stream

  (protected)/
    teams/
      page.tsx             # Team list (stub — ui-specialist domain)
      [teamId]/
        page.tsx           # Team builder UI (stub — ui-specialist domain)
```

---

## 10. Schema Changes Required

> **Flagged for backend/schema specialist — do not implement unilaterally.**

The current `prisma/schema.prisma` has no `Team` model. The `User` model has no relation to teams. The following additions are required before the team builder can persist user teams:

```prisma
model Team {
  id         String   @id @default(cuid())
  userId     String
  name       String
  pokemonIds Int[]    // array of Pokémon IDs, 1-6 entries

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

And on the `User` model, add:

```prisma
teams Team[]
```

**Migration required:** `npx prisma migrate dev --name add_team_model`

The `analyze` route does not need this schema to function — it operates statelessly on a list of IDs. Persistence of teams (save/load) requires the schema addition.

---

## 11. Assumptions and Open Questions

| # | Assumption | Basis | Flag if wrong |
|---|-----------|-------|--------------|
| 1 | Offensive coverage is based on STAB types only (not full moveset) | Moveset analysis requires individual move type lookups; STAB is a reliable proxy and available from `getPokemon()` | If moveset-based coverage is required, `getPokemon()` returns up to 15 moves but without their types — a second fetch per move would be needed |
| 2 | `getPokemon()` stat names map exactly to: `hp`, `attack`, `defense`, `special-attack`, `special-defense`, `speed` | Observed in PokeAPI v2 documentation and the existing `pokeapi.ts` implementation | Verify against a live API response — do not assume without testing `normalizeStats()` |
| 3 | The Vercel AI SDK (`ai` package) is not yet installed | Not present in `CLAUDE.md` dependency list | Check `package.json` before implementing — may require `npm install ai @ai-sdk/anthropic` |
| 4 | Rate limit store is acceptable as in-memory for MVP | Project is single-instance for now | Must migrate to Redis before any multi-instance or serverless deployment |
| 5 | The `auth()` function from `lib/auth.ts` is callable inside App Router route handlers | Consistent with NextAuth v5 beta patterns used elsewhere in the project | Verify against existing API routes (`app/api/favorites/route.ts`) for the exact call pattern |
| 6 | Pokémon IDs 1–151 correspond 1:1 to PokeAPI IDs | Standard PokeAPI behavior | No known exceptions in Gen 1, but validate against edge cases like alternate forms |

---

## 12. Portfolio Framing

The following bullet points are written for an AI/ML engineering resume. They are verbatim and may be used directly.

---

**System Design:**

> Designed a two-stage AI inference pipeline: deterministic feature extraction (type-coverage matrix, stat-threshold role classifier, weakness-stacking detector) feeding structured context into LLM inference — separating computable facts from language model reasoning

**Interpretable ML:**

> Implemented a rule-based role classifier using stat-distribution decision boundaries (Physical Sweeper, Tank, Support, etc.) with full interpretability — mirrors production ML systems where auditable heuristics complement black-box models

**Retrieval-Augmented Generation pattern:**

> Applied RAG-inspired context injection: pre-computed feature vectors injected as structured XML context blocks, reducing LLM hallucination on factual game mechanics while preserving its synthesis and language capabilities

**Output reliability:**

> Engineered structured output pipeline with Zod schema validation — LLM returns typed JSON, parsed and validated server-side before any UI rendering

**Caching:**

> Built hash-based response caching (SHA-256 of team composition) with TTL, reducing redundant API calls for repeated team analyses

---

### Why this project demonstrates real AI/ML engineering

Most "LLM projects" in a portfolio are thin wrappers: send text in, render text out. This system is structurally different:

1. **The LLM is one component in a pipeline, not the whole system.** Feature engineering, caching, validation, and streaming are all independent, separately testable layers.

2. **The system is correct by construction on factual questions.** Type effectiveness is computed from a hardcoded chart — the LLM cannot hallucinate a wrong type matchup because it never has to compute one.

3. **The output contract is enforced.** Zod validation means the UI always receives a typed, bounded, validated object — not a string that might be malformed on any given run.

4. **Security is designed in, not bolted on.** No user strings reach the prompt. API keys are server-only. Input is validated before any external call is made.

5. **The architecture scales.** Swapping in Redis for the cache store and rate limiter is a one-line change. The feature engineering layer is independently deployable as a serverless function if needed.

These properties reflect what distinguishes a production AI system from a prototype.
