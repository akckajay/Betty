/**
 * MockDataProvider (Section 4.3 a)
 * Default, always works, no key required.
 */

import { DataProvider } from '../types';
import { Event, LiveState, Delivery, Sport, Participant } from '../../types';
import { generateMockFixtures } from './fixtures';

export class MockDataProvider implements DataProvider {
  public name = 'Mock Data Provider';
  private fixtures: Event[] = [];
  private lastDeliveryCount = 92;

  constructor() {
    this.fixtures = generateMockFixtures();
  }

  public async listEvents(sport?: Sport, forceRefresh = false): Promise<Event[]> {
    if (this.fixtures.length === 0) {
      this.fixtures = generateMockFixtures();
    }
    if (sport) {
      return this.fixtures.filter((e) => e.sport === sport);
    }
    return this.fixtures;
  }

  public async getEvent(eventId: string): Promise<Event | null> {
    const ev = this.fixtures.find((e) => e.id === eventId);
    return ev || null;
  }

  public async getLiveState(eventId: string): Promise<LiveState | null> {
    const ev = await this.getEvent(eventId);
    return ev?.liveState || null;
  }

  public async getResult(eventId: string): Promise<Event | null> {
    const ev = await this.getEvent(eventId);
    if (!ev || ev.status !== 'final') return null;
    return ev;
  }

  public async getDeliveries(eventId: string, afterDeliveryNumber = 0): Promise<Delivery[]> {
    if (eventId !== 'cricket_live_t20_ind_aus') return [];
    // Return sample delivery
    const d: Delivery = {
      inning: 1,
      overNumber: 15,
      ballNumber: 2,
      deliveryNumber: 92,
      runsOffBat: 4,
      extras: 0,
      isWicket: false,
      batter: 'Suryakumar Yadav',
      bowler: 'Pat Cummins',
      timestamp: Date.now() - 6000,
      commentary: 'FOUR! Sliced beautifully past backward point for a boundary!',
    };
    return d.deliveryNumber > afterDeliveryNumber ? [d] : [];
  }

  public async getParticipants(eventId: string): Promise<Participant[]> {
    const ev = await this.getEvent(eventId);
    if (!ev) return [];
    return [ev.home, ev.away];
  }
}

export const mockProvider = new MockDataProvider();
