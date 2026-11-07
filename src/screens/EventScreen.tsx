/**
 * Event Detail Screen (Section 11)
 * Match score/clock header, market categories, collapsible panels,
 * delayed feed notice, rules popovers, and odds buttons.
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Search, Radio, Clock, ShieldCheck } from 'lucide-react';
import { Event, Market } from '../types';
import { OddsButton } from '../components/OddsButton';
import { formatEventTime } from '../lib/dates';

interface Props {
  event: Event;
  onBack: () => void;
}

export const EventScreen: React.FC<Props> = ({ event, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [marketSearch, setMarketSearch] = useState<string>('');
  const [collapsedMarkets, setCollapsedMarkets] = useState<Record<string, boolean>>({});
  const [activeRuleMarket, setActiveRuleMarket] = useState<Market | null>(null);

  const isLive = event.status === 'live';

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    event.markets.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ['all', ...Array.from(set)];
  }, [event.markets]);

  // Filter markets
  const visibleMarkets = useMemo(() => {
    return event.markets.filter((m) => {
      const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
      const matchSearch =
        !marketSearch ||
        m.name.toLowerCase().includes(marketSearch.toLowerCase()) ||
        m.selections.some((s) => s.label.toLowerCase().includes(marketSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [event.markets, selectedCategory, marketSearch]);

  const toggleCollapse = (marketId: string) => {
    setCollapsedMarkets((prev) => ({
      ...prev,
      [marketId]: !prev[marketId],
    }));
  };

  return (
    <div className="pb-32 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-gray-800 transition touch-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Matches</span>
        </button>

        {/* Source Badges */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700/60 font-mono">
            {event.sourceLabel}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40 font-mono">
            {event.oddsBasis}
          </span>
        </div>
      </div>

      {/* Match Score & Status Header */}
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-3xl shadow-lg">
        <div className="text-center mb-2">
          <span className="text-xs font-medium text-gray-400">{event.competition}</span>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {isLive ? (
              <span className="text-red-400 font-bold inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                LIVE IN-PLAY
              </span>
            ) : (
              formatEventTime(event.startTime)
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 items-center text-center my-3">
          {/* Home team */}
          <div className="col-span-3 flex flex-col items-center">
            <span className="text-sm font-bold text-gray-100">{event.home.name}</span>
            {event.score && (
              <span className="text-2xl font-black tabular-nums text-white mt-1">
                {event.score.homeScore}
              </span>
            )}
          </div>

          {/* VS / Clock */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <span className="text-xs font-extrabold text-gray-600">VS</span>
            {isLive && event.liveState?.displayClock && (
              <span className="text-[10px] font-mono text-red-400 mt-1">
                {event.liveState.displayClock}
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="col-span-3 flex flex-col items-center">
            <span className="text-sm font-bold text-gray-100">{event.away.name}</span>
            {event.score && (
              <span className="text-2xl font-black tabular-nums text-white mt-1">
                {event.score.awayScore}
              </span>
            )}
          </div>
        </div>

        {event.score?.detail && (
          <div className="text-center text-xs font-medium text-blue-400 bg-blue-950/30 py-1.5 px-3 rounded-xl border border-blue-900/40">
            {event.score.detail}
          </div>
        )}

        {/* Cricket Live In-play Details (Batters / Bowler) */}
        {isLive && event.sport === 'cricket' && event.liveState?.batters && (
          <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-300 space-y-1 bg-gray-950/50 p-2.5 rounded-xl">
            <div className="flex justify-between font-medium">
              <span>
                🏏 {event.liveState.batters[0].name}* : {event.liveState.batters[0].runs} ({event.liveState.batters[0].balls})
              </span>
              <span>
                {event.liveState.batters[1].name} : {event.liveState.batters[1].runs} ({event.liveState.batters[1].balls})
              </span>
            </div>
            {event.liveState.bowler && (
              <div className="text-gray-400 flex justify-between text-[10px] pt-1">
                <span>Bowler: {event.liveState.bowler.name}</span>
                <span>
                  {event.liveState.bowler.overs} ov, {event.liveState.bowler.wickets}/{event.liveState.bowler.runs}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delayed Feed Safeguard Notice for In-Play (Section 7.4) */}
      {isLive && (
        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Delayed feed: prices may lag the live broadcast (updated 6s ago).</span>
          </div>
          <span className="text-[10px] font-mono text-amber-400/80">Active</span>
        </div>
      )}

      {/* Search within markets */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search markets..."
          value={marketSearch}
          onChange={(e) => setMarketSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Market Category Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition shrink-0 border ${
              selectedCategory === cat
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Markets List */}
      <div className="space-y-3">
        {visibleMarkets.map((market) => {
          const isCollapsed = !!collapsedMarkets[market.id];
          return (
            <div
              key={market.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Market Header */}
              <div
                onClick={() => toggleCollapse(market.id)}
                className="p-3 bg-gray-950/60 border-b border-gray-800/60 flex items-center justify-between cursor-pointer hover:bg-gray-950 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-200">{market.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-800 text-gray-400">
                    Margin: {(market.margin * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveRuleMarket(market);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-400 transition"
                    title="View settlement rules"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Market Selections Grid */}
              {!isCollapsed && (
                <div className="p-3">
                  <div
                    className={`grid gap-2 ${
                      market.selections.length === 2
                        ? 'grid-cols-2'
                        : market.selections.length === 3
                        ? 'grid-cols-3'
                        : market.selections.length > 4
                        ? 'grid-cols-2'
                        : 'grid-cols-2'
                    }`}
                  >
                    {market.selections.map((sel) => (
                      <OddsButton
                        key={sel.id}
                        eventId={event.id}
                        eventTitle={`${event.home.name} vs ${event.away.name}`}
                        market={market}
                        selection={sel}
                      />
                    ))}
                  </div>

                  {/* Rules preview footnote */}
                  <div className="mt-2 text-[10px] text-gray-500 flex justify-between items-center pt-1 border-t border-gray-800/40">
                    <span className="truncate pr-2">{market.rulesText}</span>
                    <button
                      onClick={() => setActiveRuleMarket(market)}
                      className="text-blue-400 hover:underline shrink-0"
                    >
                      Rules
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rules Modal */}
      {activeRuleMarket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setActiveRuleMarket(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-800 p-5 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm">Settlement Rules</h3>
            </div>
            <div className="mt-3">
              <span className="text-xs text-blue-400 font-semibold">{activeRuleMarket.name}</span>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed bg-gray-950 p-3 rounded-xl border border-gray-800">
                {activeRuleMarket.rulesText}
              </p>
            </div>
            <div className="mt-3 text-[11px] text-gray-400">
              <strong>Margin applied:</strong> {(activeRuleMarket.margin * 100).toFixed(1)}%
            </div>
            <button
              onClick={() => setActiveRuleMarket(null)}
              className="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold touch-target"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
