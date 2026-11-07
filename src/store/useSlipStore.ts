/**
 * Bet Slip Zustand Store (Section 8)
 * Manages selections, single / accumulator / system tabs, stakes, validation, and conflict warnings.
 */

import { create } from 'zustand';
import { CONFIG } from '../config';
import { Leg, SystemBetType } from '../types';
import { analyzeAccumulator } from '../engine/odds';

export type SlipTab = 'singles' | 'accumulator' | 'system';

export interface SlipSelection extends Leg {
  eventId: string;
  marketId: string;
  selectionId: string;
  eventTitle: string;
  marketName: string;
  selectionLabel: string;
  oddsAtPlacement: number;
  fairProbAtPlacement: number;
  stakeMinor: number; // for singles
}

interface SlipState {
  isOpen: boolean;
  activeTab: SlipTab;
  selections: SlipSelection[];
  accumulatorStakeMinor: number;
  systemStakePerLineMinor: number;
  systemType: SystemBetType;
  conflictMessage: string | null;
  oddsChangedAlert: boolean;

  // Actions
  toggleOpen: (open?: boolean) => void;
  setActiveTab: (tab: SlipTab) => void;
  addOrRemoveSelection: (leg: Omit<SlipSelection, 'stakeMinor' | 'result'>) => void;
  removeSelection: (selectionId: string) => void;
  setSingleStake: (selectionId: string, stakeMinor: number) => void;
  setAccumulatorStake: (stakeMinor: number) => void;
  setSystemStakePerLine: (stakeMinor: number) => void;
  setSystemType: (type: SystemBetType) => void;
  clearSlip: () => void;
  clearConflict: () => void;
}

export const useSlipStore = create<SlipState>((set, get) => ({
  isOpen: false,
  activeTab: 'singles',
  selections: [],
  accumulatorStakeMinor: CONFIG.minStakeMinor * 10, // Default 100
  systemStakePerLineMinor: CONFIG.minStakeMinor, // Default 10
  systemType: 'trixie',
  conflictMessage: null,
  oddsChangedAlert: false,

  toggleOpen: (open) => {
    set((state) => ({ isOpen: open !== undefined ? open : !state.isOpen }));
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  addOrRemoveSelection: (leg) => {
    const { selections } = get();
    const existingIndex = selections.findIndex((s) => s.selectionId === leg.selectionId && s.marketId === leg.marketId);

    if (existingIndex >= 0) {
      // Toggle off
      const next = selections.filter((_, idx) => idx !== existingIndex);
      set({ selections: next, conflictMessage: null });
      return;
    }

    // Check same market conflict (e.g. Can't bet Home AND Away in same 1X2 market)
    const sameMarket = selections.some((s) => s.eventId === leg.eventId && s.marketId === leg.marketId);
    if (sameMarket) {
      set({ conflictMessage: 'You already have an outcome selected from this market.' });
      return;
    }

    const newSelection: SlipSelection = {
      ...leg,
      result: 'pending',
      stakeMinor: CONFIG.minStakeMinor * 5, // Default 50
    };

    const nextSelections = [...selections, newSelection];
    set({
      selections: nextSelections,
      isOpen: true,
      conflictMessage: null,
      activeTab: nextSelections.length > 1 ? 'accumulator' : 'singles',
    });
  },

  removeSelection: (selectionId) => {
    const { selections } = get();
    const next = selections.filter((s) => s.selectionId !== selectionId);
    set({
      selections: next,
      isOpen: next.length > 0 ? get().isOpen : false,
      conflictMessage: null,
      activeTab: next.length <= 1 ? 'singles' : get().activeTab,
    });
  },

  setSingleStake: (selectionId, stakeMinor) => {
    const { selections } = get();
    const next = selections.map((s) =>
      s.selectionId === selectionId ? { ...s, stakeMinor: Math.max(0, stakeMinor) } : s
    );
    set({ selections: next });
  },

  setAccumulatorStake: (stakeMinor) => {
    set({ accumulatorStakeMinor: Math.max(0, stakeMinor) });
  },

  setSystemStakePerLine: (stakeMinor) => {
    set({ systemStakePerLineMinor: Math.max(0, stakeMinor) });
  },

  setSystemType: (systemType) => {
    set({ systemType });
  },

  clearSlip: () => {
    set({ selections: [], isOpen: false, conflictMessage: null });
  },

  clearConflict: () => {
    set({ conflictMessage: null });
  },
}));
