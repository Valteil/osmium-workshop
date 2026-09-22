// Minimal ambient types for the `ws` package. This repo doesn't depend on
// @types/ws, and main.ts only uses a small, well-known slice of the API, so
// declaring just that slice keeps `ws` typed without a new dependency.
declare module 'ws' {
  import { EventEmitter } from 'events';

  class WebSocket extends EventEmitter {
    constructor(address: string | URL, options?: Record<string, unknown>);
    send(data: unknown, cb?: (err?: Error) => void): void;
    close(code?: number, reason?: string): void;
    on(event: 'open', listener: () => void): this;
    on(event: 'message', listener: (data: Buffer, isBinary: boolean) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'unexpected-response', listener: (req: unknown, res: { statusCode?: number }) => void): this;
    on(event: 'close', listener: (code: number, reason: Buffer) => void): this;
  }

  export = WebSocket;
}
