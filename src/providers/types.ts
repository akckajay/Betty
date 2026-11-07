/**
 * DataProvider Contract (Section 4.1)
 */

import { Event, LiveState, Delivery, Sport, Participant } from '../types';

export interface DataProvider {
  name: string;
  listEvents: (sport?: Sport, forceRefresh?: boolean) => Promise<Event[]>;
  getEvent: (eventId: string) => Promise<Event | null>;
  getLiveState: (eventId: string) => Promise<LiveState | null>;
  getResult: (eventId: string) => Promise<Event | null>;
  getDeliveries: (eventId: string, afterDeliveryNumber?: number) => Promise<Delivery[]>;
  getParticipants: (eventId: string) => Promise<Participant[]>;
  subscribeLiveUpdates?: (
    onEventsUpdate: (events: Event[]) => void,
    intervalMs?: number
  ) => () => void;
}
