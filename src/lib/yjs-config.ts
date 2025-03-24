import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

export function createYjsProvider(ydoc: Y.Doc, room: string = 'doc-room'): WebsocketProvider {
  const wsUrl = process.env.YJS_WS_URL || 'wss://y-server-tdnd.onrender.com';
  if (!wsUrl) {
    throw new Error('YJS_WS_URL environment variable is not set');
  }

  const provider = new WebsocketProvider(wsUrl, room, ydoc, {
    connect: true,
    maxBackoffTime: 10000,
    WebSocketPolyfill: typeof window === 'undefined' ? require('ws') : undefined,
  });

  provider.on('status', ({ status }: { status: string }) => {
    console.log(`Yjs WebSocket status for room ${room}: ${status}`);
  });

  return provider;
}