// peerDiscovery.ts - connection status + live list of other devices.
// Import { peerDiscovery } anywhere; call peerDiscovery.start() once on your dashboard.
import { signaling } from '../config/signaling';
import type { Peer } from '../config/client';

export interface DiscoveryState {
  connected: boolean;
  myId: string | null;
  peers: Peer[]; // other devices only, sorted by name
}

class PeerDiscovery {
  private state: DiscoveryState = { connected: false, myId: null, peers: [] };
  private listeners = new Set<() => void>();

  constructor() {
    // Subscribed at import time, so no events are missed once start() is called
    signaling.on('open', () => this.set({ connected: true }));
    signaling.on('close', () => this.set({ connected: false, myId: null, peers: [] }));
    signaling.on('registered', (myId) => this.set({ myId }));
    signaling.on('peers', (list) =>
      this.set({ peers: [...list].sort((a, b) => a.name.localeCompare(b.name)) })
    );
  }

  // Safe to call more than once (React StrictMode, remounts): signaling ignores repeats
  start(name?: string) {
    signaling.connect(name);
  }

  stop() {
    signaling.disconnect();
  }

  getPeerName(id: string | null): string | undefined {
    return this.state.peers.find((p) => p.id === id)?.name;
  }

  // ---- store API for React's useSyncExternalStore ----
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };
  
  getSnapshot = () => this.state;

  private set(patch: Partial<DiscoveryState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
}

export const peerDiscovery = new PeerDiscovery();