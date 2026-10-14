import { PeerLink } from "../handlers/webRTC_connection";
import { prepareFiles, streamFile } from "../handlers/file_stream";
import { signaling } from "../config/signaling";
import type { TransferState } from "./transferManager";

export interface SenderContext {
  getState: () => any;
  setState: (patch: Partial<TransferState>) => void;
  openLink: () => PeerLink;
  dropLink: (graceful?: boolean) => void;
  fail: (error: string) => void;
  startConnectTimer: () => void;
}

export class TransferSender {
  private outgoingFiles: File[] = [];
  private context: SenderContext;

  constructor(context: SenderContext) {
    this.context = context;
  }

  setOutgoing(files: File[]) {
    this.outgoingFiles = files;
  }

  async send(peerId: string, files: File[]) {
    const { metas, totalSize } = prepareFiles(files);
    this.outgoingFiles = files;

    this.context.setState({
      status: "connecting",
      direction: "send",
      peerId,
      files: metas,
      fileIndex: 0,
      fileName: metas[0].name,
      fileSize: totalSize,
    });

    try {
      const link = this.context.openLink();
      this.context.startConnectTimer();
      const offer = await link.startAsSender(false);
      if (offer) signaling.sendOffer(peerId, offer);
    } catch (e) {
      console.error("[rtc] send failed", e);
      this.context.fail("Could not start the transfer");
    }
  }

  async generateQROffer(files: File[]) {
    const { metas, totalSize } = prepareFiles(files);
    this.outgoingFiles = files;

    this.context.setState({
      status: "awaiting-qr-answer",
      direction: "send",
      peerId: null,
      files: metas,
      fileIndex: 0,
      fileName: metas[0]?.name || "",
      fileSize: totalSize,
    });

    const link = this.context.openLink();
    const offer = await link.startAsSender(true);
    return offer?.sdp || "";
  }

  async applyQRAnswer(link: PeerLink, answerSdp: string) {
    try {
      await link.applyAnswer({ type: "answer", sdp: answerSdp });
      this.context.setState({ status: "transferring", progress: 0 });
    } catch (e) {
      console.error("[rtc] Failed to apply QR answer", e);
      this.context.fail("Could not establish connection from QR code");
    }
  }

  async streamAll(link: PeerLink) {
    const state = this.context.getState();
    if (state.direction !== "send" || state.status !== "awaiting-accept") return;

    const total = state.fileSize || 1;
    this.context.setState({ status: "transferring", progress: 0, fileIndex: 0 });

    try {
      let sentBefore = 0;
      for (let i = 0; i < this.outgoingFiles.length; i++) {
        const file = this.outgoingFiles[i];
        if (link !== link) return; // stale check

        this.context.setState({ fileIndex: i, fileName: file.name });
        link.sendJson({ type: "file-start", index: i });

        const ok = await streamFile(
          link,
          file,
          (sent) => {
            const currentProgress = (sentBefore + sent) / total;
            if (currentProgress >= 1 || currentProgress - state.progress >= 0.01) {
              this.context.setState({ progress: Math.min(currentProgress, 1) });
            }
          },
          () => false,
        );

        if (!ok) {
          this.context.fail("Transfer interrupted");
          return;
        }

        link.sendJson({ type: "file-end", index: i });
        sentBefore += file.size;
      }

      link.sendJson({ type: "batch-done" });
      this.context.setState({ status: "complete", progress: 1 });
      await link.waitForDrain().catch(() => {});
      this.context.dropLink(true); // Clean background network disposal
    } catch {
      this.context.fail("Transfer interrupted");
    }
  }

  clear() {
    this.outgoingFiles = [];
  }
}