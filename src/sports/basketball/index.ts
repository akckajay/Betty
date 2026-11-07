/**
 * Basketball Markets Catalog & Settlement
 */

import { Event, Market, SelectionResult } from '../../types';
import { CONFIG } from '../../config';
import { calculateOfferedOdds } from '../../engine/odds';
import { computeBasketballProbs } from './pricing';
import { MarketSettlementResult, SportPlugin } from '../types';

export function createBasketballMarkets(event: Event): Market[] {
  const homeRating = event.home.rating ?? 112;
  const awayRating = event.away.rating ?? 108;
  const expectedMargin = homeRating - awayRating;
  const expectedTotal = homeRating + awayRating;

  const probs = computeBasketballProbs(expectedMargin, expectedTotal);
  const twoWayMargin = CONFIG.defaultMargins.twoWayMain;

  // Moneyline
  const moneyline: Market = {
    id: `${event.id}_moneyline`,
    eventId: event.id,
    type: 'moneyline',
    category: 'main',
    name: 'Moneyline (Winner)',
    margin: twoWayMargin,
    rulesText: 'Includes overtime if played.',
    status: 'open',
    selections: [
      { id: 'home', label: event.home.name, fairProbability: probs.homeWin, odds: calculateOfferedOdds(probs.homeWin, twoWayMargin) },
      { id: 'away', label: event.away.name, fairProbability: probs.awayWin, odds: calculateOfferedOdds(probs.awayWin, twoWayMargin) },
    ],
  };

  // Point Spread
  const spreadSign = probs.spreadLine > 0 ? `-${probs.spreadLine}` : `+${Math.abs(probs.spreadLine)}`;
  const oppSpreadSign = probs.spreadLine > 0 ? `+${probs.spreadLine}` : `-${Math.abs(probs.spreadLine)}`;

  const spread: Market = {
    id: `${event.id}_spread`,
    eventId: event.id,
    type: 'point_spread',
    category: 'main',
    name: `Point Spread (${event.home.name} ${spreadSign})`,
    line: probs.spreadLine,
    margin: twoWayMargin,
    rulesText: 'Point spread line includes overtime. Half-point lines eliminate ties.',
    status: 'open',
    selections: [
      { id: 'home', label: `${event.home.name} ${spreadSign}`, fairProbability: probs.homeCovers, odds: calculateOfferedOdds(probs.homeCovers, twoWayMargin) },
      { id: 'away', label: `${event.away.name} ${oppSpreadSign}`, fairProbability: probs.awayCovers, odds: calculateOfferedOdds(probs.awayCovers, twoWayMargin) },
    ],
  };

  // Total Points Over/Under
  const totalPoints: Market = {
    id: `${event.id}_total_points`,
    eventId: event.id,
    type: 'total_points',
    category: 'main',
    name: `Total Points Over/Under ${probs.totalLine}`,
    line: probs.totalLine,
    margin: twoWayMargin,
    rulesText: 'Total combined points scored by both teams including overtime.',
    status: 'open',
    selections: [
      { id: 'over', label: `Over ${probs.totalLine}`, fairProbability: probs.overProb, odds: calculateOfferedOdds(probs.overProb, twoWayMargin) },
      { id: 'under', label: `Under ${probs.totalLine}`, fairProbability: probs.underProb, odds: calculateOfferedOdds(probs.underProb, twoWayMargin) },
    ],
  };

  return [moneyline, spread, totalPoints];
}

export function settleBasketballMarket(market: Market, event: Event): MarketSettlementResult {
  if (event.status !== 'final') {
    return { marketId: market.id, results: {}, settled: false };
  }

  const homeScore = parseInt(event.score?.homeScore ?? '105', 10);
  const awayScore = parseInt(event.score?.awayScore ?? '100', 10);
  const total = homeScore + awayScore;
  const marginDiff = homeScore - awayScore;
  const results: Record<string, SelectionResult> = {};

  if (market.type === 'moneyline') {
    results['home'] = homeScore > awayScore ? 'won' : 'lost';
    results['away'] = awayScore > homeScore ? 'won' : 'lost';
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'point_spread') {
    const line = market.line ?? 0;
    results['home'] = marginDiff > line ? 'won' : 'lost';
    results['away'] = marginDiff < line ? 'won' : 'lost';
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'total_points') {
    const line = market.line ?? 215.5;
    results['over'] = total > line ? 'won' : 'lost';
    results['under'] = total < line ? 'won' : 'lost';
    return { marketId: market.id, results, settled: true };
  }

  return { marketId: market.id, results, settled: false };
}

export const basketballPlugin: SportPlugin = {
  sportId: 'basketball',
  displayName: 'Basketball',
  createMarkets: createBasketballMarkets,
  settleMarket: settleBasketballMarket,
};
