/**
 * Live Matches Screen
 * Displays all currently live fixtures across sports with live timers and live cricket match details.
 */

import React from 'react';
import { useEventsStore } from '../store/useEventsStore';
import { EventCard } from '../components/EventCard';
import { Event } from '../types';
import { Radio, RefreshCw } from 'lucide-react';

interface Props {
  onSelectEvent: (event: Event) => void;
}

export const LiveScreen: React.FC<Props> = ({ onSelectEvent }) => {
  const { events, loadEvents, isLoading } = useEventsStore();
  const liveEvents = events.filter((e) => e.status === 'live');

  return (
    <div className="pb-32 max-w-md mx-auto px-4 pt-3 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <h2 className="text-lg font-bold text-gray-100">Live In-Play</h2>
        </div>

        <button
          onClick={() => loadEvents(true)}
          className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition touch-target flex items-center gap-1 text-xs"
          title="Refresh live match state"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {liveEvents.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
          <Radio className="w-10 h-10 text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-300">No live matches right now</p>
          <p className="text-xs text-gray-500 mt-1">
            Check the Home tab for starting soon and upcoming fixtures.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {liveEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} onSelectEvent={onSelectEvent} />
          ))}
        </div>
      )}
    </div>
  );
};
