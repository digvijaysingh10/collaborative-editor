import { setupWSConnection } from 'y-websocket/bin/utils';
import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import http from 'http';

const server = http.createServer((req: IncomingMessage, res: http.ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs WebSocket Server');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  setupWSConnection(ws, req);
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 1234;
server.listen(port, () => {
  console.log(`Yjs WebSocket server running on port ${port}`);
});