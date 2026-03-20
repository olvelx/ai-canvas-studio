import React, { useState, useCallback } from 'react';
import { AIModel, IMAGE_MODELS, VIDEO_MODELS, GenerationMode, ImageSize, VideoMode } from '@/lib/models';
import { AppSidebar, TabType } from '@/components/AppSidebar';
import { ModelSelector } from '@/components/ModelSelector';
import { APIKeyInput } from '@/components/APIKeyInput';
import { PromptInput } from '@/components/PromptInput';
import { ImageUpload } from '@/components/ImageUpload';
import { SizeSelector } from '@/components/SizeSelector';
import { ResultsPanel } from '@/components/ResultsPanel';
import { VideoModeSelector } from '@/components/VideoModeSelector';
import { VideoResultsPanel } from '@/components/VideoResultsPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { useGenerationHistory } from '@/hooks/useGenerationHistory';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Image as ImageIcon, Video, Volume2, VolumeX } from 'lucide-react';

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

const GeneratorPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [selectedImageModel, setSelectedImageModel] = useState<AIModel>(IMAGE_MODELS[0]);
  const [selectedVideoModel, setSelectedVideoModel] = useState<AIModel>(VIDEO_MODELS[0]);
  const [mode, setMode] = useState<GenerationMode>('text2img');
  const [videoMode, setVideoMode] = useState<VideoMode>('text2video');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [lastFrameImage, setLastFrameImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>(IMAGE_MODELS[0].sizes[0]);
  const [results, setResults] = useState<string[]>([]);
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 视频参数
  const [videoDuration, setVideoDuration] = useState('5');
  const [videoResolution, setVideoResolution] = useState('720p');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [isDraft, setIsDraft] = useState(false);

  const { history, addRecord, updateRecord, deleteRecord, clearHistory } = useGenerationHistory();

  const currentModel = activeTab === 'image' ? selectedImageModel : selectedVideoModel;
  const currentModels = activeTab === 'image' ? IMAGE_MODELS : VIDEO_MODELS;

  const handleModelSelect = (model: AIModel) => {
    if (activeTab === 'image') setSelectedImageModel(model);
    else setSelectedVideoModel(model);
    setSelectedSize(model.sizes[0]);
    if (!model.capabilities.includes('img2img') && mode === 'img2img') setMode('text2img');
  };

  const handleVideoTaskUpdate = useCallback((taskId: string, updates: Partial<VideoTask>) => {
    setVideoTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, ...updates } : t));
    // 更新历史记录
    if (updates.status === 'succeeded' && updates.videoUrl) {
      const record = history.find(r => r.taskId === taskId);
      if (record) {
        updateRecord(record.id, { status: 'succeeded', resultUrl: updates.videoUrl });
      }
    } else if (updates.status === 'failed') {
      const record = history.find(r => r.taskId === taskId);
      if (record) {
        updateRecord(record.id, { status: 'failed' });
      }
    }
  }, [history, updateRecord]);

  const handleGenerate = async () => {
    if (!apiKey.trim()) { setError('请先输入 API Key'); return; }
    if (!prompt.trim()) { setError('请输入文字描述'); return; }

    const needsImage = activeTab === 'video'
      ? ['img2video', 'img2video_first_last', 'img2video_reference'].includes(videoMode)
      : mode === 'img2img';
    if (needsImage && !uploadedImage) { setError('请上传图片'); return; }
    if (videoMode === 'img2video_first_last' && !lastFrameImage) { setError('请上传尾帧图片'); return; }

    setError(null);
    setIsGenerating(true);

    try {
      const body: any = {
        model: currentModel.backendModel,
        modelId: currentModel.id,
        prompt: prompt.trim(),
        apiKey: apiKey.trim(),
        apiType: currentModel.apiType,
        size: selectedSize.value,
      };

      if (activeTab === 'video') {
        body.videoMode = isDraft ? 'draft' : videoMode;
        body.duration = videoDuration;
        body.resolution = videoResolution;
        body.generateAudio = generateAudio;
        body.draft = isDraft;
        if (uploadedImage) body.image = uploadedImage;
        if (lastFrameImage) body.lastImage = lastFrameImage;
      } else {
        if (mode === 'img2img' && uploadedImage) body.image = uploadedImage;
      }

      const { data, error: fnError } = await supabase.functions.invoke('generate-image', { body });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        setResults(prev => [data.imageUrl, ...prev]);
        addRecord({
          type: 'image',
          modelName: currentModel.name,
          prompt: prompt.trim(),
          resultUrl: data.imageUrl,
          status: 'completed',
        });
      } else if (data?.taskId) {
        const newTask: VideoTask = {
          taskId: data.taskId,
          status: 'processing',
          prompt: prompt.trim(),
          createdAt: Date.now(),
          draft: isDraft,
        };
        setVideoTasks(prev => [newTask, ...prev]);
        addRecord({
          type: 'video',
          modelName: currentModel.name,
          prompt: prompt.trim(),
          taskId: data.taskId,
          status: 'processing',
        });
      }
    } catch (err: any) {
      setError(err.message || '生成失败，请检查 API Key 和网络连接');
    } finally {
      setIsGenerating(false);
    }
  };

  const supportsImg2Img = currentModel.capabilities.includes('img2img');

  // 判断是否需要图片上传
  const needsFirstImage = activeTab === 'video'
    ? ['img2video', 'img2video_first_last', 'img2video_reference'].includes(videoMode)
    : mode === 'img2img';
  const needsLastImage = activeTab === 'video' && videoMode === 'img2video_first_last';

  // 步骤计算
  let stepNum = 1;
  const getStep = () => stepNum++;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Tab */}
        {activeTab === 'chat' ? (
          <ChatPanel />
        ) : activeTab === 'history' ? (
          <HistoryPanel history={history} onDelete={deleteRecord} onClear={clearHistory} />
        ) : (
          /* Image / Video Generation */
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Controls */}
            <div className="w-[520px] min-w-[420px] border-r border-border flex flex-col overflow-y-auto scrollbar-thin">
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    {activeTab === 'video' ? <Video className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">
                      {activeTab === 'video' ? 'AI 视频生成' : 'AI 图像生成'}
                    </h1>
                    <p className="text-sm text-muted-foreground">选择模型，输入描述，创造精彩内容</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1">
                {/* Mode Toggle (Image tab) */}
                {activeTab === 'image' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode('text2img')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        mode === 'text2img' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" /> 文生图
                    </button>
                    {supportsImg2Img && (
                      <button
                        onClick={() => setMode('img2img')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          mode === 'img2img' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" /> 图生图
                      </button>
                    )}
                  </div>
                )}

                {/* Video Mode Selector */}
                {activeTab === 'video' && (
                  <section>
                    <StepLabel step={getStep()} label="生成模式" />
                    <VideoModeSelector mode={videoMode} onModeChange={setVideoMode} />
                  </section>
                )}

                {/* Model Selection */}
                <section>
                  <StepLabel step={getStep()} label="选择模型" />
                  <ModelSelector models={currentModels} selected={currentModel} onSelect={handleModelSelect} />
                </section>

                {/* API Key */}
                <section>
                  <StepLabel step={getStep()} label="配置 API Key" />
                  <APIKeyInput
                    label={currentModel.apiKeyLabel}
                    placeholder={currentModel.apiKeyPlaceholder}
                    value={apiKey}
                    onChange={setApiKey}
                  />
                </section>

                {/* Size Selection */}
                <section>
                  <StepLabel step={getStep()} label={activeTab === 'video' ? '视频比例' : '图片尺寸'} />
                  <SizeSelector sizes={currentModel.sizes} selected={selectedSize} onSelect={setSelectedSize} />
                </section>

                {/* Video Parameters */}
                {activeTab === 'video' && (
                  <section>
                    <StepLabel step={getStep()} label="视频参数" />
                    <div className="space-y-3">
                      {/* Duration */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground w-16 shrink-0">时长</label>
                        <select
                          value={videoDuration}
                          onChange={e => setVideoDuration(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
                        >
                          {[4,5,6,7,8,9,10,11,12].map(d => (
                            <option key={d} value={d}>{d} 秒</option>
                          ))}
                        </select>
                      </div>
                      {/* Resolution */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground w-16 shrink-0">分辨率</label>
                        <div className="flex gap-2">
                          {['480p', '720p', '1080p'].map(r => (
                            <button
                              key={r}
                              onClick={() => setVideoResolution(r)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                videoResolution === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Audio */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground w-16 shrink-0">音频</label>
                        <button
                          onClick={() => setGenerateAudio(!generateAudio)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            generateAudio ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {generateAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          {generateAudio ? '包含音频' : '静音'}
                        </button>
                      </div>
                      {/* Draft mode */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground w-16 shrink-0">样片</label>
                        <button
                          onClick={() => setIsDraft(!isDraft)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isDraft ? 'bg-amber-500 text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isDraft ? '样片模式（低成本预览）' : '正式模式'}
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* Image Upload */}
                {needsFirstImage && (
                  <section>
                    <StepLabel step={getStep()} label={
                      activeTab === 'video'
                        ? (videoMode === 'img2video_reference' ? '上传参考图片' : '上传首帧图片')
                        : '上传参考图片'
                    } />
                    <ImageUpload onImageSelect={setUploadedImage} selectedImage={uploadedImage} />
                  </section>
                )}
                {needsLastImage && (
                  <section>
                    <StepLabel step={getStep()} label="上传尾帧图片" />
                    <ImageUpload onImageSelect={setLastFrameImage} selectedImage={lastFrameImage} />
                  </section>
                )}

                {/* Prompt */}
                <section>
                  <StepLabel step={getStep()} label="文字描述" />
                  <PromptInput value={prompt} onChange={setPrompt} />
                </section>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
                    {error}
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      生成中...
                    </span>
                  ) : (
                    '开始生成'
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel - Results */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {activeTab === 'video' ? (
                <VideoResultsPanel tasks={videoTasks} apiKey={apiKey} onTaskUpdate={handleVideoTaskUpdate} />
              ) : (
                <ResultsPanel results={results} isGenerating={isGenerating} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StepLabel = ({ step, label }: { step: number; label: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
      {step}
    </span>
    <span className="text-sm font-medium text-foreground">{label}</span>
  </div>
);

export default GeneratorPage;
