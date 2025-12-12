import { Switch } from './switch';
import { Tooltip } from './tooltip';

interface AutoRefocusToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function AutoRefocusToggle({ checked, onCheckedChange, disabled }: AutoRefocusToggleProps) {
  return (
    <Tooltip content="Automatically return focus to popup after activating a tab">
      <div className="flex items-center gap-2">
        <Switch id="auto-refocus" checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        <label
          htmlFor="auto-refocus"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap hidden sm:inline-block"
        >
          Auto-refocus
        </label>
      </div>
    </Tooltip>
  );
}
