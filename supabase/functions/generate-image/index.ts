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
    const { model, modelId, prompt, image, apiKey } = await req.json();

    if (!apiKey || !prompt || !model) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Nano Banana family - uses Lovable AI gateway (OpenAI-compatible)
    if (modelId?.startsWith('nano-banana')) {
      const messages: any[] = [];
      
      if (image) {
        // img2img: send image + text prompt
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } },
          ],
        });
      } else {
        // text2img
        messages.push({
          role: 'user',
          content: prompt,
        });
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          modalities: ['image', 'text'],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 调用失败 [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error('未能生成图片，请检查提示词或重试');
      }

      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Seedream family - uses Volcengine Ark API (OpenAI-compatible)
    if (modelId?.startsWith('seedream')) {
      const defaultSeedreamModel = modelId ===  '-ep-m-20260317133017-d9hzp' 
    ? '-ep-m-20260306020558-r225p';
      const arkModel = model?.trim() || defaultSeedreamModel;
      
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: arkModel,
          prompt: prompt,
          size: '2048x2048',
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

    return new Response(JSON.stringify({ error: '不支持的模型' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Generate image error:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
