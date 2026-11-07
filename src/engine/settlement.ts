/**
 * PaperBook - Settlement Engine (Section 9)
 * Idempotent, leg-by-leg evaluation, accumulator compounding, void handling,
 * and settlement audit logging.
 */

import { Bet, Event, Leg, SettlementLogEntry, LedgerEntry } from '../types';
import { SPORT_PLUGINS } from '../sports/registry';
import { calculateReturn } from '../lib/money';

export interface SettlementBatchResult {
  settledBets: Bet[];
  newLedgerEntries: LedgerEntry[];
  logs: SettlementLogEntry[];
}

/**
 * Settles all eligible pending bets against updated event states.
 * IDEMPOTENT: Only pending bets are evaluated. Once marked won/lost/void, they cannot settle again.
 */
export function settlePendingBets(
  pendingBets: Bet[],
  eventsMap: Map<string, Event>,
  currentBalanceMinor: number
): SettlementBatchResult {
  const settledBets: Bet[] = [];
  const newLedgerEntries: LedgerEntry[] = [];
  const logs: SettlementLogEntry[] = [];
  let runningBalance = currentBalanceMinor;

  for (const bet of pendingBets) {
    if (bet.status !== 'pending') continue;

    let canSettleBet = true;
    const evaluatedLegs: Leg[] = [];

    for (const leg of bet.legs) {
      const event = eventsMap.get(leg.eventId);
      if (!event) {
        canSettleBet = false;
        evaluatedLegs.push(leg);
        continue;
      }

      // If leg was already settled (e.g. In multi-leg with earlier result)
      if (leg.result !== 'pending') {
        evaluatedLegs.push(leg);
        continue;
      }

      // Check if event is final or if it's a pre-match market that settled (like toss)
      const market = event.markets.find((m) => m.id === leg.marketId);
      if (!market) {
        canSettleBet = false;
        evaluatedLegs.push(leg);
        continue;
      }

      const plugin = SPORT_PLUGINS[event.sport];
      if (!plugin) {
        canSettleBet = false;
        evaluatedLegs.push(leg);
        continue;
      }

      const marketOutcome = plugin.settleMarket(market, event);
      if (marketOutcome.settled) {
        const legOutcome = marketOutcome.results[leg.selectionId] ?? 'pending';
        evaluatedLegs.push({
          ...leg,
          result: legOutcome,
        });
      } else {
        canSettleBet = false;
        evaluatedLegs.push(leg);
      }
    }

    if (!canSettleBet) {
      // Keep pending, but update any leg results that have already finished
      settledBets.push({
        ...bet,
        legs: evaluatedLegs,
      });
      continue;
    }

    // Now evaluate whole bet outcome
    const hasLostLeg = evaluatedLegs.some((l) => l.result === 'lost');
    const allVoid = evaluatedLegs.every((l) => l.result === 'void');

    if (hasLostLeg) {
      // Bet is lost
      const settledBet: Bet = {
        ...bet,
        legs: evaluatedLegs,
        status: 'lost',
        actualReturnMinor: 0,
        settledAt: Date.now(),
      };
      settledBets.push(settledBet);
      logs.push({
        id: `log_${Date.now()}_${bet.id}`,
        timestamp: Date.now(),
        betId: bet.id,
        outcome: 'lost',
        stakeMinor: bet.stakeMinor,
        payoutMinor: 0,
        details: `Accumulator/Single lost on leg evaluation.`,
      });
    } else if (allVoid) {
      // Full void refund
      runningBalance += bet.stakeMinor;
      const settledBet: Bet = {
        ...bet,
        legs: evaluatedLegs,
        status: 'void',
        actualReturnMinor: bet.stakeMinor,
        settledAt: Date.now(),
      };
      settledBets.push(settledBet);

      newLedgerEntries.push({
        id: `ledger_void_${bet.id}`,
        time: Date.now(),
        kind: 'void_refund',
        amountMinor: bet.stakeMinor,
        balanceAfterMinor: runningBalance,
        betId: bet.id,
        note: 'Full bet void - stake refunded',
      });

      logs.push({
        id: `log_${Date.now()}_${bet.id}`,
        timestamp: Date.now(),
        betId: bet.id,
        outcome: 'void',
        stakeMinor: bet.stakeMinor,
        payoutMinor: bet.stakeMinor,
        details: 'All legs void. Stake returned in full.',
      });
    } else {
      // Won (or won with partial void)
      let effectiveOdds = 1.0;
      for (const leg of evaluatedLegs) {
        if (leg.result === 'won') {
          effectiveOdds *= leg.oddsAtPlacement;
        } else if (leg.result === 'void') {
          effectiveOdds *= 1.0;
        }
      }

      const payoutMinor = calculateReturn(bet.stakeMinor, effectiveOdds);
      runningBalance += payoutMinor;

      const settledBet: Bet = {
        ...bet,
        legs: evaluatedLegs,
        status: 'won',
        actualReturnMinor: payoutMinor,
        settledAt: Date.now(),
      };
      settledBets.push(settledBet);

      newLedgerEntries.push({
        id: `ledger_win_${bet.id}`,
        time: Date.now(),
        kind: 'return',
        amountMinor: payoutMinor,
        balanceAfterMinor: runningBalance,
        betId: bet.id,
        note: `Bet Won (Odds: ${effectiveOdds.toFixed(2)})`,
      });

      logs.push({
        id: `log_${Date.now()}_${bet.id}`,
        timestamp: Date.now(),
        betId: bet.id,
        outcome: 'won',
        stakeMinor: bet.stakeMinor,
        payoutMinor,
        details: `Bet won at effective odds ${effectiveOdds.toFixed(2)}.`,
      });
    }
  }

  return {
    settledBets,
    newLedgerEntries,
    logs,
  };
}
