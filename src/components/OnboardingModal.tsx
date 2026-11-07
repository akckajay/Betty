/**
 * Onboarding Modal (Section 1 & 11)
 * 3 educational cards, 18+ confirmation, starting balance and currency selection.
 */

import React, { useState } from 'react';
import { ShieldCheck, BookOpen, Calculator, Check, ArrowRight, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWalletStore } from '../store/useWalletStore';
import { CONFIG, CurrencyCode } from '../config';
import { formatMoney } from '../lib/money';

export const OnboardingModal: React.FC = () => {
  const { settings, completeOnboarding } = useSettingsStore();
  const { resetBankroll } = useWalletStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmed18, setConfirmed18] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('INR');
  const [startingBalanceMajor, setStartingBalanceMajor] = useState<number>(10000);
  const [hasError, setHasError] = useState(false);

  if (settings.hasCompletedOnboarding && settings.hasConfirmed18Plus) {
    return null;
  }

  const handleFinish = () => {
    if (!confirmed18) {
      setHasError(true);
      return;
    }
    const balanceMinor = startingBalanceMajor * 100;
    completeOnboarding(selectedCurrency, balanceMinor);
    resetBankroll(balanceMinor);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl text-white flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-xs font-semibold text-gray-300">Welcome to PaperBook</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-6 h-1 rounded-full transition-colors ${
                  step === s ? 'bg-blue-500' : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card 1: What this is */}
        {step === 1 && (
          <div className="space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-100">Play-Money Betting Simulator</h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                PaperBook is an educational tool designed to demystify sports betting. You will practise with virtual credits on realistic fixtures and learn with exact numbers why the bookmaker wins over time.
              </p>
            </div>

            <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0" />
                <span>100% Fake Money. No deposits or withdrawals ever.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0" />
                <span>No real bookmaker logos, links, or marketing.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="w-4 h-4 shrink-0" />
                <span>Transparent odds math and margins exposed on every price.</span>
              </div>
            </div>
          </div>
        )}

        {/* Card 2: How Odds & Margins Really Work */}
        {step === 2 && (
          <div className="space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Calculator className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-100">How Odds &amp; Margins Work</h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                A fair coin toss has a 50% chance of Heads (true decimal odds of <strong>2.00</strong>).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[11px]">Fair Price</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">2.00 / 2.00</span>
                <span className="text-[10px] text-gray-500 block mt-1">Sum = 100% (No margin)</span>
              </div>
              <div className="p-3 bg-gray-950 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[11px]">Bookmaker Price</span>
                <span className="text-lg font-bold text-rose-400 tabular-nums">1.90 / 1.90</span>
                <span className="text-[10px] text-gray-500 block mt-1">Sum = 105.2% (House edge)</span>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-blue-950/30 p-3 rounded-xl border border-blue-900/40">
              At 1.90 odds, on average you lose about <strong>₹4.76</strong> on every ₹100 you bet, even if your picks are unbiased. In PaperBook, tap any odds button to see the house margin instantly.
            </p>
          </div>
        )}

        {/* Card 3: 18+ Confirmation & Bankroll Setup */}
        {step === 3 && (
          <div className="space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-100">Setup Your Practice Bankroll</h2>
              <p className="text-xs text-gray-400 mt-1">
                Customize your initial virtual bankroll and practice currency.
              </p>
            </div>

            {/* Currency selector */}
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Practice Currency
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCurrency(c)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                      selectedCurrency === c
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {CONFIG.currencies[c].symbol} {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Balance */}
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Starting Practice Credits
              </label>
              <input
                type="number"
                min="1000"
                max="100000"
                step="1000"
                value={startingBalanceMajor}
                onChange={(e) => setStartingBalanceMajor(parseInt(e.target.value) || 10000)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-sm font-bold text-white tabular-nums"
              />
              <span className="text-[11px] text-gray-500 block mt-1">
                Initial balance: {formatMoney(startingBalanceMajor * 100, selectedCurrency)} (Virtual only)
              </span>
            </div>

            {/* 18+ Mandatory Confirmation */}
            <div
              className={`p-3 rounded-xl border transition cursor-pointer ${
                confirmed18
                  ? 'bg-emerald-950/30 border-emerald-800/60'
                  : hasError
                  ? 'bg-rose-950/40 border-rose-700'
                  : 'bg-gray-950 border-gray-800'
              }`}
              onClick={() => {
                setConfirmed18(!confirmed18);
                setHasError(false);
              }}
            >
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={confirmed18}
                  onChange={(e) => {
                    setConfirmed18(e.target.checked);
                    setHasError(false);
                  }}
                  className="mt-0.5 rounded border-gray-700 text-blue-600 focus:ring-0"
                />
                <span className="text-gray-200 font-medium">
                  I confirm I am 18 years of age or older. I understand this app uses exclusively virtual practice credits for education.
                </span>
              </label>
            </div>

            {hasError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Please confirm you are 18+ to proceed.</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 pt-3 border-t border-gray-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md touch-target"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg touch-target"
            >
              Start Practicing
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
