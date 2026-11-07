/**
 * Football Markets Catalog
 */

import { Event, Market } from '../../types';
import { CONFIG } from '../../config';
import { calculateOfferedOdds } from '../../engine/odds';
import { generateFootballGoalGrid, computeGoalGridProbabilities } from './pricing';

export function createFootballMarkets(event: Event): Market[] {
  const homeRating = event.home.rating ?? 1.5;
  const awayRating = event.away.rating ?? 1.2;

  // Expected goals
  const lambdaHome = Math.max(0.6, homeRating);
  const lambdaAway = Math.max(0.4, awayRating);
  const grid = generateFootballGoalGrid(lambdaHome, lambdaAway);
  const probs = computeGoalGridProbabilities(grid);

  const threeWayMargin = CONFIG.defaultMargins.threeWayMain;
  const twoWayMargin = CONFIG.defaultMargins.twoWayMain;

  // 1X2 Match Result
  const matchResult: Market = {
    id: `${event.id}_1x2`,
    eventId: event.id,
    type: '1x2',
    category: 'main',
    name: 'Match Result (90 Mins)',
    margin: threeWayMargin,
    rulesText: 'Settled on regular time 90 mins plus stoppage time only. Extra time and penalties do not count.',
    status: 'open',
    selections: [
      {
        id: 'home',
        label: event.home.name,
        fairProbability: probs.homeWin,
        odds: calculateOfferedOdds(probs.homeWin, threeWayMargin),
      },
      {
        id: 'draw',
        label: 'Draw',
        fairProbability: probs.draw,
        odds: calculateOfferedOdds(probs.draw, threeWayMargin),
      },
      {
        id: 'away',
        label: event.away.name,
        fairProbability: probs.awayWin,
        odds: calculateOfferedOdds(probs.awayWin, threeWayMargin),
      },
    ],
  };

  // Over/Under 2.5 Goals
  let over25Prob = 0;
  for (const [goals, p] of Object.entries(probs.totalGoalsProbs)) {
    if (Number(goals) > 2.5) over25Prob += p;
  }
  const under25Prob = 1 - over25Prob;

  const overUnder25: Market = {
    id: `${event.id}_ou25`,
    eventId: event.id,
    type: 'over_under_goals',
    category: 'main',
    name: 'Total Goals Over/Under 2.5',
    line: 2.5,
    margin: twoWayMargin,
    rulesText: 'Total goals scored by both teams in 90 minutes plus stoppage time.',
    status: 'open',
    selections: [
      {
        id: 'over',
        label: 'Over 2.5',
        fairProbability: over25Prob,
        odds: calculateOfferedOdds(over25Prob, twoWayMargin),
      },
      {
        id: 'under',
        label: 'Under 2.5',
        fairProbability: under25Prob,
        odds: calculateOfferedOdds(under25Prob, twoWayMargin),
      },
    ],
  };

  // Both Teams to Score (BTTS)
  const btts: Market = {
    id: `${event.id}_btts`,
    eventId: event.id,
    type: 'btts',
    category: 'main',
    name: 'Both Teams to Score',
    margin: twoWayMargin,
    rulesText: 'Both teams must score at least 1 goal in regular time.',
    status: 'open',
    selections: [
      {
        id: 'yes',
        label: 'Yes',
        fairProbability: probs.bttsYes,
        odds: calculateOfferedOdds(probs.bttsYes, twoWayMargin),
      },
      {
        id: 'no',
        label: 'No',
        fairProbability: probs.bttsNo,
        odds: calculateOfferedOdds(probs.bttsNo, twoWayMargin),
      },
    ],
  };

  return [matchResult, overUnder25, btts];
}
