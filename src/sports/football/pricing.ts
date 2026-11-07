/**
 * Football Poisson Goal Grid Pricing Model (Section 6.1)
 */

import { calculateOfferedOdds } from '../../engine/odds';
import { CONFIG } from '../../config';
import { Selection } from '../../types';

function poisson(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export function generateFootballGoalGrid(lambdaHome: number, lambdaAway: number, maxGoals = 8): number[][] {
  const grid: number[][] = [];
  for (let h = 0; h <= maxGoals; h++) {
    grid[h] = [];
    const pHome = poisson(h, lambdaHome);
    for (let a = 0; a <= maxGoals; a++) {
      grid[h][a] = pHome * poisson(a, lambdaAway);
    }
  }
  return grid;
}

export function computeGoalGridProbabilities(grid: number[][]) {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  const totalGoalsProbs: Record<number, number> = {};
  let bttsYes = 0;

  for (let h = 0; h < grid.length; h++) {
    for (let a = 0; a < grid[h].length; a++) {
      const p = grid[h][a];
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;

      const total = h + a;
      totalGoalsProbs[total] = (totalGoalsProbs[total] || 0) + p;

      if (h > 0 && a > 0) bttsYes += p;
    }
  }

  // Normalize
  const total = homeWin + draw + awayWin;
  return {
    homeWin: homeWin / total,
    draw: draw / total,
    awayWin: awayWin / total,
    bttsYes: bttsYes / total,
    bttsNo: 1 - bttsYes / total,
    totalGoalsProbs,
  };
}
