import React, { useState } from 'react';
import { AIModel, IMAGE_MODELS, VIDEO_MODELS, GenerationMode, ImageSize } from '@/lib/models';
import { AppSidebar } from '@/components/AppSidebar';
import { ModelSelector } from '@/components/ModelSelector';
import { APIKeyInput } from '@/components/APIKeyInput';
import { PromptInput } from '@/components/PromptInput';
import { ImageUpload } from '@/components/ImageUpload';
import { SizeSelector } from '@/components/SizeSelector';
import { ResultsPanel } from '@/components/ResultsPanel';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Image as ImageIcon, Video, MessageSquare } from 'lucide-react';

type TabType = 'image' | 'video' | 'chat';

const GeneratorPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [selectedImageModel, setSelectedImageModel] = useState<AIModel>(IMAGE_MODELS[0]);
  const [selectedVideoModel, setSelectedVideoModel] = useState<AIModel>(VIDEO_MODELS[0]);
  const [mode, setMode] = useState<GenerationMode>('text2img');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>(IMAGE_MODELS[0].sizes[0]);
  const [results, setResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentModel = activeTab === 'image' ? selectedImageModel : selectedVideoModel;
  const currentModels = activeTab === 'image' ? IMAGE_MODELS : VIDEO_MODELS;

  const handleModelSelect = (model: AIModel) => {
    if (activeTab === 'image') {
      setSelectedImageModel(model);
    } else {
      setSelectedVideoModel(model);
    }
    setSelectedSize(model.sizes[0]);
    if (!model.capabilities.includes('img2img') && mode === 'img2img') {
      setMode('text2img');
    }
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('请先输入 API Key');
      return;
    }
    if (!prompt.trim()) {
      setError('请输入文字描述');
      return;
    }
    if (mode === 'img2img' && !uploadedImage) {
      setError('请上传参考图片');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
        body: {
          model: currentModel.backendModel,
          modelId: currentModel.id,
          prompt: prompt.trim(),
          image: mode === 'img2img' ? uploadedImage : undefined,
          apiKey: apiKey.trim(),
          apiType: currentModel.apiType,
          size: selectedSize.value,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      
      if (data?.imageUrl) {
        setResults(prev => [data.imageUrl, ...prev]);
      } else if (data?.taskId) {
        // Video task - show processing message
        setError('视频生成任务已提交 (ID: ' + data.taskId + ')，请稍后查询结果');
      }
    } catch (err: any) {
      setError(err.message || '生成失败，请检查 API Key 和网络连接');
    } finally {
      setIsGenerating(false);
    }
  };

  const supportsImg2Img = currentModel.capabilities.includes('img2img');
  const modeLabel = activeTab === 'video' ? { t2: '文生视频', i2: '图生视频' } : { t2: '文生图', i2: '图生图' };

  const tabs = [
    { id: 'image' as TabType, label: '文生图 / 图生图', icon: ImageIcon },
    { id: 'video' as TabType, label: '文生视频 / 图生视频', icon: Video },
    { id: 'chat' as TabType, label: 'AI 连续对话', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Tab Bar */}
        <div className="border-b border-border bg-card/50 px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Tab Placeholder */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-muted-foreground">AI 连续对话</h2>
              <p className="text-sm text-muted-foreground/60 mt-1">即将推出，敬请期待</p>
            </div>
          </div>
        ) : (
          /* Image / Video Generation */
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Controls */}
            <div className="w-[520px] min-w-[420px] border-r border-border flex flex-col overflow-y-auto scrollbar-thin">
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    {activeTab === 'video' ? (
                      <Video className="w-5 h-5 text-primary" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-primary" />
                    )}
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
                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('text2img')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      mode === 'text2img'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {modeLabel.t2}
                  </button>
                  {supportsImg2Img && (
                    <button
                      onClick={() => setMode('img2img')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        mode === 'img2img'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      {modeLabel.i2}
                    </button>
                  )}
                </div>

                {/* Step 1: Model Selection */}
                <section>
                  <StepLabel step={1} label="选择模型" />
                  <ModelSelector
                    models={currentModels}
                    selected={currentModel}
                    onSelect={handleModelSelect}
                  />
                </section>

                {/* Step 2: API Key */}
                <section>
                  <StepLabel step={2} label="配置 API Key" />
                  <APIKeyInput
                    label={currentModel.apiKeyLabel}
                    placeholder={currentModel.apiKeyPlaceholder}
                    value={apiKey}
                    onChange={setApiKey}
                  />
                </section>

                {/* Step 3: Size Selection */}
                <section>
                  <StepLabel step={3} label={activeTab === 'video' ? '视频比例' : '图片尺寸'} />
                  <SizeSelector
                    sizes={currentModel.sizes}
                    selected={selectedSize}
                    onSelect={setSelectedSize}
                  />
                </section>

                {/* Step 4: Image Upload (img2img only) */}
                {mode === 'img2img' && (
                  <section>
                    <StepLabel step={4} label="上传参考图片" />
                    <ImageUpload onImageSelect={setUploadedImage} selectedImage={uploadedImage} />
                  </section>
                )}

                {/* Step 5: Prompt */}
                <section>
                  <StepLabel step={mode === 'img2img' ? 5 : 4} label="文字描述" />
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
              <ResultsPanel results={results} isGenerating={isGenerating} />
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
