// The concept-layout generator lives behind the data layer, like the repository.
// Components never call Claude (or any model) directly — they go through the
// repository, which delegates here. Two implementations:
//
//   - ClaudeConceptLayoutGenerator: asks Claude for a structured zone layout and
//     validates it against the trailer envelope. Used when an API key is present.
//   - TemplateConceptLayoutGenerator: a deterministic, offline fallback (the
//     `templateLayout` from lib/). Used in tests, local dev without a key, and
//     whenever the AI output is unavailable or fails validation.
//
// The selection happens once, in ./index.ts.

import type { ConceptLayout, ConceptLayoutSource, LayoutZone, TrailerBrief } from '../types';
import {
  REQUIRED_ZONES,
  envelopeFor,
  templateLayout,
  templateRationale,
  validateLayout,
} from '../lib/conceptLayout';

// We call the Messages API over fetch rather than via @anthropic-ai/sdk. The
// SDK's full browser bundle pulls in tool-runner helpers with an unresolvable
// export that breaks the Vite build, and shipping the SDK + key to the browser
// is undesirable anyway. In the target Next.js/Supabase stack this call moves
// server-side and can use the SDK; the data-layer seam keeps that swap local.
const MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-8';

export interface GeneratedLayout {
  zones: LayoutZone[];
  rationale: string;
  source: ConceptLayoutSource;
}

export interface ConceptLayoutGenerator {
  /** Produce a rough zone layout for a brief that has no equivalent build. */
  generate(brief: TrailerBrief): Promise<GeneratedLayout>;
}

/** Deterministic, offline generator — the template from lib/conceptLayout. */
export class TemplateConceptLayoutGenerator implements ConceptLayoutGenerator {
  async generate(brief: TrailerBrief): Promise<GeneratedLayout> {
    const envelope = envelopeFor(brief);
    return {
      zones: templateLayout(envelope),
      rationale: templateRationale(envelope),
      source: 'template',
    };
  }
}

const SYSTEM_PROMPT = `You are a tiny-trailer space planner for CampAwayDesign, which makes affordable, SUV-towable tiny trailers.

Given a client brief, produce a ROUGH 2D concept layout: a starting point for client/designer review, NOT a final architectural drawing. Partition the trailer's rectangular floor into non-overlapping zones.

Coordinate system (feet):
- The envelope is lengthFt (along the trailer, x-axis, 0 = hitch/front) by widthFt (across, y-axis, 0 = one side).
- Each zone is an axis-aligned rectangle {kind, x, y, width, depth} where x+width <= lengthFt and y+depth <= widthFt.
- Zones must not overlap and should fill the envelope without gaps.

You MUST include exactly these five zones, each once: entry, kitchenette, bathroom, storage, sleeping.

Keep it sensible for a small trailer: entry near the front/door, wet bath compact, sleeping area at one end. Respect the brief's features (e.g. a larger kitchenette if the notes ask for it).`;

/** The shape we expect back from the model, post-JSON-schema constraint. */
interface ModelLayout {
  zones: LayoutZone[];
  rationale: string;
}

/** Claude-backed generator: structured zones validated against the envelope. */
export class ClaudeConceptLayoutGenerator implements ConceptLayoutGenerator {
  private apiKey: string;
  /** Falls back to this when the model is unavailable or returns bad output. */
  private fallback = new TemplateConceptLayoutGenerator();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(brief: TrailerBrief): Promise<GeneratedLayout> {
    const envelope = envelopeFor(brief);

    try {
      const res = await fetch(MESSAGES_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          // Required to call the API from a browser (FE-only prototype).
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          thinking: { type: 'adaptive' },
          system: [
            {
              type: 'text',
              text: SYSTEM_PROMPT,
              // Frozen instructions → cache the system prefix across requests.
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: this.userPrompt(brief, envelope) }],
          // Constrain the response to our JSON schema so the text block is
          // shape-correct before the geometry validator runs.
          output_config: { format: LAYOUT_FORMAT },
        }),
      });

      if (!res.ok) {
        throw new Error(`Messages API ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as {
        content: { type: string; text?: string }[];
      };
      const text = data.content.find((b) => b.type === 'text')?.text;
      if (!text) throw new Error('No structured output returned.');

      const parsed = JSON.parse(text) as ModelLayout;
      const check = validateLayout(parsed.zones, envelope);
      if (!check.ok) {
        throw new Error(`Invalid layout from model: ${check.errors.join('; ')}`);
      }

      return { zones: parsed.zones, rationale: parsed.rationale, source: 'ai' };
    } catch (error) {
      // Never block the user on an AI hiccup — fall back to the template and
      // let the surface show it was generated by template, not AI.
      console.warn('Concept-layout AI generation failed; using template.', error);
      return this.fallback.generate(brief);
    }
  }

  private userPrompt(
    brief: TrailerBrief,
    envelope: { lengthFt: number; widthFt: number },
  ): string {
    return [
      `Envelope: ${envelope.lengthFt} ft long x ${envelope.widthFt} ft wide.`,
      `Sleeps: ${brief.sleeps} adults.`,
      `Wet bath: ${brief.hasWetBath ? 'yes' : 'no'}.`,
      `Kitchenette: ${brief.hasKitchenette ? 'yes' : 'no'}.`,
      `Solar: ${brief.solar ? 'yes' : 'no'}. Battery: ${brief.battery ? 'yes' : 'no'}.`,
      brief.notes ? `Client notes: ${brief.notes}` : 'No extra notes.',
      '',
      `Lay out the five required zones (${REQUIRED_ZONES.join(', ')}) within the envelope.`,
    ].join('\n');
  }
}

// JSON-schema output format. The API validates Claude's response against this,
// so `parsed_output` is shape-correct before our geometry validator runs.
const LAYOUT_FORMAT = {
  type: 'json_schema' as const,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      rationale: { type: 'string' },
      zones: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            kind: {
              type: 'string',
              enum: ['entry', 'kitchenette', 'bathroom', 'storage', 'sleeping'],
            },
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            depth: { type: 'number' },
          },
          required: ['kind', 'x', 'y', 'width', 'depth'],
        },
      },
    },
    required: ['rationale', 'zones'],
  },
};

/** Build a ConceptLayout from a freshly generated layout. */
export function toConceptLayout(
  generated: GeneratedLayout,
  envelope: { lengthFt: number; widthFt: number },
  id: string,
  timestamp: string,
): ConceptLayout {
  return {
    id,
    status: 'pending_review',
    source: generated.source,
    lengthFt: envelope.lengthFt,
    widthFt: envelope.widthFt,
    zones: generated.zones,
    rationale: generated.rationale,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
