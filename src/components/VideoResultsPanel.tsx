import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2, Play, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface VideoTask {
  taskId: string;
  status: 'processing' | 'queued' | 'running' | 'succeeded' | 'failed' | 'expired' | 'cancelled';
  videoUrl?: string;
  lastFrameUrl?: string;
  error?: string;
  prompt: string;
  createdAt: number;
  draft?: boolean;
  draftTaskId?: string;
}

interface VideoResultsPanelProps {
  tasks: VideoTask[];
  apiKey: string;
  onTaskUpdate: (taskId: string, updates: Partial<VideoTask>) => void;
}

const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  processing: { label: '提交中', icon: Loader2, color: 'text-primary' },
  queued: { label: '排队中', icon: Clock, color: 'text-amber-500' },
  running: { label: '生成中', icon: Loader2, color: 'text-primary' },
  succeeded: { label: '已完成', icon: CheckCircle2, color: 'text-green-500' },
  failed: { label: '失败', icon: AlertCircle, color: 'text-destructive' },
  expired: { label: '已过期', icon: AlertCircle, color: 'text-muted-foreground' },
  cancelled: { label: '已取消', icon: AlertCircle, color: 'text-muted-foreground' },
};

export const VideoResultsPanel = ({ tasks, apiKey, onTaskUpdate }: VideoResultsPanelProps) => {
  const pollIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const pollTask = useCallback(async (taskId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('query-video-task', {
        body: { taskId, apiKey },
      });
      if (error) throw error;
      if (data) {
        const status = data.status;
        onTaskUpdate(taskId, {
          status,
          videoUrl: data.videoUrl,
          lastFrameUrl: data.lastFrameUrl,
          error: data.error?.message,
          draft: data.draft,
          draftTaskId: data.draftTaskId,
        });
        // 完成或失败时停止轮询
        if (['succeeded', 'failed', 'expired', 'cancelled'].includes(status)) {
          if (pollIntervals.current[taskId]) {
            clearInterval(pollIntervals.current[taskId]);
            delete pollIntervals.current[taskId];
          }
        }
      }
    } catch (err) {
      console.error('轮询任务失败:', err);
    }
  }, [apiKey, onTaskUpdate]);

  // 启动轮询
  useEffect(() => {
    tasks.forEach(task => {
      if (['processing', 'queued', 'running'].includes(task.status) && !pollIntervals.current[task.taskId]) {
        // 立即查询一次
        pollTask(task.taskId);
        // 每 5 秒轮询
        pollIntervals.current[task.taskId] = setInterval(() => pollTask(task.taskId), 5000);
      }
    });

    return () => {
      Object.values(pollIntervals.current).forEach(clearInterval);
    };
  }, [tasks, pollTask]);

  const handleDownload = (url: string, taskId: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `seedance-${taskId}.mp4`;
    a.target = '_blank';
    a.click();
  };

  if (tasks.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Play className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground text-sm">视频将在这里展示</p>
        <p className="text-muted-foreground/50 text-xs mt-1">选择模式，输入描述后点击生成</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">视频任务</h2>
        <span className="text-xs text-muted-foreground">{tasks.length} 个任务</span>
      </div>
      <div className="space-y-4">
        {tasks.map((task) => {
          const statusInfo = STATUS_MAP[task.status] || STATUS_MAP.processing;
          const StatusIcon = statusInfo.icon;
          const isSpinning = ['processing', 'queued', 'running'].includes(task.status);

          return (
            <div key={task.taskId} className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
              {/* 视频预览 */}
              {task.status === 'succeeded' && task.videoUrl ? (
                <div className="relative">
                  <video
                    src={task.videoUrl}
                    controls
                    className="w-full max-h-[400px] bg-black"
                    preload="metadata"
                  />
                  <button
                    onClick={() => handleDownload(task.videoUrl!, task.taskId)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <StatusIcon className={`w-8 h-8 ${statusInfo.color} ${isSpinning ? 'animate-spin' : ''}`} />
                    <p className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</p>
                  </div>
                </div>
              )}

              {/* 任务信息 */}
              <div className="p-4">
                <p className="text-sm text-foreground line-clamp-2">{task.prompt}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>ID: {task.taskId.substring(0, 16)}...</span>
                  {task.draft && <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 font-medium">样片</span>}
                </div>
                {task.error && (
                  <p className="text-xs text-destructive mt-2">{task.error}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
