import { signaling } from '../config/signaling';

const BUFFER_LOW = 1024 * 1024;

export interface LinkEvents {
  onOpen: () => void;
  onMessage: (data: string | ArrayBuffer) => void;
  onClose: () => void;              // channel closed on its own
  onError: (message: string) => void;
}

export class PeerLink {
  readonly peerId: string;
  private events: LinkEvents;
  private pc: RTCPeerConnection;
  private dc: RTCDataChannel | null = null;
  private closed = false;
  private remoteQueue: RTCIceCandidateInit[] = []; // their candidates, waiting for setRemoteDescription
  private localQueue: RTCIceCandidateInit[] = [];  // our candidates, held until the offer/answer is sent
  private localReady = false;

  constructor(peerId: string, events: LinkEvents) {
    this.peerId = peerId;
    this.events = events;

    const pc = new RTCPeerConnection({ iceServers: [] }); // LAN only: host candidates
    this.pc = pc;

    pc.onicecandidate = (e) => {
      if (!e.candidate || this.closed) return;
      const c = e.candidate.toJSON();
      if (this.localReady) signaling.sendIce(peerId, c);
      else this.localQueue.push(c);
    };
    pc.oniceconnectionstatechange = () => console.log('[rtc] ice state:', pc.iceConnectionState);
    pc.onconnectionstatechange = () => {
      console.log('[rtc] connection state:', pc.connectionState);
      if (!this.closed && pc.connectionState === 'failed') this.events.onError('Connection failed');
    };
  }

  // ---- negotiation ----
  async startAsSender() {
    this.attachChannel(this.pc.createDataChannel('file'));
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    if (this.closed) return;
    signaling.sendOffer(this.peerId, offer);
    this.releaseLocalIce(); // candidates go out only AFTER the offer
    console.log('[rtc] offer sent to', this.peerId);
  }

  async startAsReceiver(offer: RTCSessionDescriptionInit) {
    this.pc.ondatachannel = (e) => this.attachChannel(e.channel);
    await this.pc.setRemoteDescription(offer);
    await this.flushRemoteIce();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    if (this.closed) return;
    signaling.sendAnswer(this.peerId, answer);
    this.releaseLocalIce(); // candidates go out only AFTER the answer
    console.log('[rtc] answer sent to', this.peerId);
  }

  async applyAnswer(answer: RTCSessionDescriptionInit) {
    if (this.closed || this.pc.signalingState !== 'have-local-offer') return;
    await this.pc.setRemoteDescription(answer);
    await this.flushRemoteIce();
  }

  async addRemoteCandidate(c: RTCIceCandidateInit) {
    if (this.closed) return;
    if (!this.pc.remoteDescription) {
      this.remoteQueue.push(c);
      return;
    }
    try { await this.pc.addIceCandidate(c); } catch (e) { console.warn('[rtc] addIceCandidate failed', e); }
  }

  private releaseLocalIce() {
    this.localReady = true;
    const queued = this.localQueue;
    this.localQueue = [];
    queued.forEach((c) => signaling.sendIce(this.peerId, c));
  }

  private async flushRemoteIce() {
    const queued = this.remoteQueue;
    this.remoteQueue = [];
    for (const c of queued) {
      try { await this.pc.addIceCandidate(c); } catch (e) { console.warn('[rtc] queued ICE failed', e); }
    }
  }

  // ---- data channel ----
  private attachChannel(dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = BUFFER_LOW;
    this.dc = dc;

    dc.onopen = () => {
      console.log('[rtc] data channel open');
      if (!this.closed) this.events.onOpen();
    };
    dc.onmessage = (e) => {
      if (!this.closed) this.events.onMessage(e.data);
    };
    dc.onerror = (e) => {
      if (this.closed) return; // expected when we close on purpose
      console.warn('[rtc] data channel error', e);
      this.events.onError('Data channel error');
    };
    dc.onclose = () => {
      if (!this.closed) this.events.onClose();
    };
  }

  get isOpen() {
    return !this.closed && this.dc?.readyState === 'open';
  }

  get buffered() {
    return this.dc?.bufferedAmount ?? 0;
  }

  sendJson(obj: object) {
    if (!this.isOpen) return;
    try { this.dc!.send(JSON.stringify(obj)); } catch { /* channel closing */ }
  }

  sendBinary(buf: ArrayBuffer) {
    this.dc!.send(buf); // throws if the channel closed; callers treat that as a failure
  }

  // Resolves when the send buffer drops below the threshold (or the channel closes)
  waitForLowBuffer(): Promise<void> {
    const dc = this.dc;
    if (!dc || dc.readyState !== 'open') return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => {
        dc.removeEventListener('bufferedamountlow', done);
        dc.removeEventListener('close', done);
        resolve();
      };
      dc.addEventListener('bufferedamountlow', done);
      dc.addEventListener('close', done);
    });
  }

  async waitForDrain() {
    while (this.isOpen && this.buffered > 0) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  // graceful = wait a moment so a final message (reject/cancel) can reach the other side
  close(graceful = false) {
    if (this.closed) return;
    this.closed = true; // from here on, no event reaches the manager
    const dc = this.dc;
    const pc = this.pc;
    const shut = () => { dc?.close(); pc.close(); };
    if (graceful) setTimeout(shut, 300);
    else shut();
  }
}