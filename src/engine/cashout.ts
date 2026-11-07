/**
 * Cash Out Engine (Section 5.8)
 * Value = (stake * product of odds of legs already won) * (product of current fair probabilities of remaining legs) * (1 - cashOutMargin)
 */

import { CONFIG } from '../config';
import { Bet } from '../types';

export interface CashOutQuote {
  available: boolean;
  amountMinor: number;
  cashOutMarginPercent: number;
  fairValueMinor: number;
  marginTakenMinor: number;
  explanation: string;
}

export function computeCashOutValue(bet: Bet, currentLegFairProbs: Map<string, number>): CashOutQuote {
  if (bet.status !== 'pending' || bet.legs.length === 0) {
    return {
      available: false,
      amountMinor: 0,
      cashOutMarginPercent: CONFIG.cashOutMargin * 100,
      fairValueMinor: 0,
      marginTakenMinor: 0,
      explanation: 'Bet is not open for cash out.',
    };
  }

  // Check if any leg has lost
  const hasLostLeg = bet.legs.some((leg) => leg.result === 'lost');
  if (hasLostLeg) {
    return {
      available: false,
      amountMinor: 0,
      cashOutMarginPercent: CONFIG.cashOutMargin * 100,
      fairValueMinor: 0,
      marginTakenMinor: 0,
      explanation: 'Bet has already lost a leg.',
    };
  }

  // Odds of legs already won (void counts as 1.0)
  let wonOddsProduct = 1.0;
  let remainingFairProbProduct = 1.0;
  let hasPending = false;

  for (const leg of bet.legs) {
    if (leg.result === 'won') {
      wonOddsProduct *= leg.oddsAtPlacement;
    } else if (leg.result === 'void') {
      wonOddsProduct *= 1.0;
    } else {
      hasPending = true;
      const fairProb = currentLegFairProbs.get(`${leg.eventId}:${leg.marketId}:${leg.selectionId}`) ?? leg.fairProbAtPlacement;
      remainingFairProbProduct *= fairProb;
    }
  }

  if (!hasPending) {
    return {
      available: false,
      amountMinor: 0,
      cashOutMarginPercent: CONFIG.cashOutMargin * 100,
      fairValueMinor: 0,
      marginTakenMinor: 0,
      explanation: 'All legs already finished.',
    };
  }

  // Fair expectation = stake * wonOdds * remainingFairProb
  const fairValueMinor = Math.round(bet.stakeMinor * wonOddsProduct * remainingFairProbProduct);
  const offeredValueMinor = Math.floor(fairValueMinor * (1 - CONFIG.cashOutMargin));
  const marginTakenMinor = fairValueMinor - offeredValueMinor;

  return {
    available: offeredValueMinor > 0,
    amountMinor: offeredValueMinor,
    cashOutMarginPercent: CONFIG.cashOutMargin * 100,
    fairValueMinor,
    marginTakenMinor,
    explanation: `Bookmaker takes ${CONFIG.cashOutMargin * 100}% of the fair expected value of your open bet.`,
  };
}
