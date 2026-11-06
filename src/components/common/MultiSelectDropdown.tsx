import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
  badge?: string;
  color?: string;
}

export interface MultiSelectDropdownProps {
  label?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  allLabel?: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  buttonClassName?: string;
  maxVisibleTags?: number;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  icon,
  placeholder = 'Pilih opsi...',
  allLabel = 'Semua',
  options = [],
  selectedValues = [],
  onChange,
  searchable = false,
  searchPlaceholder = 'Cari...',
  className = '',
  buttonClassName = '',
  maxVisibleTags = 1,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(term) || opt.value.toLowerCase().includes(term));
  }, [options, searchTerm]);

  // Toggle single option
  const handleToggleOption = (value: string) => {
    const exists = selectedValues.some((v) => v.toLowerCase() === value.toLowerCase());
    if (exists) {
      onChange(selectedValues.filter((v) => v.toLowerCase() !== value.toLowerCase()));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  // Select all visible options
  const handleSelectAll = () => {
    const allVisibleValues = filteredOptions.map((opt) => opt.value);
    const set = new Set([...selectedValues, ...allVisibleValues]);
    onChange(Array.from(set));
  };

  // Clear all selections
  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  const selectedCount = selectedValues.length;

  // Display text on the button
  const buttonDisplay = useMemo(() => {
    if (selectedCount === 0) {
      return (
        <span className="text-slate-600 truncate font-normal">
          {allLabel}
        </span>
      );
    }

    if (selectedCount === 1) {
      const match = options.find((o) => o.value.toLowerCase() === selectedValues[0].toLowerCase());
      const label = match ? match.label : selectedValues[0];
      return (
        <span className="text-slate-900 font-semibold truncate flex items-center gap-1">
          <span className="truncate">{label}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1.5 truncate">
        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold shrink-0">
          {selectedCount}
        </span>
        <span className="text-slate-900 font-semibold truncate text-[11px]">
          {selectedValues.slice(0, maxVisibleTags).join(', ')}
          {selectedCount > maxVisibleTags && ` +${selectedCount - maxVisibleTags}`}
        </span>
      </div>
    );
  }, [selectedCount, selectedValues, options, allLabel, maxVisibleTags]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-slate-600 font-medium mb-1 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1">
            {icon}
            {label}
          </span>
          {selectedCount > 0 && (
            <span className="text-[10px] font-mono text-blue-600 font-semibold">
              ({selectedCount} aktif)
            </span>
          )}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-left flex items-center justify-between gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
          selectedCount > 0
            ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-300/40'
            : ''
        } ${buttonClassName}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
          {buttonDisplay}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {selectedCount > 0 && (
            <span
              onClick={handleClearAll}
              className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Reset pilihan ini"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden text-xs animate-in fade-in duration-150 min-w-[200px] max-w-sm sm:max-w-none">
          {/* Quick Header: Search & Bulk Action */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80 space-y-1.5">
            {searchable && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Quick Bulk Action Buttons */}
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
              >
                Pilih Semua
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-rose-600 hover:text-rose-800 hover:underline font-semibold cursor-pointer"
                >
                  Hapus Semua ({selectedCount})
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.some(
                  (v) => v.toLowerCase() === opt.value.toLowerCase()
                );

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleOption(opt.value)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-slate-700 ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {opt.color && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: opt.color }}
                        ></span>
                      )}

                      <span className="truncate text-xs">{opt.label}</span>
                    </div>

                    {typeof opt.count === 'number' && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {opt.count}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                Tidak ada opsi yang cocok
              </div>
            )}
          </div>

          {/* Footer showing summary */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {selectedCount > 0 ? `${selectedCount} opsi terpilih` : 'Semua dipilih'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
