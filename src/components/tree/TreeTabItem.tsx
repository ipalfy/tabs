import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import type React from 'react';
import type { TabData } from '../../hooks/useTabs';
import { cn } from '../../lib/utils';

interface TreeTabItemProps {
  tab: TabData;
  isPopupWindow: boolean;
  autoRefocusEnabled: boolean;
  groupColor?: string;
}

export function TreeTabItem({ tab, isPopupWindow, autoRefocusEnabled, groupColor }: TreeTabItemProps) {
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
      }, 200); // 200ms delay (faster refocus)
    }
  };

  const closeTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    chrome.tabs.remove(tab.id);
  };

  const colorMap: Record<string, string> = {
    grey: 'border-slate-500',
    blue: 'border-blue-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    green: 'border-green-500',
    pink: 'border-pink-500',
    purple: 'border-purple-500',
    cyan: 'border-cyan-500',
    orange: 'border-orange-500',
  };

  const activeBorderClass =
    tab.active && groupColor && colorMap[groupColor]
      ? `${colorMap[groupColor]} ring-2 ring-inset` // Colored frame if grouped
      : tab.active
        ? 'ring-2 ring-inset ring-primary' // Default frame if active but no group
        : ''; // Inactive state

  return (
    // biome-ignore lint/a11y/useSemanticElements: Container includes other interactive elements
    <div
      ref={setNodeRef}
      id={`tab-node-${tab.id}`}
      style={style}
      className={cn(
        'group flex items-center gap-3 py-2 px-3 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground border-b border-border/40 bg-background transition-all duration-200',
        activeBorderClass,
        tab.active ? 'bg-muted' : '',
      )}
      onClick={activateTab}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          activateTab(e as unknown as React.MouseEvent);
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Drag Handle */}
      {/* biome-ignore lint/a11y/useSemanticElements: Drag handle requires div */}
      <div
        className="text-muted-foreground/30 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="button"
        tabIndex={0}
      >
        <GripVertical size={16} />
      </div>

      {/* Favicon */}
      {tab.favIconUrl ? (
        <img src={tab.favIconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 bg-muted rounded-sm flex-shrink-0" />
      )}

      {/* Title */}
      <span className="flex-1 truncate select-none">{tab.title}</span>

      {/* Close Button */}
      <button
        type="button"
        onClick={closeTab}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}
