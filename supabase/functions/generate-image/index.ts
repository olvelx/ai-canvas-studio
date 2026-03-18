import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// 1. 统一尺寸配置（对齐1K/2K/3K/4K体系，新增分辨率→宽高比映射）
const RESOLUTION_TO_ASPECT_RATIO: Record<string, string> = {
  // 1K
  "1024x1024": "1:1",
  "1152x864": "4:3",
  "864x1152": "3:4",
  "1280x720": "16:9",
  "720x1280": "9:16",
  "832x1248": "3:2",
  "1248x832": "2:3",
  "1512x648": "21:9",
  // 2K
  "2048x2048": "1:1",
  "2304x1728": "4:3",
  "1728x2304": "3:4",
  "2848x1600": "16:9",
  "1600x2848": "9:16",
  "2496x1664": "3:2",
  "1664x2496": "2:3",
  "3136x1344": "21:9",
  // 3K
  "3072x3072": "1:1",
  "3456x2592": "4:3",
  "2592x3456": "3:4",
  "4096x2304": "16:9",
  "2304x4096": "9:16",
  "3744x2496": "3:2",
  "2496x3744": "2:3",
  "4704x2016": "21:9",
  // 4K
  "4096x4096": "1:1",
  "3520x4704": "3:4",
  "4704x3520": "4:3",
  "5504x3040": "16:9",
  "3040x5504": "9:16",
  "3328x4992": "2:3",
  "4992x3328": "3:2",
  "6240x2656": "21:9",
};

// 默认尺寸（对齐各模型基础尺寸）
const DEFAULT_SIZES = {
  gemini: "1024x1024", // Gemini 默认1K 1:1
  seedream: "2048x2048", // Seedream 默认2K 1:1
  seedance: "16:9",      // Seedance 保持原有默认
};

// 2. CORS 配置（精简且覆盖核心需求）
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 辅助函数：从分辨率提取宽高比（兼容旧的比例格式）
function getAspectRatio(size: string): string {
  // 如果是比例格式（如1:1），直接返回
  if (size.includes(":") && !size.includes("x")) {
    return size;
  }
  // 如果是分辨率格式，映射到宽高比
  return RESOLUTION_TO_ASPECT_RATIO[size] || "1:1";
}

// 4. 主服务逻辑
serve(async (req) => {
  // 处理 OPTIONS 预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 生成请求ID（便于日志排查）
  const requestId = crypto.randomUUID();

  try {
    const { model, modelId, prompt, image, apiKey, apiType, size } = await req.json();

    if (!apiKey || !prompt || !model) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 核心参数校验
    const missingParams: string[] = [];
    if (!apiKey) missingParams.push("apiKey");
    if (!prompt) missingParams.push("prompt");
    if (!model) missingParams.push("model");
    if (!apiType) missingParams.push("apiType");

    if (missingParams.length > 0) {
      const errorMsg = `缺少必要参数: ${missingParams.join(", ")}`;
      console.warn(`[${requestId}] ${errorMsg}`);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== Google Gemini API 处理 ======
    if (apiType === "gemini") {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      // 拼接带比例的提示词（适配新的分辨率尺寸）
      let fullPrompt = prompt;
      const targetSize = size || DEFAULT_SIZES.gemini;
      const aspectRatio = getAspectRatio(targetSize); // 提取宽高比
      if (aspectRatio !== "1:1") {
        fullPrompt = `${prompt}\n\n(Please generate image with aspect ratio ${aspectRatio})`;
      }
      parts.push({ text: fullPrompt });

      // 处理图片输入（img2img）
      if (image) {
        const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          parts.push({
            inlineData: {
              mimeType: base64Match[1],
              data: base64Match[2],
            },
          });
        } else {
          throw new Error("图片格式错误，需为 DataURL (base64) 格式");
        }
      }

      // 调用 Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await fetchWithTimeout(
        geminiUrl,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseModalities: ["TEXT"],
              temperature: 0.7, // 增加合理默认值
            },
          }),
        },
        30000 // Gemini 请求30秒超时
      );

      if (!response.ok) {
        const errText = await response.text();
        const errMsg = `Gemini API 调用失败 [${response.status}]: ${errText}`;
        console.error(`[${requestId}] ${errMsg}`);
        throw new Error(errMsg);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new Error("Gemini 未返回有效内容");
      }

      // 提取生成的图片
      let imageUrl = "";
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        throw new Error("Gemini 未能生成图片，请检查提示词或重试");
      }

      return new Response(JSON.stringify({ requestId, imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== Volcengine Seedream 图片生成 ======
    if (apiType === "volcengine-image") {
      const arkModel = model.trim();
      // 使用新的默认尺寸，且直接传递分辨率（火山引擎支持）
      const imageSize = size || DEFAULT_SIZES.seedream;

      // 校验尺寸是否为支持的分辨率（可选，增强健壮性）
      if (imageSize.includes("x") && !RESOLUTION_TO_ASPECT_RATIO[imageSize]) {
        throw new Error(`Seedream 不支持该尺寸: ${imageSize}，请选择2K/3K/4K标准尺寸`);
      }

      const response = await fetchWithTimeout(
        "https://ark.cn-beijing.volces.com/api/v3/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: arkModel,
            prompt: prompt,
            size: imageSize, // 直接传递1K/2K/3K/4K分辨率
            response_format: "url",
          }),
        },
        60000 // Seedream 请求60秒超时
      );

      if (!response.ok) {
        const errText = await response.text();
        const errMsg = `Seedream API 调用失败 [${response.status}]: ${errText}`;
        console.error(`[${requestId}] ${errMsg}`);
        throw new Error(errMsg);
      }

      const data = await response.json();
      const imageUrl = data?.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error("Seedream 未返回图片 URL");
      }

      return new Response(JSON.stringify({ requestId, imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== Volcengine Seedance 视频生成 ======
    if (apiType === "volcengine-video") {
      const arkModel = model.trim();
      if (!arkModel) {
        throw new Error("请提供 Seedance 接入点 ID");
      }

      // 构造请求体
      const requestBody: {
        model: string;
        content: Array<{ type: string; text?: string; image_url?: { url: string } }>;
      } = {
        model: arkModel,
        content: [{ type: "text", text: prompt }],
      };

      // 处理图片输入（img2video）- 修复参数格式
      if (image) {
        const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          // 修复：火山方舟需要直接传 base64 字符串，而非完整 DataURL
          requestBody.content.push({
            type: "image_url",
            image_url: { url: base64Match[2] },
          });
        } else {
          throw new Error("图片格式错误，需为 DataURL (base64) 格式");
        }
      }

      const response = await fetchWithTimeout(
        "https://ark.cn-beijing.volces.com/api/v3/videos/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        60000 // Seedance 请求60秒超时
      );

      if (!response.ok) {
        const errText = await response.text();
        const errMsg = `Seedance API 调用失败 [${response.status}]: ${errText}`;
        console.error(`[${requestId}] ${errMsg}`);
        throw new Error(errMsg);
      }

      const data = await response.json();
      const taskId = data.id;

      if (!taskId) {
        throw new Error("Seedance 未返回任务 ID");
      }

      return new Response(
        JSON.stringify({
          requestId,
          taskId,
          status: "processing",
          message: "视频生成中，请稍候...",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 不支持的 API 类型
    const unsupportedMsg = `不支持的 API 类型: ${apiType}`;
    console.warn(`[${requestId}] ${unsupportedMsg}`);
    return new Response(JSON.stringify({ error: unsupportedMsg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    // 统一异常处理
    const errMsg = error instanceof Error ? error.message : "未知服务器错误";
    console.error(`[${requestId}] 处理请求失败:`, errMsg, error);
    return new Response(
      JSON.stringify({ requestId, error: errMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

console.log("Deno 服务已启动，监听默认端口 (8000)");
