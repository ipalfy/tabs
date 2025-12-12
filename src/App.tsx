import { ChevronsDown, ChevronsUp, ExternalLink, Kanban, ListTree, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AutoRefocusToggle } from './components/ui/AutoRefocusToggle';
import { Input } from './components/ui/input';
import { Switch } from './components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { BoardView } from './components/views/BoardView';
import { ListView } from './components/views/ListView';
import { usePopupSettings } from './hooks/usePopupSettings';
import { useTabs } from './hooks/useTabs';
import { filterWindows } from './lib/searchUtils';

function App() {
  const [isSortEnabled, setIsSortEnabled] = useState(false);
  const { windows, refresh } = useTabs(isSortEnabled);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [expandAll, setExpandAll] = useState<boolean | null>(null);
  const { isPopupWindow, autoRefocusEnabled, setAutoRefocusEnabled } = usePopupSettings();

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
    // Toggle between Expand (true) and Collapse (false)
    // If currently null (mixed), default to Collapse (false)
    setExpandAll((prev) => prev === false);
  };

  const openInNewWindow = () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width: 450,
      height: 700,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Header / Search Bar */}
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="sort-mode" checked={isSortEnabled} onCheckedChange={setIsSortEnabled} />
            <label
              htmlFor="sort-mode"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap hidden sm:inline-block"
            >
              Recency
            </label>
          </div>

          {isPopupWindow && <AutoRefocusToggle checked={autoRefocusEnabled} onCheckedChange={setAutoRefocusEnabled} />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openInNewWindow}
              className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Open in new window"
            >
              <ExternalLink size={18} />
            </button>

            <Tabs value={currentView} onValueChange={setCurrentView}>
              <TabsList>
                <TabsTrigger value="board">
                  <Kanban size={16} className="mr-2" />
                  Board
                </TabsTrigger>
                <TabsTrigger value="list">
                  <ListTree size={16} className="mr-2" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {currentView === 'list' && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                title={expandAll === false ? 'Expand All' : 'Collapse All'}
              >
                {expandAll === false ? <ChevronsDown size={18} /> : <ChevronsUp size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {currentView === 'board' ? (
          <BoardView
            windows={filteredWindows}
            refresh={refresh}
            isPopupWindow={isPopupWindow}
            autoRefocusEnabled={autoRefocusEnabled}
          />
        ) : (
          <ListView
            windows={filteredWindows}
            refresh={refresh}
            expandAll={expandAll}
            isPopupWindow={isPopupWindow}
            autoRefocusEnabled={autoRefocusEnabled}
          />
        )}
      </div>
    </div>
  );
}

export default App;
