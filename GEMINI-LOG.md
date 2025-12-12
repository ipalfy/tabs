# 2025-12-12 12:05:00
User Report:
1. "Return focus to popup" switch stays on (state issue?).
2. "Open in new window" button missing in sidebar (logic issue).
3. Need labels for switches (UI issue).

Investigation:
- Check `usePopupSettings.ts` for state persistence and context detection.
- Check `App.tsx` for button visibility logic.
- Verify why Sidebar might be detected as Tab or neither.
