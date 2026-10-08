// transfer.ts - orchestrates ONE batch of files over ONE connection.
import { signaling } from '../config/signaling';
import { PeerLink } from './webRTC';
import { prepareFiles, sanitizeMetas, streamFile, FileAssembler } from './file_stream';
import type { FileMeta } from './file_stream';

const CONNECT_TIMEOUT_MS = 15_000;

export type Status =
  | 'idle' | 'connecting' | 'awaiting-accept' | 'transferring'
  | 'complete' | 'failed' | 'rejected';

export interface ReceivedFile {
  name: string;
  size: number;
  url: string;
}

export interface TransferState {
  status: Status;
  direction: 'send' | 'receive' | null;
  peerId: string | null;
  files: FileMeta[];       // every file in this batch
  fileIndex: number;       // file currently moving (0-based)
  fileName: string;        // name of the current file
  fileSize: number;        // TOTAL bytes of the whole batch
  progress: number;        // overall progress by bytes, 0..1
  received: ReceivedFile[]; // finished incoming files (receiver)
  error: string | null;    // failure text, or 'declined' | 'cancelled' | 'busy' when rejected
}

const initial: TransferState = {
  status: 'idle', direction: null, peerId: null, files: [], fileIndex: 0,
  fileName: '', fileSize: 0, progress: 0, received: [], error: null,
};

const ACTIVE: Status[] = ['connecting', 'awaiting-accept', 'transferring'];

class TransferManager {
  state: TransferState = { ...initial };
  private listeners = new Set<() => void>();
  private unsubs: Array<() => void> = [];

  private link: PeerLink | null = null;
  private outgoing: File[] = [];                 // sender: files waiting to be streamed
  private incoming: FileAssembler | null = null; // receiver: the file currently arriving
  private doneBytes = 0;                         // receiver: bytes of finished files
  private connectTimer: number | null = null;

  constructor() {
    this.unsubs.push(
      signaling.on('offer', (from, sdp) => void this.onOffer(from, sdp)),
      signaling.on('answer', (from, sdp) => void this.onAnswer(from, sdp)),
      signaling.on('ice', (from, c) => {
        if (this.link && from === this.state.peerId && ACTIVE.includes(this.state.status)) {
          void this.link.addRemoteCandidate(c);
        }
      }),
      signaling.on('reject', (from) => {
        if (from === this.state.peerId && ACTIVE.includes(this.state.status)) this.rejectWith('busy');
      }),
    );
  }

  // Called on Vite hot reload so an old copy stops listening to signaling
  destroy() {
    this.unsubs.forEach((off) => off());
    this.unsubs = [];
    this.dropLink();
  }

  // ---- store API ----
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };

  getSnapshot = () => this.state;

  private set(patch: Partial<TransferState>) {
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
  // Sends ALL the files to one peer over a single connection
  async send(peerId: string, files: File[]) {
    if (ACTIVE.includes(this.state.status) || files.length === 0) return;
    this.reset();

    const { metas, totalSize } = prepareFiles(files);
    this.outgoing = files;
    this.set({
      status: 'connecting', direction: 'send', peerId,
      files: metas, fileIndex: 0, fileName: metas[0].name, fileSize: totalSize,
    });

    try {
      const link = this.openLink(peerId);
      this.startConnectTimer(); // after openLink, so nothing clears it
      await link.startAsSender();
    } catch (e) {
      console.error('[rtc] send failed', e);
      this.fail('Could not start the transfer');
    }
  }

  accept() {
    if (this.state.direction !== 'receive' || this.state.status !== 'awaiting-accept') return;
    this.link?.sendJson({ type: 'accept' });
    this.set({ status: 'transferring', progress: 0 });
  }

  decline() {
    this.link?.sendJson({ type: 'reject' });
    this.reset(true);
  }

  // Sender only, and only while waiting for the receiver to accept
  cancelRequest() {
    if (this.state.direction !== 'send' || this.state.status !== 'awaiting-accept') return;
    const peerId = this.state.peerId;
    this.link?.sendJson({ type: 'cancel' });
    if (peerId) signaling.sendReject(peerId); // backup in case the channel message doesn't arrive
    this.reset(true);
  }

  reset(graceful = false) {
    this.dropLink(graceful);
    this.state.received.forEach((f) => URL.revokeObjectURL(f.url));
    this.state = { ...initial };
    this.listeners.forEach((fn) => fn());
  }

  // ---- connection lifecycle ----
  private openLink(peerId: string) {
    const link = new PeerLink(peerId, {
      onOpen: () => this.onLinkOpen(),
      onMessage: (data) => this.onMessage(data),
      onClose: () => { if (ACTIVE.includes(this.state.status)) this.fail('Connection closed'); },
      onError: (message) => this.fail(message),
    });
    this.link = link;
    return link;
  }

  private dropLink(graceful = false) {
    this.clearConnectTimer();
    this.link?.close(graceful);
    this.link = null;
    this.incoming = null;
    this.outgoing = [];
    this.doneBytes = 0;
  }

  private fail(error: string) {
    this.dropLink();
    this.set({ status: 'failed', error });
  }

  private rejectWith(reason: 'declined' | 'cancelled' | 'busy') {
    this.dropLink();
    this.set({ status: 'rejected', error: reason });
  }

  // ---- signaling handlers ----
  private async onOffer(from: string, sdp: RTCSessionDescriptionInit) {
    console.log('[rtc] offer received from', from);

    // A retry from the same device replaces a half-open attempt; anything else active is "busy"
    const isRetry =
      this.state.status === 'connecting' && this.state.direction === 'receive' && this.state.peerId === from;
    if (ACTIVE.includes(this.state.status) && !isRetry) {
      signaling.sendReject(from);
      return;
    }

    this.reset();
    this.set({ status: 'connecting', direction: 'receive', peerId: from });

    try {
      const link = this.openLink(from);
      this.startConnectTimer();
      await link.startAsReceiver(sdp);
    } catch (e) {
      console.error('[rtc] answering failed', e);
      this.fail('Could not answer the request');
    }
  }

  private async onAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    const link = this.link;
    if (!link || from !== this.state.peerId || this.state.status !== 'connecting') return;
    console.log('[rtc] answer received from', from);
    try {
      await link.applyAnswer(sdp);
    } catch (e) {
      console.error('[rtc] applying answer failed', e);
      this.fail('Connection failed');
    }
  }

  // ---- batch protocol ----
  // sender -> receiver : batch {files} ... file-start {index}, <binary chunks>, file-end {index} ... batch-done
  // receiver -> sender : accept | reject            either side: cancel
  private onLinkOpen() {
    if (this.state.direction !== 'send' || !this.link) return;
    this.link.sendJson({ type: 'batch', files: this.state.files });
    this.set({ status: 'awaiting-accept' });
  }

  private onMessage(data: string | ArrayBuffer) {
    // Binary = a chunk of the file that is currently arriving
    if (typeof data !== 'string') {
      const asm = this.incoming;
      if (!asm) return;
      asm.push(data);
      if (asm.received > asm.meta.size) return this.fail('A file was larger than announced');
      this.updateProgress((this.doneBytes + asm.received) / (this.state.fileSize || 1));
      return;
    }

    let m;
    try {
      m = JSON.parse(data);
    } catch {
      return; // ignore malformed control messages
    }
    console.log('[rtc] message:', m.type);

    switch (m.type) {
      case 'batch': { // RECEIVER: the sender lists every file; the UI asks accept/decline
        if (this.state.direction !== 'receive' || this.state.status !== 'connecting') return;
        const metas = sanitizeMetas(m.files);
        if (!metas) return this.fail('Invalid file list');
        const total = metas.reduce((sum, f) => sum + f.size, 0);
        this.set({ status: 'awaiting-accept', files: metas, fileIndex: 0, fileName: metas[0].name, fileSize: total });
        return;
      }

      case 'accept': // SENDER: start streaming the whole batch
        void this.streamAll();
        return;

      case 'reject':
        this.rejectWith('declined');
        return;

      case 'cancel':
        this.rejectWith('cancelled');
        return;

      case 'file-start': { // RECEIVER: the next file begins
        if (this.state.direction !== 'receive' || this.state.status !== 'transferring') return;
        const i = Number(m.index);
        const meta = this.state.files[i];
        if (!meta || i !== this.state.received.length) return this.fail('Files arrived out of order');
        this.incoming = new FileAssembler(meta);
        this.set({ fileIndex: i, fileName: meta.name });
        return;
      }

      case 'file-end': { // RECEIVER: the current file is complete
        const asm = this.incoming;
        if (!asm) return;
        const url = asm.finish();
        if (!url) return this.fail('A file arrived incomplete');
        this.incoming = null;
        this.doneBytes += asm.meta.size;
        this.set({ received: [...this.state.received, { name: asm.meta.name, size: asm.meta.size, url }] });
        return;
      }

      case 'batch-done': // RECEIVER: every file has been sent
        if (this.state.direction !== 'receive') return;
        if (this.state.received.length !== this.state.files.length) return this.fail('Some files are missing');
        this.set({ status: 'complete', progress: 1 });
        return;
    }
  }

  // SENDER: streams every file, in order, over the same channel
  private async streamAll() {
    const link = this.link;
    const files = this.outgoing;
    if (!link || this.state.direction !== 'send' || this.state.status !== 'awaiting-accept') return;

    const total = this.state.fileSize || 1;
    this.set({ status: 'transferring', progress: 0, fileIndex: 0 });

    try {
      let sentBefore = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (this.link !== link) return; // cancelled

        this.set({ fileIndex: i, fileName: file.name });
        link.sendJson({ type: 'file-start', index: i });

        const ok = await streamFile(
          link,
          file,
          (sent) => this.updateProgress((sentBefore + sent) / total),
          () => this.link !== link,
        );
        if (!ok) {
          if (this.link === link) this.fail('Transfer interrupted');
          return;
        }

        link.sendJson({ type: 'file-end', index: i });
        sentBefore += file.size;
      }

      link.sendJson({ type: 'batch-done' });
      await link.waitForDrain(); // let the last bytes leave before declaring success
      if (this.link !== link) return;
      this.set({ status: 'complete', progress: 1 });
    } catch {
      if (this.link === link) this.fail('Transfer interrupted');
    }
  }

  private updateProgress(p: number) {
    if (p >= 1 || p - this.state.progress >= 0.01) this.set({ progress: Math.min(p, 1) });
  }
}

export const transfer = new TransferManager();

if (import.meta.hot) {
  import.meta.hot.dispose(() => transfer.destroy());
}