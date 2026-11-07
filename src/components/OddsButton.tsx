/**
 * OddsButton Component (Section 5.4 & 14)
 * Consistent button showing label on left and odds on right in tabular monospace.
 * Supports info icon click or long press to trigger educational breakdown.
 * Locked state when suspended.
 */

import React, { useState, useRef } from 'react';
import { Lock, Info } from 'lucide-react';
import { Selection, Market } from '../types';
import { useSlipStore } from '../store/useSlipStore';
import { OddsEducationModal } from './OddsEducationModal';

interface Props {
  eventId: string;
  eventTitle: string;
  market: Market;
  selection: Selection;
  compact?: boolean;
}

export const OddsButton: React.FC<Props> = ({
  eventId,
  eventTitle,
  market,
  selection,
  compact = false,
}) => {
  const [showEducation, setShowEducation] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { selections, addOrRemoveSelection } = useSlipStore();
  const isSelected = selections.some(
    (s) => s.selectionId === selection.id && s.marketId === market.id && s.eventId === eventId
  );
  const isSuspended = market.status === 'suspended';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSuspended) return;
    addOrRemoveSelection({
      eventId,
      eventTitle,
      marketId: market.id,
      marketName: market.name,
      selectionId: selection.id,
      selectionLabel: selection.label,
      oddsAtPlacement: selection.odds,
      fairProbAtPlacement: selection.fairProbability,
    });
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEducation(true);
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowEducation(true);
    }, 600); // 600ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${selection.label} at odds ${selection.odds.toFixed(2)}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowEducation(true);
        }}
        className={`group relative flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl transition-all select-none touch-target border text-left cursor-pointer ${
          isSuspended
            ? 'bg-gray-900/40 border-gray-800 text-gray-500 cursor-not-allowed opacity-60'
            : isSelected
            ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/40'
            : 'bg-gray-800/80 hover:bg-gray-800 border-gray-700/60 hover:border-gray-600 text-gray-200'
        } ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-1">
          <span className="truncate font-medium">{selection.label}</span>
          <button
            type="button"
            onClick={handleInfoClick}
            className={`p-1 rounded-full opacity-60 hover:opacity-100 transition shrink-0 ${
              isSelected ? 'text-white hover:bg-blue-700' : 'text-gray-400 hover:bg-gray-700'
            }`}
            title="View fair odds and bookmaker margin"
            aria-label="View odds mathematics"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0 font-bold tabular-nums">
          {isSuspended ? (
            <Lock className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <span>{selection.odds.toFixed(2)}</span>
          )}
        </div>
      </div>

      {showEducation && (
        <OddsEducationModal
          selectionLabel={selection.label}
          marketName={market.name}
          offeredOdds={selection.odds}
          fairProbability={selection.fairProbability}
          margin={market.margin}
          onClose={() => setShowEducation(false)}
        />
      )}
    </>
  );
};
