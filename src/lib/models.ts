export type GenerationMode = 'text2img' | 'img2img';
export type ModelCategory = 'image' | 'video' | 'chat';

export interface ImageSize {
  label: string;
  value: string; // e.g. "1024x1024" or "16:9"
  description?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  backendModel: string;
  capabilities: ('text2img' | 'img2img')[];
  category: ModelCategory;
  badge?: string;
  apiKeyPlaceholder: string;
  apiKeyLabel: string;
  apiType: 'gemini' | 'volcengine-image' | 'volcengine-video' | 'lovable';
  sizes: ImageSize[];
}

// Gemini models - use Google Gemini API directly
const GEMINI_SIZES: ImageSize[] = [
  { label: '1:1', value: '1:1', description: '正方形' },
  { label: '3:4', value: '3:4', description: '竖版' },
  { label: '4:3', value: '4:3', description: '横版' },
  { label: '9:16', value: '9:16', description: '手机竖屏' },
  { label: '16:9', value: '16:9', description: '宽屏' },
];

// Seedream sizes
const SEEDREAM_SIZES: ImageSize[] = [
  { label: '1024×1024', value: '1024x1024', description: '1:1 标准' },
  { label: '1280×720', value: '1280x720', description: '16:9 横版' },
  { label: '720×1280', value: '720x1280', description: '9:16 竖版' },
  { label: '1536×1024', value: '1536x1024', description: '3:2 横版' },
  { label: '1024×1536', value: '1024x1536', description: '2:3 竖版' },
  { label: '2048×2048', value: '2048x2048', description: '1:1 高清' },
];

// Seedance video sizes
const SEEDANCE_SIZES: ImageSize[] = [
  { label: '16:9 横屏', value: '16:9', description: '1280×720' },
  { label: '9:16 竖屏', value: '9:16', description: '720×1280' },
  { label: '1:1 方形', value: '1:1', description: '720×720' },
];

export const AI_MODELS: AIModel[] = [
  // === Image Generation Models ===
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    provider: 'Google Gemini',
    description: '基础图片编辑与生成，速度快效率高',
    backendModel: 'gemini-2.5-flash-image',
    capabilities: ['text2img', 'img2img'],
    category: 'image',
    apiKeyPlaceholder: '输入 Google Gemini API Key',
    apiKeyLabel: 'Google Gemini API Key',
    apiType: 'gemini',
    sizes: GEMINI_SIZES,
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    provider: 'Google Gemini',
    description: 'Flash 高效版，速度与质量兼顾',
    backendModel: 'gemini-3.1-flash-image-preview',
    capabilities: ['text2img', 'img2img'],
    category: 'image',
    badge: 'NEW',
    apiKeyPlaceholder: '输入 Google Gemini API Key',
    apiKeyLabel: 'Google Gemini API Key',
    apiType: 'gemini',
    sizes: GEMINI_SIZES,
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    provider: 'Google Gemini',
    description: '专业级高保真，精准中文理解输出',
    backendModel: 'gemini-3-pro-image-preview',
    capabilities: ['text2img', 'img2img'],
    category: 'image',
    badge: 'PRO',
    apiKeyPlaceholder: '输入 Google Gemini API Key',
    apiKeyLabel: 'Google Gemini API Key',
    apiType: 'gemini',
    sizes: GEMINI_SIZES,
  },
  {
    id: 'seedream-4.5',
    name: 'Seedream 4.5',
    provider: '字节跳动 / 火山引擎',
    description: '人像美化和文字方面升级',
    backendModel: 'ep-m-20260317133017-d9hzp',
    capabilities: ['text2img'],
    category: 'image',
    apiKeyPlaceholder: '输入火山引擎 API Key',
    apiKeyLabel: '火山引擎 API Key',
    apiType: 'volcengine-image',
    sizes: SEEDREAM_SIZES,
  },
  {
    id: 'seedream-5.0',
    name: 'Seedream 5.0 Lite',
    provider: '字节跳动 / 火山引擎',
    description: '响应更精准，效果更智能',
    backendModel: 'ep-m-20260306020558-r225p',
    capabilities: ['text2img'],
    category: 'image',
    badge: 'NEW',
    apiKeyPlaceholder: '输入火山引擎 API Key',
    apiKeyLabel: '火山引擎 API Key',
    apiType: 'volcengine-image',
    sizes: SEEDREAM_SIZES,
  },

  // === Video Generation Models ===
  {
    id: 'seedance-1.5',
    name: 'Seedance 1.5',
    provider: '字节跳动 / 火山引擎',
    description: '高质量AI视频生成',
    backendModel: 'doubao-seedance-1-5-pro-251215',
    capabilities: ['text2img', 'img2img'],
    category: 'video',
    badge: 'VIDEO',
    apiKeyPlaceholder: '输入火山引擎 API Key',
    apiKeyLabel: '火山引擎 API Key',
    apiType: 'volcengine-video',
    sizes: SEEDANCE_SIZES,
  },
];

export const IMAGE_MODELS = AI_MODELS.filter(m => m.category === 'image');
export const VIDEO_MODELS = AI_MODELS.filter(m => m.category === 'video');
