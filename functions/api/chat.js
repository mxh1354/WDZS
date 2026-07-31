/**
 * Cloudflare Pages Function — Dify API 代理（新平台 dify.crpcg.com）
 * 前端 → /api/chat → https://dify.crpcg.com/v1/chat-messages
 */
export async function onRequestPost(context) {
  const { request } = context;
  const DIFY_API = 'https://dify.crpcg.com/v1/chat-messages';
  const API_KEY = 'app-HbLbwaWP0vqFsdP57UD1736u';

  let body = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch (e) {
    return jsonResponse({ error: 'JSON parse failed', detail: String(e.message) }, 400);
  }

  // 强制流式
  body.response_mode = 'streaming';

  let difyResp;
  try {
    difyResp = await fetch(DIFY_API, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(body)
    });
  } catch (fetchErr) {
    return jsonResponse({
      error: 'fetch_failed',
      message: 'Cloudflare 边缘节点无法访问 Dify: ' + fetchErr.message
    }, 502);
  }

  // 流式透传 SSE
  if (!difyResp.body) {
    return jsonResponse({ error: 'no_body' }, 502);
  }

  return new Response(difyResp.body, {
    status: difyResp.status,
    headers: {
      'Content-Type': difyResp.headers.get('Content-Type') || 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });
}

export async function onRequestGet() {
  return new Response('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
