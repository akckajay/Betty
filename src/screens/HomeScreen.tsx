/**
 * HomeScreen (Section 11)
 * Sport chips, search input, categorized match sections:
 * "Live Now", "Starting Soon", "Today", "Upcoming", "Finished"
 */

import React, { useMemo } from 'react';
import { useEventsStore } from '../store/useEventsStore';
import { EventCard } from '../components/EventCard';
import { Event, Sport } from '../types';
import { Search, Flame, Radio, Clock, Calendar, CheckCircle } from 'lucide-react';
import { isToday, isTomorrow } from 'date-fns';

interface Props {
  onSelectEvent: (event: Event) => void;
}

const SPORTS: { id: Sport | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Sports', icon: '🌐' },
  { id: 'cricket', label: 'Cricket', icon: '🏏' },
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'f1', label: 'Formula 1', icon: '🏎️' },
  { id: 'mma', label: 'MMA', icon: '🥊' },
];

export const HomeScreen: React.FC<Props> = ({ onSelectEvent }) => {
  const {
    events,
    selectedSport,
    setSelectedSport,
    searchQuery,
    setSearchQuery,
    isLoading,
    loadEvents,
  } = useEventsStore();

  // Filtered by sport and search
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSport = selectedSport === 'all' || ev.sport === selectedSport;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ev.home.name.toLowerCase().includes(q) ||
        ev.away.name.toLowerCase().includes(q) ||
        ev.competition.toLowerCase().includes(q);
      return matchesSport && matchesSearch;
    });
  }, [events, selectedSport, searchQuery]);

  // Categorize
  const now = Date.now();
  const liveEvents = filteredEvents.filter((e) => e.status === 'live');
  const startingSoonEvents = filteredEvents.filter(
    (e) =>
      e.status === 'scheduled' &&
      e.startTime > now &&
      e.startTime - now <= 60 * 60 * 1000 // within 60 mins
  );
  const todayEvents = filteredEvents.filter(
    (e) =>
      e.status === 'scheduled' &&
      e.startTime - now > 60 * 60 * 1000 &&
      isToday(new Date(e.startTime))
  );
  const upcomingEvents = filteredEvents.filter(
    (e) => e.status === 'scheduled' && !isToday(new Date(e.startTime))
  );
  const finishedEvents = filteredEvents.filter((e) => e.status === 'final');

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search teams, competitions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Sport Selector Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SPORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSport(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition touch-target shrink-0 border ${
              selectedSport === s.id
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8 text-xs text-gray-500">
          Loading realistic fixtures...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEvents.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800/80 rounded-2xl p-6">
          <p className="text-sm font-semibold text-gray-300">No events found</p>
          <p className="text-xs text-gray-500 mt-1">Try another sport or clear your search.</p>
          <button
            onClick={() => {
              setSelectedSport('all');
              setSearchQuery('');
              loadEvents();
            }}
            className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs font-medium rounded-xl text-white transition touch-target"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Section 1: Live Now */}
      {liveEvents.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
            <span>Live Now ({liveEvents.length})</span>
          </div>
          <div className="space-y-2.5">
            {liveEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} onSelectEvent={onSelectEvent} />
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Starting Soon (< 60m) */}
      {startingSoonEvents.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Starting Soon ({startingSoonEvents.length})</span>
          </div>
          <div className="space-y-2.5">
            {startingSoonEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} onSelectEvent={onSelectEvent} />
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Today */}
      {todayEvents.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Today ({todayEvents.length})</span>
          </div>
          <div className="space-y-2.5">
            {todayEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} onSelectEvent={onSelectEvent} />
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Upcoming (Tomorrow & later) */}
      {upcomingEvents.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>Upcoming Fixtures ({upcomingEvents.length})</span>
          </div>
          <div className="space-y-2.5">
            {upcomingEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} onSelectEvent={onSelectEvent} />
            ))}
          </div>
        </section>
      )}

      {/* Section 5: Finished */}
      {finishedEvents.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5 text-gray-500" />
            <span>Recent Results ({finishedEvents.length})</span>
          </div>
          <div className="space-y-2.5">
            {finishedEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} onSelectEvent={onSelectEvent} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
