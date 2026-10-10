import { signaling } from "../config/signaling";
import { PeerLink } from "../handlers/webRTC_connection";
import { TransferSender } from "./transferSender";
import { TransferReceiver } from "./transferReceiver";
import type { FileMeta } from "../handlers/file_stream";

const CONNECT_TIMEOUT_MS = 15000;

export type Status =
  | "idle"
  | "connecting"
  | "awaiting-accept"
  | "transferring"
  | "complete"
  | "failed"
  | "rejected"
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
  private connectTimer: number | null = null;

  // Delegate modules
  private sender = new TransferSender({
    getState: () => this.state,
    setState: (patch: Partial<TransferState>) => this.set(patch),
    openLink: () => this.openLink(),
    dropLink: (graceful?: boolean) => this.dropLink(graceful),
    fail: (err: string) => this.fail(err),
    startConnectTimer: () => this.startConnectTimer(),
  });

  private receiver = new TransferReceiver({
    getState: () => this.state,
    setState: (patch: any) => this.set(patch),
    openLink: () => this.openLink(),
    fail: (err: string) => this.fail(err),
    rejectWith: (reason: "declined" | "cancelled" | "busy") => this.rejectWith(reason),
    startConnectTimer: () => this.startConnectTimer(),
  });

  constructor() {
    this.unsubs.push(
      signaling.on("offer", (from, sdp) => void this.receiver.onOffer(from, sdp, () => this.reset())),
      signaling.on("answer", (from, sdp) => void this.onAnswer(from, sdp)),
      signaling.on("ice", (from, c) => {
        if (this.link && from === this.state.peerId && ACTIVE.includes(this.state.status)) {
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

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.state;

  private set(patch: Partial<TransferState>) {
    if (patch.status && patch.status !== "connecting") this.clearConnectTimer();
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
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

  // Initiates the transfer through the sender (opens connection link)
  send(peerId: string, files: File[]) {
    if (ACTIVE.includes(this.state.status) || files.length === 0) return;
    this.reset();
    return this.sender.send(peerId, files);
  }

  // When the receiver peer accepts the transfering, the state switches to tranferring
  accept() {
    if (this.state.direction !== "receive" || this.state.status !== "awaiting-accept") return;
    this.link?.sendJson({ type: "accept" });
    this.set({ status: "transferring", progress: 0 });
  }

  decline() {
    this.link?.sendJson({ type: "reject" });
    this.reset(true);
  }

  cancelRequest() {
    if (this.state.direction !== "send" || this.state.status !== "awaiting-accept") return;
    const peerId = this.state.peerId;
    this.link?.sendJson({ type: "cancel" });
    if (peerId) signaling.sendReject(peerId);
    this.reset(true);
  }

  reset(graceful = false) {
    this.dropLink(graceful);
    this.state.received.forEach((f) => URL.revokeObjectURL(f.url));
    this.sender.clear();
    this.receiver.clear();
    this.state = { ...initial };
    this.listeners.forEach((fn) => fn());
  }

  async generateQROffer(files: File[]) {
    this.reset();
    return this.sender.generateQROffer(files);
  }

  async acceptQROffer(peerId: string, offerSdp: string) {
    return this.receiver.acceptQROffer(peerId, offerSdp, () => this.reset());
  }

  async applyQRAnswer(answerSdp: string) {
    if (!this.link) return;
    return this.sender.applyQRAnswer(this.link, answerSdp);
  }

  private openLink() {
    const link = new PeerLink({
      onOpen: () => this.onLinkOpen(),
      onMessage: (data) => this.receiver.handleMessage(data, () => void this.sender.streamAll(link)),
      onClose: () => {
        if (ACTIVE.includes(this.state.status)) this.fail("Connection closed");
      },
      onError: (message) => {
        if (this.state.status === "complete") return;
        this.fail(message);
      },
      onLocalIceCandidate: (candidate) => {
        if (this.state.peerId) signaling.sendIce(this.state.peerId, candidate);
      },
    });
    this.link = link;
    return link;
  }

  private dropLink(graceful = false) {
    this.clearConnectTimer();
    this.link?.close(graceful);
    this.link = null;
  }

  private fail(error: string) {
    this.dropLink();
    this.set({ status: "failed", error });
  }

  private rejectWith(reason: "declined" | "cancelled" | "busy") {
    this.dropLink();
    this.set({ status: "rejected", error: reason });
  }

  // Send the file meta data through the datachannel when connection is established
  private onLinkOpen() {
    if (!this.link) return;
    if (this.state.direction === "send") {
      this.link.sendJson({ type: "batch", files: this.state.files });
      this.set({ status: "awaiting-accept" });
    }
    if (this.state.direction === "receive" && this.state.status === "qr-answer-ready") {
      this.set({ status: "connecting" });
    }
  }

  private async onAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    const link = this.link;
    if (!link || from !== this.state.peerId || this.state.status !== "connecting") return;
    try {
      await link.applyAnswer(sdp);
    } catch (e) {
      console.error("[rtc] applying answer failed", e);
      this.fail("Connection failed");
    }
  }
}

export const transfer = new TransferManager();

if (import.meta.hot) {
  import.meta.hot.dispose(() => transfer.destroy());
}