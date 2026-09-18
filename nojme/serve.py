#!/usr/bin/env python3
"""Локальный сервер nojme Web с заголовками cross-origin isolation.

Запуск:  python3 serve.py [порт]        (по умолчанию 8080)
Открыть: http://localhost:8080/

COOP/COEP нужны браузеру для SharedArrayBuffer — без них Java-потоки
(Thread.start) в ядре не заработают. Для продакшена выставьте те же
заголовки на вашем веб-сервере/CDN.
"""
import sys
import functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class NojmeHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.wasm': 'application/wasm',
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.jar': 'application/java-archive',
    }

    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write('[%s] %s\n' % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    srv = ThreadingHTTPServer(('0.0.0.0', port), functools.partial(
        NojmeHandler, directory='.'))
    print(f'nojme Web: http://localhost:{port}/  (Ctrl+C — остановить)')
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\nостановлено')


if __name__ == '__main__':
    main()
