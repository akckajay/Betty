/**
 * Application Header
 * Features:
 * - Permanent "Play money. Practice only." compliance label
 * - Live auto-sync indicator with one-tap refresh button
 * - Real-time practice balance
 * - Reset count badge
 */

import React from 'react';
import { ShieldAlert, RefreshCw, Wallet, Radio } from 'lucide-react';
import { useWalletStore } from '../store/useWalletStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useEventsStore } from '../store/useEventsStore';
import { formatMoney } from '../lib/money';
import { CONFIG } from '../config';

interface Props {
  onOpenLedger?: () => void;
}

export const Header: React.FC<Props> = ({ onOpenLedger }) => {
  const { balanceMinor, bankrollResetsCount } = useWalletStore();
  const { settings } = useSettingsStore();
  const { loadEvents, isLoading, lastUpdated } = useEventsStore();

  const handleManualSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    loadEvents(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/80 px-3.5 py-2">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & Mandatory Play-Money Badge */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-pulse"></span>
              PaperBook
            </span>
            {bankrollResetsCount > 0 && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                title="Number of times your bankroll was reset after ruin"
              >
                Resets: {bankrollResetsCount}
              </span>
            )}
          </div>
          {/* Non-negotiable mandatory label */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] tracking-wide text-amber-400/90 font-medium flex items-center gap-1">
              <ShieldAlert className="w-2.5 h-2.5 inline" />
              {CONFIG.playMoneyDisclaimer}
            </span>

            {/* Live Sync Status & Manual Tap Button */}
            <button
              type="button"
              onClick={handleManualSync}
              className="flex items-center gap-1 text-[9px] text-emerald-400/90 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/40 px-1.5 py-0.5 rounded-full transition"
              title="Real-time live sync every 15s. Click to refresh now."
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Live Sync</span>
            </button>
          </div>
        </div>

        {/* Practice Wallet Balance */}
        <button
          onClick={onOpenLedger}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition touch-target text-right group"
          title="Click to view bankroll ledger"
          aria-label="View bankroll ledger"
        >
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 group-hover:text-blue-400 transition font-medium">
              Practice Balance
            </span>
            <span className="text-sm font-bold tabular-nums text-emerald-400">
              {formatMoney(balanceMinor, settings.currency)}
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </header>
  );
};
