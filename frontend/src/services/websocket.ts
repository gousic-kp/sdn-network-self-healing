type MessageCallback = (data: any) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private callbacks: Set<MessageCallback> = new Set();
  private isConnected: boolean = false;
  private reconnectInterval: any = null;

  constructor(endpoint: string) {
    if (typeof window !== 'undefined' && import.meta.env.VITE_WS_URL) {
      this.url = `${import.meta.env.VITE_WS_URL}${endpoint}`;
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      const isDev = window.location.port === '3000' || window.location.port === '5173';
      const portStr = isDev ? ':8000' : (window.location.port ? `:${window.location.port}` : '');
      this.url = `${wsProtocol}//${host}${portStr}${endpoint}`;
    }
  }

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log(`[WebSocket] Connected to ${this.url}`);
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.callbacks.forEach(cb => cb(data));
        } catch (e) {
          console.error('[WebSocket] Message parse error:', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log(`[WebSocket] Disconnected from ${this.url}. Retrying...`);
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        this.socket?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectInterval) {
      this.reconnectInterval = setInterval(() => {
        console.log('[WebSocket] Attempting reconnect...');
        this.connect();
      }, 3000);
    }
  }

  public subscribe(callback: MessageCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  public send(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  }
}

export const networkWS = new WebSocketClient('/ws/network');
export const eventsWS = new WebSocketClient('/ws/events');
