// transfer.ts - WebRTC connection + file transfer, driven by the shared signaling instance
import { signaling } from './signaling';

const CHUNK = 16 * 1024;
const HIGH_WATER = 4 * 1024 * 1024;

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
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private pendingIce: RTCIceCandidateInit[] = [];
  private file: File | null = null;
  private meta: { name: string; size: number; mime: string } | null = null;
  private chunks: ArrayBuffer[] = [];
  private received = 0;

  constructor() {
    signaling.on('offer', (from, sdp) => void this.onOffer(from, sdp));
    signaling.on('answer', (from, sdp) => void this.onAnswer(from, sdp));
    signaling.on('ice', (from, c) => void this.onIce(from, c));
    signaling.on('reject', (from) => {
      if (from === this.state.peerId) { this.cleanup(); this.set({ status: 'rejected' }); }
    });
  }

  // ---- store API (for React's useSyncExternalStore) ----
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };
  getSnapshot = () => this.state;

  private set(patch: Partial<TransferState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  // ---- public actions ----
  async send(peerId: string, file: File) {
    if (ACTIVE.includes(this.state.status)) return;
    this.reset();
    this.file = file;
    this.set({ status: 'connecting', direction: 'send', peerId, fileName: file.name, fileSize: file.size });

    const pc = this.createPc(peerId);
    const dc = pc.createDataChannel('file');
    this.setupChannel(dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signaling.sendOffer(peerId, offer);
  }

  accept() {
    this.dc?.send(JSON.stringify({ type: 'accept' }));
    this.set({ status: 'transferring' });
  }

  decline() {
    this.dc?.send(JSON.stringify({ type: 'reject' }));
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
    const pc = new RTCPeerConnection({ iceServers: [] }); // LAN only: host candidates
    pc.onicecandidate = (e) => { if (e.candidate) signaling.sendIce(peerId, e.candidate.toJSON()); };
    pc.onconnectionstatechange = () => {
      if (this.pc === pc && pc.connectionState === 'failed') this.fail('Connection failed');
    };
    this.pc = pc;
    return pc;
  }

  private async onOffer(from: string, sdp: RTCSessionDescriptionInit) {
    if (ACTIVE.includes(this.state.status)) { signaling.sendReject(from); return; } // busy
    this.reset();
    this.set({ status: 'connecting', direction: 'receive', peerId: from });

    const pc = this.createPc(from);
    pc.ondatachannel = (e) => this.setupChannel(e.channel);
    await pc.setRemoteDescription(sdp);
    await this.flushIce();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    signaling.sendAnswer(from, answer);
  }

  private async onAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    if (!this.pc || from !== this.state.peerId) return;
    await this.pc.setRemoteDescription(sdp);
    await this.flushIce();
  }

  private async onIce(from: string, c: RTCIceCandidateInit) {
    if (from !== this.state.peerId) return;
    if (this.pc?.remoteDescription) await this.pc.addIceCandidate(c);
    else this.pendingIce.push(c); // arrived before the remote description: queue it
  }

  private async flushIce() {
    for (const c of this.pendingIce) await this.pc?.addIceCandidate(c);
    this.pendingIce = [];
  }

  // ---- data channel ----
  private setupChannel(dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = 1024 * 1024;
    this.dc = dc;

    dc.onopen = () => {
      if (this.state.direction === 'send' && this.file) {
        dc.send(JSON.stringify({ type: 'meta', name: this.file.name, size: this.file.size, mime: this.file.type }));
        this.set({ status: 'awaiting-accept' });
      }
    };
    dc.onmessage = (e) => this.onMessage(e.data);
    dc.onerror = () => this.fail('Data channel error');
    dc.onclose = () => { if (this.dc === dc && ACTIVE.includes(this.state.status)) this.fail('Connection closed'); };
  }

  private onMessage(data: string | ArrayBuffer) {
    if (typeof data !== 'string') {
      this.chunks.push(data);
      this.received += data.byteLength;
      this.updateProgress(this.received / (this.meta?.size || 1));
      return;
    }

    const m = JSON.parse(data);
    if (m.type === 'meta') {
      const size = Number(m.size);
      if (!Number.isFinite(size) || size < 0) return this.fail('Invalid file info');
      const name = String(m.name).replace(/[\\/:*?"<>|]/g, '_').slice(0, 255) || 'file';
      this.meta = { name, size, mime: String(m.mime || '') };
      this.chunks = [];
      this.received = 0;
      this.set({ status: 'awaiting-accept', fileName: name, fileSize: size }); // UI asks accept/decline
    } else if (m.type === 'accept') {
      void this.streamFile();
    } else if (m.type === 'reject') {
      this.cleanup();
      this.set({ status: 'rejected' });
    } else if (m.type === 'done' && this.meta) {
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
    const dc = this.dc;
    const pc = this.pc;
    this.dc = null; // null first so onclose handlers see it is intentional
    this.pc = null;
    dc?.close();
    pc?.close();
    this.pendingIce = [];
    this.chunks = [];
  }
}

export const transfer = new TransferManager();