/**
 * PaperBook - Normalised Data Models & Types
 */

import { CurrencyCode } from './config';

export type Sport = 'cricket' | 'football' | 'basketball' | 'tennis' | 'f1' | 'mma';

export type EventStatus = 'scheduled' | 'live' | 'final' | 'abandoned' | 'postponed';

export type MarketStatus = 'open' | 'suspended' | 'settled' | 'void';

export type SelectionResult = 'won' | 'lost' | 'void' | 'pending';

export type BetType = 'single' | 'accumulator' | 'system';

export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'cashed_out';

export type SystemBetType =
  | 'double'
  | 'treble'
  | 'trixie'
  | 'patent'
  | 'yankee'
  | 'lucky15'
  | 'lucky31'
  | 'heinz'
  | 'full_cover';

export interface Participant {
  id: string;
  name: string;
  shortName?: string;
  avatarUrl?: string;
  rating?: number;
  isWinner?: boolean;
}

export interface ScoreSummary {
  homeScore: string;
  awayScore: string;
  detail?: string; // e.g. "IND 142/3 (15.2 ov)", "2 - 1 (FT)", "88 - 82 (Q4)"
}

export interface CricketBatterLive {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isStriker: boolean;
}

export interface CricketBowlerLive {
  name: string;
  overs: number;
  runs: number;
  wickets: number;
}

export interface LiveState {
  currentScore: ScoreSummary;
  displayClock?: string; // e.g. "14.2 ov", "78'", "Q3 04:12"
  phase?: 'powerplay' | 'middle' | 'death' | 'first_half' | 'second_half' | 'set1' | 'lap';
  lastDeliveryNumber?: number;
  lastUpdatedTimestamp: number;
  // Cricket specific live state
  batters?: [CricketBatterLive, CricketBatterLive];
  bowler?: CricketBowlerLive;
  partnershipRuns?: number;
  partnershipBalls?: number;
  requiredRunRate?: number;
  currentRunRate?: number;
  target?: number;
}

export interface Delivery {
  inning: 1 | 2;
  overNumber: number; // 0-indexed or 1-indexed (e.g. over 14)
  ballNumber: number; // legal ball count 1-6 in over
  deliveryNumber: number; // running count of all balls including extras
  runsOffBat: number;
  extras: number;
  extraType?: 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty';
  isWicket: boolean;
  dismissalType?: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket';
  batter: string;
  bowler: string;
  timestamp: number;
  commentary?: string;
}

export interface Selection {
  id: string;
  label: string; // e.g. "India", "Draw", "Over 2.5", "Dot ball"
  fairProbability: number; // 0.00 to 1.00
  odds: number; // e.g. 1.85 (rounded down to 2 decimals)
  result?: SelectionResult;
}

export interface Market {
  id: string;
  eventId: string;
  type: string; // e.g. 'match_winner', 'both_teams_to_score', 'next_delivery', 'over_runs'
  category?: 'main' | 'toss' | 'innings' | 'players' | 'in_play' | 'specials';
  name: string; // Display title, e.g. "Match Result", "Next Delivery Outcome"
  line?: number; // e.g. 2.5 goals, 7.5 runs
  selections: Selection[];
  status: MarketStatus;
  margin: number; // e.g. 0.05
  opensAt?: number;
  closesAt?: number;
  rulesText: string;
}

export interface Event {
  id: string;
  sport: Sport;
  competition: string;
  startTime: number; // UTC timestamp ms
  status: EventStatus;
  home: Participant;
  away: Participant;
  score?: ScoreSummary;
  liveState?: LiveState;
  sourceLabel: 'Real fixture and result' | 'Simulated mock fixture';
  oddsBasis: 'Real odds basis' | 'Simulated odds';
  markets: Market[];
}

export interface Leg {
  eventId: string;
  eventTitle: string;
  marketId: string;
  marketName: string;
  selectionId: string;
  selectionLabel: string;
  oddsAtPlacement: number;
  fairProbAtPlacement: number;
  closingOdds?: number;
  targetDeliveryNumber?: number; // Cricket in-play delivery anchor
  result: SelectionResult;
}

export interface Bet {
  id: string;
  createdAt: number;
  stakeMinor: number; // in minor currency units (paise/cents)
  type: BetType;
  systemType?: SystemBetType;
  linesCount?: number;
  stakePerLineMinor?: number;
  legs: Leg[];
  combinedOdds: number;
  trueWinProbability: number;
  status: BetStatus;
  potentialReturnMinor: number;
  actualReturnMinor: number;
  settledAt?: number;
  cashedOutAmountMinor?: number;
  oddsAtPlacement: number;
  fairProbabilityAtPlacement: number;
}

export type LedgerKind =
  | 'start_balance'
  | 'stake'
  | 'return'
  | 'void_refund'
  | 'cash_out'
  | 'reset';

export interface LedgerEntry {
  id: string;
  time: number;
  kind: LedgerKind;
  amountMinor: number;
  balanceAfterMinor: number;
  betId?: string;
  note?: string;
}

export interface SettlementLogEntry {
  id: string;
  timestamp: number;
  betId: string;
  outcome: BetStatus;
  stakeMinor: number;
  payoutMinor: number;
  details: string;
}

export interface UserSettings {
  currency: CurrencyCode;
  startingBalanceMinor: number;
  theme: 'dark' | 'light' | 'system';
  realityCheckMinutes: number;
  dailyLossLimitMinor?: number;
  dataSource: 'mock' | 'real_cricket' | 'real_all';
  cricketApiKey: string;
  oddsApiKey: string;
  bankrollResetsCount: number;
  hasCompletedOnboarding: boolean;
  hasConfirmed18Plus: boolean;
  customMargins?: {
    twoWayMain?: number;
    threeWayMain?: number;
    propsAndInPlay?: number;
    correctScoreAndExotics?: number;
  };
}

export interface DataBudgetStatus {
  cricketRequestsToday: number;
  cricketLimit: number;
  oddsRequestsToday: number;
  oddsLimit: number;
  lastResetDate: string; // YYYY-MM-DD
}
