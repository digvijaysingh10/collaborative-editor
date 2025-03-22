import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

export function createYjsProvider(ydoc: Y.Doc, room: string = 'doc-room'): WebsocketProvider {
  return new WebsocketProvider(
    process.env.YJS_WS_URL!,
    room,
    ydoc,
    {
      connect: true,
      WebSocketPolyfill: typeof window === 'undefined' ? require('ws') : undefined,
    }
  );
}