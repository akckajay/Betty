import { SportPlugin } from '../types';
import { createCricketMarkets } from './markets';
import { settleCricketMarket } from './settle';

export const cricketPlugin: SportPlugin = {
  sportId: 'cricket',
  displayName: 'Cricket',
  createMarkets: createCricketMarkets,
  settleMarket: settleCricketMarket,
};
