import { useCallback, useEffect, useState } from 'react';

interface PopupSettings {
  autoRefocusEnabled: boolean;
}

const STORAGE_KEY = 'popupSettings';
const DEFAULT_SETTINGS: PopupSettings = {
  autoRefocusEnabled: true,
};

export function usePopupSettings() {
  const [isPopupWindow, setIsPopupWindow] = useState<boolean>(false);
  const [autoRefocusEnabled, setAutoRefocusEnabled] = useState<boolean>(DEFAULT_SETTINGS.autoRefocusEnabled);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Detect if current window is a popup
  useEffect(() => {
    const detectPopupWindow = async () => {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        setIsPopupWindow(currentWindow.type === 'popup');
      } catch (error) {
        console.error('Failed to detect window type:', error);
        setIsPopupWindow(false);
      }
    };

    detectPopupWindow();
  }, []);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const settings: PopupSettings = result[STORAGE_KEY] || DEFAULT_SETTINGS;
        setAutoRefocusEnabled(settings.autoRefocusEnabled);
      } catch (error) {
        console.error('Failed to load popup settings:', error);
        setAutoRefocusEnabled(DEFAULT_SETTINGS.autoRefocusEnabled);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to storage
  const updateAutoRefocusEnabled = useCallback(async (enabled: boolean) => {
    try {
      const settings: PopupSettings = { autoRefocusEnabled: enabled };
      await chrome.storage.local.set({ [STORAGE_KEY]: settings });
      setAutoRefocusEnabled(enabled);
    } catch (error) {
      console.error('Failed to save popup settings:', error);
    }
  }, []);

  return {
    isPopupWindow,
    autoRefocusEnabled,
    setAutoRefocusEnabled: updateAutoRefocusEnabled,
    isLoading,
  };
}
