#!/usr/bin/env python3

#    The MIT License (MIT)
#    Copyright (c) Kiyo Chinzei (kchinzei@gmail.com)
#    Permission is hereby granted, free of charge, to any person obtaining a copy
#    of this software and associated documentation files (the "Software"), to deal
#    in the Software without restriction, including without limitation the rights
#    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#    copies of the Software, and to permit persons to whom the Software is
#    furnished to do so, subject to the following conditions:
#    The above copyright notice and this permission notice shall be included in
#    all copies or substantial portions of the Software.
#    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#    THE SOFTWARE.

import sys
import os
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime
from pathlib import Path
from collections import deque

recent_queries = deque(maxlen=3)  # buffer of the last 3 queries
debug = False
use_debug_msg = '[use debug flag to print detail]'

if len(sys.argv) == 4 and sys.argv[3] == 'debug':
    debug = True

if not (len(sys.argv) == 3 or (len(sys.argv) == 4 and debug)):
    print(f'Wrong number of arguments.', file=sys.stderr)
    print(f'Usage: python3 obsidian_logger.py /path/to/vault logfile.md [debug]', file=sys.stderr)
    sys.exit(1)

port = 27123 # should agree to user javascript
vault_dir = sys.argv[1]
log_filename = sys.argv[2]
log_path = os.path.join(vault_dir, log_filename)

def hide_path(path: str):
    home = str(Path.home())
    if path.startswith(home):
        path = path.replace(home, '~')
    return f'{path[:12]} ... (hidden) ... {path[-12:]}'

class RequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # disables logging to stderr

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        self.do_OPTIONS()
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        try:
            data = json.loads(body)
            query = data.get('query', '').strip()
            if query in recent_queries:
                query_to_print = query if debug else '[hidden]'
                print(f'ℹ️ Skipping duplicate: {query_to_print}', flush=True)
                return
            recent_queries.append(query)

            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
            entry = f'- {timestamp} — **{query}**\n'
            try:
                with open(log_path, 'a') as f:
                    f.write(entry)
            except Exception as e:
                print(f'❌ Failed to write log: {e if debug else use_debug_msg}', file=sys.stderr)

        except Exception as e:
            query = f'⚠️ Failed to parse query: {e if debug else use_debug_msg}'
            print(f'{query}', file=sys.stderr)


def run_server():
    log_path_to_print = log_path if debug else hide_path(log_path)
    port_to_print = port if debug else '[hidden port]'
    try:
        print(f'🟢 Starting logger...', flush=True)
        print(f'📒 Logging to: {log_path_to_print}', flush=True)
        server = HTTPServer(('localhost', port), RequestHandler)
        print(f'🔌 Server is listening on http://localhost:{port_to_print}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\n❌ Interrupted by user.', flush=True)
        finally:
            server.server_close()
            print('Server terminated gracefully.', flush=True)
    except OSError as e:
        print(f'❌ Server error: {e if debug else use_debug_msg}', file=sys.stderr)
    except Exception as e:
        print(f'Unexpected error: {e if debug else use_debug_msg}', file=sys.stderr)
        
    return 0

if __name__ == '__main__':
    run_server()
