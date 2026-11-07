/**
 * Sport plugin interface.
 * Adding a sport means adding one folder implementing SportPlugin, without modifying core logic.
 */

import { Event, Market, SelectionResult } from '../types';

export interface MarketSettlementResult {
  marketId: string;
  results: Record<string, SelectionResult>; // selectionId -> result
  settled: boolean;
}

export interface SportPlugin {
  sportId: string;
  displayName: string;
  createMarkets: (event: Event) => Market[];
  settleMarket: (market: Market, event: Event) => MarketSettlementResult;
}
