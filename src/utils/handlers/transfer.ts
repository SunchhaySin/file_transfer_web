import { signaling } from "../config/signaling";
import { PeerLink } from "./webRTC_connection";
import {
  prepareFiles,
  sanitizeMetas,
  streamFile,
  FileAssembler,
} from "./file_stream";
import type { FileMeta } from "./file_stream";

const CONNECT_TIMEOUT_MS = 15000;

export type Status =
  | "idle"
  | "connecting"
  | "awaiting-accept"
  | "transferring"
  | "complete"
  | "failed"
  | "rejected"
  | "qr-peer"
  | "awaiting-qr-answer"
  | "qr-answer-ready";

export interface ReceivedFile {
  name: string;
  size: number;
  url: string;
}

export interface TransferState {
  status: Status;
  direction: "send" | "receive" | null;
  peerId: string | null;
  files: FileMeta[];
  fileIndex: number;
  fileName: string;
  fileSize: number;
  progress: number;
  received: ReceivedFile[];
  error: string | null;
}

const initial: TransferState = {
  status: "idle",
  direction: null,
  peerId: null,
  files: [],
  fileIndex: 0,
  fileName: "",
  fileSize: 0,
  progress: 0,
  received: [],
  error: null,
};

const ACTIVE: Status[] = ["connecting", "awaiting-accept", "transferring"];

class TransferManager {
  state: TransferState = { ...initial };

  private listeners = new Set<() => void>();
  private unsubs: Array<() => void> = [];

  private link: PeerLink | null = null;
  private outgoing: File[] = [];
  private incoming: FileAssembler | null = null;
  private doneBytes = 0;
  private connectTimer: number | null = null;

  constructor() {
    this.unsubs.push(
      signaling.on("offer", (from, sdp) => void this.onOffer(from, sdp)),
      signaling.on("answer", (from, sdp) => void this.onAnswer(from, sdp)),
      signaling.on("ice", (from, c) => {
        if (
          this.link &&
          from === this.state.peerId &&
          ACTIVE.includes(this.state.status)
        ) {
          void this.link.addRemoteCandidate(c);
        }
      }),
      signaling.on("reject", (from) => {
        if (from === this.state.peerId && ACTIVE.includes(this.state.status))
          this.rejectWith("busy");
      }),
    );
  }

  destroy() {
    this.unsubs.forEach((off) => off());
    this.unsubs = [];
    this.dropLink();
  }

  // ==========================================
  // 1. Store API & Internal State Management
  // ==========================================

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.state;

  private set(patch: Partial<TransferState>) {
    if (patch.status && patch.status !== "connecting") this.clearConnectTimer();
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  private updateProgress(p: number) {
    if (p >= 1 || p - this.state.progress >= 0.01)
      this.set({ progress: Math.min(p, 1) });
  }

  private startConnectTimer() {
    this.clearConnectTimer();
    this.connectTimer = window.setTimeout(() => {
      if (this.state.status === "connecting")
        this.fail("Could not reach the other device");
    }, CONNECT_TIMEOUT_MS);
  }

  private clearConnectTimer() {
    if (this.connectTimer !== null) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
  }

  // ==========================================
  // 2. Public Actions & Lifecycle Control
  // ==========================================

  async send(peerId: string, files: File[]) {
    if (ACTIVE.includes(this.state.status) || files.length === 0) return;
    this.reset();

    const { metas, totalSize } = prepareFiles(files);
    this.outgoing = files;
    this.set({
      status: "connecting",
      direction: "send",
      peerId,
      files: metas,
      fileIndex: 0,
      fileName: metas[0].name,
      fileSize: totalSize,
    });

    try {
      const link = this.openLink(peerId);
      this.startConnectTimer();

      // Standard signaling mode: Trickle ICE (waitForGathering = false)
      const offer = await link.startAsSender(false);

      if (offer) {
        signaling.sendOffer(peerId, offer);
      }
    } catch (e) {
      console.error("[rtc] send failed", e);
      this.fail("Could not start the transfer");
    }
  }

  accept() {
    if (
      this.state.direction !== "receive" ||
      this.state.status !== "awaiting-accept"
    )
      return;
    this.link?.sendJson({ type: "accept" });
    this.set({ status: "transferring", progress: 0 });
  }

  decline() {
    this.link?.sendJson({ type: "reject" });
    this.reset(true);
  }

  cancelRequest() {
    if (
      this.state.direction !== "send" ||
      this.state.status !== "awaiting-accept"
    )
      return;
    const peerId = this.state.peerId;
    this.link?.sendJson({ type: "cancel" });
    if (peerId) signaling.sendReject(peerId);
    this.reset(true);
  }

  reset(graceful = false) {
    this.dropLink(graceful);
    this.state.received.forEach((f) => URL.revokeObjectURL(f.url));
    this.state = { ...initial };
    this.listeners.forEach((fn) => fn());
  }

  // ==========================================
  // 3. Signaling Handlers & QR Support
  // ==========================================

  private async onOffer(from: string, sdp: RTCSessionDescriptionInit) {
    console.log("[rtc] offer received from", from);

    // 1. If we are generating/waiting on a QR code scan, do NOT treat incoming offers as inbound requests!
    if (this.state.peerId === "qr-peer") {
      console.log(
        "[rtc] Ignored incoming offer because we are in QR sender mode.",
      );
      return;
    }

    const isRetry =
      this.state.status === "connecting" &&
      this.state.direction === "receive" &&
      this.state.peerId === from;

    // 2. Reject offers if we are currently active in another transfer or outgoing connection
    if (ACTIVE.includes(this.state.status) && !isRetry) {
      signaling.sendReject(from);
      return;
    }

    this.reset();
    this.set({ status: "connecting", direction: "receive", peerId: from });

    try {
      const link = this.openLink(from);
      this.startConnectTimer();

      // Standard signaling mode: Trickle ICE
      const answer = await link.startAsReceiver(sdp, false);

      if (answer) {
        signaling.sendAnswer(from, answer);
      }
    } catch (e) {
      console.error("[rtc] answering failed", e);
      this.fail("Could not answer the request");
    }
  }

  private async onAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    const link = this.link;
    if (
      !link ||
      from !== this.state.peerId ||
      this.state.status !== "connecting"
    )
      return;

    console.log("[rtc] answer received from", from);
    try {
      await link.applyAnswer(sdp);
    } catch (e) {
      console.error("[rtc] applying answer failed", e);
      this.fail("Connection failed");
    }
  }

  // QR Mode Methods (Offline Vanilla ICE)
  
  // STEP 1 (Sender): Generate Offer & prepare to scan Answer
  async generateQROffer(files: File[]) {
    this.reset();
    const { metas, totalSize } = prepareFiles(files);
    this.outgoing = files;

    this.set({
      status: "awaiting-qr-answer",
      direction: "send",
      peerId: "qr-peer",
      files: metas,
      fileIndex: 0,
      fileName: metas[0]?.name || "",
      fileSize: totalSize,
    });

    const link = this.openLink("qr-peer");
    const offer = await link.startAsSender(true);

    return offer?.sdp || "";
  }

  // STEP 2 (Receiver): Scan Offer QR (#1) & generate Answer QR (#2)
  async acceptQROffer(peerId: string, offerSdp: string) {
    this.reset();

    const offer: RTCSessionDescriptionInit = {
      type: "offer",
      sdp: offerSdp,
    };

    // Set state to connecting while gathering candidates
    this.set({
      status: "connecting",
      direction: "receive",
      peerId,
    });

    try {
      const link = this.openLink(peerId);
      const answer = await link.startAsReceiver(offer, true); // Wait for full ICE candidate gathering

      if (!answer?.sdp) {
        throw new Error("Failed to generate answer SDP");
      }

      // Answer is fully gathered and ready to be rendered as QR Code #2
      this.set({
        status: "qr-answer-ready",
        direction: "receive",
        peerId,
      });

      return answer.sdp;
    } catch (e) {
      console.error("[rtc] QR accept failed", e);
      this.fail("Failed to process QR offer");
      return "";
    }
  }

  // STEP 3 (Sender): Scan Answer QR (#2) & begin file stream
  async applyQRAnswer(answerSdp: string) {
    if (!this.link || this.state.direction !== "send") return;

    try {
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSdp,
      };

      await this.link.applyAnswer(answer);

      // WebRTC link is established, transition sender to transferring state
      this.set({
        status: "transferring",
        progress: 0,
      });
    } catch (e) {
      console.error("[rtc] Failed to apply QR answer", e);
      this.fail("Could not establish connection from QR code");
    }
  }

  // ==========================================
  // 4. Connection Management & Lifecycle
  // ==========================================

  private openLink(peerId: string) {
    const link = new PeerLink(peerId, {
      onOpen: () => this.onLinkOpen(),
      onMessage: (data) => this.onMessage(data),
      onClose: () => {
        if (ACTIVE.includes(this.state.status)) this.fail("Connection closed");
      },
      onError: (message) => this.fail(message),
      onLocalIceCandidate: (candidate) => {
        if (this.state.peerId && this.state.peerId !== "qr-peer") {
          signaling.sendIce(this.state.peerId, candidate);
        }
      },
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
    this.set({ status: "failed", error });
  }

  private rejectWith(reason: "declined" | "cancelled" | "busy") {
    this.dropLink();
    this.set({ status: "rejected", error: reason });
  }

  // ==========================================
  // 5. Batch Protocol & Data Handlers
  // ==========================================

  private onLinkOpen() {
    if (this.state.direction !== "send" || !this.link) return;
    this.link.sendJson({ type: "batch", files: this.state.files });
    this.set({ status: "awaiting-accept" });
  }

  private onMessage(data: string | ArrayBuffer) {
    if (typeof data !== "string") {
      const asm = this.incoming;
      if (!asm) return;
      asm.push(data);
      if (asm.received > asm.meta.size)
        return this.fail("A file was larger than announced");
      this.updateProgress(
        (this.doneBytes + asm.received) / (this.state.fileSize || 1),
      );
      return;
    }

    let m;
    try {
      m = JSON.parse(data);
    } catch {
      return;
    }

    switch (m.type) {
      case "batch": {
        if (
          this.state.direction !== "receive" ||
          this.state.status !== "connecting"
        )
          return;
        const metas = sanitizeMetas(m.files);
        if (!metas) return this.fail("Invalid file list");
        const total = metas.reduce((sum, f) => sum + f.size, 0);
        this.set({
          status: "awaiting-accept",
          files: metas,
          fileIndex: 0,
          fileName: metas[0].name,
          fileSize: total,
        });
        return;
      }

      case "accept":
        void this.streamAll();
        return;

      case "reject":
        this.rejectWith("declined");
        return;

      case "cancel":
        this.rejectWith("cancelled");
        return;

      case "file-start": {
        if (
          this.state.direction !== "receive" ||
          this.state.status !== "transferring"
        )
          return;
        const i = Number(m.index);
        const meta = this.state.files[i];
        if (!meta || i !== this.state.received.length)
          return this.fail("Files arrived out of order");
        this.incoming = new FileAssembler(meta);
        this.set({ fileIndex: i, fileName: meta.name });
        return;
      }

      case "file-end": {
        const asm = this.incoming;
        if (!asm) return;
        const url = asm.finish();
        if (!url) return this.fail("A file arrived incomplete");
        this.incoming = null;
        this.doneBytes += asm.meta.size;
        this.set({
          received: [
            ...this.state.received,
            { name: asm.meta.name, size: asm.meta.size, url },
          ],
        });
        return;
      }

      case "batch-done":
        if (this.state.direction !== "receive") return;
        if (this.state.received.length !== this.state.files.length)
          return this.fail("Some files are missing");
        this.set({ status: "complete", progress: 1 });
        return;
    }
  }

  private async streamAll() {
    const link = this.link;
    const files = this.outgoing;
    if (
      !link ||
      this.state.direction !== "send" ||
      this.state.status !== "awaiting-accept"
    )
      return;

    const total = this.state.fileSize || 1;
    this.set({ status: "transferring", progress: 0, fileIndex: 0 });

    try {
      let sentBefore = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (this.link !== link) return;

        this.set({ fileIndex: i, fileName: file.name });
        link.sendJson({ type: "file-start", index: i });

        const ok = await streamFile(
          link,
          file,
          (sent) => this.updateProgress((sentBefore + sent) / total),
          () => this.link !== link,
        );
        if (!ok) {
          if (this.link === link) this.fail("Transfer interrupted");
          return;
        }

        link.sendJson({ type: "file-end", index: i });
        sentBefore += file.size;
      }

      link.sendJson({ type: "batch-done" });
      await link.waitForDrain();
      if (this.link !== link) return;
      this.set({ status: "complete", progress: 1 });
    } catch {
      if (this.link === link) this.fail("Transfer interrupted");
    }
  }
}

export const transfer = new TransferManager();

if (import.meta.hot) {
  import.meta.hot.dispose(() => transfer.destroy());
}
