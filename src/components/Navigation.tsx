/**
 * Bottom Tab Navigation Bar
 * Tabs: Home, Live, My Bets (with open bets counter), Learn, Settings.
 * Touch targets >= 44px.
 */

import React from 'react';
import { Home, Radio, Ticket, BookOpen, Settings } from 'lucide-react';
import { useBetsStore } from '../store/useBetsStore';

export type ActiveNavTab = 'home' | 'live' | 'bets' | 'learn' | 'settings';

interface Props {
  currentTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
}

export const Navigation: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { bets } = useBetsStore();
  const openBetsCount = bets.filter((b) => b.status === 'pending').length;

  const navItems = [
    { id: 'home' as ActiveNavTab, label: 'Home', icon: Home },
    { id: 'live' as ActiveNavTab, label: 'Live', icon: Radio },
    {
      id: 'bets' as ActiveNavTab,
      label: 'My Bets',
      icon: Ticket,
      badge: openBetsCount > 0 ? openBetsCount : undefined,
    },
    { id: 'learn' as ActiveNavTab, label: 'Learn', icon: BookOpen },
    { id: 'settings' as ActiveNavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-lg border-t border-gray-800 safe-bottom"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition touch-target relative ${
                isActive
                  ? 'text-blue-400 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
