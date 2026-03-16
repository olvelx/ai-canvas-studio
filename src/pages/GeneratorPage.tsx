import React, { useState } from 'react';
import { AIModel, AI_MODELS, GenerationMode } from '@/lib/models';
import { AppSidebar } from '@/components/AppSidebar';
import { ModelSelector } from '@/components/ModelSelector';
import { APIKeyInput } from '@/components/APIKeyInput';
import { PromptInput } from '@/components/PromptInput';
import { ImageUpload } from '@/components/ImageUpload';
import { ResultsPanel } from '@/components/ResultsPanel';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

const GeneratorPage = () => {
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [mode, setMode] = useState<GenerationMode>('text2img');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          model: selectedModel.backendModel,
          modelId: selectedModel.id,
          prompt: prompt.trim(),
          image: mode === 'img2img' ? uploadedImage : undefined,
          apiKey: apiKey.trim(),
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setResults(prev => [data.imageUrl, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || '生成失败，请检查 API Key 和网络连接');
    } finally {
      setIsGenerating(false);
    }
  };

  const supportsImg2Img = selectedModel.capabilities.includes('img2img');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-[520px] min-w-[420px] border-r border-border flex flex-col overflow-y-auto scrollbar-thin">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">AI 图像生成</h1>
                <p className="text-sm text-muted-foreground">选择模型，输入描述，创造精彩图像</p>
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
                文生图
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
                  图生图
                </button>
              )}
            </div>

            {/* Step 1: Model Selection */}
            <section>
              <StepLabel step={1} label="选择模型" />
              <ModelSelector
                models={AI_MODELS}
                selected={selectedModel}
                onSelect={(m) => {
                  setSelectedModel(m);
                  if (!m.capabilities.includes('img2img') && mode === 'img2img') {
                    setMode('text2img');
                  }
                }}
              />
            </section>

            {/* Step 2: API Key */}
            <section>
              <StepLabel step={2} label="配置 API Key" />
              <APIKeyInput
                label={selectedModel.apiKeyLabel}
                placeholder={selectedModel.apiKeyPlaceholder}
                value={apiKey}
                onChange={setApiKey}
              />
            </section>

            {/* Step 3: Image Upload (img2img only) */}
            {mode === 'img2img' && (
              <section>
                <StepLabel step={3} label="上传参考图片" />
                <ImageUpload onImageSelect={setUploadedImage} selectedImage={uploadedImage} />
              </section>
            )}

            {/* Step 4: Prompt */}
            <section>
              <StepLabel step={mode === 'img2img' ? 4 : 3} label="文字描述" />
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
