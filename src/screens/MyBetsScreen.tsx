/**
 * My Bets Screen (Section 9, 10 & 11)
 * Displays open and settled bets, leg-by-leg outcomes, cash-out quotes with margin breakdown,
 * "So close" accumulator lessons, and a mock settlement trigger.
 */

import React, { useState } from 'react';
import { useBetsStore } from '../store/useBetsStore';
import { useEventsStore } from '../store/useEventsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatMoney } from '../lib/money';
import { computeCashOutValue } from '../engine/cashout';
import { formatDateTimeFull } from '../lib/dates';
import { Bet } from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Coins,
  AlertCircle,
} from 'lucide-react';

export const MyBetsScreen: React.FC = () => {
  const { bets, cashOutBet } = useBetsStore();
  const { events, triggerSettlementCheck } = useEventsStore();
  const { settings } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'open' | 'settled' | 'cashout'>('open');
  const [cashOutConfirmBet, setCashOutConfirmBet] = useState<{
    bet: Bet;
    quote: ReturnType<typeof computeCashOutValue>;
  } | null>(null);

  const openBets = bets.filter((b) => b.status === 'pending');
  const settledBets = bets.filter((b) => b.status !== 'pending');

  // Filter bets with cash out
  const cashOutBets = openBets.filter((bet) => {
    const quote = computeCashOutValue(bet, new Map());
    return quote.available;
  });

  const displayedBets =
    activeTab === 'open' ? openBets : activeTab === 'settled' ? settledBets : cashOutBets;

  const handleCashOut = (bet: Bet) => {
    const quote = computeCashOutValue(bet, new Map());
    if (quote.available) {
      setCashOutConfirmBet({ bet, quote });
    }
  };

  const confirmCashOut = () => {
    if (cashOutConfirmBet) {
      cashOutBet(cashOutConfirmBet.bet.id, cashOutConfirmBet.quote.amountMinor);
      setCashOutConfirmBet(null);
    }
  };

  return (
    <div className="pb-32 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Screen Title & Manual Settle Button for Testing */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-100">My Practice Bets</h2>
          <span className="text-[11px] text-gray-500">
            {bets.length} total placed bets
          </span>
        </div>

        {/* Quick settle trigger */}
        <button
          onClick={triggerSettlementCheck}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs text-blue-400 font-semibold transition touch-target"
          title="Evaluate pending bets against final match results"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Check Results</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 p-1 bg-gray-950 rounded-2xl border border-gray-800">
        <button
          onClick={() => setActiveTab('open')}
          className={`py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'open'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Open ({openBets.length})
        </button>
        <button
          onClick={() => setActiveTab('settled')}
          className={`py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'settled'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Settled ({settledBets.length})
        </button>
        <button
          onClick={() => setActiveTab('cashout')}
          className={`py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'cashout'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Cash Out ({cashOutBets.length})
        </button>
      </div>

      {/* Bets List */}
      {displayedBets.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6">
          <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-300">
            No {activeTab} bets
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === 'open'
              ? 'Select odds on any match to place your first practice bet.'
              : 'Settled bets and lessons will appear here once matches conclude.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedBets.map((bet) => {
            const isWon = bet.status === 'won';
            const isLost = bet.status === 'lost';
            const isVoid = bet.status === 'void';
            const isCashedOut = bet.status === 'cashed_out';
            const isPending = bet.status === 'pending';

            const cashOutQuote = isPending ? computeCashOutValue(bet, new Map()) : null;

            // Check if accumulator lost by just 1 leg ("So close" lesson)
            const lostLegs = bet.legs.filter((l) => l.result === 'lost');
            const isSoClose = bet.type === 'accumulator' && lostLegs.length === 1 && bet.legs.length >= 3;

            return (
              <div
                key={bet.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 space-y-3 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-200 capitalize">
                      {bet.type === 'system' ? `${bet.systemType} System` : bet.type}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      Odds: {bet.combinedOdds.toFixed(2)}
                    </span>
                  </div>

                  {/* Status chip */}
                  <div className="flex items-center gap-1.5">
                    {isWon && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        WON
                      </span>
                    )}
                    {isLost && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/50 border border-rose-800/50 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3.5 h-3.5" />
                        LOST
                      </span>
                    )}
                    {isVoid && (
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                        VOID (Refunded)
                      </span>
                    )}
                    {isCashedOut && (
                      <span className="text-[11px] font-bold text-blue-400 bg-blue-950/50 border border-blue-800 px-2 py-0.5 rounded-full">
                        CASHED OUT
                      </span>
                    )}
                    {isPending && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                {/* Legs Breakdown */}
                <div className="space-y-2">
                  {bet.legs.map((leg, idx) => {
                    const legWon = leg.result === 'won';
                    const legLost = leg.result === 'lost';
                    const legVoid = leg.result === 'void';

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          legLost
                            ? 'bg-rose-950/20 border-rose-800/40'
                            : legWon
                            ? 'bg-emerald-950/20 border-emerald-800/40'
                            : legVoid
                            ? 'bg-gray-800/30 border-gray-700/40'
                            : 'bg-gray-950/60 border-gray-800/60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-[11px] text-gray-400 truncate">{leg.eventTitle}</div>
                          <div className="font-semibold text-gray-100">{leg.selectionLabel}</div>
                          <div className="text-[10px] text-gray-500">{leg.marketName}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-gray-300">
                            {leg.oddsAtPlacement.toFixed(2)}
                          </span>
                          <div className="mt-0.5">
                            {legWon && <span className="text-[10px] font-bold text-emerald-400">WON</span>}
                            {legLost && <span className="text-[10px] font-bold text-rose-400">LOST</span>}
                            {legVoid && <span className="text-[10px] font-bold text-gray-400">VOID</span>}
                            {leg.result === 'pending' && (
                              <span className="text-[10px] text-amber-400">Open</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* "So close" educational footnote for 1-leg lost accas */}
                {isSoClose && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>The "So Close" Psychological Trap</span>
                    </div>
                    <p className="text-[10px] text-amber-200/90 leading-relaxed">
                      This accumulator was 1 leg away from winning {formatMoney(bet.potentialReturnMinor, settings.currency)}. In betting, near-misses trigger the same dopamine as wins, keeping players betting despite large negative expected value.
                    </p>
                  </div>
                )}

                {/* Financial Details */}
                <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px]">STAKE</span>
                    <span className="font-bold tabular-nums text-gray-300">
                      {formatMoney(bet.stakeMinor, settings.currency)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-500 block text-[10px]">
                      {isPending ? 'POTENTIAL RETURN' : 'RETURN'}
                    </span>
                    <span
                      className={`font-bold tabular-nums text-sm ${
                        isWon
                          ? 'text-emerald-400'
                          : isLost
                          ? 'text-gray-500 line-through'
                          : 'text-blue-400'
                      }`}
                    >
                      {formatMoney(
                        isPending ? bet.potentialReturnMinor : bet.actualReturnMinor,
                        settings.currency
                      )}
                    </span>
                  </div>
                </div>

                {/* Cash Out Button */}
                {isPending && cashOutQuote && cashOutQuote.available && (
                  <div className="pt-2 border-t border-gray-800">
                    <button
                      onClick={() => handleCashOut(bet)}
                      className="w-full py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-between px-3 touch-target"
                    >
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-blue-200" />
                        <span>Cash Out Available</span>
                      </div>
                      <span className="font-mono tabular-nums text-sm font-black">
                        {formatMoney(cashOutQuote.amountMinor, settings.currency)}
                      </span>
                    </button>
                    <span className="text-[10px] text-gray-500 block mt-1 text-center">
                      Fair value: {formatMoney(cashOutQuote.fairValueMinor, settings.currency)} (House takes {cashOutQuote.cashOutMarginPercent}%)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cash Out Confirmation Modal */}
      {cashOutConfirmBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 max-w-sm w-full text-white shadow-2xl">
            <h3 className="text-base font-bold text-gray-100">Confirm Cash Out</h3>
            <p className="text-xs text-gray-400 mt-1">
              Close this bet early and lock in practice profit or loss.
            </p>

            <div className="mt-4 p-3 bg-gray-950 rounded-xl border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Offered Cash Out:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {formatMoney(cashOutConfirmBet.quote.amountMinor, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">True Fair Value:</span>
                <span className="text-gray-400 font-mono">
                  {formatMoney(cashOutConfirmBet.quote.fairValueMinor, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-amber-400">
                <span>Bookmaker Fee:</span>
                <span className="font-mono">
                  -{formatMoney(cashOutConfirmBet.quote.marginTakenMinor, settings.currency)} ({cashOutConfirmBet.quote.cashOutMarginPercent}%)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
              <strong>The Lesson:</strong> Just like pre-match bets, the bookmaker takes a 8% margin when you cash out early, guaranteeing house edge both coming and going.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setCashOutConfirmBet(null)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs touch-target"
              >
                Keep Bet Open
              </button>
              <button
                onClick={confirmCashOut}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs touch-target"
              >
                Accept Cash Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
