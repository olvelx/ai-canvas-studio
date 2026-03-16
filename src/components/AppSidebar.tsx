import React from 'react';
import { Sparkles, Image, Palette, Wand2 } from 'lucide-react';

const navItems = [
  { icon: Sparkles, label: 'AI 图像生成', active: true },
  { icon: Image, label: '图生图', active: false },
  { icon: Palette, label: '风格迁移', active: false, disabled: true },
  { icon: Wand2, label: '智能修图', active: false, disabled: true },
];

export const AppSidebar = () => {
  return (
    <aside className="w-[220px] min-w-[220px] bg-sidebar-bg flex flex-col border-r border-border/50">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-hover">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-primary-foreground">ArtForge</h2>
            <p className="text-xs text-sidebar-fg">AI 创作平台</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="px-3 py-2 text-xs font-medium text-sidebar-fg/60 uppercase tracking-wider">创作工具</p>
        {navItems.map((item) => (
          <button
            key={item.label}
            disabled={item.disabled}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              item.active
                ? 'bg-sidebar-active/15 text-sidebar-active font-medium'
                : item.disabled
                ? 'text-sidebar-fg/30 cursor-not-allowed'
                : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-primary-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            {item.disabled && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-sidebar-hover text-sidebar-fg/40">
                即将推出
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-hover">
        <p className="text-xs text-sidebar-fg/40 text-center">
          ArtForge v1.0
        </p>
      </div>
    </aside>
  );
};
