/**
 * Football Settlement Rules
 */

import { Event, Market, SelectionResult } from '../../types';
import { MarketSettlementResult } from '../types';

export function settleFootballMarket(market: Market, event: Event): MarketSettlementResult {
  if (event.status !== 'final' && event.status !== 'abandoned') {
    return { marketId: market.id, results: {}, settled: false };
  }

  if (event.status === 'abandoned') {
    // Abandoned matches void unsettled markets
    const results: Record<string, SelectionResult> = {};
    for (const sel of market.selections) {
      results[sel.id] = 'void';
    }
    return { marketId: market.id, results, settled: true };
  }

  const homeScore = parseInt(event.score?.homeScore ?? '0', 10);
  const awayScore = parseInt(event.score?.awayScore ?? '0', 10);
  const totalGoals = homeScore + awayScore;
  const results: Record<string, SelectionResult> = {};

  if (market.type === '1x2') {
    for (const sel of market.selections) {
      if (sel.id === 'home') results[sel.id] = homeScore > awayScore ? 'won' : 'lost';
      else if (sel.id === 'draw') results[sel.id] = homeScore === awayScore ? 'won' : 'lost';
      else if (sel.id === 'away') results[sel.id] = awayScore > homeScore ? 'won' : 'lost';
    }
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'over_under_goals') {
    const line = market.line ?? 2.5;
    for (const sel of market.selections) {
      if (sel.id === 'over') results[sel.id] = totalGoals > line ? 'won' : 'lost';
      else if (sel.id === 'under') results[sel.id] = totalGoals < line ? 'won' : 'lost';
    }
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'btts') {
    const bothScored = homeScore > 0 && awayScore > 0;
    for (const sel of market.selections) {
      if (sel.id === 'yes') results[sel.id] = bothScored ? 'won' : 'lost';
      else if (sel.id === 'no') results[sel.id] = !bothScored ? 'won' : 'lost';
    }
    return { marketId: market.id, results, settled: true };
  }

  return { marketId: market.id, results, settled: false };
}
