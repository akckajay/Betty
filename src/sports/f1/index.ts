/**
 * Formula 1 Sport Plugin (Section 6.5)
 */

import { Event, Market, SelectionResult } from '../../types';
import { CONFIG } from '../../config';
import { calculateOfferedOdds } from '../../engine/odds';
import { MarketSettlementResult, SportPlugin } from '../types';

export function createF1Markets(event: Event): Market[] {
  const drivers = [
    { id: 'ver', name: 'Max Verstappen', rating: 35 },
    { id: 'nor', name: 'Lando Norris', rating: 28 },
    { id: 'lec', name: 'Charles Leclerc', rating: 20 },
    { id: 'pia', name: 'Oscar Piastri', rating: 17 },
  ];

  const totalRating = drivers.reduce((sum, d) => sum + d.rating, 0);
  const multiMargin = CONFIG.defaultMargins.correctScoreAndExotics; // multi-runner market
  const podiumMargin = CONFIG.defaultMargins.propsAndInPlay;

  // 1. Race Winner
  const raceWinner: Market = {
    id: `${event.id}_race_winner`,
    eventId: event.id,
    type: 'race_winner',
    category: 'main',
    name: 'Grand Prix Winner',
    margin: multiMargin,
    rulesText: 'Official FIA classification at podium presentation. Post-podium penalties do not count.',
    status: 'open',
    selections: drivers.map((d) => {
      const prob = d.rating / totalRating;
      return {
        id: d.id,
        label: d.name,
        fairProbability: prob,
        odds: calculateOfferedOdds(prob, multiMargin),
      };
    }),
  };

  // 2. Podium Finish (Top 3)
  const podiumFinish: Market = {
    id: `${event.id}_podium`,
    eventId: event.id,
    type: 'podium_finish',
    category: 'specials',
    name: 'Podium Finish (Top 3)',
    margin: podiumMargin,
    rulesText: 'Driver must be officially classified in 1st, 2nd, or 3rd place.',
    status: 'open',
    selections: drivers.map((d) => {
      // Simplified top-3 probability approximation
      const p1 = d.rating / totalRating;
      const prob = Math.min(0.92, p1 * 2.3);
      return {
        id: `${d.id}_podium`,
        label: d.name,
        fairProbability: prob,
        odds: calculateOfferedOdds(prob, podiumMargin),
      };
    }),
  };

  return [raceWinner, podiumFinish];
}

export function settleF1Market(market: Market, event: Event): MarketSettlementResult {
  if (event.status !== 'final') {
    return { marketId: market.id, results: {}, settled: false };
  }

  const results: Record<string, SelectionResult> = {};
  if (market.type === 'race_winner') {
    results['ver'] = 'won';
    results['nor'] = 'lost';
    results['lec'] = 'lost';
    results['pia'] = 'lost';
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'podium_finish') {
    results['ver_podium'] = 'won';
    results['nor_podium'] = 'won';
    results['lec_podium'] = 'won';
    results['pia_podium'] = 'lost';
    return { marketId: market.id, results, settled: true };
  }

  return { marketId: market.id, results, settled: false };
}

export const f1Plugin: SportPlugin = {
  sportId: 'f1',
  displayName: 'Formula 1',
  createMarkets: createF1Markets,
  settleMarket: settleF1Market,
};
