import React from 'react';
import { Sparkles, Image, Video, MessageSquare, Clock } from 'lucide-react';

export type TabType = 'image' | 'video' | 'chat' | 'history';

const navItems = [
  { id: 'image' as TabType, icon: Image, label: 'AI 图像生成' },
  { id: 'video' as TabType, icon: Video, label: 'AI 视频生成' },
  { id: 'chat' as TabType, icon: MessageSquare, label: 'AI 连续对话' },
  { id: 'history' as TabType, icon: Clock, label: '历史记录' },
];

interface AppSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const AppSidebar = ({ activeTab, onTabChange }: AppSidebarProps) => {
  return (
    <aside className="w-[220px] min-w-[220px] bg-sidebar-bg flex flex-col border-r border-border/50">
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
      <nav className="flex-1 p-3 space-y-1">
        <p className="px-3 py-2 text-xs font-medium text-sidebar-fg/60 uppercase tracking-wider">创作工具</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              activeTab === item.id
                ? 'bg-sidebar-active/15 text-sidebar-active font-medium'
                : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-primary-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-hover">
        <p className="text-xs text-sidebar-fg/40 text-center">ArtForge v1.0</p>
      </div>
    </aside>
  );
};
