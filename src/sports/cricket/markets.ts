/**
 * Cricket Markets Catalog (Section 6.2 & 7.3)
 */

import { Event, Market } from '../../types';
import { CONFIG } from '../../config';
import { calculateOfferedOdds } from '../../engine/odds';
import { getAdjustedCricketDeliveryProbabilities } from './pricing';

export function createCricketMarkets(event: Event): Market[] {
  const homeRating = event.home.rating ?? 1.5;
  const awayRating = event.away.rating ?? 1.4;

  const totalRating = homeRating + awayRating;
  const pHomeWin = homeRating / totalRating;
  const pAwayWin = awayRating / totalRating;

  const twoWayMargin = CONFIG.defaultMargins.twoWayMain;
  const propsMargin = CONFIG.defaultMargins.propsAndInPlay;

  // 1. Match Winner
  const matchWinner: Market = {
    id: `${event.id}_winner`,
    eventId: event.id,
    type: 'match_winner',
    category: 'main',
    name: 'Match Winner',
    margin: twoWayMargin,
    rulesText: 'Official match result. If match is tied with no Super Over, or abandoned/no result, bets are void.',
    status: 'open',
    selections: [
      {
        id: 'home',
        label: event.home.name,
        fairProbability: pHomeWin,
        odds: calculateOfferedOdds(pHomeWin, twoWayMargin),
      },
      {
        id: 'away',
        label: event.away.name,
        fairProbability: pAwayWin,
        odds: calculateOfferedOdds(pAwayWin, twoWayMargin),
      },
    ],
  };

  // 2. Toss Winner (only available pre-match before toss)
  const tossWinner: Market = {
    id: `${event.id}_toss_winner`,
    eventId: event.id,
    type: 'toss_winner',
    category: 'toss',
    name: 'Toss Winner',
    margin: twoWayMargin,
    rulesText: 'Which team will win the official coin toss prior to play.',
    status: event.status === 'scheduled' ? 'open' : 'suspended',
    selections: [
      {
        id: 'home',
        label: event.home.name,
        fairProbability: 0.5,
        odds: calculateOfferedOdds(0.5, twoWayMargin),
      },
      {
        id: 'away',
        label: event.away.name,
        fairProbability: 0.5,
        odds: calculateOfferedOdds(0.5, twoWayMargin),
      },
    ],
  };

  // 3. Innings 1 Total Runs (e.g. Over/Under 165.5 for T20)
  const innings1Line = 165.5;
  const innings1Total: Market = {
    id: `${event.id}_inn1_runs`,
    eventId: event.id,
    type: 'innings1_runs',
    category: 'innings',
    name: `1st Innings Total Runs Over/Under ${innings1Line}`,
    line: innings1Line,
    margin: twoWayMargin,
    rulesText: 'Total runs scored in the 1st innings including extras. Void if rain curtails innings to fewer than 10 overs.',
    status: 'open',
    selections: [
      {
        id: 'over',
        label: `Over ${innings1Line}`,
        fairProbability: 0.52,
        odds: calculateOfferedOdds(0.52, twoWayMargin),
      },
      {
        id: 'under',
        label: `Under ${innings1Line}`,
        fairProbability: 0.48,
        odds: calculateOfferedOdds(0.48, twoWayMargin),
      },
    ],
  };

  // 4. Powerplay runs over/under (6 overs line: 49.5)
  const ppLine = 49.5;
  const powerplayRuns: Market = {
    id: `${event.id}_pp_runs`,
    eventId: event.id,
    type: 'powerplay_runs',
    category: 'innings',
    name: `Runs in First 6 Overs Over/Under ${ppLine}`,
    line: ppLine,
    margin: twoWayMargin,
    rulesText: 'Runs scored in overs 1 to 6 of 1st innings. All 6 overs must be completed for action.',
    status: 'open',
    selections: [
      {
        id: 'over',
        label: `Over ${ppLine}`,
        fairProbability: 0.5,
        odds: calculateOfferedOdds(0.5, twoWayMargin),
      },
      {
        id: 'under',
        label: `Under ${ppLine}`,
        fairProbability: 0.5,
        odds: calculateOfferedOdds(0.5, twoWayMargin),
      },
    ],
  };

  // 5. Total Match Sixes Over/Under 12.5
  const sixesLine = 12.5;
  const totalSixes: Market = {
    id: `${event.id}_total_sixes`,
    eventId: event.id,
    type: 'total_sixes',
    category: 'specials',
    name: `Total Match Sixes Over/Under ${sixesLine}`,
    line: sixesLine,
    margin: twoWayMargin,
    rulesText: 'Combined sixes hit by both teams during the match.',
    status: 'open',
    selections: [
      {
        id: 'over',
        label: `Over ${sixesLine}`,
        fairProbability: 0.48,
        odds: calculateOfferedOdds(0.48, twoWayMargin),
      },
      {
        id: 'under',
        label: `Under ${sixesLine}`,
        fairProbability: 0.52,
        odds: calculateOfferedOdds(0.52, twoWayMargin),
      },
    ],
  };

  // 6. In-play Next Delivery Market (if live)
  if (event.status === 'live') {
    const liveProbs = getAdjustedCricketDeliveryProbabilities({
      phase: event.liveState?.phase === 'powerplay' ? 'powerplay' : event.liveState?.phase === 'death' ? 'death' : 'middle',
      wicketsLost: 2,
      ballsRemaining: 45,
    });

    const nextBallMarket: Market = {
      id: `${event.id}_next_ball`,
      eventId: event.id,
      type: 'next_delivery',
      category: 'in_play',
      name: `Next Ball Outcome (Ball #${(event.liveState?.lastDeliveryNumber ?? 0) + 1})`,
      margin: propsMargin,
      rulesText: 'Result of the very next legal delivery. Wides & no-balls count as extras. Settles on official ball feed.',
      status: 'open',
      selections: [
        { id: 'dot', label: 'Dot Ball', fairProbability: liveProbs.dot, odds: calculateOfferedOdds(liveProbs.dot, propsMargin) },
        { id: 'one', label: '1 Run', fairProbability: liveProbs.one, odds: calculateOfferedOdds(liveProbs.one, propsMargin) },
        { id: 'two', label: '2 Runs', fairProbability: liveProbs.two, odds: calculateOfferedOdds(liveProbs.two, propsMargin) },
        { id: 'four', label: '4 Runs (Boundary)', fairProbability: liveProbs.four, odds: calculateOfferedOdds(liveProbs.four, propsMargin) },
        { id: 'six', label: '6 Runs (Maximum)', fairProbability: liveProbs.six, odds: calculateOfferedOdds(liveProbs.six, propsMargin) },
        { id: 'wicket', label: 'Wicket', fairProbability: liveProbs.wicket, odds: calculateOfferedOdds(liveProbs.wicket, propsMargin) },
      ],
    };

    return [matchWinner, tossWinner, innings1Total, powerplayRuns, totalSixes, nextBallMarket];
  }

  return [matchWinner, tossWinner, innings1Total, powerplayRuns, totalSixes];
}
