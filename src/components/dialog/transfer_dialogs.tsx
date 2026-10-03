import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/shallow";
import { useStateProvider } from "../provider/state_provider";

const formatSize = (n: number) =>
  n < 1024 ? `${n} B`
  : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB`
  : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB`
  : `${(n / 1024 ** 3).toFixed(2)} GB`;

// Shared popup shell. The portal renders it on <body>, so a parent with a
// transform or backdrop-blur can't trap the fixed overlay.
function Modal({ title, children }: { title: string; children: ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl flex flex-col gap-4"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function FileInfo({ name, size }: { name: string; size: number }) {
  return (
    <div className="rounded-xl bg-gray-100 px-3 py-2 text-center">
      <p className="font-semibold break-all">{name}</p>
      <p className="text-sm text-gray-600">{formatSize(size)}</p>
    </div>
  );
}

function Notice({ text, tone, onClose }: { text: string; tone: "ok" | "bad"; onClose: () => void }) {
  return (
    <Modal title="Transfer update">
      <p className={`text-center font-semibold ${tone === "ok" ? "text-green-700" : "text-red-600"}`}>
        {text}
      </p>
      <button onClick={onClose} className="py-2 rounded-xl bg-gray-300 hover:bg-gray-400">
        Close
      </button>
    </Modal>
  );
}

// Mount ONCE (e.g. in Dashboard). It watches the transfer state and opens
// whichever dialog matches the current stage.
export default function TransferDialogHost() {
  const { t, peers, isTransferPanel, acceptTransfer, declineTransfer, clearTransfer } =
    useStateProvider(
      useShallow((s) => ({
        t: s.transferState,
        peers: s.peers,
        isTransferPanel: s.isTransferPanel,
        acceptTransfer: s.acceptTransfer,
        declineTransfer: s.declineTransfer,
        clearTransfer: s.clearTransfer,
      })),
    );

  const peerName = peers.find((p) => p.id === t.peerId)?.name ?? "Another device";

  // ---------- RECEIVING DEVICE ----------
  if (t.direction === "receive") {
    switch (t.status) {
      case "awaiting-accept":
        return (
          <Modal title="Incoming file">
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-full bg-linear-to-b from-green-500/60 to-green-500/90 flex items-center justify-center text-xl font-semibold">
                {peerName[0]?.toUpperCase()}
              </div>
              <h2 className="text-lg font-semibold text-center">
                {peerName} wants to send you a file
              </h2>
            </div>
            <FileInfo name={t.fileName} size={t.fileSize} />
            <div className="flex gap-3">
              <button
                onClick={declineTransfer}
                className="flex-1 py-2 rounded-xl bg-gray-300 hover:bg-gray-400 transition-colors duration-200"
              >
                Decline
              </button>
              <button
                autoFocus
                onClick={acceptTransfer}
                className="flex-1 py-2 rounded-xl bg-green-400 hover:bg-green-500 font-semibold transition-colors duration-200"
              >
                Accept
              </button>
            </div>
          </Modal>
        );

      case "transferring":
        return (
          <Modal title="Receiving file">
            <h2 className="text-lg font-semibold text-center">Receiving from {peerName}</h2>
            <FileInfo name={t.fileName} size={t.fileSize} />
            <progress value={t.progress} max={1} className="w-full h-3" />
            <p className="text-center text-sm">{Math.round(t.progress * 100)}%</p>
          </Modal>
        );

      case "complete":
        return (
          <Modal title="File received">
            <h2 className="text-lg font-semibold text-center text-green-700">File received</h2>
            <FileInfo name={t.fileName} size={t.fileSize} />
            {t.downloadUrl && (
              <a
                href={t.downloadUrl}
                download={t.fileName}
                className="text-center py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                Download
              </a>
            )}
            <button onClick={clearTransfer} className="text-sm underline">
              Close
            </button>
          </Modal>
        );

      case "failed":
        return <Notice tone="bad" text={`Transfer failed: ${t.error ?? "unknown error"}`} onClose={clearTransfer} />;

      case "rejected":
        return <Notice tone="bad" text="The sender cancelled the transfer" onClose={clearTransfer} />;

      default:
        return null; // idle, or still connecting: nothing to show yet
    }
  }

  // ---------- SENDING DEVICE ----------
  // While the transfer panel is open it shows its own status. This only covers
  // the case where the sender navigated away before the result arrived.
  if (t.direction === "send" && !isTransferPanel) {
    switch (t.status) {
      case "complete":
        return <Notice tone="ok" text={`${t.fileName} was sent successfully`} onClose={clearTransfer} />;
      case "failed":
        return <Notice tone="bad" text={`Transfer failed: ${t.error ?? "unknown error"}`} onClose={clearTransfer} />;
      case "rejected":
        return <Notice tone="bad" text={`${peerName} declined the transfer`} onClose={clearTransfer} />;
      default:
        return null;
    }
  }

  return null;
}