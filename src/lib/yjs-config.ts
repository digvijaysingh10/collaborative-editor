import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

export function createYjsProvider(ydoc: Y.Doc, room: string = 'doc-room'): WebsocketProvider {
  const wsUrl = process.env.YJS_WS_URL;
  if (!wsUrl) {
    throw new Error('YJS_WS_URL environment variable is not set');
  }
  return new WebsocketProvider(wsUrl, room, ydoc, {
    connect: true,
    WebSocketPolyfill: typeof window === 'undefined' ? require('ws') : undefined,
  });
}