/**
 * Money utilities for PaperBook.
 * All monetary amounts are stored as integer minor units (paise / cents) to prevent floating-point rounding issues.
 * Returns are always rounded DOWN to the nearest minor unit.
 */

import { CONFIG, CurrencyCode } from '../config';

/**
 * Format minor currency units into human readable string (e.g. 1000000 paise -> "₹10,000.00")
 */
export function formatMoney(amountMinor: number, currency: CurrencyCode = 'INR'): string {
  const currInfo = CONFIG.currencies[currency] || CONFIG.currencies.INR;
  const major = amountMinor / currInfo.minorUnitRatio;
  
  // Format with standard locale format
  const formattedMajor = Math.abs(major).toLocaleString(
    currency === 'INR' ? 'en-IN' : 'en-US',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

  const sign = amountMinor < 0 ? '-' : '';
  return `${sign}${currInfo.symbol}${formattedMajor}`;
}

/**
 * Converts user input in major units (e.g. 100 rupees) to minor units (10000 paise)
 */
export function majorToMinor(amountMajor: number, currency: CurrencyCode = 'INR'): number {
  const currInfo = CONFIG.currencies[currency] || CONFIG.currencies.INR;
  return Math.round(amountMajor * currInfo.minorUnitRatio);
}

/**
 * Converts minor units to major units as floating number (for display or inputs)
 */
export function minorToMajor(amountMinor: number, currency: CurrencyCode = 'INR'): number {
  const currInfo = CONFIG.currencies[currency] || CONFIG.currencies.INR;
  return amountMinor / currInfo.minorUnitRatio;
}

/**
 * Calculate potential return: stakeMinor * odds, rounded DOWN to nearest integer minor unit
 */
export function calculateReturn(stakeMinor: number, odds: number): number {
  if (stakeMinor <= 0 || odds < 1.0) return 0;
  return Math.floor(stakeMinor * odds);
}
