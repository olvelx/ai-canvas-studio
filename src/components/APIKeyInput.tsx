import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

interface APIKeyInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const APIKeyInput = ({ label, placeholder, value, onChange }: APIKeyInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
      </div>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/60">
        API Key 仅在浏览器本地使用，不会存储在服务器
      </p>
    </div>
  );
};
