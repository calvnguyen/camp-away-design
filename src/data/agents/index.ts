import { StaticFormFallbackIntakeAgent } from './intakeAgent';

// When ANTHROPIC_API_KEY is present, swap in the Claude implementation here.
export const intakeAgent = new StaticFormFallbackIntakeAgent();
