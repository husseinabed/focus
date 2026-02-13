export interface VisitedSite {
  url: string
  status?: number | null
  responseOk?: boolean | null
  title?: string
  timingMs?: number
  notes?: string[]
}

export interface CtaPattern {
  pattern: string
  examples: string[]
}

export interface LanguagePatterns {
  en?: string[]
  he?: string[]
  ar?: string[]
  [key: string]: string[] | undefined
}

export interface MarketInsights {
  schema_version: string
  visited: VisitedSite[]
  competitor_patterns: string[]
  positioning_angles_seen: string[]
  offers_seen: string[]
  cta_patterns: CtaPattern[]
  trust_markers_seen: string[]
  common_objections_implied: string[]
  language_patterns: LanguagePatterns
  gaps_opportunities: string[]
  risk_flags: string[]
}

export interface MarketingInsightsData {
  structure: {
    summary: string
    visited: string[]
    market_insights: MarketInsights
    next_inputs_needed: string[]
    verification_notes: string
  }
}

// New Brand Strategy Interfaces

export interface StrategyMeta {
  schema_version: string
  confidence: string
  assumptions: string[]
}

export interface MarketTruths {
  non_obvious_insights: string[]
  hidden_customer_motivations: string[]
  trust_breakers: string[]
}

export interface CompetitiveLandscape {
  table_stakes: string[]
  overused_promises: string[]
  unclaimed_positions: string[]
}

export interface PositioningStrategy {
  who_we_are_for: string
  who_we_are_not_for: string
  primary_position: string
  secondary_position: string
}

export interface BrandStrategyCore {
  brand_promise: string
  personality_traits: string[]
  trust_builders: string[]
  emotional_triggers: string[]
}

export interface MessageStrategy {
  core_message: string
  supporting_messages: string[]
  objection_reframes: Record<string, string>
}

export interface MarketingStrategy {
  primary_channels: string[]
  channel_rationale: Record<string, string>
  conversion_focus: string
  cta_philosophy: string
}

export interface ExecutionRules {
  tone_of_voice: {
    do: string[]
    avoid: string[]
  }
  visual_direction: {
    emphasize: string[]
    avoid: string[]
  }
  strategic_no_list: string[]
}

export interface BrandStrategy {
  meta: StrategyMeta
  market_truths: MarketTruths
  competitive_landscape: CompetitiveLandscape
  positioning_strategy: PositioningStrategy
  brand_strategy: BrandStrategyCore
  message_strategy: MessageStrategy
  marketing_strategy: MarketingStrategy
  execution_rules: ExecutionRules
}
