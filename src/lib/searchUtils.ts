import type { GroupData, TabData, WindowData } from '../hooks/useTabs';

export function filterWindows(windows: WindowData[], query: string): WindowData[] {
  if (!query.trim()) {
    return windows;
  }

  const lowerCaseQuery = query.toLowerCase();
  const filtered: WindowData[] = [];

  for (const window of windows) {
    let windowHasMatch = false;
    const newGroups: GroupData[] = [];
    const newUngroupedTabs: TabData[] = [];

    // Check window title
    if (window.title && window.title.toLowerCase().includes(lowerCaseQuery)) {
      windowHasMatch = true;
    }

    // Filter ungrouped tabs
    for (const tab of window.ungroupedTabs) {
      if (
        tab.title.toLowerCase().includes(lowerCaseQuery) ||
        tab.url.toLowerCase().includes(lowerCaseQuery)
      ) {
        newUngroupedTabs.push(tab);
        // A match in ungrouped tabs implies the window itself has a match
        if (!windowHasMatch) { // Only set if not already matched by window title
            windowHasMatch = true;
        }
      }
    }

    // Filter groups and their tabs
    for (const group of window.groups) {
      let groupHasMatch = false;
      const newTabsInGroup: TabData[] = [];

      // Check group title
      if (group.title && group.title.toLowerCase().includes(lowerCaseQuery)) {
        groupHasMatch = true;
      }

      // Filter tabs within the group
      for (const tab of group.tabs) {
        if (
          tab.title.toLowerCase().includes(lowerCaseQuery) ||
          tab.url.toLowerCase().includes(lowerCaseQuery)
        ) {
          newTabsInGroup.push(tab);
          // A match in tabs implies the group itself has a match
          if (!groupHasMatch) { // Only set if not already matched by group title
              groupHasMatch = true;
          }
        }
      }

      // If the group itself matched (by title or its tabs), include the group
      if (groupHasMatch) {
        newGroups.push({
          ...group,
          // If group title matched, include all original tabs in group.
          // Otherwise, only include tabs that matched.
          tabs: (group.title && group.title.toLowerCase().includes(lowerCaseQuery)) ? group.tabs : newTabsInGroup,
        });
        // A match in groups implies the window itself has a match
        if (!windowHasMatch) { // Only set if not already matched by window title
            windowHasMatch = true;
        }
      }
    }

    // If the window itself matched (by title or its children), include the window
    if (windowHasMatch) {
      filtered.push({
        ...window,
        // If window title matched, include all original groups and ungrouped tabs.
        // Otherwise, only include groups and ungrouped tabs that matched.
        groups: (window.title && window.title.toLowerCase().includes(lowerCaseQuery)) ? window.groups : newGroups,
        ungroupedTabs: (window.title && window.title.toLowerCase().includes(lowerCaseQuery)) ? window.ungroupedTabs : newUngroupedTabs,
      });
    }
  }

  return filtered;
}