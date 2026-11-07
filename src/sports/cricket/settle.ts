/**
 * Cricket Settlement Rules (Section 7.5)
 * Evaluates bets against real match results and real scorecards.
 */

import { Event, Market, SelectionResult } from '../../types';
import { MarketSettlementResult } from '../types';

export function settleCricketMarket(market: Market, event: Event): MarketSettlementResult {
  if (event.status !== 'final' && event.status !== 'abandoned') {
    return { marketId: market.id, results: {}, settled: false };
  }

  if (event.status === 'abandoned') {
    // Abandoned or no-result matches void pre-match bets unless already determined
    const results: Record<string, SelectionResult> = {};
    for (const sel of market.selections) {
      results[sel.id] = 'void';
    }
    return { marketId: market.id, results, settled: true };
  }

  const results: Record<string, SelectionResult> = {};

  // Extract runs from real scores (e.g. "236/2 (70.5 ov)" -> 236, "504" -> 504)
  const parseRuns = (scoreStr?: string): number => {
    if (!scoreStr || scoreStr === '-') return 0;
    const match = scoreStr.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const homeScoreVal = parseRuns(event.score?.homeScore);
  const awayScoreVal = parseRuns(event.score?.awayScore);
  const detailText = (event.score?.detail || '').toLowerCase();

  if (market.type === 'match_winner') {
    const homeNameLower = event.home.name.toLowerCase();
    const awayNameLower = event.away.name.toLowerCase();
    const homeShortLower = (event.home.shortName || '').toLowerCase();
    const awayShortLower = (event.away.shortName || '').toLowerCase();

    let winnerId: 'home' | 'away' | 'tie' | 'draw' | null = null;

    if (event.home.isWinner) {
      winnerId = 'home';
    } else if (event.away.isWinner) {
      winnerId = 'away';
    } else if (
      detailText.includes(`${homeNameLower} won`) ||
      (homeShortLower && detailText.includes(`${homeShortLower} won`))
    ) {
      winnerId = 'home';
    } else if (
      detailText.includes(`${awayNameLower} won`) ||
      (awayShortLower && detailText.includes(`${awayShortLower} won`))
    ) {
      winnerId = 'away';
    } else if (detailText.includes('match tied') || detailText.includes('tied')) {
      winnerId = 'tie';
    } else if (detailText.includes('match drawn') || detailText.includes('drawn')) {
      winnerId = 'draw';
    } else if (homeScoreVal > 0 && awayScoreVal > 0) {
      if (homeScoreVal > awayScoreVal) winnerId = 'home';
      else if (awayScoreVal > homeScoreVal) winnerId = 'away';
      else winnerId = 'tie';
    }

    for (const sel of market.selections) {
      if (winnerId === 'home') {
        results[sel.id] = sel.id === 'home' ? 'won' : 'lost';
      } else if (winnerId === 'away') {
        results[sel.id] = sel.id === 'away' ? 'won' : 'lost';
      } else if (winnerId === 'tie' || winnerId === 'draw') {
        // Tie or Draw voids 2-way match winner bets
        results[sel.id] = 'void';
      } else {
        // If unresolvable from data, keep pending
        return { marketId: market.id, results: {}, settled: false };
      }
    }
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'toss_winner') {
    // If toss information is available in match detail
    if (detailText.includes('opted to') || detailText.includes('toss')) {
      const homeToss = detailText.includes(event.home.name.toLowerCase());
      results['home'] = homeToss ? 'won' : 'lost';
      results['away'] = homeToss ? 'lost' : 'won';
      return { marketId: market.id, results, settled: true };
    }
    // If toss cannot be determined from basic scorecard, void rather than fake
    results['home'] = 'void';
    results['away'] = 'void';
    return { marketId: market.id, results, settled: true };
  }

  if (market.type === 'innings1_runs') {
    const line = market.line ?? 165.5;
    const actual1stInningsRuns = homeScoreVal > 0 ? homeScoreVal : awayScoreVal;
    if (actual1stInningsRuns > 0) {
      results['over'] = actual1stInningsRuns > line ? 'won' : 'lost';
      results['under'] = actual1stInningsRuns < line ? 'won' : 'lost';
      return { marketId: market.id, results, settled: true };
    }
  }

  if (market.type === 'powerplay_runs') {
    const line = market.line ?? 49.5;
    // If total score surpassed powerplay line, over wins directly
    if (homeScoreVal > line) {
      results['over'] = 'won';
      results['under'] = 'lost';
      return { marketId: market.id, results, settled: true };
    }
  }

  return { marketId: market.id, results, settled: false };
}
