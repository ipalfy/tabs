import type React from 'react';
import { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}

export function Tooltip({ content, children, delay = 500 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Tooltip wrapper needs to capture hover events
    <div
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[9999] px-2 py-1 text-xs text-gray-200 bg-gray-800 rounded shadow-lg whitespace-normal break-words max-w-[300px] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          {content}
          <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}
