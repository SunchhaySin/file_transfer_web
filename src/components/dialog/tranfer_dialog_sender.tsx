import { useShallow } from "zustand/shallow";
import { useStateProvider } from "../provider/state_provider";
import { Modal, Notice } from "./dialog_components";
import { FileInfoList } from "./dialog_components";

// Sending device only. Mount ONCE (e.g. in Dashboard).
export default function TransferDialogReceiveSender() {
  const { t, peers, clearTransfer, cancelRequest } = useStateProvider(
    useShallow((s) => ({
      t: s.transferState,
      peers: s.peers,
      clearTransfer: s.clearTransfer,
      cancelRequest: s.cancelRequest,
    })),
  );

  if (t.direction !== "send") return null;

  const peerName = peers.find((p) => p.id === t.peerId)?.name ?? "the other device";

  switch (t.status) {
    case "connecting":
      return (
        <Modal title="Connecting">
          <h2 className="text-lg font-semibold text-center">Connecting to {peerName}...</h2>
          {/* <FileInfo name={t.fileName} size={t.fileSize} /> */}
          <FileInfoList t={t} />
        </Modal>
      );

    case "awaiting-accept":
      return (
        <Modal title="Waiting for response">
          <h2 className="text-lg font-semibold text-center">Waiting for {peerName} to accept...</h2>
          {/* <FileInfo name={t.fileName} size={t.fileSize} /> */}
          <FileInfoList t={t} />

          <button
            onClick={cancelRequest}
            className="py-2 rounded-xl bg-red-400 hover:bg-red-500 font-semibold transition-colors duration-200"
          >
            Cancel request
          </button>
        </Modal>
      );

    case "transferring":
      return (
        <Modal title="Sending file">
          <h2 className="text-lg font-semibold text-center">Sending to {peerName}</h2>
          {/* <FileInfo name={t.fileName} size={t.fileSize} /> */}
          <FileInfoList t={t} />
          <progress value={t.progress} max={1} className="w-full h-3" />
          <p className="text-center text-sm">{Math.round(t.progress * 100)}%</p>
        </Modal>
      );

    case "complete":
      return <Notice tone="ok" text={`${t.fileName} was sent successfully`} onClose={clearTransfer} />;

    case "failed":
      return <Notice tone="bad" text={`Transfer failed: ${t.error ?? "unknown error"}`} onClose={clearTransfer} />;

    case "rejected":
      return (
        <Notice
          tone="bad"
          text={
            t.error === "busy"
              ? `${peerName} is busy with another transfer !!`
              : `${peerName} rejected the transfer !!`
          }
          onClose={clearTransfer}
        />
      );

    default:
      return null;
  }
}