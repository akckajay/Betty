/**
 * Tennis Sport Plugin (Section 6.4)
 */

import { Event, Market, SelectionResult } from '../../types';
import { CONFIG } from '../../config';
import { calculateOfferedOdds } from '../../engine/odds';
import { MarketSettlementResult, SportPlugin } from '../types';

export function createTennisMarkets(event: Event): Market[] {
  const rHome = event.home.rating ?? 1.6;
  const rAway = event.away.rating ?? 1.4;
  const pHome = rHome / (rHome + rAway);
  const pAway = 1 - pHome;

  const twoWayMargin = CONFIG.defaultMargins.twoWayMain;
  const setBettingMargin = CONFIG.defaultMargins.correctScoreAndExotics;

  // 1. Match Winner
  const matchWinner: Market = {
    id: `${event.id}_winner`,
    eventId: event.id,
    type: 'match_winner',
    category: 'main',
    name: 'Match Winner',
    margin: twoWayMargin,
    rulesText: 'Retirement or walkover before one full set is completed voids all bets. Official ATP/WTA result.',
    status: 'open',
    selections: [
      { id: 'home', label: event.home.name, fairProbability: pHome, odds: calculateOfferedOdds(pHome, twoWayMargin) },
      { id: 'away', label: event.away.name, fairProbability: pAway, odds: calculateOfferedOdds(pAway, twoWayMargin) },
    ],
  };

  // 2. Set Betting (Best of 3 sets: 2-0, 2-1, 1-2, 0-2)
  const p20 = pHome * pHome * 0.9;
  const p21 = pHome - p20;
  const p02 = pAway * pAway * 0.9;
  const p12 = pAway - p02;

  const setBetting: Market = {
    id: `${event.id}_set_betting`,
    eventId: event.id,
    type: 'set_betting',
    category: 'specials',
    name: 'Set Betting (Correct Score)',
    margin: setBettingMargin,
    rulesText: 'Predict the exact sets score in a best of 3 match. All sets must finish.',
    status: 'open',
    selections: [
      { id: '2_0', label: `${event.home.name} 2-0`, fairProbability: p20, odds: calculateOfferedOdds(p20, setBettingMargin) },
      { id: '2_1', label: `${event.home.name} 2-1`, fairProbability: p21, odds: calculateOfferedOdds(p21, setBettingMargin) },
      { id: '1_2', label: `${event.away.name} 2-1`, fairProbability: p12, odds: calculateOfferedOdds(p12, setBettingMargin) },
      { id: '0_2', label: `${event.away.name} 2-0`, fairProbability: p02, odds: calculateOfferedOdds(p02, setBettingMargin) },
    ],
  };

  // 3. Total Games Over/Under 22.5
  const totalGamesLine = 22.5;
  const totalGames: Market = {
    id: `${event.id}_total_games`,
    eventId: event.id,
    type: 'total_games',
    category: 'main',
    name: `Total Games Over/Under ${totalGamesLine}`,
    line: totalGamesLine,
    margin: twoWayMargin,
    rulesText: 'Total completed games across all sets.',
    status: 'open',
    selections: [
      { id: 'over', label: `Over ${totalGamesLine}`, fairProbability: 0.51, odds: calculateOfferedOdds(0.51, twoWayMargin) },
      { id: 'under', label: `Under ${totalGamesLine}`, fairProbability: 0.49, odds: calculateOfferedOdds(0.49, twoWayMargin) },
    ],
  };

  return [matchWinner, setBetting, totalGames];
}

export function settleTennisMarket(market: Market, event: Event): MarketSettlementResult {
  if (event.status !== 'final') {
    return { marketId: market.id, results: {}, settled: false };
  }

  const results: Record<string, SelectionResult> = {};
  // Mock results
  const homeWon = true;

  if (market.type === 'match_winner') {
    results['home'] = homeWon ? 'won' : 'lost';
    results['away'] = homeWon ? 'lost' : 'won';
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'set_betting') {
    results['2_0'] = 'lost';
    results['2_1'] = 'won'; // e.g. 2-1
    results['1_2'] = 'lost';
    results['0_2'] = 'lost';
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'total_games') {
    results['over'] = 'won'; // 25 games > 22.5
    results['under'] = 'lost';
    return { marketId: market.id, results, settled: true };
  }

  return { marketId: market.id, results, settled: false };
}

export const tennisPlugin: SportPlugin = {
  sportId: 'tennis',
  displayName: 'Tennis',
  createMarkets: createTennisMarkets,
  settleMarket: settleTennisMarket,
};
