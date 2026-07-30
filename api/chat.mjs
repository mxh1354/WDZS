/**
 * Vercel Serverless Function — Dify API 代理
 * 作用：前端 → /api/chat → dify-api.crc.com.cn/v1/chat-messages
 * 无 CORS 问题（前后端同源）
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DIFY_API = 'https://dify-api.crc.com.cn/v1/chat-messages';
  const API_KEY = 'app-h8eTFFP65XYZP7CAyTZQcimo';

  try {
    const difyResp = await fetch(DIFY_API, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await difyResp.json();
    res.status(difyResp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}
