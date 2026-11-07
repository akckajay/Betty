/**
 * PaperBook - Master Configuration File
 * Every tunable number (margins, limits, probabilities, refresh timers, starting balance)
 * lives here so it can be tuned in one place.
 */

export const CONFIG = {
  // App Identity & Play Money Rules
  appName: 'PaperBook',
  playMoneyDisclaimer: 'Play money. Practice only.',
  legalAgeConfirmation: 18,

  // Currencies supported
  defaultCurrency: 'INR' as const,
  currencies: {
    INR: { symbol: '₹', name: 'Indian Rupee', minorUnitRatio: 100 },
    USD: { symbol: '$', name: 'US Dollar', minorUnitRatio: 100 },
    EUR: { symbol: '€', name: 'Euro', minorUnitRatio: 100 },
    GBP: { symbol: '£', name: 'British Pound', minorUnitRatio: 100 },
  },

  // Wallet & Limits (Stored in minor units: paise / cents)
  // 10,000 INR = 1,000,000 paise
  defaultStartingBalanceMinor: 1000000, // 10,000.00
  minStakeMinor: 1000, // 10.00
  maxStakeBalancePercent: 0.25, // 25% of current balance for single bets
  maxAccumulatorLegs: 15,
  maxPayoutMinor: 100000000, // 10,00,000.00
  maxOpenBets: 20,

  // Bookmaker Margins (applied over fair probability: p * (1 + m))
  defaultMargins: {
    twoWayMain: 0.05, // 5% for 2-way moneyline, spreads, totals
    threeWayMain: 0.06, // 6% for 1X2 football / test match 3-way
    propsAndInPlay: 0.09, // 9% for player props and live markets
    correctScoreAndExotics: 0.15, // 15% for correct score, first goalscorer, multi-way
  },

  // Cash Out Margin
  cashOutMargin: 0.08, // 8% deduction from fair expectation

  // In-play Cricket Per-Delivery Baseline Probabilities (T20)
  // Must sum to ~1.00
  cricketT20Baselines: {
    dot: 0.34,
    one: 0.30,
    two: 0.07,
    three: 0.005,
    four: 0.12,
    six: 0.055,
    wicket: 0.045,
    extra: 0.065,
  },

  // Basketball Model Parameters
  basketball: {
    marginStdDev: 12.0, // points
    totalStdDev: 17.0, // points
  },

  // Timers & Intervals (in milliseconds)
  intervals: {
    settlementPollMs: 15000, // Background check for settlements
    cricketDemoDeliveryMs: 9000, // 8 to 12s demo match engine delivery rate
    oddsFlashDurationMs: 1000, // 1 second green/red flash for odds changes
    staleFeedWarningThresholdSec: 90, // Suspend live markets if feed older than 90s
    realityCheckDefaultMinutes: 30, // 30 min responsible gaming alert
  },

  // Data Caching & Budget Caps (Daily request caps)
  dataBudget: {
    cricketApiDailyCap: 100, // Free tier cricketdata.org
    oddsApiDailyCap: 50,
    cacheTtlMinutes: {
      fixtureList: 15,
      scheduledEvent: 30,
      liveStateSec: 25,
      finalResult: 9999999, // Forever
    },
  },

  // Storage & Versioning
  storageKey: 'paperbook_state_v1',
  storageVersion: 1,
} as const;

export type CurrencyCode = keyof typeof CONFIG.currencies;
