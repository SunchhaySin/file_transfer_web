import React from "react";
import { useShallow } from "zustand/shallow";
import { useStateProvider } from "../provider/state_provider";
import useScreenSize from "../provider/windowWidth";
import IconCategorizer from "../../utils/misc/iconHelper";

export default function FileTransferPanel() {
  const { windowWidth, isMobile, isTablet, isDesktop } = useScreenSize();
  const {
    setIsSelectionPanel,
    selectedFiles,
    setIsTransferPanel,
    resetFilesList,
    connected,

    peers,
    selectedPeer,
    setSelectedPeer,
    transferState: t,
    sendSelectedFiles,
    clearTransfer,
    cancelRequest, 
  } = useStateProvider(
    useShallow((state) => ({
      setIsSelectionPanel: state.setIsSelectionPanel,
      selectedFiles: state.selectedFiles,
      setIsTransferPanel: state.setIsTransferPanel,
      resetFilesList: state.resetFilesList,
      connected: state.connected,

      peers: state.peers,
      selectedPeer: state.selectedPeer,
      setSelectedPeer: state.setSelectedPeer,
      transferState: state.transferState,
      sendSelectedFiles: state.sendSelectedFiles,
      clearTransfer: state.clearTransfer,
      cancelRequest: state.cancelRequest, 
    })),
  );

  const busy = ["connecting", "awaiting-accept", "transferring"].includes(
    t.status,
  );
  const isSending = t.direction === "send" && t.status !== "idle";
  const canShare =
    connected && !!selectedPeer && selectedFiles.length > 0 && !busy;

  const statusLabel = {
    idle: "",
    connecting: "Connecting...",
    "awaiting-accept": "Waiting for the other device to accept...",
    transferring: "Sending...",
    complete: "Sent successfully",
    failed: `Failed: ${t.error ?? "unknown error"}`,
    rejected: "The other device declined the transfer",
  }[t.status];

  const onShare = () => {
    if (!canShare) {
      alert("Error when sharing, Try Again !!");
      return;
    }
    if (canShare) sendSelectedFiles();
  };

  const hintSize = isDesktop
    ? "text-[12px]"
    : isTablet
      ? "text-[11px]"
      : "text-[10px]";
  const boxPadding = isDesktop
    ? "px-6 py-4"
    : isTablet
      ? "px-4 py-3"
      : "px-2 py-2";

  return (
    <div
      className={`flex-1 flex flex-col justify-between items-center bg-blue-200/80 rounded-3xl shadow-2xl gap-4 transition-all duration-300 ease-in-out min-h-0 
            ${isDesktop ? "max-h-[calc(100lvh-19rem)]" : isTablet && windowWidth >= 1000 ? "max-h-[calc(100lvh-16rem)]" : isMobile && "max-h-[calc(100lvh-14rem)]"}
            ${
              isDesktop
                ? "px-10 py-6 w-250"
                : isTablet && windowWidth >= 1100
                  ? "px-8 py-4 w-200"
                  : windowWidth >= 1000
                    ? "px-6 py-3 w-175"
                    : windowWidth >= 800
                      ? "px-4 py-2 w-150"
                      : windowWidth >= 550
                        ? "px-3 py-2 w-115"
                        : "px-3 py-2 w-80"
            }`}
    >
      <p
        className={`${isDesktop ? "text-2xl" : isTablet ? "text-xl" : "lg"} font-semibold`}
      >
        Begin the file tranfer
      </p>
      {windowWidth >= 800 && (
        <hr className="border border-black/20 w-full mt-1" />
      )}
      <div
        className={`${windowWidth >= 1000 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"} w-full flex-1 min-h-0 ${isDesktop ? "px-6 py-4" : isTablet ? "px-4 py-3" : "px-2 py-2"}`}
      >
        {selectedFiles.length > 0 && (
          <ul
            className={`w-full bg-blue-100/80 border border-blue-300 shadow-[0px_0px_2px_0.25px_blue] flex-1 flex flex-col gap-1 p-2 rounded-2xl overflow-y-auto min-h-0
            ${isTablet && windowWidth < 1000 && "max-h-65"}
            `}
          >
            {selectedFiles.map((file, index) => (
              <li
                key={index}
                className="text-gray-700 w-full bg-white/60 rounded-lg px-3 py-1"
              >
                <div className="flex-1 flex gap-5 items-center min-w-0">
                  <span className="shrink-0">{IconCategorizer(file.name)}</span>
                  <div className="flex flex-col items-start min-w-0">
                    <p className="font-semibold truncate w-full">{file.name}</p>
                    <p className="text-sm">{`${(file.size / (1024 * 1024)).toFixed(2)} MB`}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-1 justify-center items-center flex-1">
          <div
            className={`bg-gray-200 flex-1 flex flex-col gap-3 min-h-0 w-full rounded-2xl ${boxPadding}`}
          >
            <div className="flex flex-col items-center">
              <button
                onClick={onShare}
                className="font-semibold bg-green-400 hover:bg-green-500 px-2 py-1 rounded-xl border border-black/50"
              >
                {busy
                  ? "Sharing..."
                  : selectedPeer
                    ? `Share Directly to ${selectedPeer.name}`
                    : "Share Directly"}
              </button>
              <p className={`${hintSize} text-center text-gray-500/80`}>
                {!connected
                  ? "Not connected to the server."
                  : selectedFiles.length === 0
                    ? "Select at least one file first."
                    : !selectedPeer
                      ? "Tap a device below to choose who to send to."
                      : "Automatically detects and connects with other devices on this local network."}
              </p>
            </div>
            {peers.length > 0 ? (
              <ul className="flex w-full flex-row gap-3 overflow-x-auto overflow-y-hidden py-2 snap-x snap-proximity">
                {peers.map((p) => {
                  const selected = selectedPeer?.id === p.id;
                  return (
                    <li
                      key={p.id}
                      className={`shrink-0 snap-start flex p-2 flex-col items-center gap-1 ${isDesktop || isTablet ? "text-md" : "text-sm"}`}
                    >
                      <button
                        onClick={() => setSelectedPeer(selected ? null : p)}
                        disabled={busy}
                        aria-pressed={selected}
                        className={`rounded-full flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed
                          ${isDesktop ? "h-14 w-14 text-xl" : isTablet ? "h-12 w-12 text-lg" : "h-10 w-10"}
                          ${
                            selected
                              ? "bg-green-500 ring-2 ring-blue-600 ring-offset-2 ring-offset-gray-200"
                              : "bg-linear-to-b from-green-500/60 to-green-500/90 hover:scale-105"
                          }`}
                      >
                        {p.name[0]?.toUpperCase()}
                      </button>
                      <span
                        className={`max-w-24 truncate ${selected ? "font-semibold text-blue-700" : ""}`}
                      >
                        {p.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No devices found</p>
            )}

            {isSending && (
              <div className="w-full flex flex-col items-center gap-1">
                <p
                  className={`text-center ${t.status === "failed" || t.status === "rejected" ? "text-red-600" : t.status === "complete" ? "text-green-700" : ""}`}
                >
                  {statusLabel}
                </p>
                {(t.status === "transferring" || t.status === "complete") && (
                  <>
                    <progress
                      value={t.progress}
                      max={1}
                      className="w-full h-3"
                    />
                    <p className="text-sm truncate max-w-full">
                      {t.fileName} - {Math.round(t.progress * 100)}%
                    </p>
                  </>
                )}
                {!busy && (
                  <button onClick={clearTransfer} className="text-sm underline">
                    Dismiss
                  </button>
                )}
                {t.status === "awaiting-accept" && (
                  <button
                    onClick={cancelRequest}
                    className="mt-1 px-3 py-1 rounded-xl bg-red-400 hover:bg-red-500 text-sm font-semibold"
                  >
                    Cancel request
                  </button>
                )}
              </div>
            )}
          </div>
          <div
            className={`bg-gray-200 flex-1 w-full rounded-2xl ${isDesktop ? "px-6 py-4" : isTablet ? "px-4 py-3" : "px-2 py-2"} flex flex-col items-center`}
          >
            <button className="font-semibold bg-green-400 hover:bg-green-500 px-2 py-1 rounded-xl border border-black/50">
              Generate QR-code
            </button>
            <p className={`${hintSize} text-center text-gray-500/80`}>
              Share by using this generated QR-code
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full">
        <button
          className="flex-1 py-2 bg-blue-400 rounded-xl hover:bg-blue-500 transition-colors duration-200 ease-in-out cursor-pointer"
          onClick={() => setIsTransferPanel(false)}
        >
          Back
        </button>
        <button
          className="flex-1 py-2 bg-gray-400/80 rounded-xl hover:bg-gray-400 transition-colors duration-200 ease-in-out cursor-pointer"
          onClick={() => {
            setIsSelectionPanel(false);
            setIsTransferPanel(false);
            resetFilesList();

            clearTransfer();
            setSelectedPeer(null);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
