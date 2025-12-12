import {
  ChevronsDown,
  ChevronsUp,
  ExternalLink,
  Kanban,
  ListTree,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AutoRefocusToggle } from './components/ui/AutoRefocusToggle';
import { Input } from './components/ui/input';
import { Switch } from './components/ui/switch';
import { Tooltip } from './components/ui/tooltip';

import { BoardView } from './components/views/BoardView';
import { ListView } from './components/views/ListView';
import { usePopupSettings } from './hooks/usePopupSettings';
import { useTabs } from './hooks/useTabs';
import { filterWindows } from './lib/searchUtils';

function App() {
  const [isSortEnabled, setIsSortEnabled] = useState(true);
  const { windows, refresh } = useTabs(isSortEnabled);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [expandAll, setExpandAll] = useState<boolean | null>(null);
  const { isPopupWindow, isTab, autoRefocusEnabled, setAutoRefocusEnabled } = usePopupSettings();

  const filteredWindows = useMemo(() => {
    const result = filterWindows(windows, searchQuery);
    // Move focused window to top
    result.sort((a, b) => {
      if (a.focused) return -1;
      if (b.focused) return 1;
      return 0;
    });
    return result;
  }, [windows, searchQuery]);
  const lastActiveTabId = useRef<number | null>(null);

  // --- Auto-Scroll to Active Tab ---
  useEffect(() => {
    // Find the currently active tab in the windows data
    let activeTabId: number | null = null;
    for (const win of windows) {
      for (const group of win.groups) {
        const found = group.tabs.find((t) => t.active);
        if (found) {
          activeTabId = found.id;
          break;
        }
      }
      if (!activeTabId) {
        const found = win.ungroupedTabs.find((t) => t.active);
        if (found) activeTabId = found.id;
      }
      if (activeTabId) break;
    }

    if (activeTabId && activeTabId !== lastActiveTabId.current) {
      const element = document.getElementById(`tab-node-${activeTabId}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
        lastActiveTabId.current = activeTabId;
      }
    }
  }, [windows]);

  const toggleExpandAll = () => {
    // Tri-state cycle: null (Actual) -> false (Collapse All) -> true (Expand All) -> null
    setExpandAll((prev) => {
      if (prev === null) return false;
      if (prev === false) return true;
      return null;
    });
  };

  const getExpandButtonIcon = () => {
    if (expandAll === null) return <Minimize2 size={18} />; // Next: Collapse All
    if (expandAll === false) return <Maximize2 size={18} />; // Next: Expand All
    return <ListTree size={18} />; // Next: Restore Actual
  };

  const getExpandButtonTooltip = () => {
    if (expandAll === null) return 'Collapse All';
    if (expandAll === false) return 'Expand All';
    return 'Restore Default View';
  };

  // Force expand all when searching
  const effectiveExpandAll = searchQuery ? true : expandAll;

  const openInNewWindow = async () => {
    try {
      const currentWindow = await chrome.windows.getCurrent();
      await chrome.windows.create({
        url: chrome.runtime.getURL('index.html'),
        type: 'popup',
        width: 450,
        height: 700,
        left: currentWindow.left,
        top: (currentWindow.top || 0) + (currentWindow.height || 0) + 10, // Position below current window
      });

      // If we are currently in a side panel (button is visible implies not a popup)
      // and a new popup was successfully created, hide this side panel.
      if (!isPopupWindow) {
        // Assume if button was visible and not a popup, it's a sidepanel.
        // currentWindow.id is the ID of the browser window this side panel is attached to.
        await chrome.sidePanel.hide({ windowId: currentWindow.id });
      }
    } catch (error) {
      console.error('Failed to open new window:', error);
      // Fallback if we can't get current window position
      try {
        await chrome.windows.create({
          url: chrome.runtime.getURL('index.html'),
          type: 'popup',
          width: 450,
          height: 700,
        });
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Header / Search Bar */}
      <div className="p-4 border-b flex items-center gap-4">
        <Tooltip content={getExpandButtonTooltip()}>
          <button
            type="button"
            onClick={toggleExpandAll}
            className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {getExpandButtonIcon()}
          </button>
        </Tooltip>

        <div className="relative flex-1 min-w-0">
          <Input
            placeholder="Filter windows, groups, tabs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip content="Sort by recency">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Recency</span>
              <Switch id="sort-mode" checked={isSortEnabled} onCheckedChange={setIsSortEnabled} className="h-5 w-9" />
            </div>
          </Tooltip>

          <AutoRefocusToggle checked={autoRefocusEnabled} onCheckedChange={setAutoRefocusEnabled} />

          {!isPopupWindow && (
            <Tooltip content="Open in new window">
              <button
                type="button"
                onClick={openInNewWindow}
                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink size={18} />
              </button>
            </Tooltip>
          )}

          <Tooltip content="Board view">
            <button
              type="button"
              onClick={() => setCurrentView('board')}
              className={`p-2 hover:bg-muted rounded-md transition-colors ${
                currentView === 'board' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Kanban size={18} />
            </button>
          </Tooltip>

          <Tooltip content="List view">
            <button
              type="button"
              onClick={() => setCurrentView('list')}
              className={`p-2 hover:bg-muted rounded-md transition-colors ${
                currentView === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTree size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {currentView === 'board' ? (
          <BoardView
            windows={filteredWindows}
            refresh={refresh}
            expandAll={effectiveExpandAll}
            isPopupWindow={isPopupWindow}
            autoRefocusEnabled={autoRefocusEnabled}
          />
        ) : (
          <ListView
            windows={filteredWindows}
            refresh={refresh}
            expandAll={effectiveExpandAll}
            isPopupWindow={isPopupWindow}
            autoRefocusEnabled={autoRefocusEnabled}
          />
        )}
      </div>
    </div>
  );
}

export default App;
