# 2025-12-12 13:15:00
User Report:
1. Slow load or failure when active window has NO tab groups.
2. Refocus fails completely in this specific case.

Investigation:
- **Case: No Tab Groups:**
  - `useTabs` fetches `chrome.tabGroups.query({})`. If none exist, it returns `[]`.
  - The mapping logic in `useTabs` iterates `allGroups`. If empty, `groupMap` is empty.
  - `allTabs` iteration:
    - `if (tab.groupId > -1 && groupMap.has(tab.groupId))`
    - Tabs with `groupId === -1` (ungrouped) go to `win.ungroupedTabs`.
    - Tabs with `groupId > -1` but NOT in `groupMap` (orphaned?) go where?
      - The code currently does: `else { win.ungroupedTabs.push(...) }`.
      - So they become ungrouped. This seems correct safe logic.
  - **Why Refocus Fails?**
    - Refocus logic is in `TreeTabItem.tsx` (and `TabItem.tsx`?) inside `activateTab`.
    - It calls `chrome.windows.getCurrent()` to find the *popup* window ID and focuses it.
    - If the "Active Window" (where we clicked the tab) has no groups, why would `chrome.windows.getCurrent()` fail in the popup?
    - *Hypothesis:* Maybe the popup closes or loses context?
    - *Hypothesis:* `isPopupWindow` state might be incorrect if `detectContext` fails?
    - *Hypothesis:* `autoRefocusEnabled` might be false?

- **Why Slow Load?**
  - `useTabs` has `Promise.all` for windows, tabs, groups.
  - If `chrome.tabGroups` API hangs when empty? Unlikely.
  - **Critical Check:** Is `chrome.tabGroups` permission or API valid if no groups exist? Yes.
  - **Wait**, `windowMap` initialization:
    - `if (w.id === currentWindow.id) return; // Skip the extension's own window`
    - `currentWindow` in `useTabs` is `chrome.windows.getCurrent()`.
    - If the extension is a **detached popup**, `chrome.windows.getCurrent()` returns the **popup window itself**.
    - So we filter out the popup. This is correct.
    - But if the *target* window (the one with tabs) is somehow not being processed correctly?
    - If `allWindows` contains the target window, it should be processed.

- **Refocus Issue Detail:**
  - `TreeTabItem.tsx`:
    ```typescript
    if (isPopupWindow && autoRefocusEnabled) {
      setTimeout(async () => {
        try {
          const currentWindow = await chrome.windows.getCurrent(); // <--- THIS
          if (currentWindow.id) {
             await chrome.windows.update(currentWindow.id, { focused: true });
          }
        } ...
    ```
    - When we click a tab in the list, we activate it: `chrome.tabs.update(..., {active:true})` and `chrome.windows.update(..., {focused:true})`.
    - This steals focus *away* from the popup immediately.
    - The code continues running (async/timeout).
    - Then it tries to get `currentWindow`.
    - **CRITICAL:** `chrome.windows.getCurrent()` returns the **currently focused window** by default (or the window the script is running in?).
      - In a background script/service worker, it might be ambiguous.
      - In a popup/page script: It *should* return the window where the script is running.
      - *However*, if focus has shifted to the browser window, `chrome.windows.getCurrent()` might return the *browser* window depending on implementation details or if the popup is considered "blurred".
      - **Documentation says:** "The current window is the window that contains the code that is currently executing. It's important to realize that this can be different from the focused window."
      - So `getCurrent()` *should* return the popup.
    - **BUT**, if the popup is closed?
      - If it's a *detached window* (type='popup'), it stays open even if focus is lost.
      - So `getCurrent` should work.

- **Why specifically "No Tab Groups"?**
  - Maybe `useTabs` fails or errors out, causing `windows` to be empty or stale?
  - If `useTabs` fails, `windows` is empty. The UI might show "No results".
  - If "Slow load", maybe it's retrying?
  - Let's check `useTabs` logic again for potential errors when groups are empty.
  - `const groupMap = new Map<number, GroupData>();` -> `allGroups` is empty array. Map is empty.
  - `allTabs.forEach` -> `tab.groupId` might be `-1`.
  - `if (tab.groupId > -1 && groupMap.has(tab.groupId))` -> False.
  - `else { win.ungroupedTabs.push(...) }`.
  - This looks solid.

- **Alternative Theory:** `detectContext` in `usePopupSettings`?
  - `chrome.windows.getCurrent()`
  - If the popup is slow to initialize?

- **User said:** "Also in these case refocus does not work at all."
  - This strongly implies the popup might not be realizing it IS a popup, or `autoRefocusEnabled` is effectively false/stale.
  - OR, the `setTimeout` of 200ms is *too fast* and the focus switch hasn't fully registered/stabilized, or the OS prevents stealing focus back so quickly?
  - But if it works *with* tab groups, why fail *without*?
  - Maybe the layout/rendering is different?
  - If "No Tab Groups", we render a list of `TreeWindowItem`s which contain `TreeTabItem`s.
  - The structure is slightly different (ungrouped tabs vs grouped).
  - **Wait!** Ungrouped tabs use `TreeTabItem`. Tabs in groups use `TreeTabItem`.
  - **Wait!** `TreeWindowItem` renders:
    ```typescript
    {window.groups.map(...)}
    {window.ungroupedTabs.map(...)}
    ```
  - Both use `TreeTabItem`.
  - **Check `TreeTabItem` props:**
    - `isPopupWindow` and `autoRefocusEnabled` are passed down.
    - In `TreeWindowItem.tsx`:
      ```typescript
      <TreeGroupItem ... />
      <TreeTabItem ... />
      ```
    - **Check `TreeWindowItem.tsx`:**
      - Does it pass the props to `TreeTabItem` for *ungrouped* tabs?
      - Let's verify.

  - **Also Check:** `ListView.tsx` passes props to `TreeWindowItem`.
  - **Also Check:** `App.tsx` passes props to `ListView`.

  - **Slow Load:**
    - If `useTabs` is slow?
    - Maybe `chrome.tabGroups.query({})` is slow if empty? (Unlikely)
    - Maybe `chrome.tabs.query({})` returning many tabs?

  - **Let's Verify Prop Passing First.**
    - If `TreeWindowItem` fails to pass `autoRefocusEnabled` to ungrouped tabs, that explains why refocus fails specifically for windows with no groups (only ungrouped tabs).

