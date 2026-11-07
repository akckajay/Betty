/**
 * Wallet & Ledger Zustand Store (Section 10)
 * Starting balance: 10,000 (config.ts), minor units.
 * Resets count tracked permanently.
 * Synchronized across tabs via storage listener.
 */

import { create } from 'zustand';
import { CONFIG } from '../config';
import { LedgerEntry } from '../types';
import { loadFromStorage, saveToStorage } from '../lib/storage';

interface WalletState {
  balanceMinor: number;
  ledger: LedgerEntry[];
  bankrollResetsCount: number;

  // Actions
  deductStake: (stakeMinor: number, betId: string, note?: string) => boolean;
  addReturn: (returnMinor: number, betId: string, note?: string) => void;
  refundStake: (refundMinor: number, betId: string, note?: string) => void;
  resetBankroll: (newStartingBalanceMinor?: number) => void;
  syncFromStorage: () => void;
}

const STORAGE_KEY = 'paperbook_wallet_v1';

interface PersistedWallet {
  balanceMinor: number;
  ledger: LedgerEntry[];
  bankrollResetsCount: number;
}

const initialBalance = CONFIG.defaultStartingBalanceMinor;
const initialLedger: LedgerEntry[] = [
  {
    id: 'init_balance',
    time: Date.now(),
    kind: 'start_balance',
    amountMinor: initialBalance,
    balanceAfterMinor: initialBalance,
    note: 'Initial practice bankroll',
  },
];

const savedData = loadFromStorage<PersistedWallet>(STORAGE_KEY, {
  balanceMinor: initialBalance,
  ledger: initialLedger,
  bankrollResetsCount: 0,
});

export const useWalletStore = create<WalletState>((set, get) => ({
  balanceMinor: savedData.balanceMinor,
  ledger: savedData.ledger,
  bankrollResetsCount: savedData.bankrollResetsCount,

  deductStake: (stakeMinor: number, betId: string, note = 'Bet Stake') => {
    const { balanceMinor, ledger } = get();
    if (balanceMinor < stakeMinor || stakeMinor <= 0) {
      return false;
    }
    const newBalance = balanceMinor - stakeMinor;
    const entry: LedgerEntry = {
      id: `stake_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      time: Date.now(),
      kind: 'stake',
      amountMinor: -stakeMinor,
      balanceAfterMinor: newBalance,
      betId,
      note,
    };
    const newLedger = [entry, ...ledger];
    set({ balanceMinor: newBalance, ledger: newLedger });
    saveToStorage(STORAGE_KEY, {
      balanceMinor: newBalance,
      ledger: newLedger,
      bankrollResetsCount: get().bankrollResetsCount,
    });
    return true;
  },

  addReturn: (returnMinor: number, betId: string, note = 'Bet Return') => {
    const { balanceMinor, ledger, bankrollResetsCount } = get();
    const newBalance = balanceMinor + returnMinor;
    const entry: LedgerEntry = {
      id: `return_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      time: Date.now(),
      kind: 'return',
      amountMinor: returnMinor,
      balanceAfterMinor: newBalance,
      betId,
      note,
    };
    const newLedger = [entry, ...ledger];
    set({ balanceMinor: newBalance, ledger: newLedger });
    saveToStorage(STORAGE_KEY, {
      balanceMinor: newBalance,
      ledger: newLedger,
      bankrollResetsCount,
    });
  },

  refundStake: (refundMinor: number, betId: string, note = 'Void Refund') => {
    const { balanceMinor, ledger, bankrollResetsCount } = get();
    const newBalance = balanceMinor + refundMinor;
    const entry: LedgerEntry = {
      id: `refund_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      time: Date.now(),
      kind: 'void_refund',
      amountMinor: refundMinor,
      balanceAfterMinor: newBalance,
      betId,
      note,
    };
    const newLedger = [entry, ...ledger];
    set({ balanceMinor: newBalance, ledger: newLedger });
    saveToStorage(STORAGE_KEY, {
      balanceMinor: newBalance,
      ledger: newLedger,
      bankrollResetsCount,
    });
  },

  resetBankroll: (newStartingBalanceMinor = CONFIG.defaultStartingBalanceMinor) => {
    const { bankrollResetsCount, ledger } = get();
    const newResets = bankrollResetsCount + 1;
    const entry: LedgerEntry = {
      id: `reset_${Date.now()}`,
      time: Date.now(),
      kind: 'reset',
      amountMinor: newStartingBalanceMinor,
      balanceAfterMinor: newStartingBalanceMinor,
      note: `Bankroll reset #${newResets}`,
    };
    const newLedger = [entry, ...ledger];
    set({
      balanceMinor: newStartingBalanceMinor,
      bankrollResetsCount: newResets,
      ledger: newLedger,
    });
    saveToStorage(STORAGE_KEY, {
      balanceMinor: newStartingBalanceMinor,
      ledger: newLedger,
      bankrollResetsCount: newResets,
    });
  },

  syncFromStorage: () => {
    const latest = loadFromStorage<PersistedWallet>(STORAGE_KEY, {
      balanceMinor: initialBalance,
      ledger: initialLedger,
      bankrollResetsCount: 0,
    });
    set({
      balanceMinor: latest.balanceMinor,
      ledger: latest.ledger,
      bankrollResetsCount: latest.bankrollResetsCount,
    });
  },
}));

// Cross-tab storage listener
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      useWalletStore.getState().syncFromStorage();
    }
  });
}
