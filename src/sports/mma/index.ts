/**
 * MMA Sport Plugin (Section 6.6)
 */

import { Event, Market, SelectionResult } from '../../types';
import { CONFIG } from '../../config';
import { calculateOfferedOdds } from '../../engine/odds';
import { MarketSettlementResult, SportPlugin } from '../types';

export function createMMAMarkets(event: Event): Market[] {
  const pHome = 0.58;
  const pAway = 0.42;

  const twoWayMargin = CONFIG.defaultMargins.twoWayMain;
  const methodMargin = CONFIG.defaultMargins.propsAndInPlay;

  // 1. Fight Winner
  const fightWinner: Market = {
    id: `${event.id}_winner`,
    eventId: event.id,
    type: 'match_winner',
    category: 'main',
    name: 'Fight Winner (Moneyline)',
    margin: twoWayMargin,
    rulesText: 'Official UFC/Promotion result. Draw or No Contest voids moneyline bets.',
    status: 'open',
    selections: [
      { id: 'home', label: event.home.name, fairProbability: pHome, odds: calculateOfferedOdds(pHome, twoWayMargin) },
      { id: 'away', label: event.away.name, fairProbability: pAway, odds: calculateOfferedOdds(pAway, twoWayMargin) },
    ],
  };

  // 2. Method of Victory
  const methodOfVictory: Market = {
    id: `${event.id}_method`,
    eventId: event.id,
    type: 'method_of_victory',
    category: 'specials',
    name: 'Method of Victory',
    margin: methodMargin,
    rulesText: 'How the fight ends: KO/TKO, Submission, or Decision.',
    status: 'open',
    selections: [
      { id: 'ko', label: 'KO / TKO / Disqualification', fairProbability: 0.42, odds: calculateOfferedOdds(0.42, methodMargin) },
      { id: 'sub', label: 'Submission', fairProbability: 0.23, odds: calculateOfferedOdds(0.23, methodMargin) },
      { id: 'dec', label: 'Decision / Points', fairProbability: 0.35, odds: calculateOfferedOdds(0.35, methodMargin) },
    ],
  };

  return [fightWinner, methodOfVictory];
}

export function settleMMAMarket(market: Market, event: Event): MarketSettlementResult {
  if (event.status !== 'final') {
    return { marketId: market.id, results: {}, settled: false };
  }

  const results: Record<string, SelectionResult> = {};
  if (market.type === 'match_winner') {
    results['home'] = 'won';
    results['away'] = 'lost';
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'method_of_victory') {
    results['ko'] = 'won';
    results['sub'] = 'lost';
    results['dec'] = 'lost';
    return { marketId: market.id, results, settled: true };
  }

  return { marketId: market.id, results, settled: false };
}

export const mmaPlugin: SportPlugin = {
  sportId: 'mma',
  displayName: 'MMA',
  createMarkets: createMMAMarkets,
  settleMarket: settleMMAMarket,
};
