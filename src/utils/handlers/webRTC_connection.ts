const BUFFER_LOW = 1024 * 1024;

export interface LinkEvents {
  onOpen: () => void;
  onMessage: (data: string | ArrayBuffer) => void;
  onClose: () => void;
  onError: (message: string) => void;
  onLocalIceCandidate: (candidate: RTCIceCandidateInit) => void;
}

export class PeerLink {
  private events: LinkEvents;
  private pc: RTCPeerConnection;
  private dc: RTCDataChannel | null = null;
  private closed = false;
  private remoteQueue: RTCIceCandidateInit[] = [];
  private localQueue: RTCIceCandidateInit[] = [];
  private localReady = false;

  constructor(events: LinkEvents) {
    this.events = events;

    const pc = new RTCPeerConnection({ iceServers: [] }); // LAN only: host candidates
    this.pc = pc;

    pc.onicecandidate = (e) => {
      if (!e.candidate || this.closed) return;
      const c = e.candidate.toJSON();
      if (this.localReady) {
        this.events.onLocalIceCandidate(c);
      } else {
        this.localQueue.push(c);
      }
    };

    pc.oniceconnectionstatechange = () => console.log('[rtc] ice state:', pc.iceConnectionState);
    pc.onconnectionstatechange = () => {
      console.log('[rtc] connection state:', pc.connectionState);
      if (!this.closed && pc.connectionState === 'failed') {
        this.events.onError('Connection failed');
      }
    };
  }

  // ---- negotiation ----
  async waitForIceGathering(): Promise<void> {
    if (this.pc.iceGatheringState === 'complete') return;

    return new Promise((resolve) => {
      const checkState = () => {
        if (this.pc.iceGatheringState === 'complete') {
          this.pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };
      this.pc.addEventListener('icegatheringstatechange', checkState);

      // Safety timeout after 3s in case candidate gathering gets stuck
      setTimeout(() => {
        this.pc.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }, 3000);
    });
  }

  async startAsSender(waitForGathering = false): Promise<RTCSessionDescriptionInit | undefined> {
    // 1. Sender MUST create the Data Channel
    this.attachChannel(this.pc.createDataChannel('file'));

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    if (this.closed) return undefined;

    if (waitForGathering) {
      await this.waitForIceGathering();
      return this.pc.localDescription ?? undefined;
    }

    // Release queued local candidates AFTER local description is set
    this.releaseLocalIce();
    return offer;
  }

  async startAsReceiver(
    offer: RTCSessionDescriptionInit,
    waitForGathering = false
  ): Promise<RTCSessionDescriptionInit | undefined> {
    // 2. Receiver MUST listen for incoming Data Channel
    this.pc.ondatachannel = (e) => this.attachChannel(e.channel);

    await this.pc.setRemoteDescription(offer);
    await this.flushRemoteIce();

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    if (this.closed) return undefined;

    if (waitForGathering) {
      await this.waitForIceGathering();
      return this.pc.localDescription ?? undefined;
    }

    // Release queued local candidates AFTER answer is set
    this.releaseLocalIce();
    return answer;
  }

  async applyAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    // Prevent setRemoteDescription error when signalingState is already stable
    if (this.pc.signalingState !== 'have-local-offer') {
      console.warn(
        `[rtc] Ignored redundant answer (signalingState: "${this.pc.signalingState}")`
      );
      return;
    }

    await this.pc.setRemoteDescription(answer);
    await this.flushRemoteIce();
  }

  async addRemoteCandidate(c: RTCIceCandidateInit) {
    if (this.closed) return;
    if (!this.pc.remoteDescription) {
      this.remoteQueue.push(c);
      return;
    }
    try {
      await this.pc.addIceCandidate(c);
    } catch (e) {
      console.warn('[rtc] addIceCandidate failed', e);
    }
  }

  private releaseLocalIce() {
    this.localReady = true;
    const queued = this.localQueue;
    this.localQueue = [];
    queued.forEach((c) => this.events.onLocalIceCandidate(c));
  }

  private async flushRemoteIce() {
    const queued = this.remoteQueue;
    this.remoteQueue = [];
    for (const c of queued) {
      try {
        await this.pc.addIceCandidate(c);
      } catch (e) {
        console.warn('[rtc] queued ICE failed', e);
      }
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
      if (this.closed) return;
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
    try {
      this.dc!.send(JSON.stringify(obj));
    } catch {
      /* channel closing */
    }
  }

  sendBinary(buf: ArrayBuffer) {
    this.dc!.send(buf);
  }

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

  close(graceful = false) {
    if (this.closed) return;
    this.closed = true;
    const dc = this.dc;
    const pc = this.pc;
    const shut = () => {
      dc?.close();
      pc.close();
    };
    if (graceful) setTimeout(shut, 300);
    else shut();
  }
}