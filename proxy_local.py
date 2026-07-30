#!/usr/bin/env python3
"""
本地代理：用你的电脑作为 Cloudflare 前端和 Dify 的桥梁
用法：python proxy_local.py
然后浏览器访问 https://qa-assistant.pages.dev/ 提问
"""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import URLError

DIFY_API = 'https://dify-api.crc.com.cn/v1/chat-messages'
API_KEY = 'app-h8eTFFP65XYZP7CAyTZQcimo'

class ProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_cors(200)
        self.end_headers()

    def do_POST(self):
        body = self.rfile.read(int(self.headers['Content-Length']))
        req = Request(DIFY_API, data=body, method='POST',
                      headers={'Authorization': f'Bearer {API_KEY}',
                               'Content-Type': 'application/json'})
        try:
            resp = urlopen(req, timeout=55)
            data = resp.read()
            self.send_cors(resp.status)
            self.wfile.write(data)
        except URLError as e:
            err = json.dumps({'error': 'proxy_failed', 'detail': str(e.reason)}).encode()
            self.send_cors(502)
            self.wfile.write(err)
        except Exception as e:
            err = json.dumps({'error': 'unknown', 'detail': str(e)}).encode()
            self.send_cors(500)
            self.wfile.write(err)

    def do_GET(self):
        self.send_cors(200)
        self.wfile.write(b'local proxy running')

    def send_cors(self, status):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', 'https://qa-assistant.pages.dev')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

    def log_message(self, fmt, *args):
        print(f'[proxy] {args[0]} {args[1]}')

print('''
╔══════════════════════════════════════╗
║  本地代理已启动                      ║
║  用浏览器打开 qa-assistant.pages.dev ║
║  正常选择方向+提问即可                ║
║                                      ║
║  关闭窗口 = 停止代理                  ║
╚══════════════════════════════════════╝
''')
HTTPServer(('0.0.0.0', 8888), ProxyHandler).serve_forever()
