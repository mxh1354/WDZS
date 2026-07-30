#!/usr/bin/env python3
"""
本地代理（流式版）：透传 Dify SSE 流，前端按节点事件更新进度
"""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import URLError

DIFY_API = 'https://dify-api.crc.com.cn/v1/chat-messages'
API_KEY = 'app-h8eTFFP65XYZP7CAyTZQcimo'

class ProxyHandler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def do_OPTIONS(self):
        self.send_cors(204)
        self.end_headers()

    def do_GET(self):
        self.send_cors(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        self.wfile.write('local proxy OK')

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length', '0') or '0'))
        req = Request(DIFY_API, data=body, method='POST',
                      headers={
                          'Authorization': f'Bearer {API_KEY}',
                          'Content-Type': 'application/json',
                          'Accept': 'text/event-stream'
                      })
        # 强制使用 streaming 输出模式
        try:
            payload = json.loads(body)
            payload['response_mode'] = 'streaming'
            req = Request(DIFY_API, data=json.dumps(payload).encode(),
                          method='POST',
                          headers={
                              'Authorization': f'Bearer {API_KEY}',
                              'Content-Type': 'application/json',
                              'Accept': 'text/event-stream'
                          })
        except Exception:
            pass

        try:
            resp = urlopen(req, timeout=55)
        except URLError as e:
            err = json.dumps({'error': 'proxy_failed', 'detail': str(e.reason)}).encode()
            self.send_cors(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(err)
            return

        self.send_cors(resp.status)
        ct = resp.headers.get('Content-Type', 'text/event-stream')
        self.send_header('Content-Type', ct)
        self.send_header('Cache-Control', 'no-cache')
        # chunked 透传 SSE
        try:
            while True:
                chunk = resp.read(512)
                if not chunk:
                    break
                self.wfile.write(f'{len(chunk):x}\r\n'.encode())
                self.wfile.write(chunk)
                self.wfile.write(b'\r\n')
                self.wfile.flush()
        except Exception:
            pass
        self.wfile.write(b'0\r\n\r\n')
        self.wfile.flush()

    def send_cors(self, status):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', 'https://qa-assistant.pages.dev')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Transfer-Encoding', 'chunked')

    def log_message(self, fmt, *args):
        print(f'[proxy] {args[0]}')

print('''
╔══════════════════════════════════════╗
║  本地代理已启动（流式版）           ║
║  端口: 8888                         ║
║  支持 Dify SSE 进度推送             ║
╚══════════════════════════════════════╝
''')
HTTPServer(('0.0.0.0', 8888), ProxyHandler).serve_forever()