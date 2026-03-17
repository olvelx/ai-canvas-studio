export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  backendModel: string;
  capabilities: ('text2img' | 'img2img')[];
  badge?: string;
  apiKeyPlaceholder: string;
  apiKeyLabel: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    provider: 'Google Gemini',
    description: '基础图片编辑与生成，英文优秀',
    backendModel: 'google/gemini-2.5-flash-image',
    capabilities: ['text2img', 'img2img'],
    apiKeyPlaceholder: '输入 Lovable API Key',
    apiKeyLabel: 'Lovable API Key',
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    provider: 'Google Gemini',
    description: '第二代绘图模型，速度与质量兼顾',
    backendModel: 'google/gemini-3.1-flash-image-preview',
    capabilities: ['text2img', 'img2img'],
    badge: 'NEW',
    apiKeyPlaceholder: '输入 Lovable API Key',
    apiKeyLabel: 'Lovable API Key',
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    provider: 'Google Gemini',
    description: '精准中文理解输出 & 4K 高清',
    backendModel: 'google/gemini-3-pro-image-preview',
    capabilities: ['text2img', 'img2img'],
    badge: 'PRO',
    apiKeyPlaceholder: '输入 Lovable API Key',
    apiKeyLabel: 'Lovable API Key',
  },
  {
    id: 'seedream-4.5',
    name: 'Seedream 4.5',
    provider: '字节跳动 / 火山引擎',
    description: '人像美化和文字方面升级',
    backendModel: 'ep-m-20260317133017-d9hzp',
    capabilities: ['text2img'],
    apiKeyPlaceholder: '输入火山引擎 API Key',
    apiKeyLabel: '火山引擎 API Key',
  },
  {
    id: 'seedream-5.0',
    name: 'Seedream 5.0 Lite',
    provider: '字节跳动 / 火山引擎',
    description: '响应更精准，效果更智能',
    backendModel: 'ep-m-20260306020558-r225p',
    capabilities: ['text2img'],
    badge: 'NEW',
    apiKeyPlaceholder: '输入火山引擎 API Key',
    apiKeyLabel: '火山引擎 API Key',
  },
];

export type GenerationMode = 'text2img' | 'img2img';
