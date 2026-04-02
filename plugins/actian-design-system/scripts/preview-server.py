#!/usr/bin/env python3
"""Preview server with annotation POST endpoint.

Serves static files from the working directory AND accepts POST to /_annotations
to write annotation JSON to .annotations.json in the served directory.

Usage: python3 preview-server.py [port] [directory]
"""

import json
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path


class PreviewHandler(SimpleHTTPRequestHandler):
    """Static file server + POST /_annotations + plugin asset serving."""

    # Set by main() — path to the plugin's templates/ directory
    plugin_templates_dir = None

    def do_GET(self):
        if self.path.startswith('/_version'):
            self._handle_version()
        elif self.path.startswith('/_plugin/'):
            self._serve_plugin_asset()
        else:
            super().do_GET()

    def _serve_plugin_asset(self):
        """Serve files from the plugin's templates directory at /_plugin/..."""
        if not self.plugin_templates_dir:
            self.send_error(404, 'Plugin templates path not configured')
            return
        rel_path = self.path[len('/_plugin/'):]
        file_path = Path(self.plugin_templates_dir) / rel_path
        # Security: prevent path traversal
        try:
            file_path = file_path.resolve()
            templates_dir = Path(self.plugin_templates_dir).resolve()
            if not str(file_path).startswith(str(templates_dir)):
                self.send_error(403, 'Forbidden')
                return
        except Exception:
            self.send_error(400, 'Bad path')
            return
        if not file_path.is_file():
            self.send_error(404, 'Not found')
            return
        # Determine content type
        ext = file_path.suffix.lower()
        content_types = {
            '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
            '.json': 'application/json', '.svg': 'image/svg+xml',
        }
        content_type = content_types.get(ext, 'application/octet-stream')
        try:
            data = file_path.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(data))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_error(500, str(e))

    def do_POST(self):
        if self.path == '/_annotations':
            self._handle_annotations()
        else:
            self.send_error(404, 'Not Found')

    def _handle_version(self):
        """Return mtime of a file for live-reload polling."""
        from urllib.parse import urlparse, parse_qs
        query = parse_qs(urlparse(self.path).query)
        file_path = query.get('file', [''])[0]
        if not file_path:
            self.send_error(400, 'Missing file param')
            return
        full_path = (Path(self.directory) / file_path.lstrip('/')).resolve()
        # Security: prevent path traversal
        if not str(full_path).startswith(str(Path(self.directory).resolve())):
            self.send_error(403, 'Forbidden')
            return
        try:
            mtime = full_path.stat().st_mtime
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'mtime': mtime}).encode())
        except FileNotFoundError:
            self.send_error(404, 'File not found')

    def _handle_annotations(self):
        try:
            MAX_BODY = 10 * 1024 * 1024  # 10MB
            length = int(self.headers.get('Content-Length', 0))
            if length > MAX_BODY:
                self.send_error(413, 'Request body too large')
                return
            body = self.rfile.read(length)
            data = json.loads(body)

            # Validate minimal structure
            if 'annotations' not in data or not isinstance(data['annotations'], list):
                self.send_error(400, 'Missing or invalid annotations array')
                return

            # Write to .annotations.json in the served directory
            out_path = Path(self.directory) / '.annotations.json'
            with open(out_path, 'w') as f:
                json.dump(data, f, indent=2)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'ok': True,
                'file': str(out_path),
                'count': len(data['annotations'])
            }).encode())

        except json.JSONDecodeError:
            self.send_error(400, 'Invalid JSON')
        except Exception as e:
            self.send_error(500, str(e))

    def do_OPTIONS(self):
        """Handle CORS preflight for POST."""
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        """Suppress request logging."""
        pass


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    directory = sys.argv[2] if len(sys.argv) > 2 else '.'

    os.chdir(directory)
    PreviewHandler.directory = os.getcwd()

    # Plugin templates directory (sibling of scripts/)
    script_dir = Path(__file__).resolve().parent
    PreviewHandler.plugin_templates_dir = str(script_dir.parent / 'templates')

    server = HTTPServer(('', port), PreviewHandler)
    server.serve_forever()


if __name__ == '__main__':
    main()
