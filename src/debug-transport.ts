import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

/**
 * Debug wrapper for transports that logs all messages
 */
export class DebugTransport implements Transport {
  private wrapped: Transport;
  private debug: boolean;

  constructor(wrapped: Transport) {
    this.wrapped = wrapped;
    this.debug = !!process.env.DEBUG;
  }

  get onclose() {
    return this.wrapped.onclose;
  }

  set onclose(handler: (() => void) | undefined) {
    this.wrapped.onclose = handler;
  }

  get onerror() {
    return this.wrapped.onerror;
  }

  set onerror(handler: ((error: Error) => void) | undefined) {
    this.wrapped.onerror = handler;
  }

  get onmessage() {
    return this.wrapped.onmessage;
  }

  set onmessage(handler: ((message: JSONRPCMessage) => void) | undefined) {
    if (!handler) {
      this.wrapped.onmessage = undefined;
      return;
    }

    // Wrap the message handler to log incoming messages
    this.wrapped.onmessage = (message: JSONRPCMessage) => {
      if (this.debug) {
        console.error('[DEBUG] Incoming message:', JSON.stringify(message, null, 2));
        
        // Special handling for tools/list request
        if ('method' in message && message.method === 'tools/list') {
          console.error('[DEBUG] Client is requesting tool list');
        }
      }
      handler(message);
    };
  }

  async start(): Promise<void> {
    if (this.debug) {
      console.error('[DEBUG] Starting transport');
    }
    return this.wrapped.start();
  }

  async close(): Promise<void> {
    if (this.debug) {
      console.error('[DEBUG] Closing transport');
    }
    return this.wrapped.close();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this.debug) {
      console.error('[DEBUG] Outgoing message:', JSON.stringify(message, null, 2));
      
      // Special handling for tools/list response
      if ('result' in message && message.result && typeof message.result === 'object' && 'tools' in message.result) {
        const result = message.result as any;
        if (Array.isArray(result.tools)) {
          console.error('[DEBUG] Sending tool list with', result.tools.length, 'tools');
          // Log detailed tool info
          result.tools.forEach((tool: any) => {
            console.error('[DEBUG] Tool:', {
              name: tool.name,
              hasInputSchema: !!tool.inputSchema,
              inputSchemaType: tool.inputSchema ? typeof tool.inputSchema : 'undefined',
              inputSchemaKeys: tool.inputSchema && typeof tool.inputSchema === 'object' ? Object.keys(tool.inputSchema) : []
            });
          });
        }
      }
    }
    return this.wrapped.send(message);
  }
}