/**
 * Unit Tests for Odds Engine & Accumulator Mathematics (Section 5 & 18)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateOfferedOdds,
  calculateSingleLossPer100,
  analyzeAccumulator,
  removeMarginFromMarketOdds,
} from '../src/engine/odds';
import { theoreticalCompoundLoss } from '../src/engine/accumulator';
import { generateSystemLines } from '../src/engine/system-bets';
import { settlePendingBets } from '../src/engine/settlement';
import { Bet, Event, Leg } from '../src/types';

describe('Odds Engine & Acceptance Checks', () => {
  it('Overround Check: Odds for complete 2-way market sum to ~1 + margin', () => {
    const margin = 0.05; // 5%
    const p1 = 0.5;
    const p2 = 0.5;

    const o1 = calculateOfferedOdds(p1, margin);
    const o2 = calculateOfferedOdds(p2, margin);

    // 1 / (0.5 * 1.05) = 1.9047 -> floor to 1.90
    expect(o1).toBe(1.9);
    expect(o2).toBe(1.9);

    const sumImplied = 1 / o1 + 1 / o2;
    // Implied probabilities sum to ~1.0526 (1 + 5.26% with rounding down)
    expect(sumImplied).toBeGreaterThan(1.04);
    expect(sumImplied).toBeLessThan(1.06);
  });

  it('Acceptance Check 1: 5-leg accumulator at 5% margin per leg shows ~21.6% expected loss', () => {
    const margin = 0.05;
    const loss5Legs = theoreticalCompoundLoss(5, margin);
    // 1 - (1 / 1.05)^5 = 1 - 0.7835 = 0.2164 (21.6%)
    expect(loss5Legs * 100).toBeCloseTo(21.64, 1);

    // Also check 10-leg accumulator: 1 - (1 / 1.05)^10 = 0.386 (38.6%)
    const loss10Legs = theoreticalCompoundLoss(10, margin);
    expect(loss10Legs * 100).toBeCloseTo(38.61, 1);

    // Single bet: 1 - 1 / 1.05 = 0.0476 (4.8%)
    const lossSingle = calculateSingleLossPer100(margin);
    expect(lossSingle).toBeCloseTo(4.76, 1);
  });

  it('Acceptance Check 4: System bets produce 4 (Trixie), 11 (Yankee) and 57 (Heinz) lines', () => {
    const dummyLeg = (id: string): Leg => ({
      eventId: `ev_${id}`,
      eventTitle: `Event ${id}`,
      marketId: `m_${id}`,
      marketName: 'Winner',
      selectionId: `s_${id}`,
      selectionLabel: 'Team A',
      oddsAtPlacement: 2.0,
      fairProbAtPlacement: 0.5,
      result: 'pending',
    });

    const legs3 = [dummyLeg('1'), dummyLeg('2'), dummyLeg('3')];
    const trixieLines = generateSystemLines('trixie', legs3);
    expect(trixieLines.length).toBe(4); // 3 doubles + 1 treble

    const legs4 = [...legs3, dummyLeg('4')];
    const yankeeLines = generateSystemLines('yankee', legs4);
    expect(yankeeLines.length).toBe(11); // 6 doubles + 4 trebles + 1 fourfold

    const legs6 = [...legs4, dummyLeg('5'), dummyLeg('6')];
    const heinzLines = generateSystemLines('heinz', legs6);
    expect(heinzLines.length).toBe(57); // 15 doubles + 20 trebles + 15 fourfolds + 6 fivefolds + 1 sixfold
  });

  it('Acceptance Check 5: Settlement is idempotent and never pays twice', () => {
    const bet: Bet = {
      id: 'test_bet_1',
      createdAt: Date.now(),
      stakeMinor: 10000, // 100 INR
      type: 'single',
      legs: [
        {
          eventId: 'foot_final_int_mil',
          eventTitle: 'Inter vs Milan',
          marketId: 'foot_final_int_mil_1x2',
          marketName: 'Match Result',
          selectionId: 'home', // Inter won 1-0 in mock
          selectionLabel: 'Inter Milan',
          oddsAtPlacement: 2.0,
          fairProbAtPlacement: 0.5,
          result: 'pending',
        },
      ],
      combinedOdds: 2.0,
      trueWinProbability: 0.5,
      status: 'pending',
      potentialReturnMinor: 20000,
      actualReturnMinor: 0,
      oddsAtPlacement: 2.0,
      fairProbabilityAtPlacement: 0.5,
    };

    const mockEvent: Event = {
      id: 'foot_final_int_mil',
      sport: 'football',
      competition: 'Serie A',
      startTime: Date.now() - 100000,
      status: 'final',
      home: { id: 'int', name: 'Inter Milan' },
      away: { id: 'mil', name: 'AC Milan' },
      score: { homeScore: '1', awayScore: '0' },
      sourceLabel: 'Simulated mock fixture',
      oddsBasis: 'Simulated odds',
      markets: [
        {
          id: 'foot_final_int_mil_1x2',
          eventId: 'foot_final_int_mil',
          type: '1x2',
          name: 'Match Result',
          margin: 0.06,
          status: 'settled',
          rulesText: '90 mins result',
          selections: [
            { id: 'home', label: 'Inter', odds: 2.0, fairProbability: 0.5 },
            { id: 'draw', label: 'Draw', odds: 3.2, fairProbability: 0.3 },
            { id: 'away', label: 'Milan', odds: 4.0, fairProbability: 0.2 },
          ],
        },
      ],
    };

    const eventsMap = new Map<string, Event>([['foot_final_int_mil', mockEvent]]);

    // Run settlement round 1
    const res1 = settlePendingBets([bet], eventsMap, 100000);
    expect(res1.settledBets[0].status).toBe('won');
    expect(res1.settledBets[0].actualReturnMinor).toBe(20000);
    expect(res1.newLedgerEntries.length).toBe(1);

    // Run settlement round 2 on already settled bet
    const res2 = settlePendingBets(res1.settledBets, eventsMap, 120000);
    // Since bet status is no longer 'pending', it is skipped entirely
    expect(res2.settledBets.length).toBe(0);
    expect(res2.newLedgerEntries.length).toBe(0);
  });
});
