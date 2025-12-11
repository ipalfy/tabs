import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
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
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GroupData, TabData, WindowData } from '../../hooks/useTabs';
import { GroupItem } from '../GroupItem';
import { TabItem } from '../TabItem';
import { WindowItem } from '../WindowItem';

interface BoardViewProps {
  windows: WindowData[];
  refresh: () => void;
}

type DragItem =
  | { type: 'tab'; tab: TabData }
  | { type: 'group'; group: GroupData }
  | { type: 'window'; window: WindowData };

export function BoardView({ windows, refresh }: BoardViewProps) {
  const [_activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);

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

  const handleDragOver = (_event: DragOverEvent) => {
    // Logic for moving items between containers visually during drag can go here
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeIdStr === overIdStr) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    console.log(
      `Dropped ${activeType} (${activeIdStr}) over ${overType} (${overIdStr})`,
    );

    try {
      // --- CASE 1: Moving a Tab ---
      if (activeType === 'tab') {
        const activeTab = active.data.current?.tab as TabData;
        let targetGroupId = -1;
        let targetWindowId = activeTab.windowId;
        let targetIndex = -1;

        if (overType === 'group') {
          // Dropped onto a group header -> Move to end of that group
          const targetGroup = over.data.current?.group as GroupData;
          targetGroupId = targetGroup.id;
          targetWindowId = targetGroup.windowId;
          // Index -1 means append
        } else if (overType === 'tab') {
          // Dropped onto another tab -> Reorder
          const overTab = over.data.current?.tab as TabData;
          targetGroupId = overTab.groupId;
          targetWindowId = overTab.windowId;
          targetIndex = overTab.index;
        } else if (overType === 'window') {
          // Dropped onto a window (empty space) -> Ungroup and append
          const targetWindow = over.data.current?.window as WindowData;
          targetWindowId = targetWindow.id;
          targetGroupId = -1;
        }

        // Verify Windows are Normal
        const [sourceWin, targetWin] = await Promise.all([
          chrome.windows.get(activeTab.windowId),
          chrome.windows.get(targetWindowId),
        ]);

        if (sourceWin.type !== 'normal' || targetWin.type !== 'normal') {
          console.warn('Cannot move tabs between non-normal windows.');
          return;
        }

        // 1. Move Operation
        const moveProps: chrome.tabs.MoveProperties = {
          windowId: targetWindowId,
          index: -1,
        };
        if (targetIndex !== -1) {
          moveProps.index = targetIndex;
        }

        // Execute Move
        const [movedTab] = await chrome.tabs.move(activeTab.id, moveProps);

        // 2. Group Operation
        if (targetGroupId !== -1) {
          await chrome.tabs.group({
            tabIds: movedTab.id,
            groupId: targetGroupId,
          });
        } else if (activeTab.groupId !== -1) {
          // If it was in a group, but now isn't (targetGroupId is -1), ungroup it.
          await chrome.tabs.ungroup(movedTab.id);
        }
      }

      // --- CASE 2: Moving a Group ---
      if (activeType === 'group') {
        const activeGroup = active.data.current?.group as GroupData;

        if (overType === 'window') {
          const targetWindow = over.data.current?.window as WindowData;
          if (activeGroup.windowId !== targetWindow.id) {
            // Verify Windows
            const [sourceWin, targetWin] = await Promise.all([
              chrome.windows.get(activeGroup.windowId),
              chrome.windows.get(targetWindow.id),
            ]);
            if (sourceWin.type !== 'normal' || targetWin.type !== 'normal')
              return;

            await chrome.tabGroups.move(activeGroup.id, {
              windowId: targetWindow.id,
              index: -1,
            });
          }
        } else if (overType === 'group') {
          const overGroup = over.data.current?.group as GroupData;

          // Verify Windows
          const [sourceWin, targetWin] = await Promise.all([
            chrome.windows.get(activeGroup.windowId),
            chrome.windows.get(overGroup.windowId),
          ]);
          if (sourceWin.type !== 'normal' || targetWin.type !== 'normal')
            return;

          await chrome.tabGroups.move(activeGroup.id, {
            windowId: overGroup.windowId,
            index: -1,
          });
        }
      }
    } catch (e) {
      console.error('Drag operation failed', e);
    }

    // Refresh to get new state
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 w-full overflow-x-auto h-full">
        {windows.map((window, index) => (
          <WindowItem key={window.id} window={window} index={index} />
        ))}
        {windows.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No results found
          </div>
        )}
      </div>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem && activeItem.type === 'tab' && (
            <div className="opacity-80 rotate-2 cursor-grabbing">
              <TabItem tab={activeItem.tab} />
            </div>
          )}
          {activeItem && activeItem.type === 'group' && (
            <div className="opacity-80 rotate-2 cursor-grabbing w-[300px]">
              <GroupItem group={activeItem.group} />
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
