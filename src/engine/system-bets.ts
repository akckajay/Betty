/**
 * System Bets Engine: Trixie, Patent, Yankee, Lucky 15, Lucky 31, Heinz, etc.
 * Supports line generation, combinatorial settlements, and void rules (void leg = odds 1.00).
 */

import { SystemBetType, Leg } from '../types';

export interface SystemBetDef {
  name: string;
  minSelections: number;
  totalBets: number;
  description: string;
  combinations: { size: number; count: number }[];
}

export const SYSTEM_BET_DEFINITIONS: Record<SystemBetType, SystemBetDef> = {
  double: {
    name: 'Double',
    minSelections: 2,
    totalBets: 1,
    description: '1 double from 2 selections',
    combinations: [{ size: 2, count: 1 }],
  },
  treble: {
    name: 'Treble',
    minSelections: 3,
    totalBets: 1,
    description: '1 treble from 3 selections',
    combinations: [{ size: 3, count: 1 }],
  },
  trixie: {
    name: 'Trixie',
    minSelections: 3,
    totalBets: 4,
    description: '3 doubles and 1 treble (4 bets)',
    combinations: [
      { size: 2, count: 3 },
      { size: 3, count: 1 },
    ],
  },
  patent: {
    name: 'Patent',
    minSelections: 3,
    totalBets: 7,
    description: '3 singles, 3 doubles and 1 treble (7 bets)',
    combinations: [
      { size: 1, count: 3 },
      { size: 2, count: 3 },
      { size: 3, count: 1 },
    ],
  },
  yankee: {
    name: 'Yankee',
    minSelections: 4,
    totalBets: 11,
    description: '6 doubles, 4 trebles and 1 four-fold (11 bets)',
    combinations: [
      { size: 2, count: 6 },
      { size: 3, count: 4 },
      { size: 4, count: 1 },
    ],
  },
  lucky15: {
    name: 'Lucky 15',
    minSelections: 4,
    totalBets: 15,
    description: '4 singles, 6 doubles, 4 trebles and 1 four-fold (15 bets)',
    combinations: [
      { size: 1, count: 4 },
      { size: 2, count: 6 },
      { size: 3, count: 4 },
      { size: 4, count: 1 },
    ],
  },
  lucky31: {
    name: 'Lucky 31',
    minSelections: 5,
    totalBets: 31,
    description: '5 singles, 10 doubles, 10 trebles, 5 four-folds, 1 five-fold (31 bets)',
    combinations: [
      { size: 1, count: 5 },
      { size: 2, count: 10 },
      { size: 3, count: 10 },
      { size: 4, count: 5 },
      { size: 5, count: 1 },
    ],
  },
  heinz: {
    name: 'Heinz',
    minSelections: 6,
    totalBets: 57,
    description: '15 doubles, 20 trebles, 15 four-folds, 6 five-folds, 1 six-fold (57 bets)',
    combinations: [
      { size: 2, count: 15 },
      { size: 3, count: 20 },
      { size: 4, count: 15 },
      { size: 5, count: 6 },
      { size: 6, count: 1 },
    ],
  },
  full_cover: {
    name: 'Full Cover',
    minSelections: 2,
    totalBets: 0,
    description: 'All possible combinations (singles and multiples)',
    combinations: [],
  },
};

/**
 * Generate all combinations of array k items at a time
 */
export function getCombinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length === 0 || k > items.length) return [];
  const head = items[0];
  const tail = items.slice(1);
  const withHead = getCombinations(tail, k - 1).map((combo) => [head, ...combo]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

/**
 * Generates all individual bet lines for a given system bet type and legs.
 */
export function generateSystemLines(systemType: SystemBetType, legs: Leg[]): Leg[][] {
  const def = SYSTEM_BET_DEFINITIONS[systemType];
  if (!def || legs.length < def.minSelections) return [];

  const lines: Leg[][] = [];
  for (const combo of def.combinations) {
    const subCombos = getCombinations(legs, combo.size);
    lines.push(...subCombos);
  }
  return lines;
}
