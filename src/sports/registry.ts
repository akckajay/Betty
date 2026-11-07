/**
 * Central Sport Plugins Registry
 * Adding a sport means adding one folder and registering it here.
 */

import { SportPlugin } from './types';
import { cricketPlugin } from './cricket';
import { footballPlugin } from './football';
import { basketballPlugin } from './basketball';
import { tennisPlugin } from './tennis';
import { f1Plugin } from './f1';
import { mmaPlugin } from './mma';
import { Sport } from '../types';

export const SPORT_PLUGINS: Record<Sport, SportPlugin> = {
  cricket: cricketPlugin,
  football: footballPlugin,
  basketball: basketballPlugin,
  tennis: tennisPlugin,
  f1: f1Plugin,
  mma: mmaPlugin,
};

export function getSportPlugin(sport: Sport): SportPlugin {
  return SPORT_PLUGINS[sport] || footballPlugin;
}
