import { useShallow } from "zustand/shallow";
import { useStateProvider } from "../provider/state_provider";
import useScreenSize from "../provider/windowWidth";
import { Modal, Notice } from "./dialog_components";
import { FileInfoList, FileInfoDownloadList } from "./dialog_components";
import type { ReceivedFile } from "../../utils/handlers/transfer";

export function downloadReceivedFile(file: ReceivedFile) {
  const a = document.createElement("a");
  a.href = file.url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Downloads every file, with a short gap so the browser doesn't block the extras
export async function downloadAllReceived(files: ReceivedFile[]) {
  for (const f of files) {
    downloadReceivedFile(f);
    await new Promise((r) => setTimeout(r, 300));
  }
}

// Receiving device only. Mount ONCE (e.g. in Dashboard).
export default function TransferDialogReceiver() {
  const { t, peers, acceptTransfer, declineTransfer, clearTransfer } = useStateProvider(
    useShallow((s) => ({
      t: s.transferState,
      peers: s.peers,
      acceptTransfer: s.acceptTransfer,
      declineTransfer: s.declineTransfer,
      clearTransfer: s.clearTransfer,
    })),
  );

  const { isTablet, isDesktop } = useScreenSize();

  if (t.direction !== "receive") return null;

  const peerName = peers.find((p) => p.id === t.peerId)?.name ?? "Another device";
  const fileCount = t.files.length;

  switch (t.status) {
    case "awaiting-accept":
      return (
        <Modal title="Incoming file">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`rounded-full bg-linear-to-b from-green-500/60 to-green-500/90 flex items-center justify-center font-semibold
                ${isDesktop ? "h-14 w-14 text-xl" : isTablet ? "h-12 w-12 text-lg" : "h-10 w-10"}`}
            >
              {peerName[0]?.toUpperCase()}
            </div>
            <p className={`font-semibold text-center ${isDesktop || isTablet ? "text-md" : "text-sm"}`}>
              {peerName} wants to send you {fileCount} {fileCount === 1 ? "file" : "files"}
            </p>
          </div>
          <hr className="border border-black/20 w-full" />
          <FileInfoList t={t} />
          <div className="flex gap-3">
            <button
              onClick={declineTransfer}
              className="flex-1 py-2 rounded-xl bg-gray-400/60 hover:bg-gray-400 transition-colors duration-200"
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
          {/* <FileInfo name={t.fileName} size={t.fileSize} /> */}
          <FileInfoList t={t} />
          <progress value={t.progress} max={1} className="w-full h-3" />
          <p className="text-center text-sm">{Math.round(t.progress * 100)}%</p>
        </Modal>
      );

    case "complete":
      return (
    <Modal title="Files received">
      <h2 className="text-lg font-semibold text-center text-green-700">
        {t.received.length === 1 ? "File received" : `${t.received.length} files received`}
      </h2>
      <FileInfoDownloadList t={t} onDownload={downloadReceivedFile} />
      <div className="flex gap-1 items-center w-full">
        <button onClick={clearTransfer} className="py-1.5 bg-red-400 hover:bg-red-500 rounded-xl flex-1">
          Discard
        </button>
        {t.received.length > 1 && (
          <button
            onClick={() => downloadAllReceived(t.received)}
            className="py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold flex-1"
          >
            Download all
          </button>
        )}
      </div>
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