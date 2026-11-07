/**
 * Date and time formatting utilities.
 * All timestamps stored as UTC ms, displayed in user's local timezone.
 */

import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { EventStatus } from '../types';

export function formatEventTime(timestampMs: number): string {
  const date = new Date(timestampMs);
  if (isToday(date)) {
    return `Today, ${format(date, 'HH:mm')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'HH:mm')}`;
  }
  return format(date, 'MMM d, HH:mm');
}

export function formatTimeOnly(timestampMs: number): string {
  return format(new Date(timestampMs), 'HH:mm');
}

export function formatDateTimeFull(timestampMs: number): string {
  return format(new Date(timestampMs), 'MMM d, yyyy HH:mm:ss');
}

export function getEventTimingBadge(startTimeMs: number, status: EventStatus): {
  type: 'live' | 'starting_soon' | 'today' | 'upcoming' | 'finished';
  label: string;
} {
  if (status === 'live') {
    return { type: 'live', label: 'LIVE' };
  }
  if (status === 'final') {
    return { type: 'finished', label: 'Finished' };
  }
  if (status === 'abandoned') {
    return { type: 'finished', label: 'Abandoned' };
  }
  if (status === 'postponed') {
    return { type: 'upcoming', label: 'Postponed' };
  }

  const now = Date.now();
  const diffMinutes = Math.round((startTimeMs - now) / (1000 * 60));

  if (diffMinutes <= 0) {
    return { type: 'live', label: 'Starting now' };
  }
  if (diffMinutes <= 60) {
    return { type: 'starting_soon', label: `Starts in ${diffMinutes}m` };
  }
  if (isToday(new Date(startTimeMs))) {
    return { type: 'today', label: `Today, ${formatTimeOnly(startTimeMs)}` };
  }
  return { type: 'upcoming', label: formatEventTime(startTimeMs) };
}
