/**
 * Cloudflare Pages Function — Dify API 代理
 * 作用：前端 → /api/chat → dify-api.crc.com.cn/v1/chat-messages
 */
export async function onRequestPost(context) {
  const { request } = context;
  const DIFY_API = 'https://dify-api.crc.com.cn/v1/chat-messages';
  const API_KEY = 'app-h8eTFFP65XYZP7CAyTZQcimo';

  let body = {};
  try {
    const ct = request.headers.get('content-type') || '';
    const text = await request.text();
    if (text && ct.includes('json')) {
      body = JSON.parse(text);
    }
  } catch (e) {
    return jsonResponse({ error: 'JSON parse failed', detail: String(e.message) }, 400);
  }

  let difyResp;
  try {
    difyResp = await fetch(DIFY_API, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000)
    });
  } catch (fetchErr) {
    return jsonResponse({
      error: 'fetch_failed',
      message: 'Cloudflare 边缘节点无法访问 Dify: ' + fetchErr.message
    }, 502);
  }

  let text;
  try {
    text = await difyResp.text();
  } catch (e) {
    return jsonResponse({ error: 'read_failed', detail: String(e.message) }, 502);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return jsonResponse({
      error: 'dify_non_json',
      status: difyResp.status,
      body_preview: text.slice(0, 300)
    }, 502);
  }

  return jsonResponse(data, difyResp.status);
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