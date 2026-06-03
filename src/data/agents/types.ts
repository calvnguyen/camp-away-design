import type { TrailerBrief, TrailerSizeCategory } from '../../types';

export interface Agent<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
}

// ─── Intake Agent ─────────────────────────────────────────────────────────────

export interface IntakeTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface IntakeAgentInput {
  userMessage: string;
  conversationHistory: IntakeTurn[];
  mode: 'rental' | 'project';
}

export interface IntakeAgentResult {
  partialBrief: Partial<TrailerBrief>;
  followUpQuestions: string[];
  isComplete: boolean;
  assistantMessage: string;
  trailerCategoryRecommendation?: TrailerSizeCategory;
  requirementSummary?: string;
}
