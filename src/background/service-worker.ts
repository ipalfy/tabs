// Listen for the extension installation event
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Inspector installed.');
});

const POPUP_URL = chrome.runtime.getURL('index.html');
const WINDOW_STATE_KEY = 'windowState';

// Handle extension icon click
chrome.action.onClicked.addListener(async () => {
  // Check if a popup window already exists
  const tabs = await chrome.tabs.query({ url: POPUP_URL });

  if (tabs.length > 0) {
    // Focus the existing window
    const tab = tabs[0];
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
  } else {
    // Create new popup window
    try {
      // 1. Get saved state
      const storage = await chrome.storage.local.get(WINDOW_STATE_KEY);
      const savedState = storage[WINDOW_STATE_KEY];

      let createData: chrome.windows.CreateData = {
        url: POPUP_URL,
        type: 'popup',
        width: 450,
        height: 600, // Fallback default
      };

      if (savedState) {
        createData = {
          ...createData,
          left: savedState.left,
          top: savedState.top,
          width: savedState.width,
          height: savedState.height,
        };
      } else {
        // 2. Calculate default position (Top Right relative to current window)
        const currentWindow = await chrome.windows.getCurrent();
        const screenWidth = currentWindow.width || 1920;
        const screenHeight = currentWindow.height || 1080;
        const leftBase = currentWindow.left || 0;
        const topBase = currentWindow.top || 0;

        const width = 450;
        const height = Math.floor(screenHeight * 0.5);
        const left = leftBase + screenWidth - width - 50; // 50px margin from right
        const top = topBase + 50; // 50px margin from top

        createData = {
          ...createData,
          left: left,
          top: top,
          width: width,
          height: height,
        };
      }

      await chrome.windows.create(createData);
    } catch (error) {
      console.error('Failed to create popup window:', error);
      // Fallback
      await chrome.windows.create({
        url: POPUP_URL,
        type: 'popup',
        width: 450,
        height: 600,
      });
    }
  }
});

// Debounce timer for saving bounds
let saveBoundsTimer: NodeJS.Timeout | null = null;

chrome.windows.onBoundsChanged.addListener((window) => {
  if (saveBoundsTimer) clearTimeout(saveBoundsTimer);

  saveBoundsTimer = setTimeout(async () => {
    try {
      if (window.id === undefined) return;
      
      // Check if this is our popup window
      // We check if it contains our index.html
      const tabs = await chrome.tabs.query({ windowId: window.id });
      if (tabs.length > 0 && tabs[0].url === POPUP_URL) {
        const state = {
          left: window.left,
          top: window.top,
          width: window.width,
          height: window.height,
        };
        await chrome.storage.local.set({ [WINDOW_STATE_KEY]: state });
      }
    } catch (err) {
      console.error('Error saving window bounds:', err);
    }
  }, 500); // Debounce 500ms
});