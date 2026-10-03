// transfer.ts - WebRTC connection + file transfer, driven by the shared signaling instance
import { signaling } from '../config/signaling'; // must be the SAME file peer_discovery.ts imports

const CHUNK = 16 * 1024;
const HIGH_WATER = 4 * 1024 * 1024;
const CONNECT_TIMEOUT_MS = 15_000;

export type Status =
  | 'idle' | 'connecting' | 'awaiting-accept' | 'transferring'
  | 'complete' | 'failed' | 'rejected';

export interface TransferState {
  status: Status;
  direction: 'send' | 'receive' | null;
  peerId: string | null;
  fileName: string;
  fileSize: number;
  progress: number; // 0..1
  downloadUrl: string | null;
  error: string | null;
}

const initial: TransferState = {
  status: 'idle', direction: null, peerId: null, fileName: '',
  fileSize: 0, progress: 0, downloadUrl: null, error: null,
};

const ACTIVE: Status[] = ['connecting', 'awaiting-accept', 'transferring'];

class TransferManager {
  state: TransferState = { ...initial };
  private listeners = new Set<() => void>();
  private unsubs: Array<() => void> = [];

  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private pendingIce: RTCIceCandidateInit[] = [];    // their candidates, waiting for setRemoteDescription
  private localIceQueue: RTCIceCandidateInit[] = []; // our candidates, held until the offer/answer is sent
  private localIceReady = false;
  private connectTimer: number | null = null;

  private file: File | null = null;
  private meta: { name: string; size: number; mime: string } | null = null;
  private chunks: ArrayBuffer[] = [];
  private received = 0;

  constructor() {
    this.unsubs.push(
      signaling.on('offer', (from, sdp) => void this.onOffer(from, sdp)),
      signaling.on('answer', (from, sdp) => void this.onAnswer(from, sdp)),
      signaling.on('ice', (from, c) => void this.onIce(from, c)),
      signaling.on('reject', (from) => {
        if (from === this.state.peerId && ACTIVE.includes(this.state.status)) {
          this.cleanup();
          this.set({ status: 'rejected' });
        }
      }),
    );
  }

  // Called on Vite hot reload so an old copy stops listening to signaling
  destroy() {
    this.unsubs.forEach((off) => off());
    this.unsubs = [];
    this.cleanup();
  }

  // ---- store API (for the zustand bridge / useSyncExternalStore) ----
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };
  
  getSnapshot = () => this.state;

  private set(patch: Partial<TransferState>) {
    // Once we leave "connecting" the connect timeout is no longer needed
    if (patch.status && patch.status !== 'connecting') this.clearConnectTimer();
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  // ---- connect timeout ----
  private startConnectTimer() {
    this.clearConnectTimer();
    this.connectTimer = window.setTimeout(() => {
      if (this.state.status === 'connecting') this.fail('Could not reach the other device');
    }, CONNECT_TIMEOUT_MS);
  }

  private clearConnectTimer() {
    if (this.connectTimer !== null) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
  }

  // ---- public actions ----
  async send(peerId: string, file: File) {
    if (ACTIVE.includes(this.state.status)) return;
    this.reset();
    this.file = file;
    this.set({ status: 'connecting', direction: 'send', peerId, fileName: file.name, fileSize: file.size });

    try {
      const pc = this.createPc(peerId);
      this.startConnectTimer(); // must come after createPc, because createPc calls cleanup()
      this.setupChannel(pc.createDataChannel('file'));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (this.pc !== pc) return; // cancelled while we were awaiting

      signaling.sendOffer(peerId, offer);
      this.releaseLocalIce(peerId); // candidates go out only AFTER the offer
      console.log('[rtc] offer sent to', peerId);
    } catch (e) {
      console.error('[rtc] send failed', e);
      this.fail('Could not start the transfer');
    }
  }

  accept() {
    this.dc?.send(JSON.stringify({ type: 'accept' }));
    this.set({ status: 'transferring' });
  }

  decline() {
    try { this.dc?.send(JSON.stringify({ type: 'reject' })); } catch { /* channel closing */ }
    this.reset();
  }

  // Sender only, and only while waiting for the receiver to accept
  cancelRequest() {
    if (this.state.direction !== 'send' || this.state.status !== 'awaiting-accept') return;
    const peerId = this.state.peerId;
    try {
      if (this.dc?.readyState === 'open') this.dc.send(JSON.stringify({ type: 'cancel' }));
    } catch { /* channel already closing */ }
    if (peerId) signaling.sendReject(peerId); // backup in case the message doesn't arrive
    this.reset();
  }

  reset() {
    this.cleanup();
    if (this.state.downloadUrl) URL.revokeObjectURL(this.state.downloadUrl);
    this.state = { ...initial };
    this.listeners.forEach((fn) => fn());
  }

  // ---- WebRTC plumbing ----
  private createPc(peerId: string) {
    this.cleanup();
    this.localIceReady = false;
    this.localIceQueue = [];

    const pc = new RTCPeerConnection({ iceServers: [] }); // LAN only: host candidates
    pc.onicecandidate = (e) => {
      if (!e.candidate || this.pc !== pc) return;
      const c = e.candidate.toJSON();
      console.log('[rtc] local candidate:', e.candidate.candidate.split(' ')[7]);
      if (this.localIceReady) signaling.sendIce(peerId, c);
      else this.localIceQueue.push(c); // hold until the offer/answer has been sent
    };
    pc.onicegatheringstatechange = () => console.log('[rtc] gathering:', pc.iceGatheringState);
    pc.oniceconnectionstatechange = () => console.log('[rtc] ice state:', pc.iceConnectionState);
    pc.onconnectionstatechange = () => {
      console.log('[rtc] connection state:', pc.connectionState);
      if (this.pc === pc && pc.connectionState === 'failed') this.fail('Connection failed');
    };
    this.pc = pc;
    return pc;
  }

  private releaseLocalIce(peerId: string) {
    this.localIceReady = true;
    const queued = this.localIceQueue;
    this.localIceQueue = [];
    queued.forEach((c) => signaling.sendIce(peerId, c));
  }

  private async onOffer(from: string, sdp: RTCSessionDescriptionInit) {
    console.log('[rtc] offer received from', from);

    // A retry from the same device replaces a half-open attempt; anything else active is "busy"
    const isRetry = this.state.status === 'connecting' && this.state.peerId === from;
    if (ACTIVE.includes(this.state.status) && !isRetry) {
      signaling.sendReject(from);
      return;
    }

    this.reset();
    this.set({ status: 'connecting', direction: 'receive', peerId: from });

    try {
      const pc = this.createPc(from);
      this.startConnectTimer();
      pc.ondatachannel = (e) => this.setupChannel(e.channel);
      await pc.setRemoteDescription(sdp);
      await this.flushIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (this.pc !== pc) return; // cancelled while we were awaiting

      signaling.sendAnswer(from, answer);
      this.releaseLocalIce(from); // candidates go out only AFTER the answer
      console.log('[rtc] answer sent to', from);
    } catch (e) {
      console.error('[rtc] answering failed', e);
      this.fail('Could not answer the request');
    }
  }

  private async onAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.pc;
    // Ignore answers that aren't for the offer we currently have out
    if (!pc || from !== this.state.peerId || this.state.status !== 'connecting') return;
    if (pc.signalingState !== 'have-local-offer') return;
    console.log('[rtc] answer received from', from);
    try {
      await pc.setRemoteDescription(sdp);
      await this.flushIce();
    } catch (e) {
      console.error('[rtc] applying answer failed', e);
      this.fail('Connection failed');
    }
  }

  private async onIce(from: string, c: RTCIceCandidateInit) {
    const pc = this.pc;
    // Only accept candidates for the negotiation in progress; anything else is stale
    if (!pc || from !== this.state.peerId || !ACTIVE.includes(this.state.status)) return;
    try {
      if (pc.remoteDescription) await pc.addIceCandidate(c);
      else this.pendingIce.push(c); // remote description not set yet: queue it
    } catch (e) {
      console.warn('[rtc] addIceCandidate failed', e);
    }
  }

  private async flushIce() {
    const queued = this.pendingIce;
    this.pendingIce = [];
    for (const c of queued) {
      try { await this.pc?.addIceCandidate(c); } catch (e) { console.warn('[rtc] queued ICE failed', e); }
    }
  }

  // ---- data channel ----
  private setupChannel(dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = 1024 * 1024;
    this.dc = dc;

    dc.onopen = () => {
      console.log('[rtc] data channel open');
      if (this.state.direction === 'send' && this.file) {
        dc.send(JSON.stringify({ type: 'meta', name: this.file.name, size: this.file.size, mime: this.file.type }));
        this.set({ status: 'awaiting-accept' });
      }
    };
    dc.onmessage = (e) => this.onMessage(e.data);
    dc.onerror = (e) => {
      // Errors fired because we (or the peer) closed the channel on purpose are expected
      if (this.dc !== dc || !ACTIVE.includes(this.state.status)) return;
      console.warn('[rtc] data channel error', e);
      this.fail('Data channel error');
    };
    dc.onclose = () => {
      if (this.dc === dc && ACTIVE.includes(this.state.status)) this.fail('Connection closed');
    };
  }

  private onMessage(data: string | ArrayBuffer) {
    // Binary = a file chunk (receiver side)
    if (typeof data !== 'string') {
      this.chunks.push(data);
      this.received += data.byteLength;
      this.updateProgress(this.received / (this.meta?.size || 1));
      return;
    }

    console.log('[rtc] message:', data.slice(0, 80));

    let m;
    try {
      m = JSON.parse(data);
    } catch {
      return; // ignore malformed control messages
    }

    if (m.type === 'meta') {
      // RECEIVER: the sender describes the incoming file; the UI will ask accept/decline
      const size = Number(m.size);
      if (!Number.isFinite(size) || size < 0) return this.fail('Invalid file info');
      const name = String(m.name).replace(/[\\/:*?"<>|]/g, '_').slice(0, 255) || 'file';
      this.meta = { name, size, mime: String(m.mime || '') };
      this.chunks = [];
      this.received = 0;
      this.set({ status: 'awaiting-accept', fileName: name, fileSize: size });
    } else if (m.type === 'accept') {
      // SENDER: the receiver accepted, start streaming
      void this.streamFile();
    } else if (m.type === 'reject' || m.type === 'cancel') {
      // Either side: the other device declined or cancelled
      this.cleanup();
      this.set({ status: 'rejected' });
    } else if (m.type === 'done' && this.meta) {
      // RECEIVER: all chunks arrived, build the file
      const url = URL.createObjectURL(new Blob(this.chunks, { type: this.meta.mime }));
      this.chunks = [];
      this.set({ status: 'complete', progress: 1, downloadUrl: url });
    }
  }

  private async streamFile() {
    const dc = this.dc;
    const file = this.file;
    if (!dc || !file) return;
    this.set({ status: 'transferring', progress: 0 });

    try {
      let offset = 0;
      while (offset < file.size) {
        if (dc.readyState !== 'open') throw new Error('closed');
        if (dc.bufferedAmount > HIGH_WATER) { // backpressure
          await new Promise<void>((r) => dc.addEventListener('bufferedamountlow', () => r(), { once: true }));
        }
        const buf = await file.slice(offset, offset + CHUNK).arrayBuffer();
        dc.send(buf);
        offset += buf.byteLength;
        this.updateProgress(offset / file.size);
      }
      dc.send(JSON.stringify({ type: 'done' }));
      while (dc.bufferedAmount > 0) await new Promise((r) => setTimeout(r, 50)); // let it drain
      this.set({ status: 'complete', progress: 1 });
    } catch {
      if (this.dc !== dc) return; // cleaned up on purpose (cancel/decline), not a failure
      this.fail('Transfer interrupted');
    }
  }

  private updateProgress(p: number) {
    if (p >= 1 || p - this.state.progress >= 0.01) this.set({ progress: Math.min(p, 1) });
  }

  private fail(error: string) {
    this.cleanup();
    this.set({ status: 'failed', error });
  }

  private cleanup() {
    this.clearConnectTimer();
    const dc = this.dc;
    const pc = this.pc;
    this.dc = null; // null first so onclose handlers see it is intentional
    this.pc = null;
    dc?.close();
    pc?.close();
    this.pendingIce = [];
    this.localIceQueue = [];
    this.localIceReady = false;
    this.chunks = [];
  }
}

export const transfer = new TransferManager();

if (import.meta.hot) {
  import.meta.hot.dispose(() => transfer.destroy());
}