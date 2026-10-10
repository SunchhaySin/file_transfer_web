import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { TransferState } from "../../utils/transferManager"
import type { ReceivedFile } from "../../utils/transferManager"
import useScreenSize from "../../provider/windowWidth";

export const formatSize = (n: number) =>
  n < 1024 ? `${n} B`
  : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB`
  : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB`
  : `${(n / 1024 ** 3).toFixed(2)} GB`;

// Popup shell. The portal renders it on <body>, so a parent with a
// transform or backdrop-blur can't trap the fixed overlay.
export function Modal({ title, children }: { title: string; children: ReactNode }) {
  const { isTablet, isDesktop } = useScreenSize();
  const maxWidthClass = (isDesktop || isTablet) ? "max-w-md" : "max-w-sm";

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidthClass} rounded-2xl bg-blue-200 p-5 shadow-2xl flex flex-col gap-4 text-black/70`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function FileInfoList({ t }: { t: TransferState }) {
  const count = t.files.length;
  return (
    <div className="rounded-xl bg-blue-100 px-3 py-2 text-center border border-black/30">
      {count > 1 ? (
        <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {t.files.map((file, index) => (
          <li key={index} 
            className="shrink-0 flex flex-col items-start gap-1 rounded-lg px-3 py-1.5 bg-white overflow-hidden">
               <p className="font-semibold break-all truncate">{file.name}</p>
               <p className="text-xs text-gray-600">{formatSize(file.size)}</p>
          </li>
        ))}
      </ul>
      ): (
        <>
          <p className="font-semibold break-all truncate">{t.fileName}</p>
          <p className="text-xs text-gray-600">{formatSize(t.fileSize)}</p>
        </>
      )}
      
    </div>
  );
}

export function FileInfoDownloadList({
  t,
  onDownload,
}: {
  t: TransferState;
  onDownload: (file: ReceivedFile) => void;
}) {
  const files = t.received; // these carry the download URL; t.files does not
  if (files.length === 0) return null;

  return (
    <div className="rounded-xl bg-blue-100 px-3 py-2 border border-black/30">
      <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {files.map((file) => (
          <li
            key={file.url}
            className="shrink-0 flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5"
          >
            <div className="flex flex-col items-start min-w-0">
              <p className="font-semibold truncate max-w-full">{file.name}</p>
              <p className="text-xs text-gray-600">{formatSize(file.size)}</p>
            </div>

            <button
              type="button"
              onClick={() => onDownload(file)}
              aria-label={`Download ${file.name}`}
              title={`Download ${file.name}`}
              className="shrink-0 rounded-full p-1 hover:bg-green-200 transition-colors duration-200 cursor-pointer"
            >
              <svg
                className="shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="green"
              >
                <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Notice({ text, tone, onClose }: { text: string; tone: "ok" | "bad"; onClose: () => void }) {
  return (
    <Modal title="Transfer update">
      <p className={`text-center font-semibold ${tone === "ok" ? "text-green-700" : "text-red-600"}`}>
        {text}
      </p>
      <button onClick={onClose} className="py-2 rounded-xl bg-gray-400/60 hover:bg-gray-400">
        Close
      </button>
    </Modal>
  );
}