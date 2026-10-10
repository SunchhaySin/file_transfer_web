export interface Peer {
  id: string;
  name: string;
}

// Messages the server sends to us
export type ServerMessage =
  | { type: 'registered'; id: string; token: string }
  | { type: 'peers'; list: Peer[] }
  | { type: 'offer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; from: string; candidate: RTCIceCandidateInit }
  | { type: 'reject'; from: string };

// Messages we send to the server (the server adds `from` when relaying)
export type ClientMessage =
  | { type: 'register'; name: string; token?: string }
  | { type: 'offer'; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; to: string; candidate: RTCIceCandidateInit }
  | { type: 'reject'; to: string }
  | { type: 'rename'; name: string };

// Events other classes can subscribe to, with their argument types
export interface SignalingEvents {
  open: [];
  close: [];
  registered: [myId: string];
  peers: [peers: Peer[]];
  offer: [from: string, sdp: RTCSessionDescriptionInit];
  answer: [from: string, sdp: RTCSessionDescriptionInit];
  ice: [from: string, candidate: RTCIceCandidateInit];
  reject: [from: string];
}

type Listener<K extends keyof SignalingEvents> = (...args: SignalingEvents[K]) => void;

const TOKEN_KEY = 'signalingToken';

export class SignalingClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private closedByUser = false;
  private listeners = new Map<keyof SignalingEvents, Set<Listener<any>>>();
  private url: string;
  private name = "";
  private fallbackName = 'Device-' + Math.floor(Math.random() * 1000);
  
  public myId: string | null = null;
  public peers: Peer[] = [];

  constructor(url: string) {
    this.url = url;
  }

  // Subscribe to an event. Returns an unsubscribe function.
  on<K extends keyof SignalingEvents>(event: K, fn: Listener<K>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => { this.listeners.get(event)?.delete(fn); };
  }

  private emit<K extends keyof SignalingEvents>(event: K, ...args: SignalingEvents[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(...args));
  }

  connect(name? :string): void {
    const changed = name !== undefined && name !== this.name;
    if (name !== undefined) this.name = name;
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) {
      // Already connecting or connected: do nothing
      if (changed && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'rename', name: this.name || this.fallbackName });
      }
      return
    };


    this.closedByUser = false;
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      if (this.ws !== ws) return;
      console.log('[signaling] connected to', this.url);
      const token = sessionStorage.getItem(TOKEN_KEY) ?? undefined;
      this.send({ type: 'register', name: this.name || this.fallbackName, token });
      this.emit('open');
    };

    ws.onmessage = (event: MessageEvent) => {
      if (this.ws !== ws) return;
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        console.warn('[signaling] bad message', event.data);
        return;
      }
      this.handleMessage(msg);
    };

    ws.onclose = () => {
      if (this.ws !== ws) return; // stale socket, ignore
      console.log('[signaling] disconnected');
      this.ws = null;
      this.myId = null;
      this.peers = [];
      this.emit('close');
      if (!this.closedByUser) {
        this.reconnectTimer = window.setTimeout(() => this.connect(), 5000);
      }
    };

    ws.onerror = (err) => console.error('[signaling] error', err);
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'registered':
        this.myId = msg.id;
        sessionStorage.setItem(TOKEN_KEY, msg.token);
        this.emit('registered', msg.id);
        break;
      case 'peers':
        this.peers = msg.list.filter((p) => p.id !== this.myId);
        this.emit('peers', this.peers);
        break;
      case 'offer':
        this.emit('offer', msg.from, msg.sdp);
        break;
      case 'answer':
        this.emit('answer', msg.from, msg.sdp);
        break;
      case 'ice':
        this.emit('ice', msg.from, msg.candidate);
        break;
      case 'reject':
        this.emit('reject', msg.from);
        break;
    }
  }

  private send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[signaling] not connected, dropped:', msg.type);
    }
  }

  sendOffer(to: string, sdp: RTCSessionDescriptionInit): void {
    this.send({ type: 'offer', to, sdp });
  }
  sendAnswer(to: string, sdp: RTCSessionDescriptionInit): void {
    this.send({ type: 'answer', to, sdp });
  }
  sendIce(to: string, candidate: RTCIceCandidateInit): void {
    this.send({ type: 'ice', to, candidate });
  }
  sendReject(to: string): void {
    this.send({ type: 'reject', to });
  }

  disconnect(): void {
    this.closedByUser = true;
    if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}