import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragOverlayProps,
  type DragStartEvent,
  defaultDropAnimationSideEffects,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GroupData, TabData, WindowData } from '../../hooks/useTabs';
import { TreeGroupItem } from '../tree/TreeGroupItem';
import { TreeTabItem } from '../tree/TreeTabItem';
import { TreeWindowItem } from '../tree/TreeWindowItem';

interface ListViewProps {
  windows: WindowData[];
  refresh: () => void;
  expandAll?: boolean | null;
}

type DragItem =
  | { type: 'tab'; tab: TabData }
  | { type: 'group'; group: GroupData }
  | { type: 'window'; window: WindowData };

export function ListView({ windows, refresh, expandAll }: ListViewProps) {
  const [_activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [isAppsCollapsed, setIsAppsCollapsed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveItem(active.data.current as DragItem);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    // --- COPY OF DRAG END LOGIC FROM BOARD VIEW ---
    // Since IDs and Data Types are consistent, this works for both views.
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeIdStr === overIdStr) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    console.log(`[ListView] Dropped ${activeType} (${activeIdStr}) over ${overType} (${overIdStr})`);

    try {
      if (activeType === 'tab') {
        const activeTab = active.data.current?.tab as TabData;
        let targetGroupId = -1;
        let targetWindowId = activeTab.windowId;
        let targetIndex = -1;

        if (overType === 'group') {
          const targetGroup = over.data.current?.group as GroupData;
          targetGroupId = targetGroup.id;
          targetWindowId = targetGroup.windowId;
        } else if (overType === 'tab') {
          const overTab = over.data.current?.tab as TabData;
          targetGroupId = overTab.groupId;
          targetWindowId = overTab.windowId;
          targetIndex = overTab.index;
        } else if (overType === 'window') {
          const targetWindow = over.data.current?.window as WindowData;
          targetWindowId = targetWindow.id;
          targetGroupId = -1;
        }

        const [sourceWin, targetWin] = await Promise.all([
          chrome.windows.get(activeTab.windowId),
          chrome.windows.get(targetWindowId),
        ]);

        if (sourceWin.type !== 'normal' || targetWin.type !== 'normal') return;

        const moveProps: chrome.tabs.MoveProperties = {
          windowId: targetWindowId,
          index: -1,
        };
        if (targetIndex !== -1) {
          moveProps.index = targetIndex;
        }

        const [movedTab] = await chrome.tabs.move(activeTab.id, moveProps);

        if (targetGroupId !== -1) {
          await chrome.tabs.group({
            tabIds: movedTab.id,
            groupId: targetGroupId,
          });
        } else if (activeTab.groupId !== -1) {
          await chrome.tabs.ungroup(movedTab.id);
        }
      }

      if (activeType === 'group') {
        const activeGroup = active.data.current?.group as GroupData;

        if (overType === 'window') {
          const targetWindow = over.data.current?.window as WindowData;
          if (activeGroup.windowId !== targetWindow.id) {
            const [sourceWin, targetWin] = await Promise.all([
              chrome.windows.get(activeGroup.windowId),
              chrome.windows.get(targetWindow.id),
            ]);
            if (sourceWin.type !== 'normal' || targetWin.type !== 'normal') return;

            await chrome.tabGroups.move(activeGroup.id, {
              windowId: targetWindow.id,
              index: -1,
            });
          }
        } else if (overType === 'group') {
          const overGroup = over.data.current?.group as GroupData;

          const [sourceWin, targetWin] = await Promise.all([
            chrome.windows.get(activeGroup.windowId),
            chrome.windows.get(overGroup.windowId),
          ]);
          if (sourceWin.type !== 'normal' || targetWin.type !== 'normal') return;

          await chrome.tabGroups.move(activeGroup.id, {
            windowId: overGroup.windowId,
            index: -1,
          });
        }
      }
    } catch (e) {
      console.error('Drag operation failed', e);
    }

    setTimeout(refresh, 200);
  };

  const dropAnimation: DragOverlayProps['dropAnimation'] = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const normalWindows = windows.filter((w) => w.type === 'normal');

  const appWindows = windows.filter((w) => w.type !== 'normal');

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 h-full overflow-y-auto max-w-4xl mx-auto">
        {appWindows.length > 0 && (
          <div className="mb-6">
            {/* biome-ignore lint/a11y/useSemanticElements: Needs to be a div for layout reasons */}
            <div
              className="flex items-center gap-2 mb-2 px-2 py-1 cursor-pointer hover:bg-muted/50 rounded-md text-xs font-bold text-muted-foreground uppercase tracking-widest border-b select-none transition-colors"
              onClick={() => setIsAppsCollapsed(!isAppsCollapsed)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsAppsCollapsed(!isAppsCollapsed);
                }
              }}
              role="button"
              tabIndex={0}
            >
              {isAppsCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              Apps & Popups
            </div>

            {!isAppsCollapsed &&
              appWindows.map((window, index) => (
                <TreeWindowItem
                  key={window.id}
                  window={window}
                  index={index + normalWindows.length}
                  expandAll={expandAll}
                  hideHeader={true}
                />
              ))}
          </div>
        )}

        {normalWindows.map((window, index) => (
          <TreeWindowItem key={window.id} window={window} index={index} expandAll={expandAll} />
        ))}

        {windows.length === 0 && <div className="text-center text-muted-foreground mt-10">No results found</div>}
      </div>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem && activeItem.type === 'tab' && (
            <div className="opacity-80">
              <TreeTabItem tab={activeItem.tab} />
            </div>
          )}
          {activeItem && activeItem.type === 'group' && (
            <div className="opacity-80">
              <TreeGroupItem group={activeItem.group} />
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
