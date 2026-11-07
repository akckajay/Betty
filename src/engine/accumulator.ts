/**
 * Accumulator engine: leg validation, conflict detection, and compounding rules.
 */

import { CONFIG } from '../config';
import { Leg } from '../types';
import { analyzeAccumulator } from './odds';

export interface AccumulatorValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates accumulator rules:
 * - Max legs (config.ts)
 * - No two selections from the same event (correlated / related contingency block)
 */
export function validateAccumulatorLegs(legs: Leg[]): AccumulatorValidation {
  const errors: string[] = [];

  if (legs.length > CONFIG.maxAccumulatorLegs) {
    errors.push(`Maximum ${CONFIG.maxAccumulatorLegs} legs allowed in an accumulator.`);
  }

  // Check for same event conflict
  const eventIds = new Set<string>();
  for (const leg of legs) {
    if (eventIds.has(leg.eventId)) {
      errors.push('Related selections from the same match cannot be combined here.');
      break;
    }
    eventIds.add(leg.eventId);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Theoretical compound loss for n identical legs with margin m:
 * expectedLoss = 1 - (1 / (1 + m))^n
 */
export function theoreticalCompoundLoss(n: number, margin: number): number {
  return 1 - Math.pow(1 / (1 + margin), n);
}
