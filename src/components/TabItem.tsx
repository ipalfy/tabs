import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import type React from 'react';
import type { TabData } from '../hooks/useTabs';
import { Tooltip } from './ui/tooltip';

interface TabItemProps {
  tab: TabData;
  isPopupWindow: boolean;
  autoRefocusEnabled: boolean;
}

export function TabItem({ tab, isPopupWindow, autoRefocusEnabled }: TabItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `tab-${tab.id}`,
    data: { type: 'tab', tab },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const activateTab = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Activate tab and focus target window
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });

    // Auto-refocus popup if enabled and in popup context
    if (isPopupWindow && autoRefocusEnabled) {
      setTimeout(async () => {
        try {
          const currentWindow = await chrome.windows.getCurrent();
          if (currentWindow.id) {
            await chrome.windows.update(currentWindow.id, { focused: true });
          }
        } catch (_error) {
          // Popup might be closed, ignore error
        }
      }, 1000); // 1 second delay
    }
  };

  const closeTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    chrome.tabs.remove(tab.id);
  };

  const lastAccessed = tab.lastAccessed ? new Date(tab.lastAccessed).toLocaleString() : 'Unknown';

  return (
    <Tooltip
      content={
        <div className="flex flex-col gap-1">
          <span className="font-bold">{tab.title}</span>
          <span className="text-xs opacity-75">{tab.url}</span>
          <span className="text-xs text-muted-foreground pt-1 border-t border-white/20">
            Last Accessed: {lastAccessed}
          </span>
        </div>
      }
    >
      {/* biome-ignore lint/a11y/useSemanticElements: Container includes other interactive elements */}
      <div
        ref={setNodeRef}
        id={`tab-node-${tab.id}`}
        style={style}
        {...attributes}
        {...listeners}
        onClick={activateTab}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            activateTab(e as unknown as React.MouseEvent);
          }
        }}
        role="button"
        tabIndex={0}
        className={`group flex items-center gap-2 p-2 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-border transition-colors min-w-0 ${tab.active ? 'bg-secondary' : ''}`}
      >
        {tab.favIconUrl ? (
          <img src={tab.favIconUrl} alt="" className="w-4 h-4 rounded-sm" />
        ) : (
          <div className="w-4 h-4 bg-muted rounded-sm" />
        )}
        <span className="flex-1 truncate select-none">{tab.title}</span>
        <button
          type="button"
          onClick={closeTab}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-opacity"
        >
          <X size={12} />
        </button>
      </div>
    </Tooltip>
  );
}
