/**
 * Basketball Normal Distribution Pricing Model (Section 6.3)
 */

import { CONFIG } from '../../config';

function standardNormalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX));

  return 0.5 * (1.0 + sign * y);
}

export function computeBasketballProbs(expectedMarginHome: number, expectedTotal: number) {
  const marginStd = CONFIG.basketball.marginStdDev; // 12.0
  const totalStd = CONFIG.basketball.totalStdDev; // 17.0

  // Win probability (home margin > 0)
  const zWin = (0 - expectedMarginHome) / marginStd;
  const homeWin = 1 - standardNormalCDF(zWin);
  const awayWin = 1 - homeWin;

  // Spread (e.g. Home -4.5 -> margin > 4.5)
  const spreadLine = Math.round(expectedMarginHome) - 0.5;
  const zSpread = (spreadLine - expectedMarginHome) / marginStd;
  const homeCovers = 1 - standardNormalCDF(zSpread);

  // Total points (e.g. Total Over 218.5)
  const totalLine = Math.round(expectedTotal) + 0.5;
  const zTotal = (totalLine - expectedTotal) / totalStd;
  const overProb = 1 - standardNormalCDF(zTotal);

  return {
    homeWin,
    awayWin,
    spreadLine,
    homeCovers,
    awayCovers: 1 - homeCovers,
    totalLine,
    overProb,
    underProb: 1 - overProb,
  };
}
