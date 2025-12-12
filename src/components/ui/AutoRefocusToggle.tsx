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
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Refocus</span>
        <Switch id="auto-refocus" checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="h-5 w-9" />
      </div>
    </Tooltip>
  );
}
