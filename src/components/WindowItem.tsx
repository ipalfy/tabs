import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Monitor } from 'lucide-react';
import type { WindowData } from '../hooks/useTabs';
import { getWindowTitle } from '../lib/utils';
import { GroupItem } from './GroupItem';
import { TabItem } from './TabItem';

interface WindowItemProps {
  window: WindowData;
  index: number;
}

export function WindowItem({ window, index }: WindowItemProps) {
  const { setNodeRef } = useDroppable({
    id: `window-${window.id}`,
    data: { type: 'window', window },
  });

  const allItems = [
    ...window.groups.map((g) => `group-${g.id}`),
    ...window.ungroupedTabs.map((t) => `tab-${t.id}`),
  ];

  const _focusWindow = () => {
    chrome.windows.update(window.id, { focused: true });
  };

  const windowTitle = getWindowTitle(window, index);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-border min-w-[300px] max-w-[350px] ${window.focused ? 'ring-2 ring-primary ring-inset' : ''}`}
    >
      <div className="p-4 border-b bg-background sticky top-0 z-10 flex items-center gap-2 font-semibold select-none">
        <Monitor
          size={18}
          className={window.focused ? 'text-primary' : 'text-muted-foreground'}
        />
        <span className="truncate" title={windowTitle}>
          {windowTitle}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <SortableContext
          items={allItems}
          strategy={verticalListSortingStrategy}
        >
          {/* Render Groups First */}
          {window.groups.map((group) => (
            <GroupItem key={group.id} group={group} />
          ))}

          {/* Then Render Ungrouped Tabs */}
          {window.ungroupedTabs.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground px-2 uppercase tracking-wider mb-2">
                Ungrouped Tabs
              </div>
              {window.ungroupedTabs.map((tab) => (
                <TabItem key={tab.id} tab={tab} />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
