import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { GroupData } from '../hooks/useTabs';
import { cn } from '../lib/utils';
import { TabItem } from './TabItem';

interface GroupItemProps {
  group: GroupData;
  isPopupWindow: boolean;
  autoRefocusEnabled: boolean;
}

export function GroupItem({ group, isPopupWindow, autoRefocusEnabled }: GroupItemProps) {
  const [collapsed, setCollapsed] = useState(group.collapsed);

  useEffect(() => {
    setCollapsed(group.collapsed);
  }, [group.collapsed]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group-${group.id}`,
    data: { type: 'group', group },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !collapsed;
    setCollapsed(newState);
    chrome.tabGroups.update(group.id, { collapsed: newState });
  };

  const colorMap: Record<string, string> = {
    grey: 'bg-slate-200 border-slate-300',
    blue: 'bg-blue-200 border-blue-300',
    red: 'bg-red-200 border-red-300',
    yellow: 'bg-yellow-200 border-yellow-300',
    green: 'bg-green-200 border-green-300',
    pink: 'bg-pink-200 border-pink-300',
    purple: 'bg-purple-200 border-purple-300',
    cyan: 'bg-cyan-200 border-cyan-300',
    orange: 'bg-orange-200 border-orange-300',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('mb-2 rounded-lg border bg-card text-card-foreground shadow-sm', isDragging && 'z-50')}
    >
      {/* Header */}
      {/* biome-ignore lint/a11y/useSemanticElements: Container includes other interactive elements */}
      <div
        className={cn(
          'flex items-center gap-2 p-3 cursor-pointer select-none rounded-t-lg transition-colors hover:bg-muted/50',
          colorMap[group.color] || 'bg-secondary',
        )}
        onClick={toggleCollapse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleCollapse(e as unknown as React.MouseEvent);
          }
        }}
        role="button"
        tabIndex={0}
        {...attributes}
        {...listeners}
      >
        <span className="cursor-grab active:cursor-grabbing text-muted-foreground">
          <GripVertical size={16} />
        </span>
        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        <span className="font-medium text-sm flex-1">{group.title || 'Unnamed Group'}</span>
        <span className="ml-auto text-xs text-muted-foreground">{group.tabs.length} tabs</span>
      </div>

      {/* Tabs List */}
      {!collapsed && (
        <div className="p-2 space-y-1">
          <SortableContext items={group.tabs.map((t) => `tab-${t.id}`)} strategy={verticalListSortingStrategy}>
            {group.tabs.map((tab) => (
              <TabItem key={tab.id} tab={tab} isPopupWindow={isPopupWindow} autoRefocusEnabled={autoRefocusEnabled} />
            ))}
            {group.tabs.length === 0 && (
              <div className="text-xs text-center text-muted-foreground py-2 italic">Empty group</div>
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
