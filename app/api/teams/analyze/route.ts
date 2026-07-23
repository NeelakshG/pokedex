import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPokemon } from "@/lib/pokeapi"
import { buildTeamFeatures } from "@/lib/teamAnalysis"
import Anthropic from "@anthropic-ai/sdk"
import { createHash } from "crypto"

// Simple in-memory cache (upgrade to Redis in production)
const analysisCache = new Map<string, { result: AnalysisResult; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// Rate limit: 5 analyses per user per hour
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

export type AnalysisResult = {
  overallScore: number
  grade: "S" | "A" | "B" | "C" | "D" | "F"
  summary: string
  strengths: string[]
  weaknesses: string[]
  criticalThreat: string
  suggestedReplacements: Array<{ remove: string; addType: string; reason: string }>
  mvp: string
  synergyScore: number
  cached?: boolean
}

function scoreToGrade(score: number): AnalysisResult["grade"] {
  if (score >= 90) return "S"
  if (score >= 80) return "A"
  if (score >= 65) return "B"
  if (score >= 50) return "C"
  if (score >= 35) return "D"
  return "F"
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  // Rate limit
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. You can analyze 5 teams per hour." },
      { status: 429 }
    )
  }

  // Input validation
  let pokemonIds: number[]
  try {
    const body = await req.json()
    pokemonIds = body.pokemonIds
    if (!Array.isArray(pokemonIds) || pokemonIds.length < 1 || pokemonIds.length > 6) {
      throw new Error("Must provide 1–6 Pokémon IDs")
    }
    if (!pokemonIds.every(id => Number.isInteger(id) && id >= 1 && id <= 151)) {
      throw new Error("All IDs must be integers between 1 and 151")
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  // Cache lookup — sort IDs so order doesn't matter
  const sortedIds = [...pokemonIds].sort((a, b) => a - b)
  const cacheKey = createHash("sha256").update(sortedIds.join(",")).digest("hex")
  const cached = analysisCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json({ ...cached.result, cached: true })
  }

  // Fetch Pokémon data (pokeapi already caches with force-cache)
  let rawPokemon
  try {
    rawPokemon = await Promise.all(pokemonIds.map(id => getPokemon(id)))
  } catch {
    return NextResponse.json({ error: "Failed to fetch Pokémon data" }, { status: 502 })
  }

  // Feature engineering
  const features = buildTeamFeatures(rawPokemon)

  // Build prompt
  const systemPrompt = `You are an expert competitive Pokémon analyst. You evaluate team compositions for viability in single battles.

You will receive pre-computed feature data about a team. Use it as ground truth — do NOT re-derive type matchups yourself. The feature engineering is already done; your job is to synthesize it into clear, actionable analysis.

Always respond with valid JSON matching this exact schema:
{
  "summary": "2-3 sentence overall assessment (max 200 chars)",
  "strengths": ["up to 4 specific strengths"],
  "weaknesses": ["up to 4 specific weaknesses"],
  "criticalThreat": "single biggest threat to this team and why",
  "suggestedReplacements": [
    { "remove": "pokemon name", "addType": "type(s) to add", "reason": "why" }
  ],
  "mvp": "best pokemon on the team and why in one sentence"
}

Be direct. No filler. Prioritize critical weaknesses and concrete threats over vague praise.`

  const userMessage = `<team_features>
${JSON.stringify(features, null, 2)}
</team_features>

Team: ${features.pokemon.map(p => p.name).join(", ")}
Computed synergy score: ${features.synergyScore}/100
Critical weaknesses: ${features.criticalWeaknesses.length > 0 ? features.criticalWeaknesses.join(", ") : "none"}
Uncovered offensive types: ${features.uncoveredTypes.join(", ")}
Roles missing: ${features.rolesMissing.length > 0 ? features.rolesMissing.join(", ") : "none"}

Analyze this team. Use the pre-computed data above. Return JSON only.`

  // Call Anthropic
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI analysis not configured" }, { status: 503 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let parsed: Omit<AnalysisResult, "overallScore" | "grade" | "synergyScore" | "cached">
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    // Strip markdown code fences if present
    const jsonText = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim()
    parsed = JSON.parse(jsonText)
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
  }

  const result: AnalysisResult = {
    ...parsed,
    overallScore: features.synergyScore,
    grade: scoreToGrade(features.synergyScore),
    synergyScore: features.synergyScore,
    suggestedReplacements: parsed.suggestedReplacements?.slice(0, 2) ?? [],
    strengths: parsed.strengths?.slice(0, 4) ?? [],
    weaknesses: parsed.weaknesses?.slice(0, 4) ?? [],
  }

  // Cache result
  analysisCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS })

  return NextResponse.json(result)
}
