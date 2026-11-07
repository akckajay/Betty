/**
 * DataBudget & Caching Engine (Section 4.4)
 * Tracks provider request counts against daily limits, provides cache-aside TTL,
 * and prevents UI blanking on network / budget exhaustion.
 */

import { CONFIG } from '../config';
import { DataBudgetStatus } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class DataBudgetManager {
  private static instance: DataBudgetManager;
  private cache = new Map<string, CacheEntry<any>>();
  private budgetStatus: DataBudgetStatus;

  private constructor() {
    this.budgetStatus = this.loadBudget();
  }

  public static getInstance(): DataBudgetManager {
    if (!DataBudgetManager.instance) {
      DataBudgetManager.instance = new DataBudgetManager();
    }
    return DataBudgetManager.instance;
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private loadBudget(): DataBudgetStatus {
    const today = this.getTodayKey();
    try {
      const raw = localStorage.getItem('paperbook_budget_tracker');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lastResetDate === today) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore
    }
    return {
      cricketRequestsToday: 0,
      cricketLimit: CONFIG.dataBudget.cricketApiDailyCap,
      oddsRequestsToday: 0,
      oddsLimit: CONFIG.dataBudget.oddsApiDailyCap,
      lastResetDate: today,
    };
  }

  private saveBudget(): void {
    try {
      localStorage.setItem('paperbook_budget_tracker', JSON.stringify(this.budgetStatus));
    } catch (e) {
      // Ignore
    }
  }

  public getStatus(): DataBudgetStatus {
    // Reset if new day
    const today = this.getTodayKey();
    if (this.budgetStatus.lastResetDate !== today) {
      this.budgetStatus = {
        cricketRequestsToday: 0,
        cricketLimit: CONFIG.dataBudget.cricketApiDailyCap,
        oddsRequestsToday: 0,
        oddsLimit: CONFIG.dataBudget.oddsApiDailyCap,
        lastResetDate: today,
      };
      this.saveBudget();
    }
    return { ...this.budgetStatus };
  }

  public canRequest(provider: 'cricket' | 'odds'): boolean {
    const status = this.getStatus();
    if (provider === 'cricket') {
      return status.cricketRequestsToday < status.cricketLimit;
    }
    return status.oddsRequestsToday < status.oddsLimit;
  }

  public recordRequest(provider: 'cricket' | 'odds'): void {
    const status = this.getStatus();
    if (provider === 'cricket') {
      this.budgetStatus.cricketRequestsToday++;
    } else {
      this.budgetStatus.oddsRequestsToday++;
    }
    this.saveBudget();
  }

  public setCache<T>(key: string, data: T, ttlMinutes: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: ttlMinutes * 60 * 1000,
    });
  }

  public getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }
}
