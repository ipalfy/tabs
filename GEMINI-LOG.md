# 2025-12-12 12:15:00
User Report:
1. Tabs should NEVER be sorted by recency (only groups/windows?).
2. Moving a tab inside a group should sync to Chrome (logic issue?).
3. Active tab needs a visible border matching the group color, not just bold text.

Investigation:
- Check `useTabs.ts` or sorting logic in `App.tsx` regarding Recency.
- Check drag-and-drop logic in `ListView.tsx` and `BoardView.tsx` (or their shared handlers) to ensuring `chrome.tabs.move` is called with correct indices.
- Check `TreeTabItem.tsx` for active tab styling.