import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CheckSquare, ChevronDown, ChevronRight, Square } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { WindowData } from '../../hooks/useTabs';
import { cn } from '../../lib/utils';
import { TreeGroupItem } from './TreeGroupItem';
import { TreeTabItem } from './TreeTabItem';

interface TreeWindowItemProps {
  window: WindowData;
  index: number;
  expandAll?: boolean | null;
  hideHeader?: boolean;
  isPopupWindow: boolean;
  autoRefocusEnabled: boolean;
}

export function TreeWindowItem({
  window,
  index,
  expandAll,
  hideHeader,
  isPopupWindow,
  autoRefocusEnabled,
}: TreeWindowItemProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (expandAll === true) setCollapsed(false);
    if (expandAll === false) setCollapsed(true);
  }, [expandAll]);

  const { setNodeRef } = useDroppable({
    id: `window-${window.id}`,
    data: { type: 'window', window },
  });

  const allItems = [...window.groups.map((g) => `group-${g.id}`), ...window.ungroupedTabs.map((t) => `tab-${t.id}`)];

  // Calculate counts for display
  const groupCount = window.groups.length;
  let tabCount = window.ungroupedTabs.length;
  for (const g of window.groups) {
    tabCount += g.tabs.length;
  }

  const isMinimized = window.state === 'minimized';

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = isMinimized ? 'normal' : 'minimized';
    chrome.windows.update(window.id, { state: newState });
  };

  const renderContent = () => (
    <div className="space-y-0">
      <SortableContext items={allItems} strategy={verticalListSortingStrategy}>
        {/* Groups */}
        {window.groups.map((group) => (
          <TreeGroupItem
            key={group.id}
            group={group}
            expandAll={expandAll}
            isPopupWindow={isPopupWindow}
            autoRefocusEnabled={autoRefocusEnabled}
          />
        ))}

        {/* Ungrouped Tabs */}
        {window.ungroupedTabs.map((tab) => (
          <TreeTabItem key={tab.id} tab={tab} />
        ))}
      </SortableContext>

      {allItems.length === 0 && <div className="pl-4 text-xs text-muted-foreground py-2 italic">Empty Window</div>}
    </div>
  );

  if (hideHeader) {
    return (
      <div ref={setNodeRef} className="mb-2">
        {renderContent()}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn('mb-6 relative pl-3 border-l-2 border-transparent', window.focused && 'border-primary')}
    >
      {/* Window Header (Pill Style) */}
      {/* biome-ignore lint/a11y/useSemanticElements: Container includes other interactive elements */}
      <div
        className="flex items-center justify-between gap-2 py-1 px-4 mb-2 cursor-pointer bg-gray-600 hover:bg-gray-500 rounded-full w-full max-w-full select-none transition-colors"
        onClick={() => setCollapsed(!collapsed)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setCollapsed(!collapsed);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <button
            type="button"
            onClick={toggleMinimize}
            className="text-white hover:text-gray-200 transition-colors"
            title={isMinimized ? 'Restore Window' : 'Minimize Window'}
          >
            {isMinimized ? <Square size={16} /> : <CheckSquare size={16} />}
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-semibold text-sm whitespace-nowrap text-white">Window {index + 1}</span>
            <span className="text-xs text-gray-200 ml-auto whitespace-nowrap hidden sm:inline-block">
              ({groupCount} Groups, {tabCount} Tabs)
            </span>
          </div>
        </div>

        <button type="button" className="text-white hover:text-gray-200">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {!collapsed && renderContent()}
    </div>
  );
}
