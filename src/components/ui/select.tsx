'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  error?: string;
}

function Select({ options, value: controlledValue, onChange, placeholder, label, className, error }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(controlledValue ?? '');
  const [mounted, setMounted] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0, width: 0 });

  React.useEffect(() => { setMounted(true); }, []);

  // Sync internal value when controlled value changes
  React.useEffect(() => {
    if (controlledValue !== undefined) setInternalValue(controlledValue);
  }, [controlledValue]);

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedLabel = options.find(o => o.value === currentValue)?.label || placeholder || 'Select...';

  // Click outside handler
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Also check if the click is on the portal dropdown
        const dropdown = document.getElementById('select-dropdown-portal');
        if (dropdown && dropdown.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // ESC key handler
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Calculate dropdown position
  const updatePosition = React.useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Recalculate on open and on scroll/resize
  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const handleSelect = (val: string) => {
    setInternalValue(val);
    onChange?.(val);
    setOpen(false);
  };

  const handleToggle = () => {
    if (!open) updatePosition();
    setOpen(!open);
  };

  const dropdown = open && mounted ? createPortal(
    <div
      id="select-dropdown-portal"
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 9999,
      }}
    >
      <div
        className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_12px_36px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden overflow-y-auto"
        style={{ animation: 'selectFadeIn 0.15s ease-out', maxHeight: '220px' }}
      >
        {options.map((opt) => {
          const isActive = currentValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                'flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition-colors cursor-pointer',
                isActive
                  ? 'bg-[rgba(24,104,150,0.08)] text-[#8B7355] font-medium'
                  : 'text-[var(--fg)] hover:bg-[var(--bg-secondary)]'
              )}
            >
              {opt.label}
              {isActive && <Check className="h-4 w-4 text-[#8B7355]" />}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="w-full" ref={ref}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-[var(--fg)]">{label}</label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--fg)] transition-all cursor-pointer',
            'hover:border-[var(--fg-muted)]',
            open && 'ring-2 ring-[rgba(24,104,150,0.3)] border-[rgba(24,104,150,0.4)]',
            error && 'border-danger ring-danger',
            className
          )}
        >
          <span className={cn('truncate', !currentValue && placeholder ? 'text-[var(--fg-muted)]' : '')}>
            {selectedLabel}
          </span>
          <ChevronDown className={cn(
            'h-4 w-4 text-[var(--fg-muted)] transition-transform duration-200 shrink-0 ml-1',
            open && 'rotate-180'
          )} />
        </button>
        {dropdown}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export { Select, type SelectOption };
