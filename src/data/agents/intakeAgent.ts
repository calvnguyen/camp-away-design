import type {
  BathroomType,
  BudgetRange,
  DesignStyle,
  KitchenType,
  PowerOption,
  TrailerBrief,
  TrailerSizeCategory,
  TowVehicle,
  UsageIntent,
} from '../../types';
import type { Agent, IntakeAgentInput, IntakeAgentResult } from './types';

// ─── Field extraction ─────────────────────────────────────────────────────────

function extractFromText(text: string): Partial<TrailerBrief> {
  const t = text.toLowerCase();
  const partial: Partial<TrailerBrief> = {};

  // sleeps
  const sleepsMatch = t.match(/(?:sleep[s]?|fit[s]?|seat[s]?)\s+(\d+)|(\d+)\s+(?:person|people|adult)/);
  if (sleepsMatch) {
    const n = Number(sleepsMatch[1] ?? sleepsMatch[2]);
    partial.sleeps = n <= 2 ? 2 : n <= 3 ? 3 : n <= 4 ? 4 : 6;
  }

  // tow vehicle
  if (/\btruck\b|pickup|f-150|silverado|tacoma|tundra|ram\b/.test(t)) {
    partial.towVehicle = 'truck' as TowVehicle;
  } else if (/\bsuv\b|4runner|outback|explorer|highlander|rav4|crv|pilot|subaru|toyota\b/.test(t)) {
    partial.towVehicle = 'suv' as TowVehicle;
  } else if (/not sure|unsure|don.t know/.test(t)) {
    partial.towVehicle = 'unsure' as TowVehicle;
  }

  // size category
  if (/\bsmall\b/.test(t)) partial.sizeCategory = 'small' as TrailerSizeCategory;
  else if (/\bmedium\b/.test(t)) partial.sizeCategory = 'medium' as TrailerSizeCategory;
  else if (/\blarge\b/.test(t)) partial.sizeCategory = 'large' as TrailerSizeCategory;

  // bathroom
  if (/no\s*bath|no\s*toilet|without\s*bath/.test(t)) partial.bathroomType = 'none' as BathroomType;
  else if (/wet\s*bath/.test(t)) partial.bathroomType = 'wet_bath' as BathroomType;
  else if (/dry\s*bath/.test(t)) partial.bathroomType = 'dry_bath' as BathroomType;

  // kitchen
  if (/basic\s*kitchen|minimal\s*kitchen/.test(t)) partial.kitchenType = 'basic' as KitchenType;
  else if (/standard\s*kitchen|standard\s*kitchenette/.test(t)) partial.kitchenType = 'standard' as KitchenType;
  else if (/extended|extra\s*storage/.test(t)) partial.kitchenType = 'extended_storage' as KitchenType;

  // intended usage
  if (/full.time|full\s+time|live\s+in|living\s+in/.test(t)) partial.intendedUsage = 'full_time' as UsageIntent;
  else if (/part.time|part\s+time/.test(t)) partial.intendedUsage = 'part_time' as UsageIntent;
  else if (/weekend/.test(t)) partial.intendedUsage = 'weekend' as UsageIntent;

  // power options
  const power: PowerOption[] = [];
  if (/\bsolar\b/.test(t)) power.push('solar');
  if (/\bbattery\b|off.grid|off\s+grid/.test(t)) power.push('battery');
  if (/shore\s*power/.test(t)) power.push('shore_power');
  if (power.length > 0) partial.powerOptions = power;

  // design style
  if (/\bmodern\b/.test(t)) partial.designStyle = 'modern' as DesignStyle;
  else if (/\brustic\b/.test(t)) partial.designStyle = 'rustic' as DesignStyle;
  else if (/minimalist|minimal/.test(t)) partial.designStyle = 'minimalist' as DesignStyle;
  else if (/luxury/.test(t)) partial.designStyle = 'luxury_compact' as DesignStyle;

  // budget
  if (/under\s*\$?40|less\s*than\s*\$?40|below\s*\$?40/.test(t)) partial.budgetRange = 'under_40k' as BudgetRange;
  else if (/40\s*k?\s*(?:to|-)\s*50|40k.*50k/.test(t)) partial.budgetRange = '40k_50k' as BudgetRange;
  else if (/50\s*k?\s*(?:to|-)\s*70|50k.*70k/.test(t)) partial.budgetRange = '50k_70k' as BudgetRange;
  else if (/over\s*\$?70|above\s*\$?70|\$?70\s*k?\s*\+/.test(t)) partial.budgetRange = '70k_plus' as BudgetRange;

  return partial;
}

// Infer sizeCategory from sleeps + towVehicle when not explicitly stated
function inferSizeCategory(brief: Partial<TrailerBrief>): TrailerSizeCategory | undefined {
  if (brief.sizeCategory) return brief.sizeCategory;
  const { sleeps, towVehicle } = brief;
  if (towVehicle === 'suv') return 'small'; // SUV can only tow small
  if (sleeps !== undefined) {
    if (sleeps <= 2) return 'small';
    if (sleeps <= 4) return 'medium';
    return 'large';
  }
  return undefined;
}

// Extract fields from all user turns in history
function extractFromHistory(
  history: { role: string; content: string }[],
  currentMessage: string,
): Partial<TrailerBrief> {
  const allUserText = [
    ...history.filter((t) => t.role === 'user').map((t) => t.content),
    currentMessage,
  ].join(' ');
  return extractFromText(allUserText);
}

// ─── Required field questions ─────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof TrailerBrief)[] = [
  'sleeps',
  'towVehicle',
  'sizeCategory',
  'bathroomType',
  'kitchenType',
  'intendedUsage',
];

const FIELD_QUESTIONS: Record<string, string> = {
  sleeps: 'How many people will be sleeping in the trailer?',
  towVehicle: 'What kind of tow vehicle do you have — SUV, truck, or are you unsure?',
  sizeCategory: 'What size are you thinking? Small (14–16 ft), Medium (17–20 ft), or Large (21–24 ft)?',
  bathroomType: 'Do you need a bathroom? If so, would you prefer a wet bath (shower + toilet combined) or a dry bath?',
  kitchenType: 'What kind of kitchen setup are you looking for — Basic, Standard, or Extended Storage?',
  intendedUsage: 'How do you plan to use the trailer? Weekend camping, part-time, or full-time living?',
};

const FIELD_LABELS: Record<string, string> = {
  sleeps: 'sleeping capacity',
  towVehicle: 'tow vehicle',
  sizeCategory: 'trailer size',
  bathroomType: 'bathroom type',
  kitchenType: 'kitchen type',
  intendedUsage: 'intended usage',
};

// ─── Fallback implementation ──────────────────────────────────────────────────

export class StaticFormFallbackIntakeAgent
  implements Agent<IntakeAgentInput, IntakeAgentResult>
{
  async run(input: IntakeAgentInput): Promise<IntakeAgentResult> {
    const extracted = extractFromHistory(input.conversationHistory, input.userMessage);
    const inferred = inferSizeCategory(extracted);
    const partialBrief: Partial<TrailerBrief> = {
      ...extracted,
      ...(inferred && !extracted.sizeCategory ? { sizeCategory: inferred } : {}),
    };

    const missingRequired = REQUIRED_FIELDS.filter((f) => !(f in partialBrief));
    const isComplete = missingRequired.length === 0;

    const foundFields = REQUIRED_FIELDS.filter((f) => f in partialBrief);
    const followUpQuestions = missingRequired.slice(0, 2).map((f) => FIELD_QUESTIONS[f]);

    let assistantMessage: string;
    let requirementSummary: string | undefined;

    if (isComplete) {
      requirementSummary = buildSummary(partialBrief as TrailerBrief);
      assistantMessage =
        `Got everything I need! Here's what I've captured: ${requirementSummary} ` +
        'Review the form on the left and make any adjustments, then submit your brief.';
    } else if (foundFields.length === 0) {
      assistantMessage =
        'Happy to help you figure out the right trailer setup! ' +
        FIELD_QUESTIONS[missingRequired[0]!];
    } else {
      const found = foundFields.map((f) => FIELD_LABELS[f]).join(', ');
      assistantMessage =
        `Got it — I've noted your ${found}. ` +
        (followUpQuestions[0] ?? '');
    }

    return {
      partialBrief,
      followUpQuestions,
      isComplete,
      assistantMessage,
      trailerCategoryRecommendation: partialBrief.sizeCategory,
      ...(requirementSummary ? { requirementSummary } : {}),
    };
  }
}

function buildSummary(brief: TrailerBrief): string {
  const parts: string[] = [];
  const sizeLabels: Record<TrailerSizeCategory, string> = {
    small: 'Small (14–16 ft)',
    medium: 'Medium (17–20 ft)',
    large: 'Large (21–24 ft)',
  };
  parts.push(sizeLabels[brief.sizeCategory]);
  parts.push(`sleeps ${brief.sleeps}`);
  if (brief.bathroomType === 'none') parts.push('no bathroom');
  else if (brief.bathroomType === 'wet_bath') parts.push('wet bath');
  else parts.push('dry bath');
  parts.push(`${brief.kitchenType.replace('_', ' ')} kitchen`);
  const usageLabels: Record<UsageIntent, string> = {
    weekend: 'weekend camping',
    part_time: 'part-time living',
    full_time: 'full-time living',
  };
  parts.push(usageLabels[brief.intendedUsage]);
  return parts.join(' · ');
}
