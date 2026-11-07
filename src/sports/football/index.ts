import { SportPlugin } from '../types';
import { createFootballMarkets } from './markets';
import { settleFootballMarket } from './settle';

export const footballPlugin: SportPlugin = {
  sportId: 'football',
  displayName: 'Football',
  createMarkets: createFootballMarkets,
  settleMarket: settleFootballMarket,
};
