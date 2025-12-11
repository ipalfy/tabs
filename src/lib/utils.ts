import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { WindowData } from '../hooks/useTabs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWindowTitle(window: WindowData, index: number): string {
  const groupCount = window.groups ? window.groups.length : 0;

  let tabCount = window.ungroupedTabs ? window.ungroupedTabs.length : 0;
  if (window.groups) {
    for (const g of window.groups) {
      if (g.tabs) tabCount += g.tabs.length;
    }
  }

  return `Window ${index + 1} - ${groupCount} Groups, ${tabCount} Tabs`;
}
