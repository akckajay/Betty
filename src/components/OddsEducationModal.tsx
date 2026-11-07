/**
 * Odds Educational Modal (Section 5.4)
 * Shows the fair price, the offered price, the bookmaker margin %,
 * and the exact sentence: "On average you lose about X on every 100 you stake here."
 */

import React from 'react';
import { X, HelpCircle, AlertCircle } from 'lucide-react';
import { getOddsEducationalBreakdown } from '../engine/odds';

interface Props {
  selectionLabel: string;
  marketName: string;
  offeredOdds: number;
  fairProbability: number;
  margin: number;
  onClose: () => void;
}

export const OddsEducationModal: React.FC<Props> = ({
  selectionLabel,
  marketName,
  offeredOdds,
  fairProbability,
  margin,
  onClose,
}) => {
  const breakdown = getOddsEducationalBreakdown(offeredOdds, fairProbability, margin);
  const fairOdds = (1 / fairProbability).toFixed(2);
  const fairPercent = (fairProbability * 100).toFixed(1);
  const impliedOfferedPercent = ((1 / offeredOdds) * 100).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-800 p-5 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold">How These Odds Work</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 touch-target flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3">
          <div className="text-xs text-gray-400">{marketName}</div>
          <div className="text-lg font-bold text-gray-100">{selectionLabel}</div>
        </div>

        {/* Comparison grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="p-3 rounded-xl bg-gray-800/80 border border-gray-700/50">
            <span className="text-xs text-gray-400">Fair Price</span>
            <div className="text-xl font-bold tabular-nums text-emerald-400 mt-0.5">{fairOdds}</div>
            <span className="text-[11px] text-gray-500">True win: {fairPercent}%</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-800/80 border border-gray-700/50">
            <span className="text-xs text-gray-400">Offered Price</span>
            <div className="text-xl font-bold tabular-nums text-blue-400 mt-0.5">{offeredOdds.toFixed(2)}</div>
            <span className="text-[11px] text-gray-500">Implies: {impliedOfferedPercent}%</span>
          </div>
        </div>

        {/* The Math Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-blue-300">
                Bookmaker Margin: {breakdown.marginPercent}%
              </div>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                {breakdown.explanation}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-[11px] text-gray-400 leading-relaxed bg-gray-950/50 p-3 rounded-lg border border-gray-800">
          <strong>The Lesson:</strong> The bookmaker reduces true decimal odds from {fairOdds} down to {offeredOdds.toFixed(2)} so that across all players, the house keeps an edge over time.
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl text-sm transition touch-target flex items-center justify-center"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
