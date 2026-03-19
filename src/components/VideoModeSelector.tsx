import React from 'react';
import { VideoMode } from '@/lib/models';
import { Film, Image, Images, Palette, Zap } from 'lucide-react';

interface VideoModeSelectorProps {
  mode: VideoMode;
  onModeChange: (mode: VideoMode) => void;
}

const VIDEO_MODE_OPTIONS: { id: VideoMode; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'text2video', label: '文生视频', icon: Film, desc: '纯文字描述生成视频' },
  { id: 'img2video', label: '首帧生成', icon: Image, desc: '基于首帧图片生成视频' },
  { id: 'img2video_first_last', label: '首尾帧', icon: Images, desc: '基于首帧和尾帧生成' },
  { id: 'img2video_reference', label: '参考图', icon: Palette, desc: '基于参考图风格生成' },
  { id: 'draft', label: '样片模式', icon: Zap, desc: '快速预览，低成本试看' },
];

export const VideoModeSelector = ({ mode, onModeChange }: VideoModeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {VIDEO_MODE_OPTIONS.map((opt) => {
        const isSelected = opt.id === mode;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            onClick={() => onModeChange(opt.id)}
            className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02]'
            }`}
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{opt.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
