/**
 * Settings Screen (Section 11, 13 & 10)
 * Manages currency, theme, bankroll resets, data budget meters, custom margins,
 * export/import data, settlement debugging logs, and responsible use safeguards.
 */

import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWalletStore } from '../store/useWalletStore';
import { useBetsStore } from '../store/useBetsStore';
import { CONFIG, CurrencyCode } from '../config';
import { formatMoney } from '../lib/money';
import { exportAppData, importAppData } from '../lib/storage';
import { DataBudgetManager } from '../engine/budget';
import {
  RotateCcw,
  Download,
  Upload,
  ShieldAlert,
  Coins,
  Cpu,
  Sliders,
  FileText,
  AlertTriangle,
  HeartHandshake,
  Smartphone,
  ExternalLink,
  Check,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { bankrollResetsCount, resetBankroll, balanceMinor } = useWalletStore();
  const { settlementLogs } = useBetsStore();

  const [showLogs, setShowLogs] = useState(false);
  const [showMargins, setShowMargins] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const budgetStatus = DataBudgetManager.getInstance().getStatus();

  const handleExport = () => {
    const fullState = {
      settings,
      wallet: useWalletStore.getState(),
      bets: useBetsStore.getState(),
    };
    const json = exportAppData(fullState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paperbook_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importAppData(text);
        if (imported.settings) updateSettings(imported.settings);
        alert('Data successfully imported from backup file.');
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON backup');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-32 max-w-md mx-auto px-4 pt-3 space-y-4 text-white">
      <div>
        <h2 className="text-lg font-bold text-gray-100">Settings &amp; Tools</h2>
        <span className="text-[11px] text-gray-500">
          Configuration, bankroll controls, and transparency metrics
        </span>
      </div>

      {/* Section 0: Install App & Download APK */}
      <div className="p-4 bg-gradient-to-br from-blue-950/60 to-gray-900 border border-blue-800/50 rounded-2xl space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>Install to Phone / Download as APK</span>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          PaperBook is a Progressive Web App (PWA) that installs directly on Android without an app store, or can be packaged into an installable <strong>.apk</strong> file.
        </p>

        {/* Method 1: Instant PWA Install on Android */}
        <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800 space-y-2 text-xs">
          <div className="font-semibold text-gray-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Direct Install to Home Screen (Instant)</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            In Chrome or Brave on Android, tap the <strong>three dots (⋮)</strong> menu in the top right corner and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. It installs as a full standalone app with its own icon and offline cache!
          </p>
        </div>

        {/* Method 2: Download as standalone .apk */}
        <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800 space-y-2 text-xs">
          <div className="font-semibold text-gray-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Generate Standalone .APK File</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            To generate a downloadable Android <strong>.apk</strong> package for sideloading or sharing:
          </p>
          <ol className="list-decimal list-inside text-[11px] text-gray-400 space-y-1 pl-1">
            <li>Visit <strong>PWABuilder.com</strong> (free tool by Microsoft).</li>
            <li>Paste your app URL.</li>
            <li>Click <strong>"Package for Android"</strong> to download your ready-to-install <strong>.apk</strong>!</li>
          </ol>
          <a
            href={`https://www.pwabuilder.com?url=${encodeURIComponent(window.location.origin)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition touch-target"
          >
            <span>Open PWABuilder to Generate APK</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Section 1: Practice Currency & Bankroll */}
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
          <Coins className="w-4 h-4 text-blue-400" />
          <span>Practice Bankroll &amp; Currency</span>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Display Currency</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map((c) => (
              <button
                key={c}
                onClick={() => updateSettings({ currency: c })}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  settings.currency === c
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {CONFIG.currencies[c].symbol} {c}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-400 block">Bankroll Resets Count</span>
            <span className="text-[10px] text-gray-500">
              Permanently recorded to show ruin history
            </span>
          </div>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {bankrollResetsCount}
          </span>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset practice bankroll back to default 10,000? Resets count will increment.')) {
              resetBankroll();
            }
          }}
          className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-rose-300 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition touch-target"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Bankroll to Default</span>
        </button>
      </div>

      {/* Section 2: Data Source & Budget Meter */}
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Data Provider &amp; Free Tier Budget</span>
        </div>

        <div className="text-xs text-gray-400 space-y-2">
          <div className="flex justify-between items-center bg-gray-950 p-2.5 rounded-xl border border-gray-800">
            <span>Cricket API Requests Today:</span>
            <span className="font-mono font-bold text-emerald-400">
              {budgetStatus.cricketRequestsToday} / {budgetStatus.cricketLimit}
            </span>
          </div>

          <div className="flex justify-between items-center bg-gray-950 p-2.5 rounded-xl border border-gray-800">
            <span>Odds API Requests Today:</span>
            <span className="font-mono font-bold text-blue-400">
              {budgetStatus.oddsRequestsToday} / {budgetStatus.oddsLimit}
            </span>
          </div>
        </div>

        {/* Security Warning on API keys */}
        <div className="text-[11px] p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-300 leading-relaxed">
          <strong className="block mb-0.5">Device Security Notice:</strong>
          Any API key entered into the browser is stored only in local storage on this device, meaning anyone with physical or inspection access to this browser can read it.
        </div>
      </div>

      {/* Section 3: Margins Configuration */}
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-3">
        <button
          onClick={() => setShowMargins(!showMargins)}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-200"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Bookmaker Margins (Tunable in config.ts)</span>
          </div>
          <span className="text-gray-500">{showMargins ? 'Hide' : 'View'}</span>
        </button>

        {showMargins && (
          <div className="pt-2 border-t border-gray-800 space-y-2 text-xs text-gray-300">
            <div className="flex justify-between">
              <span>Two-Way Main Markets:</span>
              <span className="font-mono text-blue-400">{(CONFIG.defaultMargins.twoWayMain * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Three-Way Main Markets (1X2):</span>
              <span className="font-mono text-blue-400">{(CONFIG.defaultMargins.threeWayMain * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Props &amp; In-Play Markets:</span>
              <span className="font-mono text-blue-400">{(CONFIG.defaultMargins.propsAndInPlay * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Correct Score &amp; Exotics:</span>
              <span className="font-mono text-blue-400">{(CONFIG.defaultMargins.correctScoreAndExotics * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Cash Out Deduction Margin:</span>
              <span className="font-mono text-blue-400">{(CONFIG.cashOutMargin * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Export / Import Data */}
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
          <Download className="w-4 h-4 text-blue-400" />
          <span>Export &amp; Import Data</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleExport}
            className="py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium flex items-center justify-center gap-1.5 transition touch-target"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className="py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium flex items-center justify-center gap-1.5 transition cursor-pointer text-center touch-target">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {exportSuccess && (
          <span className="text-[11px] text-emerald-400 block text-center">
            Backup downloaded successfully.
          </span>
        )}
        {importError && (
          <span className="text-[11px] text-rose-400 block text-center">
            {importError}
          </span>
        )}
      </div>

      {/* Section 5: Settlement Debugging Log */}
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-3">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-200"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Settlement Audit Logs ({settlementLogs.length})</span>
          </div>
          <span className="text-gray-500">{showLogs ? 'Hide' : 'View'}</span>
        </button>

        {showLogs && (
          <div className="pt-2 border-t border-gray-800 max-h-48 overflow-y-auto space-y-2 text-[11px]">
            {settlementLogs.length === 0 ? (
              <span className="text-gray-500 block">No settlement events logged yet.</span>
            ) : (
              settlementLogs.map((log) => (
                <div key={log.id} className="p-2 bg-gray-950 rounded-lg border border-gray-800">
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-400">{log.betId}</span>
                    <span
                      className={`font-bold ${
                        log.outcome === 'won'
                          ? 'text-emerald-400'
                          : log.outcome === 'lost'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {log.outcome.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-400 mt-0.5">{log.details}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Responsible Use Harm Prevention Note (Section 13) */}
      <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
          <HeartHandshake className="w-4 h-4 text-blue-400" />
          <span>Responsible Gambling &amp; Support Notice</span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed">
          If betting with real money is causing harm to you, your finances, or your loved ones, talk to someone you trust or consult a qualified national support service. PaperBook is strictly for education and cannot be used with real currency.
        </p>
      </div>
    </div>
  );
};
