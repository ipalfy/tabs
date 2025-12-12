import { useCallback, useEffect, useState } from 'react';

interface AppSettings {
  autoRefocusEnabled: boolean;
  currentView: 'list' | 'board';
  isSortEnabled: boolean;
}

const STORAGE_KEY = 'appSettings'; // Changed key to reflect broader scope
const OLD_STORAGE_KEY = 'popupSettings'; // Migration support

const DEFAULT_SETTINGS: AppSettings = {
  autoRefocusEnabled: true,
  currentView: 'list',
  isSortEnabled: true,
};

export function usePopupSettings() {
  const [isPopupWindow, setIsPopupWindow] = useState<boolean>(false);
  const [isTab, setIsTab] = useState<boolean>(false);
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      // Parallelize context detection and settings loading
      const [currentWindow, currentTab, settingsResult, oldSettingsResult] = await Promise.all([
        chrome.windows.getCurrent().catch(() => null),
        chrome.tabs.getCurrent().catch(() => null),
        chrome.storage.local.get(STORAGE_KEY).catch(() => ({})),
        chrome.storage.local.get(OLD_STORAGE_KEY).catch(() => ({})),
      ]);

      // Context State
      setIsPopupWindow(currentWindow?.type === 'popup');
      setIsTab(!!currentTab);

      // Settings State
      let loadedSettings = settingsResult[STORAGE_KEY];

      // Migration Logic
      if (!loadedSettings && oldSettingsResult[OLD_STORAGE_KEY]) {
        loadedSettings = {
          ...DEFAULT_SETTINGS,
          autoRefocusEnabled: oldSettingsResult[OLD_STORAGE_KEY].autoRefocusEnabled,
        };
        // Migrate async (don't await)
        chrome.storage.local.set({ [STORAGE_KEY]: loadedSettings });
        chrome.storage.local.remove(OLD_STORAGE_KEY);
      }

      setSettings(loadedSettings ? { ...DEFAULT_SETTINGS, ...loadedSettings } : DEFAULT_SETTINGS);
      setIsLoading(false);
    };

    init();
  }, []);

  // Removed redundant useEffects


  // Generic update function
  const updateSetting = useCallback(async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      chrome.storage.local.set({ [STORAGE_KEY]: newSettings }).catch(err => {
        console.error("Failed to save setting:", err);
      });
      return newSettings;
    });
  }, []);

  return {
    isPopupWindow,
    isTab,
    isLoading,
    // Individual exposed values for easier consumption
    autoRefocusEnabled: settings.autoRefocusEnabled,
    currentView: settings.currentView,
    isSortEnabled: settings.isSortEnabled,
    // Setters
    setAutoRefocusEnabled: (val: boolean) => updateSetting('autoRefocusEnabled', val),
    setCurrentView: (val: 'list' | 'board') => updateSetting('currentView', val),
    setIsSortEnabled: (val: boolean) => updateSetting('isSortEnabled', val),
  };
}
