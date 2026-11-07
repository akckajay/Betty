/**
 * PaperBook - Core Odds Engine
 * Implements the mathematical core: fair probabilities, bookmaker overround margins,
 * odds conversion, accumulator mathematics, and transparency formulas.
 */

import { CONFIG } from '../config';

export interface OddsEducationalBreakdown {
  offeredOdds: number;
  fairOdds: number;
  offeredImpliedProb: number;
  fairProbability: number;
  marginPercent: number; // e.g. 5.0 for 5%
  lossPer100: number; // e.g. 4.76
  explanation: string;
}

/**
 * Calculates offered decimal odds from a fair probability and a bookmaker margin.
 * Formulas:
 *   offeredImpliedProb = fairProbability * (1 + margin)
 *   rawOdds = 1 / offeredImpliedProb
 *   offeredOdds = Math.floor(rawOdds * 100) / 100 (rounded DOWN to 2 decimals, min 1.01)
 */
export function calculateOfferedOdds(fairProbability: number, margin: number): number {
  if (fairProbability <= 0) return 1000.0;
  if (fairProbability >= 1) return 1.01;

  const offeredImpliedProb = fairProbability * (1 + margin);
  if (offeredImpliedProb <= 0) return 1000.0;

  const rawOdds = 1 / offeredImpliedProb;
  // Round DOWN to 2 decimals
  const roundedOdds = Math.floor(rawOdds * 100) / 100;
  return Math.max(1.01, roundedOdds);
}

/**
 * Calculates fair probability from offered odds when given the margin used.
 */
export function calculateFairProbFromOffered(offeredOdds: number, margin: number): number {
  if (offeredOdds <= 1.0) return 0.999;
  const impliedProb = 1 / offeredOdds;
  return impliedProb / (1 + margin);
}

/**
 * Removes a margin from an entire market's offered odds to get normalized fair probabilities.
 * Formula:
 *   q_i = 1 / odds_i
 *   Q = sum(q_i)
 *   fair_i = q_i / Q
 */
export function removeMarginFromMarketOdds(oddsList: number[]): {
  fairProbabilities: number[];
  overround: number;
  marginPercent: number;
} {
  const impliedProbs = oddsList.map((o) => (o > 0 ? 1 / o : 0));
  const sumImplied = impliedProbs.reduce((acc, val) => acc + val, 0);
  const overround = sumImplied - 1; // e.g. 0.05
  const marginPercent = overround * 100;

  const fairProbabilities = impliedProbs.map((q) => (sumImplied > 0 ? q / sumImplied : 0));

  return {
    fairProbabilities,
    overround,
    marginPercent,
  };
}

/**
 * Calculates expected loss on every 100 staked for a single selection with margin m.
 * Formula: X = 100 * (1 - 1 / (1 + m))
 */
export function calculateSingleLossPer100(margin: number): number {
  const ratio = 1 / (1 + margin);
  return 100 * (1 - ratio);
}

/**
 * Detailed educational breakdown for any odds displayed in the app.
 */
export function getOddsEducationalBreakdown(
  offeredOdds: number,
  fairProbability: number,
  margin: number
): OddsEducationalBreakdown {
  const fairOdds = fairProbability > 0 ? Number((1 / fairProbability).toFixed(2)) : 1000;
  const offeredImpliedProb = offeredOdds > 0 ? 1 / offeredOdds : 0;
  const marginPercent = Number((margin * 100).toFixed(1));
  const lossPer100 = Number(calculateSingleLossPer100(margin).toFixed(2));

  return {
    offeredOdds,
    fairOdds,
    offeredImpliedProb,
    fairProbability,
    marginPercent,
    lossPer100,
    explanation: `On average you lose about ${lossPer100.toFixed(2)} on every 100 you stake here.`,
  };
}

/**
 * Accumulator math: exact calculations for combined odds, true win probability,
 * 1 in N win chance, and expected loss per 100 staked.
 */
export interface AccumulatorAnalysis {
  combinedOdds: number;
  trueWinChance: number;
  oneInNTimes: number; // 1 / trueWinChance
  expectedLossPer100: number; // Average loss per 100 staked
  expectedReturnPer1: number;
}

export function analyzeAccumulator(legs: Array<{ odds: number; fairProb: number }>): AccumulatorAnalysis {
  if (legs.length === 0) {
    return {
      combinedOdds: 1.0,
      trueWinChance: 1.0,
      oneInNTimes: 1.0,
      expectedLossPer100: 0,
      expectedReturnPer1: 1.0,
    };
  }

  // Combined odds = product of leg odds, rounded down to 2 decimals
  const rawCombinedOdds = legs.reduce((prod, leg) => prod * leg.odds, 1.0);
  const combinedOdds = Math.floor(rawCombinedOdds * 100) / 100;

  // True win chance = product of fair probabilities
  const trueWinChance = legs.reduce((prod, leg) => prod * leg.fairProb, 1.0);

  // 1 in N times
  const oneInNTimes = trueWinChance > 0 ? Math.round(1 / trueWinChance) : Infinity;

  // Expected return per 1 staked = (true win chance * combined odds)
  const expectedReturnPer1 = trueWinChance * combinedOdds;

  // Expected loss per 100 staked = 100 * (1 - expectedReturnPer1)
  const expectedLossPer100 = Math.max(0, Number((100 * (1 - expectedReturnPer1)).toFixed(2)));

  return {
    combinedOdds,
    trueWinChance,
    oneInNTimes,
    expectedLossPer100,
    expectedReturnPer1,
  };
}
