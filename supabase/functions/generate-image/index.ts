import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 60000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getAspectRatio(size: string): string {
  if (size.includes(":") && !size.includes("x")) return size;
  const ratioMap: Record<string, string> = {
    "1024x1024": "1:1", "1152x864": "4:3", "864x1152": "3:4",
    "1280x720": "16:9", "720x1280": "9:16", "832x1248": "3:2",
    "1248x832": "2:3", "1512x648": "21:9",
    "2048x2048": "1:1", "2304x1728": "4:3", "1728x2304": "3:4",
    "2848x1600": "16:9", "1600x2848": "9:16", "2496x1664": "3:2",
    "1664x2496": "2:3", "3136x1344": "21:9",
    "3072x3072": "1:1", "3456x2592": "4:3", "2592x3456": "3:4",
    "4096x2304": "16:9", "2304x4096": "9:16", "3744x2496": "3:2",
    "2496x3744": "2:3", "4704x2016": "21:9",
    "4096x4096": "1:1", "3520x4704": "3:4", "4704x3520": "4:3",
    "5504x3040": "16:9", "3040x5504": "9:16", "3328x4992": "2:3",
    "4992x3328": "3:2", "6240x2656": "21:9",
  };
  return ratioMap[size] || "1:1";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const requestId = generateRequestId();

  try {
    let body: any = {};
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ requestId, error: "请求体格式错误" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { model, prompt, image, lastImage, apiKey, apiType, size, videoMode, duration, resolution, generateAudio, draft } = body;

    if (!apiKey || !prompt || !model || !apiType) {
      return new Response(JSON.stringify({ requestId, error: "缺少必要参数" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== Google Gemini API ======
    if (apiType === "gemini") {
      const parts: any[] = [];
      let fullPrompt = prompt;
      const targetSize = size || "1024x1024";
      const aspectRatio = getAspectRatio(targetSize);
      if (aspectRatio !== "1:1") {
        fullPrompt = `${prompt}\n\n(Please generate image with aspect ratio ${aspectRatio})`;
      }
      parts.push({ text: fullPrompt });

      if (image) {
        const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          parts.push({ inlineData: { mimeType: base64Match[1], data: base64Match[2] } });
        }
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await fetchWithTimeout(geminiUrl, {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }, 60000);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API 错误 [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      if (!candidate?.content?.parts) throw new Error("Gemini 未返回有效内容");

      let imageUrl = "";
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      if (!imageUrl) throw new Error("Gemini 未能生成图片，请检查提示词");

      return new Response(JSON.stringify({ requestId, imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== Volcengine Seedream 图片生成（文生图 + 图生图）======
    if (apiType === "volcengine-image") {
      const imageSize = size || "2048x2048";
      const requestBody: any = {
        model: model.trim(),
        prompt,
        size: imageSize,
        response_format: "url",
      };

      // 图生图：添加参考图片
      if (image) {
        let imgData = image;
        const base64Match = imgData.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          imgData = base64Match[2];
        }
        requestBody.image = imgData;
      }

      const response = await fetchWithTimeout(
        "https://ark.cn-beijing.volces.com/api/v3/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        60000
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Seedream API 错误 [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const imgUrl = data?.data?.[0]?.url;
      if (!imgUrl) throw new Error("Seedream 未返回图片 URL");

      return new Response(JSON.stringify({ requestId, imageUrl: imgUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== Volcengine Seedance 视频生成 ======
    if (apiType === "volcengine-video") {
      const actualVideoMode = videoMode || "text2video";
      const content: any[] = [{ type: "text", text: prompt }];

      // 图生视频 - 首帧
      if (actualVideoMode === "img2video" && image) {
        content.push({
          type: "image_url",
          image_url: { url: image }, // 支持 data:image/...;base64,... 或 URL
        });
      }

      // 图生视频 - 首尾帧
      if (actualVideoMode === "img2video_first_last" && image) {
        content.push({
          type: "image_url",
          image_url: { url: image },
          role: "first_frame",
        });
        if (lastImage) {
          content.push({
            type: "image_url",
            image_url: { url: lastImage },
            role: "last_frame",
          });
        }
      }

      // 图生视频 - 参考图
      if (actualVideoMode === "img2video_reference" && image) {
        content.push({
          type: "image_url",
          image_url: { url: image },
          role: "reference_image",
        });
      }

      const requestBody: any = {
        model: model.trim(),
        content,
      };

      // 视频参数
      if (size) requestBody.ratio = size;
      if (duration) requestBody.duration = parseInt(duration);
      if (resolution) requestBody.resolution = resolution;
      if (typeof generateAudio === 'boolean') requestBody.generate_audio = generateAudio;
      if (typeof draft === 'boolean') requestBody.draft = draft;

      // 返回尾帧（非样片模式时）
      if (!draft) {
        requestBody.return_last_frame = true;
      }

      // 样片模式强制 480p
      if (draft) {
        requestBody.resolution = "480p";
      }

      requestBody.watermark = false;

      console.log(`[${requestId}] Seedance 请求:`, JSON.stringify({ ...requestBody, content: `[${content.length} items]` }));

      const response = await fetchWithTimeout(
        "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        60000
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Seedance API 错误 [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const taskId = data.id;
      if (!taskId) throw new Error("Seedance 未返回任务 ID");

      return new Response(JSON.stringify({
        requestId,
        taskId,
        status: "processing",
        message: "视频生成任务已提交，正在处理中...",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ requestId, error: `不支持的 API 类型: ${apiType}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "未知服务器错误";
    console.error(`[${requestId}] 错误:`, errMsg);
    return new Response(JSON.stringify({ requestId, error: errMsg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});