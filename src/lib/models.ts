export type GenerationMode = 'text2img' | 'img2img';
export type VideoMode = 'text2video' | 'img2video' | 'img2video_first_last' | 'img2video_reference';
export type ModelCategory = 'image' | 'video' | 'chat';

export interface ImageSize {
  label: string;
  value: string;
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
  videoModes?: VideoMode[];
}

// ===================== 尺寸配置 =====================
const SIZE_1K: ImageSize[] = [
  { label: '1:1 (1K)', value: '1024x1024', description: '1K 正方形' },
  { label: '4:3 (1K)', value: '1152x864', description: '1K 横版' },
  { label: '3:4 (1K)', value: '864x1152', description: '1K 竖版' },
  { label: '16:9 (1K)', value: '1280x720', description: '1K 宽屏' },
  { label: '9:16 (1K)', value: '720x1280', description: '1K 手机竖屏' },
  { label: '3:2 (1K)', value: '832x1248', description: '1K 摄影横版' },
  { label: '2:3 (1K)', value: '1248x832', description: '1K 摄影竖版' },
  { label: '21:9 (1K)', value: '1512x648', description: '1K 超宽屏' },
];

const SIZE_2K: ImageSize[] = [
  { label: '1:1 (2K)', value: '2048x2048', description: '2K 正方形' },
  { label: '4:3 (2K)', value: '2304x1728', description: '2K 横版' },
  { label: '3:4 (2K)', value: '1728x2304', description: '2K 竖版' },
  { label: '16:9 (2K)', value: '2848x1600', description: '2K 宽屏' },
  { label: '9:16 (2K)', value: '1600x2848', description: '2K 手机竖屏' },
  { label: '3:2 (2K)', value: '2496x1664', description: '2K 摄影横版' },
  { label: '2:3 (2K)', value: '1664x2496', description: '2K 摄影竖版' },
  { label: '21:9 (2K)', value: '3136x1344', description: '2K 超宽屏' },
];

const SIZE_3K: ImageSize[] = [
  { label: '1:1 (3K)', value: '3072x3072', description: '3K 正方形' },
  { label: '4:3 (3K)', value: '3456x2592', description: '3K 横版' },
  { label: '3:4 (3K)', value: '2592x3456', description: '3K 竖版' },
  { label: '16:9 (3K)', value: '4096x2304', description: '3K 宽屏' },
  { label: '9:16 (3K)', value: '2304x4096', description: '3K 手机竖屏' },
  { label: '3:2 (3K)', value: '3744x2496', description: '3K 摄影横版' },
  { label: '2:3 (3K)', value: '2496x3744', description: '3K 摄影竖版' },
  { label: '21:9 (3K)', value: '4704x2016', description: '3K 超宽屏' },
];

const SIZE_4K: ImageSize[] = [
  { label: '1:1 (4K)', value: '4096x4096', description: '4K 正方形' },
  { label: '3:4 (4K)', value: '3520x4704', description: '4K 竖版' },
  { label: '4:3 (4K)', value: '4704x3520', description: '4K 横版' },
  { label: '16:9 (4K)', value: '5504x3040', description: '4K 宽屏' },
  { label: '9:16 (4K)', value: '3040x5504', description: '4K 手机竖屏' },
  { label: '2:3 (4K)', value: '3328x4992', description: '4K 摄影竖版' },
  { label: '3:2 (4K)', value: '4992x3328', description: '4K 摄影横版' },
  { label: '21:9 (4K)', value: '6240x2656', description: '4K 超宽屏' },
];

const GEMINI_NANO_BANANA_SIZES = SIZE_1K;
const GEMINI_NANO_BANANA_PRO_SIZES = [...SIZE_1K, ...SIZE_2K, ...SIZE_4K];
const SEEDREAM_4_5_SIZES = [...SIZE_2K, ...SIZE_4K];
const SEEDREAM_5_0_SIZES = [...SIZE_2K, ...SIZE_3K];

const SEEDANCE_SIZES: ImageSize[] = [
  { label: '16:9 横屏', value: '16:9', description: '1280×720' },
  { label: '9:16 竖屏', value: '9:16', description: '720×1280' },
  { label: '1:1 方形', value: '1:1', description: '720×720' },
];

// ===================== 模型配置 =====================
export const AI_MODELS: AIModel[] = [
  // === Image Models ===
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
    sizes: GEMINI_NANO_BANANA_SIZES,
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
    sizes: GEMINI_NANO_BANANA_PRO_SIZES,
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
    sizes: GEMINI_NANO_BANANA_PRO_SIZES,
  },
  {
    id: 'seedream-4.5',
    name: 'Seedream 4.5',
    provider: '字节跳动 / 火山引擎',
    description: '人像美化和文字方面升级，支持图生图',
    backendModel: 'ep-m-20260317133017-d9hzp',
    capabilities: ['text2img', 'img2img'],
    category: 'image',
    apiKeyPlaceholder: '输入火山引擎 API Key',
    apiKeyLabel: '火山引擎 API Key',
    apiType: 'volcengine-image',
    sizes: SEEDREAM_4_5_SIZES,
  },
  {
    id: 'seedream-5.0',
    name: 'Seedream 5.0 Lite',
    provider: '字节跳动 / 火山引擎',
    description: '响应更精准，效果更智能，支持图生图',
    backendModel: 'ep-m-20260306020558-r225p',
    capabilities: ['text2img', 'img2img'],
    category: 'image',
    badge: 'NEW',
    apiKeyPlaceholder: '输入火山引擎 API Key',
    apiKeyLabel: '火山引擎 API Key',
    apiType: 'volcengine-image',
    sizes: SEEDREAM_5_0_SIZES,
  },

  // === Video Models ===
  {
    id: 'seedance-1.5',
    name: 'Seedance 1.5 Pro',
    provider: '字节跳动 / 火山引擎',
    description: '高质量AI视频生成，支持多种模式',
    backendModel: 'doubao-seedance-1-5-pro-251215',
    capabilities: ['text2img', 'img2img'],
    category: 'video',
    badge: 'VIDEO',
    apiKeyPlaceholder: '输入火山引擎 API Key',
    apiKeyLabel: '火山引擎 API Key',
    apiType: 'volcengine-video',
    sizes: SEEDANCE_SIZES,
    videoModes: ['text2video', 'img2video', 'img2video_first_last'],
  },
];

// Chat models (use Lovable AI Gateway, no user API key needed)
export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  gatewayModel: string;
}

export const CHAT_MODELS: ChatModel[] = [
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', description: '强大的推理和多模态理解', gatewayModel: 'openai/gpt-5' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', description: '平衡性能与速度', gatewayModel: 'openai/gpt-5-mini' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: '视觉+文本，复杂推理', gatewayModel: 'google/gemini-2.5-pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: '快速高效，性价比高', gatewayModel: 'google/gemini-2.5-flash' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', provider: 'Google', description: '最新预览版，均衡能力', gatewayModel: 'google/gemini-3-flash-preview' },
];

export const IMAGE_MODELS = AI_MODELS.filter(m => m.category === 'image');
export const VIDEO_MODELS = AI_MODELS.filter(m => m.category === 'video');
