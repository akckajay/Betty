/**
 * Cricket Delivery Outcome Pricing Model (Section 7.1)
 * Per-delivery probabilistic model adjusted for match phase, wickets in hand, and required run rate.
 */

import { CONFIG } from '../../config';

export interface DeliveryProbabilities {
  dot: number;
  one: number;
  two: number;
  three: number;
  four: number;
  six: number;
  wicket: number;
  extra: number;
}

/**
 * Adjusts baseline T20 probabilities dynamically according to match situation
 */
export function getAdjustedCricketDeliveryProbabilities(params: {
  phase: 'powerplay' | 'middle' | 'death';
  wicketsLost: number;
  ballsRemaining: number;
  requiredRunRate?: number;
}): DeliveryProbabilities {
  const base = { ...CONFIG.cricketT20Baselines };
  let { dot, one, two, three, four, six, wicket, extra } = base;

  // 1. Phase adjustments
  if (params.phase === 'powerplay') {
    // Field restrictions: more boundaries, fewer dots
    four *= 1.35;
    six *= 1.15;
    dot *= 0.85;
    wicket *= 1.1;
  } else if (params.phase === 'death') {
    // Slog overs: high boundaries, high wickets, low dots
    six *= 1.8;
    four *= 1.25;
    wicket *= 1.9;
    dot *= 0.65;
    one *= 0.8;
  }

  // 2. Wickets in hand factor (if 7+ wickets lost, batting side is tentative or tailenders)
  if (params.wicketsLost >= 7) {
    wicket *= 1.4;
    dot *= 1.2;
    four *= 0.7;
    six *= 0.5;
  }

  // 3. Required Run Rate pressure in chase
  if (params.requiredRunRate && params.requiredRunRate > 10.0) {
    const pressureMultiplier = Math.min(2.0, params.requiredRunRate / 8.5);
    four *= pressureMultiplier;
    six *= pressureMultiplier * 1.2;
    wicket *= pressureMultiplier * 1.25;
    dot *= 0.75;
  }

  // Re-normalize so sum is exactly 1.00
  const sum = dot + one + two + three + four + six + wicket + extra;
  return {
    dot: dot / sum,
    one: one / sum,
    two: two / sum,
    three: three / sum,
    four: four / sum,
    six: six / sum,
    wicket: wicket / sum,
    extra: extra / sum,
  };
}

/**
 * Expected runs from a single delivery
 */
export function getExpectedRunsPerDelivery(probs: DeliveryProbabilities): number {
  return (
    probs.one * 1 +
    probs.two * 2 +
    probs.three * 3 +
    probs.four * 4 +
    probs.six * 6 +
    probs.extra * 1
  );
}
