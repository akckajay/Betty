/**
 * User Bets Zustand Store
 * Tracks open bets, settled bets, settlement logs, cash-outs.
 */

import { create } from 'zustand';
import { Bet, Event, SettlementLogEntry } from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { settlePendingBets } from '../engine/settlement';
import { useWalletStore } from './useWalletStore';

const STORAGE_KEY = 'paperbook_bets_v1';

interface PersistedBets {
  bets: Bet[];
  settlementLogs: SettlementLogEntry[];
}

interface BetsState {
  bets: Bet[];
  settlementLogs: SettlementLogEntry[];

  // Actions
  placeBet: (bet: Bet) => boolean;
  settleBets: (eventsMap: Map<string, Event>) => void;
  cashOutBet: (betId: string, cashOutAmountMinor: number) => boolean;
  getOpenBets: () => Bet[];
  getSettledBets: () => Bet[];
}

const saved = loadFromStorage<PersistedBets>(STORAGE_KEY, {
  bets: [],
  settlementLogs: [],
});

export const useBetsStore = create<BetsState>((set, get) => ({
  bets: saved.bets,
  settlementLogs: saved.settlementLogs,

  placeBet: (bet: Bet) => {
    const wallet = useWalletStore.getState();
    const success = wallet.deductStake(bet.stakeMinor, bet.id, `Bet placed: ${bet.type}`);
    if (!success) return false;

    const newBets = [bet, ...get().bets];
    set({ bets: newBets });
    saveToStorage(STORAGE_KEY, {
      bets: newBets,
      settlementLogs: get().settlementLogs,
    });
    return true;
  },

  settleBets: (eventsMap: Map<string, Event>) => {
    const { bets, settlementLogs } = get();
    const pending = bets.filter((b) => b.status === 'pending');
    if (pending.length === 0) return;

    const wallet = useWalletStore.getState();
    const { settledBets, logs } = settlePendingBets(pending, eventsMap, wallet.balanceMinor);

    if (settledBets.length === 0) return;

    // Merge settled bets with non-pending bets
    const settledMap = new Map<string, Bet>(settledBets.map((b) => [b.id, b]));
    const updatedBets = bets.map((b) => settledMap.get(b.id) || b);
    const updatedLogs = [...logs, ...settlementLogs].slice(0, 100); // keep last 100 logs

    set({ bets: updatedBets, settlementLogs: updatedLogs });
    saveToStorage(STORAGE_KEY, {
      bets: updatedBets,
      settlementLogs: updatedLogs,
    });
  },

  cashOutBet: (betId: string, cashOutAmountMinor: number) => {
    const { bets, settlementLogs } = get();
    const target = bets.find((b) => b.id === betId);
    if (!target || target.status !== 'pending' || cashOutAmountMinor <= 0) {
      return false;
    }

    const wallet = useWalletStore.getState();
    wallet.addReturn(cashOutAmountMinor, target.id, `Cashed out ${target.type} bet`);

    const updatedBet: Bet = {
      ...target,
      status: 'cashed_out',
      actualReturnMinor: cashOutAmountMinor,
      cashedOutAmountMinor: cashOutAmountMinor,
      settledAt: Date.now(),
    };

    const newBets = bets.map((b) => (b.id === betId ? updatedBet : b));
    const newLog: SettlementLogEntry = {
      id: `log_cashout_${Date.now()}_${target.id}`,
      timestamp: Date.now(),
      betId: target.id,
      outcome: 'cashed_out',
      stakeMinor: target.stakeMinor,
      payoutMinor: cashOutAmountMinor,
      details: `User accepted cash out. Fair expectation minus 8% margin.`,
    };

    set({ bets: newBets, settlementLogs: [newLog, ...settlementLogs] });
    saveToStorage(STORAGE_KEY, {
      bets: newBets,
      settlementLogs: [newLog, ...settlementLogs],
    });
    return true;
  },

  getOpenBets: () => {
    return get().bets.filter((b) => b.status === 'pending');
  },

  getSettledBets: () => {
    return get().bets.filter((b) => b.status !== 'pending');
  },
}));
