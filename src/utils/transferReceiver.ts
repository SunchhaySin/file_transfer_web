import { PeerLink } from "../handlers/webRTC_connection";
import { sanitizeMetas, FileAssembler } from "../handlers/file_stream";
import { signaling } from "../config/signaling";
import type { TransferState } from "./transferManager"

export interface ReceiverContext {
  getState: () => any;
  setState: (patch: Partial<TransferState>) => void;
  openLink: () => PeerLink;
  fail: (error: string) => void;
  rejectWith: (reason: "declined" | "cancelled" | "busy") => void;
  startConnectTimer: () => void;
}

export class TransferReceiver {
  private incoming: FileAssembler | null = null;
  private doneBytes = 0;
  private context: ReceiverContext;

  constructor(context: ReceiverContext) {
    this.context = context
  }

  async onOffer(from: string, sdp: RTCSessionDescriptionInit, resetFn: () => void) {
    const state = this.context.getState();
    const isRetry = state.status === "connecting" && state.direction === "receive" && state.peerId === from;

    if (state.status !== "idle" && !isRetry) {
      signaling.sendReject(from);
      return;
    }

    resetFn();
    this.context.setState({ status: "connecting", direction: "receive", peerId: from });

    try {
      const link = this.context.openLink();
      this.context.startConnectTimer();
      const answer = await link.startAsReceiver(sdp, false);
      if (answer) signaling.sendAnswer(from, answer);
    } catch (e) {
      console.error("[rtc] answering failed", e);
      this.context.fail("Could not answer the request");
    }
  }

  async acceptQROffer(peerId: string, offerSdp: string, resetFn: () => void) {
    resetFn();
    this.context.setState({ status: "connecting", direction: "receive", peerId });

    try {
      const link = this.context.openLink();
      const answer = await link.startAsReceiver({ type: "offer", sdp: offerSdp }, true);

      if (!answer?.sdp) throw new Error("Failed to generate answer SDP");

      this.context.setState({ status: "qr-answer-ready", direction: "receive", peerId });
      return answer.sdp;
    } catch (e) {
      console.error("[rtc] QR accept failed", e);
      this.context.fail("Failed to process QR offer");
      return "";
    }
  }

  handleMessage(data: string | ArrayBuffer, streamAllCallback: () => void) {
    if (typeof data !== "string") {
      const asm = this.incoming;
      if (!asm) return;
      asm.push(data);
      if (asm.received > asm.meta.size) return this.context.fail("A file was larger than announced");
      
      const state = this.context.getState();
      const progress = (this.doneBytes + asm.received) / (state.fileSize || 1);
      if (progress >= 1 || progress - state.progress >= 0.01) {
        this.context.setState({ progress: Math.min(progress, 1) });
      }
      return;
    }

    let m;
    try { m = JSON.parse(data); } catch { return; }

    const state = this.context.getState();

    switch (m.type) {
      case "batch": {
        if (state.direction !== "receive") return;
        const metas = sanitizeMetas(m.files);
        if (!metas) return this.context.fail("Invalid file list");
        const total = metas.reduce((sum, f) => sum + f.size, 0);
        this.context.setState({
          status: "awaiting-accept",
          files: metas,
          fileIndex: 0,
          fileName: metas[0].name,
          fileSize: total,
        });
        return;
      }
      case "accept": 
        // Case: Sender receives the transfer request answer
        // Calls streamAlCallback which triggers () => void this.sender.streamAll(link)
        streamAllCallback();
        return;
      case "reject":
        this.context.rejectWith("declined");
        return;
      case "cancel":
        this.context.rejectWith("cancelled");
        return;
      case "file-start": {
        const i = Number(m.index);
        const meta = state.files[i];
        if (!meta || i !== state.received.length) return this.context.fail("Files arrived out of order");
        this.incoming = new FileAssembler(meta);
        this.context.setState({ fileIndex: i, fileName: meta.name });
        return;
      }
      case "file-end": {
        const asm = this.incoming;
        if (!asm) return;
        const url = asm.finish();
        if (!url) return this.context.fail("A file arrived incomplete");
        this.incoming = null;
        this.doneBytes += asm.meta.size;
        this.context.setState({
          received: [...state.received, { name: asm.meta.name, size: asm.meta.size, url }],
        });
        return;
      }
      case "batch-done":
        if (state.received.length !== state.files.length) return this.context.fail("Some files are missing");
        this.context.setState({ status: "complete", progress: 1 });
        return;
    }
  }

  clear() {
    this.incoming = null;
    this.doneBytes = 0;
  }
}