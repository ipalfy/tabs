import { useCallback, useEffect, useState } from 'react';

export interface TabData extends chrome.tabs.Tab {
  id: number;
}

export interface GroupData extends chrome.tabGroups.TabGroup {
  id: number;
  tabs: TabData[];
}

export interface WindowData extends chrome.windows.Window {
  id: number;
  groups: GroupData[];
  ungroupedTabs: TabData[];
}

export function useTabs(sortEnabled: boolean = false) {
  const [windows, setWindows] = useState<WindowData[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [allWindows, allTabs, allGroups, currentWindow] = await Promise.all([
        chrome.windows.getAll(),
        chrome.tabs.query({}),
        chrome.tabGroups.query({}),
        chrome.windows.getCurrent(),
      ]);

      const groupMap = new Map<number, GroupData>();
      allGroups.forEach((g) => {
        groupMap.set(g.id, { ...g, tabs: [] });
      });

      const windowMap = new Map<number, WindowData>();
      allWindows.forEach((w) => {
        if (w.id === currentWindow.id) return; // Skip the extension's own window
        if (w.id && (w.type === 'normal' || w.type === 'app' || w.type === 'popup')) {
          windowMap.set(w.id, {
            ...w,
            id: w.id,
            groups: [],
            ungroupedTabs: [],
          });
        }
      });

      allTabs.forEach((tab) => {
        if (!tab.id || !tab.windowId) return;

        const win = windowMap.get(tab.windowId);
        if (!win) return;

        if (tab.groupId > -1 && groupMap.has(tab.groupId)) {
          // Tab belongs to a group
          // biome-ignore lint/style/noNonNullAssertion: Checked with has() above
          const group = groupMap.get(tab.groupId)!;
          group.tabs.push(tab as TabData);
        } else {
          // Tab is ungrouped
          win.ungroupedTabs.push(tab as TabData);
        }
      });

      // Assign groups to their respective windows
      allGroups.forEach((g) => {
        const groupWithTabs = groupMap.get(g.id);
        if (groupWithTabs && windowMap.has(g.windowId)) {
          windowMap.get(g.windowId)?.groups.push(groupWithTabs);
        }
      });

      // --- SORTING LOGIC ---
      let sortedWindows = Array.from(windowMap.values());

      if (sortEnabled) {
        const getRecency = (tabs: TabData[]): number => {
          if (!tabs || tabs.length === 0) return 0;
          return Math.max(...tabs.map((t) => t.lastAccessed || 0));
        };

        sortedWindows = sortedWindows.map((window) => {
          // 1. Sort Tabs within Groups
          window.groups.forEach((group) => {
            group.tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
          });

          // 2. Sort Groups within Window (by most recent tab in group)
          window.groups.sort((a, b) => getRecency(b.tabs) - getRecency(a.tabs));

          // 3. Sort Ungrouped Tabs within Window
          window.ungroupedTabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

          return window;
        });

        // 4. Sort Windows (by most recent content)
        sortedWindows.sort((a, b) => {
          const recencyA = Math.max(getRecency(a.ungroupedTabs), ...a.groups.map((g) => getRecency(g.tabs)));
          const recencyB = Math.max(getRecency(b.ungroupedTabs), ...b.groups.map((g) => getRecency(g.tabs)));
          return recencyB - recencyA;
        });
      } else {
        // Browser Default Order (Index-based)
        sortedWindows = sortedWindows.map((window) => {
          // 1. Sort Tabs within Groups by Index
          window.groups.forEach((group) => {
            group.tabs.sort((a, b) => a.index - b.index);
          });

          // 2. Sort Groups by the index of their first tab (approximate visual order)
          window.groups.sort((a, b) => {
            const minIndexA = a.tabs.length > 0 ? Math.min(...a.tabs.map((t) => t.index)) : Infinity;
            const minIndexB = b.tabs.length > 0 ? Math.min(...b.tabs.map((t) => t.index)) : Infinity;
            return minIndexA - minIndexB;
          });

          // 3. Sort Ungrouped Tabs by Index
          window.ungroupedTabs.sort((a, b) => a.index - b.index);

          return window;
        });
        // Windows are left in the order returned by chrome.windows.getAll() (which is roughly z-order or creation)
      }

      setWindows(sortedWindows);
    } catch (error) {
      console.error('Error fetching tab data:', error);
    }
  }, [sortEnabled]);

  useEffect(() => {
    fetchData();

    // Listeners for updates
    const listeners = [
      chrome.tabs.onCreated,
      chrome.tabs.onUpdated,
      chrome.tabs.onMoved,
      chrome.tabs.onActivated,
      chrome.tabs.onDetached,
      chrome.tabs.onAttached,
      chrome.tabs.onRemoved,
      chrome.tabGroups.onCreated,
      chrome.tabGroups.onUpdated,
      chrome.tabGroups.onMoved,
      chrome.tabGroups.onRemoved,
      chrome.windows.onCreated,
      chrome.windows.onRemoved,
      chrome.windows.onFocusChanged,
      chrome.windows.onBoundsChanged,
    ];

    const handleUpdate = () => fetchData();

    listeners.forEach((l) => {
      l.addListener(handleUpdate);
    });

    return () => {
      listeners.forEach((l) => {
        l.removeListener(handleUpdate);
      });
    };
  }, [fetchData]);

  return { windows, refresh: fetchData };
}
