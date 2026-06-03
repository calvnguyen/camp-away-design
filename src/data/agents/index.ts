import { StaticFormFallbackIntakeAgent } from './intakeAgent';
import { RuleBasedInventoryMatchingAgent } from './inventoryMatchingAgent';
import { RuleTableTowabilityAgent } from './towabilityAgent';
import { CalculatorFallbackPricingAgent } from './pricingAgent';

// Swap each fallback for its Claude implementation when ANTHROPIC_API_KEY is present.
export const intakeAgent = new StaticFormFallbackIntakeAgent();
export const inventoryMatchingAgent = new RuleBasedInventoryMatchingAgent();
export const towabilityAgent = new RuleTableTowabilityAgent();
export const pricingAgent = new CalculatorFallbackPricingAgent();
