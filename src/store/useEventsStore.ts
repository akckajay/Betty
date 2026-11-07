/**
 * Events Zustand Store
 * Loads fixtures from MockDataProvider (or RealDataProvider in Phase 4),
 * triggers background settlement, and provides sport/search filtering.
 */

import { create } from 'zustand';
import { Event, Sport } from '../types';
import { realDataProvider } from '../providers/real';
import { mockProvider } from '../providers/mock';
import { useBetsStore } from './useBetsStore';

interface EventsState {
  events: Event[];
  selectedSport: Sport | 'all';
  searchQuery: string;
  selectedEventId: string | null;
  isLoading: boolean;
  lastUpdated: number;

  // Actions
  loadEvents: (forceRefresh?: boolean) => Promise<void>;
  setSelectedSport: (sport: Sport | 'all') => void;
  setSearchQuery: (query: string) => void;
  selectEvent: (eventId: string | null) => void;
  updateEventScore: (eventId: string, update: Partial<Event>) => void;
  triggerSettlementCheck: () => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  selectedSport: 'all',
  searchQuery: '',
  selectedEventId: null,
  isLoading: false,
  lastUpdated: Date.now(),

  loadEvents: async (forceRefresh = false) => {
    // Only show full loading spinner on initial load, not background silent refresh
    if (get().events.length === 0) {
      set({ isLoading: true });
    }
    try {
      // Fetch genuine real-time live events first
      let fixtures = await realDataProvider.listEvents(undefined, forceRefresh);

      // If empty (e.g. offline or API down), fall back to cached / fallback fixtures
      if (!fixtures || fixtures.length === 0) {
        fixtures = await mockProvider.listEvents();
      }

      set({ events: fixtures, isLoading: false, lastUpdated: Date.now() });

      // Run settlement against current fixtures
      get().triggerSettlementCheck();
    } catch (e) {
      console.error('Failed to load real events, falling back', e);
      if (get().events.length === 0) {
        const fallback = await mockProvider.listEvents();
        set({ events: fallback, isLoading: false, lastUpdated: Date.now() });
      }
    }
  },

  setSelectedSport: (sport) => {
    set({ selectedSport: sport });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  selectEvent: (eventId) => {
    set({ selectedEventId: eventId });
  },

  updateEventScore: (eventId, update) => {
    const { events } = get();
    const next = events.map((e) => (e.id === eventId ? { ...e, ...update } : e));
    set({ events: next });
    get().triggerSettlementCheck();
  },

  triggerSettlementCheck: () => {
    const { events } = get();
    const map = new Map<string, Event>(events.map((e) => [e.id, e]));
    useBetsStore.getState().settleBets(map);
  },
}));
