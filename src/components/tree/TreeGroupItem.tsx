import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { GroupData } from '../../hooks/useTabs';
import { cn } from '../../lib/utils';
import { TreeTabItem } from './TreeTabItem';

interface TreeGroupItemProps {
  group: GroupData;
  expandAll?: boolean | null;
}

export function TreeGroupItem({ group, expandAll }: TreeGroupItemProps) {
  const [collapsed, setCollapsed] = useState(group.collapsed);

  useEffect(() => {
    setCollapsed(group.collapsed);
  }, [group.collapsed]);

  useEffect(() => {
    if (expandAll === true) setCollapsed(false);
    if (expandAll === false) setCollapsed(true);
  }, [expandAll]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${group.id}`, data: { type: 'group', group } });

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

  // Map for the left border line and header pill background
  const colorMap: Record<string, { border: string; bg: string; text: string }> =
    {
      grey: {
        border: 'border-slate-400',
        bg: 'bg-slate-200',
        text: 'text-slate-800',
      },
      blue: {
        border: 'border-blue-400',
        bg: 'bg-blue-200',
        text: 'text-blue-800',
      },
      red: { border: 'border-red-400', bg: 'bg-red-200', text: 'text-red-800' },
      yellow: {
        border: 'border-yellow-400',
        bg: 'bg-yellow-200',
        text: 'text-yellow-800',
      },
      green: {
        border: 'border-green-400',
        bg: 'bg-green-200',
        text: 'text-green-800',
      },
      pink: {
        border: 'border-pink-400',
        bg: 'bg-pink-200',
        text: 'text-pink-800',
      },
      purple: {
        border: 'border-purple-400',
        bg: 'bg-purple-200',
        text: 'text-purple-800',
      },
      cyan: {
        border: 'border-cyan-400',
        bg: 'bg-cyan-200',
        text: 'text-cyan-800',
      },
      orange: {
        border: 'border-orange-400',
        bg: 'bg-orange-200',
        text: 'text-orange-800',
      },
    };

  const colors = colorMap[group.color] || colorMap.grey;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('mb-2 relative pl-3', isDragging && 'z-50 opacity-50')}
    >
      {/* Colored Left Line (Connects Header and Content) */}
      <div
        className={cn(
          'absolute left-0 top-3 bottom-0 w-1 rounded-full',
          colors.border,
        )}
      />

      {/* Header */}
      {/* biome-ignore lint/a11y/useSemanticElements: Container includes other interactive elements */}
      <div
        className="flex items-center gap-2 mb-1 cursor-pointer select-none"
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
        {/* Title Pill */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-t-lg rounded-br-lg transition-colors flex-1 min-w-0',
            colors.bg,
            colors.text,
          )}
        >
          <span className="font-semibold text-sm truncate">
            {group.title || 'Unnamed Group'}
          </span>
          <span className="ml-auto text-xs opacity-70 whitespace-nowrap">
            {group.tabs.length} Tabs
          </span>
        </div>

        {/* Chevron (Outside Pill) */}
        <button
          type="button"
          className="text-muted-foreground p-1 hover:text-foreground"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Tabs List */}
      {!collapsed && (
        <div className="space-y-0">
          <SortableContext
            items={group.tabs.map((t) => `tab-${t.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {group.tabs.map((tab) => (
              <TreeTabItem key={tab.id} tab={tab} />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
