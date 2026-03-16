import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const PromptInput = ({ value, onChange }: PromptInputProps) => {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="描述你想要生成的图像，例如：一只在樱花树下的白色猫咪，水彩画风格..."
        rows={4}
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none leading-relaxed"
      />
      <p className="text-[11px] text-muted-foreground/60">
        提示：详细的描述可以获得更好的生成效果
      </p>
    </div>
  );
};
