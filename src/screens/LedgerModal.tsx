/**
 * Ledger Modal (Section 10)
 * Displays complete transaction ledger of the practice wallet:
 * stakes, payouts, void refunds, resets, and running balances.
 */

import React from 'react';
import { X, ArrowDownRight, ArrowUpRight, RotateCcw, Wallet } from 'lucide-react';
import { useWalletStore } from '../store/useWalletStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatMoney } from '../lib/money';
import { formatDateTimeFull } from '../lib/dates';

interface Props {
  onClose: () => void;
}

export const LedgerModal: React.FC<Props> = ({ onClose }) => {
  const { ledger, balanceMinor, bankrollResetsCount } = useWalletStore();
  const { settings } = useSettingsStore();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl text-white flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-100">Bankroll Ledger</h3>
              <span className="text-[10px] text-gray-500">
                Audited transaction history
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 touch-target flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Summary */}
        <div className="mt-3 p-3.5 bg-gray-950 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block">Current Balance</span>
            <span className="text-xl font-black text-emerald-400 tabular-nums">
              {formatMoney(balanceMinor, settings.currency)}
            </span>
          </div>

          {bankrollResetsCount > 0 && (
            <div className="text-right">
              <span className="text-[10px] text-amber-400 font-semibold block">
                Total Resets: {bankrollResetsCount}
              </span>
              <span className="text-[10px] text-gray-500">Lesson of ruin visible</span>
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div className="mt-3 overflow-y-auto space-y-2 flex-1 pr-1">
          {ledger.map((entry) => {
            const isStake = entry.kind === 'stake';
            const isReturn = entry.kind === 'return' || entry.kind === 'cash_out';
            const isReset = entry.kind === 'reset' || entry.kind === 'start_balance';
            const isVoid = entry.kind === 'void_refund';

            return (
              <div
                key={entry.id}
                className="p-2.5 bg-gray-950/60 border border-gray-800/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isReturn
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : isStake
                        ? 'bg-rose-500/10 text-rose-400'
                        : isReset
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {isReturn ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : isStake ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : isReset ? (
                      <RotateCcw className="w-3.5 h-3.5" />
                    ) : (
                      <Wallet className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-gray-200 block truncate max-w-[170px]">
                      {entry.note || entry.kind}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatDateTimeFull(entry.time)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-bold tabular-nums block ${
                      isReturn
                        ? 'text-emerald-400'
                        : isStake
                        ? 'text-rose-400'
                        : 'text-gray-200'
                    }`}
                  >
                    {entry.amountMinor > 0 ? '+' : ''}
                    {formatMoney(entry.amountMinor, settings.currency)}
                  </span>
                  <span className="text-[10px] text-gray-500 tabular-nums">
                    Bal: {formatMoney(entry.balanceAfterMinor, settings.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold touch-target"
        >
          Close Ledger
        </button>
      </div>
    </div>
  );
};
