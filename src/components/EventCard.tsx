/**
 * EventCard Component
 * Displays match teams, live scores / start times, source badge,
 * and quick-tap odds buttons for the primary market.
 */

import React from 'react';
import { Event } from '../types';
import { getEventTimingBadge } from '../lib/dates';
import { OddsButton } from './OddsButton';
import { ChevronRight, Radio } from 'lucide-react';

interface Props {
  event: Event;
  onSelectEvent: (event: Event) => void;
}

export const EventCard: React.FC<Props> = ({ event, onSelectEvent }) => {
  const timing = getEventTimingBadge(event.startTime, event.status);
  const mainMarket = event.markets[0]; // Primary market (e.g. 1X2, Moneyline, Winner)

  const isLive = event.status === 'live';

  return (
    <div
      onClick={() => onSelectEvent(event)}
      className="bg-gray-900/90 border border-gray-800 hover:border-gray-700/80 rounded-2xl p-3.5 transition shadow-sm cursor-pointer group"
    >
      {/* Top Header: Competition & Badges */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium text-gray-400 truncate">
            {event.competition}
          </span>
          <span className="text-[10px] text-gray-500 font-mono px-1 rounded bg-gray-800/80">
            {event.sourceLabel === 'Real fixture and result' ? 'Real' : 'Simulated'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isLive ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/50 border border-red-800/40 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              LIVE {event.liveState?.displayClock ? `(${event.liveState.displayClock})` : ''}
            </span>
          ) : timing.type === 'starting_soon' ? (
            <span className="text-[11px] font-medium text-amber-400 bg-amber-950/40 border border-amber-800/30 px-2 py-0.5 rounded-full">
              {timing.label}
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">{timing.label}</span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* Participants & Scores */}
      <div className="space-y-1.5 my-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-100 truncate pr-2">
            {event.home.name}
          </span>
          {event.score && (
            <span className="text-sm font-bold tabular-nums text-gray-200 shrink-0">
              {event.score.homeScore}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-100 truncate pr-2">
            {event.away.name}
          </span>
          {event.score && (
            <span className="text-sm font-bold tabular-nums text-gray-200 shrink-0">
              {event.score.awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Detail or live status description */}
      {event.score?.detail && isLive && (
        <div className="text-[11px] font-medium text-blue-400/90 mb-2">
          {event.score.detail}
        </div>
      )}

      {/* Main Market Odds Grid */}
      {mainMarket && (
        <div className="mt-2.5 pt-2 border-t border-gray-800/50">
          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
            <span>{mainMarket.name}</span>
            <span className="text-[10px] text-gray-500">Margin: {(mainMarket.margin * 100).toFixed(1)}%</span>
          </div>

          <div
            className={`grid gap-1.5 ${
              mainMarket.selections.length === 2
                ? 'grid-cols-2'
                : mainMarket.selections.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2'
            }`}
          >
            {mainMarket.selections.slice(0, 3).map((selection) => (
              <OddsButton
                key={selection.id}
                eventId={event.id}
                eventTitle={`${event.home.name} vs ${event.away.name}`}
                market={mainMarket}
                selection={selection}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
