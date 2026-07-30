/**
 * Cloudflare Pages Function — Dify API 代理
 * 作用：前端 → /api/chat → dify-api.crc.com.cn/v1/chat-messages
 */
export async function onRequestPost(context) {
  const { request } = context;
  const DIFY_API = 'https://dify-api.crc.com.cn/v1/chat-messages';
  const API_KEY = 'app-h8eTFFP65XYZP7CAyTZQcimo';

  try {
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      return jsonResponse({ error: 'Invalid JSON body', detail: String(parseErr.message) }, 400);
    }

    let difyResp;
    try {
      difyResp = await fetch(DIFY_API, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (fetchErr) {
      return jsonResponse({
        error: 'Dify fetch failed',
        detail: String(fetchErr.message),
        hint: 'Cloudflare 边缘节点可能无法访问 Dify 内网域名'
      }, 502);
    }

    const text = await difyResp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return jsonResponse({
        error: 'Dify returned non-JSON',
        status: difyResp.status,
        body_preview: text.slice(0, 300)
      }, difyResp.status);
    }

    return jsonResponse(data, difyResp.status);
  } catch (err) {
    return jsonResponse({
      error: 'Unhandled exception',
      detail: String(err.message),
      stack: err.stack ? err.stack.slice(0, 500) : ''
    }, 500);
  }
}

export async function onRequestGet() {
  return new Response('OK - use POST', {
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