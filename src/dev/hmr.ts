import type * as http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

export class HmrServer {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
      ws.on('error', () => this.clients.delete(ws));
    });
  }

  /** Attach to an existing HTTP server — shares the same port, no extra port needed. */
  attach(server: http.Server): void {
    server.on('upgrade', (req, socket, head) => {
      if (req.url === '/__actjs_hmr') {
        this.wss.handleUpgrade(req, socket, head, (ws) => {
          this.wss.emit('connection', ws, req);
        });
      }
    });
  }

  broadcast(message: Record<string, unknown>): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  close(): Promise<void> {
    return new Promise((resolve) => this.wss.close(() => resolve()));
  }
}
