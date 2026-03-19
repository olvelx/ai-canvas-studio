import React, { useState } from 'react';
import { HistoryRecord } from '@/hooks/useGenerationHistory';
import { Image as ImageIcon, Video, MessageSquare, Download, Trash2, Clock, Filter, X } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryRecord[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

type FilterType = 'all' | 'image' | 'video' | 'chat';

export const HistoryPanel = ({ history, onDelete, onClear }: HistoryPanelProps) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? history : history.filter(r => r.type === filter);

  const typeIcons: Record<string, React.ElementType> = {
    image: ImageIcon,
    video: Video,
    chat: MessageSquare,
  };
  const typeLabels: Record<string, string> = {
    image: '图片', video: '视频', chat: '对话',
  };

  const filterOptions: { id: FilterType; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'image', label: '图片' },
    { id: 'video', label: '视频' },
    { id: 'chat', label: '对话' },
  ];

  const handleDownload = (url: string, id: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `artforge-${id}`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">历史记录</h2>
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              清除全部
            </button>
          )}
        </div>
        {/* Filters */}
        <div className="flex gap-1.5">
          {filterOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === opt.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <Clock className="w-12 h-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground text-sm">暂无记录</p>
          </div>
        ) : (
          filtered.map(record => {
            const TypeIcon = typeIcons[record.type] || ImageIcon;
            return (
              <div key={record.id} className="rounded-xl border border-border bg-card p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    record.type === 'image' ? 'bg-blue-500/10 text-blue-500' :
                    record.type === 'video' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-green-500/10 text-green-500'
                  }`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{typeLabels[record.type]}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">{record.modelName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        record.status === 'completed' || record.status === 'succeeded'
                          ? 'bg-green-500/10 text-green-600'
                          : record.status === 'failed'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {record.status === 'completed' || record.status === 'succeeded' ? '成功' :
                         record.status === 'failed' ? '失败' : '处理中'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{record.prompt}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {record.resultUrl && (
                      <button
                        onClick={() => handleDownload(record.resultUrl!, record.id)}
                        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(record.id)}
                      className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Preview thumbnail */}
                {record.resultUrl && record.type === 'image' && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-border">
                    <img src={record.resultUrl} alt="" className="w-full max-h-40 object-contain bg-muted" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
