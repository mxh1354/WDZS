/**
 * Cloudflare Pages Function — Dify API 代理
 * 作用：前端 → /api/chat → dify-api.crc.com.cn/v1/chat-messages
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const DIFY_API = 'https://dify-api.crc.com.cn/v1/chat-messages';
  const API_KEY = 'app-h8eTFFP65XYZP7CAyTZQcimo';

  try {
    const body = await request.json();
    const difyResp = await fetch(DIFY_API, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await difyResp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Dify returned non-JSON',
        status: difyResp.status,
        body_preview: text.slice(0, 300)
      }), { status: difyResp.status, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), {
      status: difyResp.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Proxy error: ' + err.message,
      hint: 'Cloudflare 边缘节点可能无法访问 Dify 内网域名 dify-api.crc.com.cn'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestGet() {
  return new Response('OK - use POST', { status: 200 });
}
