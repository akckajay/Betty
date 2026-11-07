/**
 * PaperBook - Play-Money Sports Betting Simulator & Odds Education
 * Main Application Entry
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useEventsStore } from './store/useEventsStore';
import { useSettingsStore } from './store/useSettingsStore';
import { Header } from './components/Header';
import { Navigation, ActiveNavTab } from './components/Navigation';
import { BetSlip } from './components/BetSlip';
import { OnboardingModal } from './components/OnboardingModal';
import { LedgerModal } from './screens/LedgerModal';
import { HomeScreen } from './screens/HomeScreen';
import { EventScreen } from './screens/EventScreen';
import { MyBetsScreen } from './screens/MyBetsScreen';
import { LiveScreen } from './screens/LiveScreen';
import { LearnScreen } from './screens/LearnScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { realDataProvider } from './providers/real';
import { Event } from './types';
import { CONFIG } from './config';

export default function App() {
  const { events, loadEvents, triggerSettlementCheck } = useEventsStore();
  const { settings } = useSettingsStore();

  const [currentTab, setCurrentTab] = useState<ActiveNavTab>('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // Initial load & Automated real-time subscription
  useEffect(() => {
    // 1. Initial load
    loadEvents();

    // 2. Real-time background subscription through DataProvider (every 15s)
    const unsubscribe = realDataProvider.subscribeLiveUpdates((updatedEvents) => {
      useEventsStore.setState({ events: updatedEvents, lastUpdated: Date.now() });
      triggerSettlementCheck();
    }, CONFIG.intervals.settlementPollMs);

    // 3. Tab visibility listener: fetch latest immediately when tab is brought to focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadEvents(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadEvents, triggerSettlementCheck]);

  // Keep the active event in sync with real-time score updates
  const activeEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const handleSelectEvent = (event: Event) => {
    setSelectedEventId(event.id);
  };

  const handleBackToMatches = () => {
    setSelectedEventId(null);
  };

  const handleTabChange = (tab: ActiveNavTab) => {
    setSelectedEventId(null);
    setCurrentTab(tab);
  };

  return (
    <div className={`min-h-screen bg-[#090d16] text-gray-100 antialiased selection:bg-blue-600 selection:text-white ${settings.theme === 'light' ? 'theme-light' : ''}`}>
      {/* Centered mobile-first container */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl bg-[#090d16] border-x border-gray-900/60">
        {/* Top Header */}
        <Header onOpenLedger={() => setIsLedgerOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          {activeEvent ? (
            <EventScreen event={activeEvent} onBack={handleBackToMatches} />
          ) : (
            <>
              {currentTab === 'home' && <HomeScreen onSelectEvent={handleSelectEvent} />}
              {currentTab === 'live' && <LiveScreen onSelectEvent={handleSelectEvent} />}
              {currentTab === 'bets' && <MyBetsScreen />}
              {currentTab === 'learn' && <LearnScreen />}
              {currentTab === 'settings' && <SettingsScreen />}
            </>
          )}
        </main>

        {/* Bet Slip Bottom Drawer & Sticky Pill */}
        <BetSlip onViewMyBets={() => handleTabChange('bets')} />

        {/* Bottom Tab Navigation */}
        <Navigation currentTab={currentTab} onSelectTab={handleTabChange} />

        {/* Ledger Modal */}
        {isLedgerOpen && <LedgerModal onClose={() => setIsLedgerOpen(false)} />}

        {/* First Launch Onboarding & 18+ Confirmation Modal */}
        <OnboardingModal />
      </div>
    </div>
  );
}
