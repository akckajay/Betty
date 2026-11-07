/**
 * Bet Slip Component (Section 8 & 5.5)
 * Bottom-sheet drawer with sticky summary pill, Singles / Accumulator / System tabs,
 * mathematical transparency ("Wins about 1 in N", expected loss %), validation against bankroll,
 * and conflict warnings.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useSlipStore, SlipTab } from '../store/useSlipStore';
import { useWalletStore } from '../store/useWalletStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useBetsStore } from '../store/useBetsStore';
import { formatMoney, minorToMajor, majorToMinor, calculateReturn } from '../lib/money';
import { CONFIG } from '../config';
import { analyzeAccumulator } from '../engine/odds';
import { validateAccumulatorLegs } from '../engine/accumulator';
import { SYSTEM_BET_DEFINITIONS, generateSystemLines } from '../engine/system-bets';
import { Bet, SystemBetType } from '../types';

interface Props {
  onViewMyBets: () => void;
}

export const BetSlip: React.FC<Props> = ({ onViewMyBets }) => {
  const {
    isOpen,
    toggleOpen,
    activeTab,
    setActiveTab,
    selections,
    removeSelection,
    setSingleStake,
    accumulatorStakeMinor,
    setAccumulatorStake,
    systemType,
    setSystemType,
    systemStakePerLineMinor,
    setSystemStakePerLine,
    clearSlip,
    conflictMessage,
    clearConflict,
  } = useSlipStore();

  const { balanceMinor } = useWalletStore();
  const { settings } = useSettingsStore();
  const { placeBet, bets } = useBetsStore();

  const [placedBetRef, setPlacedBetRef] = useState<string | null>(null);

  if (selections.length === 0 && !placedBetRef) {
    return null;
  }

  // Accumulator analysis
  const accAnalysis = analyzeAccumulator(
    selections.map((s) => ({ odds: s.oddsAtPlacement, fairProb: s.fairProbAtPlacement }))
  );
  const accValidation = validateAccumulatorLegs(selections);

  // Singles total stake and potential return
  const singlesTotalStake = selections.reduce((sum, s) => sum + s.stakeMinor, 0);
  const singlesTotalPotentialReturn = selections.reduce(
    (sum, s) => sum + calculateReturn(s.stakeMinor, s.oddsAtPlacement),
    0
  );

  // System bet setup
  const systemDef = SYSTEM_BET_DEFINITIONS[systemType];
  const systemLines = generateSystemLines(systemType, selections);
  const totalSystemLines = systemLines.length;
  const totalSystemStake = totalSystemLines * systemStakePerLineMinor;

  // Validation
  const openBetsCount = bets.filter((b) => b.status === 'pending').length;
  const isOverMaxOpenBets = openBetsCount >= CONFIG.maxOpenBets;

  let canPlace = true;
  let validationError: string | null = null;

  if (isOverMaxOpenBets) {
    canPlace = false;
    validationError = `Maximum ${CONFIG.maxOpenBets} open bets allowed at one time.`;
  }

  if (activeTab === 'singles') {
    if (singlesTotalStake > balanceMinor) {
      canPlace = false;
      validationError = 'Total stake exceeds practice balance.';
    } else if (singlesTotalStake < CONFIG.minStakeMinor) {
      canPlace = false;
      validationError = `Minimum stake is ${formatMoney(CONFIG.minStakeMinor, settings.currency)}.`;
    }
  } else if (activeTab === 'accumulator') {
    if (!accValidation.isValid) {
      canPlace = false;
      validationError = accValidation.errors[0];
    } else if (accumulatorStakeMinor > balanceMinor) {
      canPlace = false;
      validationError = 'Stake exceeds practice balance.';
    } else if (accumulatorStakeMinor < CONFIG.minStakeMinor) {
      canPlace = false;
      validationError = `Minimum stake is ${formatMoney(CONFIG.minStakeMinor, settings.currency)}.`;
    }
  } else if (activeTab === 'system') {
    if (selections.length < systemDef.minSelections) {
      canPlace = false;
      validationError = `${systemDef.name} requires at least ${systemDef.minSelections} selections.`;
    } else if (totalSystemStake > balanceMinor) {
      canPlace = false;
      validationError = 'Total system stake exceeds practice balance.';
    } else if (systemStakePerLineMinor < CONFIG.minStakeMinor) {
      canPlace = false;
      validationError = `Minimum stake per line is ${formatMoney(CONFIG.minStakeMinor, settings.currency)}.`;
    }
  }

  const handlePlaceBet = () => {
    if (!canPlace) return;

    if (activeTab === 'singles') {
      // Place each single bet
      for (const sel of selections) {
        if (sel.stakeMinor <= 0) continue;
        const betId = `PB_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        const newBet: Bet = {
          id: betId,
          createdAt: Date.now(),
          stakeMinor: sel.stakeMinor,
          type: 'single',
          legs: [sel],
          combinedOdds: sel.oddsAtPlacement,
          trueWinProbability: sel.fairProbAtPlacement,
          status: 'pending',
          potentialReturnMinor: calculateReturn(sel.stakeMinor, sel.oddsAtPlacement),
          actualReturnMinor: 0,
          oddsAtPlacement: sel.oddsAtPlacement,
          fairProbabilityAtPlacement: sel.fairProbAtPlacement,
        };
        placeBet(newBet);
      }
      setPlacedBetRef(`Placed ${selections.length} Single Bet(s)`);
      clearSlip();
    } else if (activeTab === 'accumulator') {
      const betId = `PB_ACC_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const newBet: Bet = {
        id: betId,
        createdAt: Date.now(),
        stakeMinor: accumulatorStakeMinor,
        type: 'accumulator',
        legs: selections,
        combinedOdds: accAnalysis.combinedOdds,
        trueWinProbability: accAnalysis.trueWinChance,
        status: 'pending',
        potentialReturnMinor: calculateReturn(accumulatorStakeMinor, accAnalysis.combinedOdds),
        actualReturnMinor: 0,
        oddsAtPlacement: accAnalysis.combinedOdds,
        fairProbabilityAtPlacement: accAnalysis.trueWinChance,
      };
      placeBet(newBet);
      setPlacedBetRef(betId);
      clearSlip();
    } else if (activeTab === 'system') {
      const betId = `PB_SYS_${Date.now().toString(36).toUpperCase()}`;
      const maxReturn = systemLines.reduce((sum, line) => {
        const lineOdds = line.reduce((prod, l) => prod * l.oddsAtPlacement, 1.0);
        return sum + calculateReturn(systemStakePerLineMinor, lineOdds);
      }, 0);

      const newBet: Bet = {
        id: betId,
        createdAt: Date.now(),
        stakeMinor: totalSystemStake,
        type: 'system',
        systemType,
        linesCount: totalSystemLines,
        stakePerLineMinor: systemStakePerLineMinor,
        legs: selections,
        combinedOdds: 1.0,
        trueWinProbability: 0.5,
        status: 'pending',
        potentialReturnMinor: maxReturn,
        actualReturnMinor: 0,
        oddsAtPlacement: 1.0,
        fairProbabilityAtPlacement: 0.5,
      };
      placeBet(newBet);
      setPlacedBetRef(betId);
      clearSlip();
    }
  };

  return (
    <>
      {/* Placed Bet Confirmation Dialog */}
      {placedBetRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-100">Practice Bet Placed</h3>
            <p className="text-xs text-gray-400 mt-1">
              Ref: <span className="font-mono text-gray-200">{placedBetRef}</span>
            </p>
            <p className="text-xs text-gray-400 mt-2 bg-gray-950/60 p-2.5 rounded-lg border border-gray-800">
              No real money is ever at stake. Watch results settle automatically in My Bets.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPlacedBetRef(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-xl text-xs touch-target"
              >
                Keep Browsing
              </button>
              <button
                onClick={() => {
                  setPlacedBetRef(null);
                  onViewMyBets();
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs touch-target"
              >
                View in My Bets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Slip Bar (when closed) */}
      {!isOpen && (
        <div className="fixed bottom-14 left-0 right-0 z-30 px-3 py-2 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => toggleOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center justify-between touch-target border border-blue-400/30 transition-transform active:scale-98"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 text-xs font-bold flex items-center justify-center tabular-nums">
                  {selections.length}
                </span>
                <span className="font-semibold text-sm">Bet Slip</span>
              </div>

              <div className="flex items-center gap-2">
                {selections.length > 1 && (
                  <span className="text-xs font-mono bg-blue-700/60 px-2 py-0.5 rounded-lg">
                    Odds: {accAnalysis.combinedOdds.toFixed(2)}
                  </span>
                )}
                <ChevronUp className="w-5 h-5 text-blue-200" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Expanded Slip Drawer (Bottom Sheet) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md mx-auto bg-gray-900 border-t border-gray-800 rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 touch-target flex items-center justify-center"
                  aria-label="Minimize slip"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-gray-100">Bet Slip</span>
                  <span className="text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/40">
                    {selections.length} {selections.length === 1 ? 'selection' : 'selections'}
                  </span>
                </div>
              </div>

              <button
                onClick={clearSlip}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded hover:bg-gray-800 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            {/* Conflict Notification Banner */}
            {conflictMessage && (
              <div className="p-2.5 bg-amber-950/40 border-b border-amber-800/40 flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{conflictMessage}</span>
                </div>
                <button
                  onClick={clearConflict}
                  className="text-amber-400 underline ml-2 shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Tab Selectors (Singles, Accumulator, System) */}
            <div className="grid grid-cols-3 p-1.5 mx-3 mt-2 bg-gray-950 rounded-xl border border-gray-800/80">
              <button
                onClick={() => setActiveTab('singles')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'singles'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Singles
              </button>
              <button
                onClick={() => setActiveTab('accumulator')}
                disabled={selections.length < 2}
                className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'accumulator'
                    ? 'bg-blue-600 text-white shadow'
                    : selections.length < 2
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Accumulator
              </button>
              <button
                onClick={() => setActiveTab('system')}
                disabled={selections.length < 3}
                className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'system'
                    ? 'bg-blue-600 text-white shadow'
                    : selections.length < 3
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                System
              </button>
            </div>

            {/* Selections List */}
            <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
              {selections.map((leg) => {
                const potentialReturn = calculateReturn(leg.stakeMinor, leg.oddsAtPlacement);
                return (
                  <div
                    key={leg.selectionId}
                    className="p-3 bg-gray-950/80 border border-gray-800/90 rounded-xl relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="pr-6">
                        <div className="text-xs text-gray-400 truncate">{leg.eventTitle}</div>
                        <div className="text-sm font-bold text-gray-100 mt-0.5">
                          {leg.selectionLabel}
                        </div>
                        <div className="text-[11px] text-gray-500">{leg.marketName}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold tabular-nums text-blue-400 font-mono">
                          {leg.oddsAtPlacement.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeSelection(leg.selectionId)}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400 rounded transition"
                        aria-label="Remove selection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Singles stake input */}
                    {activeTab === 'singles' && (
                      <div className="mt-2.5 pt-2 border-t border-gray-800/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">Stake:</span>
                          <input
                            type="number"
                            min="10"
                            value={minorToMajor(leg.stakeMinor, settings.currency)}
                            onChange={(e) =>
                              setSingleStake(
                                leg.selectionId,
                                majorToMinor(parseFloat(e.target.value) || 0, settings.currency)
                              )
                            }
                            className="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-700 text-xs text-white font-mono text-right"
                          />
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-gray-500">To return: </span>
                          <span className="text-xs font-bold tabular-nums text-emerald-400">
                            {formatMoney(potentialReturn, settings.currency)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Accumulator Details & Lesson Panel */}
              {activeTab === 'accumulator' && (
                <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">Combined Odds</span>
                    <span className="text-sm font-bold tabular-nums text-blue-400 font-mono">
                      {accAnalysis.combinedOdds.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">True Win Chance</span>
                    <span className="font-semibold text-gray-200">
                      Wins about 1 in {accAnalysis.oneInNTimes} times
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Expected Loss</span>
                    <span className="font-semibold text-rose-400">
                      ~{accAnalysis.expectedLossPer100}% of stake
                    </span>
                  </div>

                  {selections.length >= 6 && (
                    <div className="text-[11px] p-2 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-200">
                      <strong>Compounding Margin Alert:</strong> At {selections.length} legs, the bookmaker's margin compounds heavily. Long accumulators are almost guaranteed negative expectation over time.
                    </div>
                  )}

                  {/* Stake input */}
                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-medium">Accumulator Stake:</span>
                    <input
                      type="number"
                      min="10"
                      value={minorToMajor(accumulatorStakeMinor, settings.currency)}
                      onChange={(e) =>
                        setAccumulatorStake(
                          majorToMinor(parseFloat(e.target.value) || 0, settings.currency)
                        )
                      }
                      className="w-24 px-2 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white font-mono text-right"
                    />
                  </div>

                  {/* Quick Stake Chips */}
                  <div className="flex gap-1.5 pt-1">
                    {[10, 50, 100, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAccumulatorStake(majorToMinor(amt, settings.currency))}
                        className="flex-1 py-1 text-[11px] font-medium bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-xs">
                    <span className="text-gray-400">Potential Return:</span>
                    <span className="text-sm font-bold tabular-nums text-emerald-400">
                      {formatMoney(
                        calculateReturn(accumulatorStakeMinor, accAnalysis.combinedOdds),
                        settings.currency
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* System Bet Details */}
              {activeTab === 'system' && (
                <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">System Type:</span>
                    <select
                      value={systemType}
                      onChange={(e) => setSystemType(e.target.value as SystemBetType)}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white"
                    >
                      {Object.entries(SYSTEM_BET_DEFINITIONS).map(([key, def]) => {
                        if (def.minSelections <= selections.length && def.totalBets > 0) {
                          return (
                            <option key={key} value={key}>
                              {def.name} ({def.totalBets} bets)
                            </option>
                          );
                        }
                        return null;
                      })}
                    </select>
                  </div>

                  <div className="text-[11px] text-gray-400">{systemDef.description}</div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
                    <span className="text-xs text-gray-300">Stake per line:</span>
                    <input
                      type="number"
                      min="10"
                      value={minorToMajor(systemStakePerLineMinor, settings.currency)}
                      onChange={(e) =>
                        setSystemStakePerLine(
                          majorToMinor(parseFloat(e.target.value) || 0, settings.currency)
                        )
                      }
                      className="w-24 px-2 py-1 rounded bg-gray-900 border border-gray-700 text-xs text-white font-mono text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Total lines: {totalSystemLines}</span>
                    <span>
                      Total stake: {formatMoney(totalSystemStake, settings.currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Slip Footer & Action Button */}
            <div className="p-3.5 border-t border-gray-800 bg-gray-950 safe-bottom">
              {validationError && (
                <div className="mb-2 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-2.5 text-xs text-gray-400">
                <span>Total Stake:</span>
                <span className="font-bold text-gray-200 tabular-nums">
                  {formatMoney(
                    activeTab === 'singles'
                      ? singlesTotalStake
                      : activeTab === 'accumulator'
                      ? accumulatorStakeMinor
                      : totalSystemStake,
                    settings.currency
                  )}
                </span>
              </div>

              <button
                onClick={handlePlaceBet}
                disabled={!canPlace}
                className={`w-full py-3 rounded-xl font-bold text-sm transition touch-target flex items-center justify-center gap-2 shadow-lg ${
                  canPlace
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 cursor-pointer active:scale-98'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Place Practice Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
