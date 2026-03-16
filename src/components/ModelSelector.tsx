import React from 'react';
import { AIModel } from '@/lib/models';

interface ModelSelectorProps {
  models: AIModel[];
  selected: AIModel;
  onSelect: (model: AIModel) => void;
}

export const ModelSelector = ({ models, selected, onSelect }: ModelSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {models.map((model) => {
        const isSelected = model.id === selected.id;
        return (
          <button
            key={model.id}
            onClick={() => onSelect(model)}
            className={`relative p-3 rounded-lg border text-left transition-all ${
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02]'
            }`}
          >
            {model.badge && (
              <span className={`absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                model.badge === 'NEW' ? 'bg-primary/15 text-primary' :
                model.badge === 'PRO' ? 'bg-amber-500/15 text-amber-600' :
                'bg-muted text-muted-foreground'
              }`}>
                {model.badge}
              </span>
            )}
            <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
              {model.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {model.description}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">
              {model.provider}
            </p>
          </button>
        );
      })}
    </div>
  );
};
