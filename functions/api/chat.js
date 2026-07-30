// 最小测试版：不调用 Dify，只返回固定 JSON
export async function onRequestPost(context) {
  return new Response(JSON.stringify({
    test_ok: true,
    message: '函数运行正常，说明不是函数本身问题'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestGet() {
  return new Response('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}
