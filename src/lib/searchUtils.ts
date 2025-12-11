import Fuse from 'fuse.js';
import type { GroupData, TabData, WindowData } from '../hooks/useTabs';

const FUSE_OPTIONS = {
  threshold: 0.4,
  ignoreLocation: true,
};

export function filterWindows(
  windows: WindowData[],
  query: string,
): WindowData[] {
  if (!query.trim()) return windows;

  // Create Fuse instances for each type
  const tabFuse = new Fuse<TabData>([], {
    ...FUSE_OPTIONS,
    keys: ['title', 'url'],
  });
  const groupFuse = new Fuse<GroupData>([], {
    ...FUSE_OPTIONS,
    keys: ['title'],
  });
  const windowFuse = new Fuse<WindowData>([], {
    ...FUSE_OPTIONS,
    keys: ['id'],
  }); // Match ID for windows

  return windows.reduce((acc: WindowData[], win) => {
    // 1. Check if Window matches directly
    windowFuse.setCollection([win]);
    const windowMatches = windowFuse.search(query).length > 0;

    // 2. Process Groups
    const filteredGroups: GroupData[] = [];

    win.groups.forEach((group) => {
      groupFuse.setCollection([group]);
      const groupMatches = groupFuse.search(query).length > 0;

      if (groupMatches) {
        // If group matches, keep it AND all its tabs (context is key)
        filteredGroups.push(group);
      } else {
        // If group doesn't match, check its tabs
        tabFuse.setCollection(group.tabs);
        const matchingTabs = tabFuse.search(query).map((result) => result.item);

        if (matchingTabs.length > 0) {
          // Create a copy of the group with only matching tabs
          filteredGroups.push({ ...group, tabs: matchingTabs });
        }
      }
    });

    // 3. Process Ungrouped Tabs
    tabFuse.setCollection(win.ungroupedTabs);
    const matchingUngroupedTabs = tabFuse
      .search(query)
      .map((result) => result.item);

    // 4. Decision: Keep Window?
    if (windowMatches) {
      // If window matches, keep everything?
      // Let's adhere to "show everything in matching container" logic
      acc.push(win);
    } else if (filteredGroups.length > 0 || matchingUngroupedTabs.length > 0) {
      // Keep window with filtered content
      acc.push({
        ...win,
        groups: filteredGroups,
        ungroupedTabs: matchingUngroupedTabs,
      });
    }

    return acc;
  }, []);
}
