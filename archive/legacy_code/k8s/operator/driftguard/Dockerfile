FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy operator code
COPY operator.py .

# Create health check endpoints
RUN echo 'import http.server, socketserver, os, threading\n\
\n\
class HealthHandler(http.server.BaseHTTPRequestHandler):\n\
    def do_GET(self):\n\
        if self.path == "/healthz":\n\
            self.send_response(200)\n\
            self.send_header("Content-type", "text/plain")\n\
            self.end_headers()\n\
            self.wfile.write(b"healthy")\n\
        elif self.path == "/readyz":\n\
            self.send_response(200)\n\
            self.send_header("Content-type", "text/plain")\n\
            self.end_headers()\n\
            self.wfile.write(b"ready")\n\
        else:\n\
            self.send_response(404)\n\
            self.end_headers()\n\
\n\
def start_health_server():\n\
    with socketserver.TCPServer(("", 8080), HealthHandler) as httpd:\n\
        httpd.serve_forever()\n\
\n\
threading.Thread(target=start_health_server, daemon=True).start()\n'\
> health_server.py

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Create entrypoint script
RUN echo '#!/bin/bash\n\
python health_server.py &\n\
kopf run --standalone operator.py\n' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Add requirements file
RUN echo 'kopf==1.35.4\n\
kubernetes==26.1.0\n\
aiohttp==3.8.4\n' > requirements.txt

ENTRYPOINT ["/app/entrypoint.sh"]