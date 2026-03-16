import React from 'react';
import { Download, ImageIcon } from 'lucide-react';

interface ResultsPanelProps {
  results: string[];
  isGenerating: boolean;
}

export const ResultsPanel = ({ results, isGenerating }: ResultsPanelProps) => {
  const handleDownload = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `artforge-${Date.now()}-${index}.png`;
    a.click();
  };

  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">我的创作</h2>
        {results.length > 0 && (
          <span className="text-xs text-muted-foreground">{results.length} 张图片</span>
        )}
      </div>

      {results.length === 0 && !isGenerating ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground text-sm">您的创作将在这里实时呈现</p>
          <p className="text-muted-foreground/50 text-xs mt-1">选择模型、输入描述后点击生成</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isGenerating && (
            <div className="aspect-square rounded-xl bg-muted border border-border flex items-center justify-center animate-fade-in">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">正在生成...</p>
              </div>
            </div>
          )}
          {results.map((url, i) => (
            <div key={i} className="group relative rounded-xl overflow-hidden border border-border bg-card animate-fade-in shadow-card">
              <img src={url} alt={`Generated ${i + 1}`} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-all flex items-end justify-end p-3">
                <button
                  onClick={() => handleDownload(url, i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card shadow-sm"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
