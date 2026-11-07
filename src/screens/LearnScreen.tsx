/**
 * Learn Screen (Section 12 preview)
 * Lessons on odds, implied probability, accumulators, Kelly criterion,
 * plus interactive odds converter and margin calculator.
 */

import React, { useState } from 'react';
import { BookOpen, Calculator, HelpCircle, ArrowRight } from 'lucide-react';
import { calculateSingleLossPer100 } from '../engine/odds';

export const LearnScreen: React.FC = () => {
  const [calcOdds, setCalcOdds] = useState<number>(2.0);
  const [calcMargin, setCalcMargin] = useState<number>(5.0);

  const impliedProb = calcOdds > 0 ? (1 / calcOdds) * 100 : 0;
  const lossPer100 = calculateSingleLossPer100(calcMargin / 100);

  const lessons = [
    {
      title: '1. How Odds Really Work',
      tag: 'Foundations',
      summary:
        'Decimal odds reflect the payout multiplier per unit staked. Implied probability is 1 / odds.',
    },
    {
      title: '2. The Bookmaker Margin (Overround)',
      tag: 'Mathematics',
      summary:
        'A bookmaker prices all outcomes above 100% total probability to guarantee long-term theoretical profit.',
    },
    {
      title: '3. Why Accumulators Compound Losses',
      tag: 'Critical Concept',
      summary:
        'Every added leg multiplies the house edge. A 5-leg accumulator at 5% margin per leg loses ~21.6% of your stake on average.',
    },
    {
      title: '4. System Bets (Trixie, Yankee, Heinz)',
      tag: 'Structures',
      summary:
        'Full-cover bets divide stake across multiple combinations so you can still win even if 1 leg fails.',
    },
    {
      title: '5. Expected Value & Bankroll Ruin',
      tag: 'Strategy',
      summary:
        'Without a verifiable statistical edge, flat staking, martingale, or arbitrary bet sizing always leads to negative expectation.',
    },
  ];

  return (
    <div className="pb-32 max-w-md mx-auto px-4 pt-3 space-y-4 text-white">
      <div>
        <h2 className="text-lg font-bold text-gray-100">Betting Mathematics Academy</h2>
        <span className="text-[11px] text-gray-500">
          Learn how bookmakers price odds, compound margins, and protect your bankroll
        </span>
      </div>

      {/* Interactive Quick Calculator Card */}
      <div className="p-4 bg-gradient-to-br from-blue-950/40 to-gray-900 border border-blue-900/40 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
          <Calculator className="w-4 h-4 text-blue-400" />
          <span>Interactive Odds &amp; Margin Calculator</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Decimal Odds</label>
            <input
              type="number"
              step="0.05"
              min="1.01"
              value={calcOdds}
              onChange={(e) => setCalcOdds(parseFloat(e.target.value) || 1.01)}
              className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-sm font-bold tabular-nums text-white"
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">House Margin (%)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="30"
              value={calcMargin}
              onChange={(e) => setCalcMargin(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-sm font-bold tabular-nums text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800 text-center">
          <div className="p-2 bg-gray-950 rounded-lg border border-gray-800">
            <span className="text-[10px] text-gray-500 block">Implied Win Chance</span>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">
              {impliedProb.toFixed(1)}%
            </span>
          </div>

          <div className="p-2 bg-gray-950 rounded-lg border border-gray-800">
            <span className="text-[10px] text-gray-500 block">Expected Loss per 100</span>
            <span className="text-sm font-bold text-rose-400 tabular-nums">
              {lossPer100.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Core Curriculum
        </h3>

        {lessons.map((lesson, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200">{lesson.title}</span>
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-900/40">
                {lesson.tag}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{lesson.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
