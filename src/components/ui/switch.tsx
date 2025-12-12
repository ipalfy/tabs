import * as React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, onChange, checked, defaultChecked, ...props }, ref) => {
    // Handle both controlled and uncontrolled usage
    // We proxy the change event to onCheckedChange for easier usage

    return (
      <label className={cn('relative inline-flex items-center cursor-pointer', className)}>
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          {...props}
        />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </label>
    );
  },
);
Switch.displayName = 'Switch';

export { Switch };
