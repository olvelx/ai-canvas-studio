import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { taskId, apiKey } = await req.json();

    if (!taskId || !apiKey) {
      return new Response(JSON.stringify({ error: "缺少 taskId 或 apiKey" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 查询视频生成任务状态
    const response = await fetch(
      `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`查询任务失败 [${response.status}]: ${errText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      taskId: data.id,
      status: data.status, // queued | running | succeeded | failed | cancelled | expired
      videoUrl: data.content?.video_url || null,
      lastFrameUrl: data.content?.last_frame_url || null,
      error: data.error || null,
      duration: data.duration || null,
      resolution: data.resolution || null,
      ratio: data.ratio || null,
      seed: data.seed || null,
      generateAudio: data.generate_audio || false,
      draft: data.draft || false,
      draftTaskId: data.draft_task_id || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "未知错误";
    console.error("查询视频任务失败:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
