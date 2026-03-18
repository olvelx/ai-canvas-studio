import React from 'react';
import { ImageSize } from '@/lib/models';

interface SizeSelectorProps {
  sizes: ImageSize[];
  selected: ImageSize;
  onSelect: (size: ImageSize) => void;
}

export const SizeSelector = ({ sizes, selected, onSelect }: SizeSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const isSelected = size.value === selected.value;
        return (
          <button
            key={size.value}
            onClick={() => onSelect(size)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40'
            }`}
          >
            <span>{size.label}</span>
            {size.description && (
              <span className="ml-1 text-[10px] opacity-60">{size.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
