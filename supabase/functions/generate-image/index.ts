import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model, modelId, prompt, image, apiKey, apiType, size } = await req.json();

    if (!apiKey || !prompt || !model) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ====== Google Gemini API (Nano Banana series) ======
    if (apiType === 'gemini') {
      const parts: any[] = [];

      // Build prompt with aspect ratio hint if provided
      let fullPrompt = prompt;
      if (size && size !== '1:1') {
        fullPrompt = `${prompt}\n\n(Please generate image with aspect ratio ${size})`;
      }

      if (image) {
        // img2img: text + image
        parts.push({ text: fullPrompt });
        
        // Extract base64 data from data URL
        const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          parts.push({
            inlineData: {
              mimeType: base64Match[1],
              data: base64Match[2],
            },
          });
        }
      } else {
        // text2img
        parts.push({ text: fullPrompt });
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API 调用失败 [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      
      // Extract image from response parts
      const candidate = data.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new Error('Gemini 未返回有效内容');
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          // Return as data URL
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          return new Response(JSON.stringify({ imageUrl: dataUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      throw new Error('Gemini 未能生成图片，请检查提示词或重试');
    }

    // ====== Volcengine Ark API - Seedream (Image Generation) ======
    if (apiType === 'volcengine-image') {
      const arkModel = model?.trim();
      const imageSize = size || '2048x2048';
      
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: arkModel,
          prompt: prompt,
          size: imageSize,
          response_format: 'url',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Seedream API 调用失败 [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const imageUrl = data?.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('Seedream 未返回图片数据');
      }

      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ====== Volcengine Ark API - Seedance (Video Generation) ======
    if (apiType === 'volcengine-video') {
      const arkModel = model?.trim();
      if (!arkModel) {
        throw new Error('请提供 Seedance 接入点 ID');
      }

      // Create video generation task
      const requestBody: any = {
        model: arkModel,
        content: [
          { type: 'text', text: prompt },
        ],
      };

      // Add image for img2video
      if (image) {
        const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          requestBody.content.push({
            type: 'image_url',
            image_url: { url: image },
          });
        }
      }

      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/videos/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Seedance API 调用失败 [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      
      // Video generation is async - return task ID for polling
      return new Response(JSON.stringify({ 
        taskId: data.id,
        status: 'processing',
        message: '视频生成中，请稍候...',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: '不支持的模型类型' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Generate error:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
