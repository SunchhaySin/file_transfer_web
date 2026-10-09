import { useState } from "react";
import { useShallow } from "zustand/shallow";
import { useStateProvider } from "../provider/state_provider";
import useScreenSize from "../provider/windowWidth";
import IconCategorizer from "../../utils/misc/iconHelper";
import {
  encodePayload,
  newPairingId,
  compactSdp,
  payloadToQrDataUrl,
} from "../../utils/handlers/qr_code";
import { Modal } from "../dialog/dialog_components";
import QrSenderScanner from "../dialog/qrSenderScanner";
import QrReceiverScanner from "../dialog/qrReceiverScanner";

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

    generateQROffer,
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

      generateQROffer: state.generateQROffer,
    })),
  );

  const busy = ["connecting", "awaiting-accept", "transferring"].includes(
    t.status,
  );

  const canShare =
    connected && !!selectedPeer && selectedFiles.length > 0 && !busy;

  const onShare = () => {
    if (!canShare) {
      alert("Error when sharing, Try Again !!");
      return;
    }
    if (canShare) sendSelectedFiles();
  };

  const hintSize = isDesktop
    ? "text-[14px]"
    : isTablet
      ? "text-[12px]"
      : "text-[11px]";

  const boxPadding = isDesktop
    ? "px-4 py-3"
    : isTablet
      ? "px-3 py-3"
      : "px-2 py-2";

  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [expandModal, setExpandModal] = useState(false);

  // Scanner state management
  const [showOfferScanner, setShowOfferScanner] = useState(false); // Receiver role: Scan offer
  const [showAnswerScanner, setShowAnswerScanner] = useState(false); // Sender role: Scan answer
  const [pairingId, setPairingId] = useState<string>("");

  const handleGenerateQr = async (filesToTransfer: File[]) => {
    try {
      const rawSdp = await generateQROffer(filesToTransfer);
      // 1. Get complete SDP offer string containing all ICE candidates
      const compressedSdp = compactSdp(rawSdp);

      // 2. Build payload without candidates
      const payload = await encodePayload({
        v: 1,
        k: "offer",
        id: newPairingId(),
        name: "My Device",
        sdp: compressedSdp,
      });

      // 3. Render QR code
      const qrUrl = await payloadToQrDataUrl(payload);
      setQrSrc(qrUrl);
      setShowQr(true);
    } catch (err) {
      setQrError("Failed to generate QR code");
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col justify-between items-center bg-blue-200/80 rounded-3xl shadow-2xl gap-4 transition-all duration-300 ease-in-out min-h-0 w-full
            ${isDesktop ? "px-12 py-6" : isTablet && windowWidth >= 1100 ? "px-8 py-4" : isTablet && windowWidth < 1100 ? "px-6 py-3" : isMobile ? "p-3 mb-6" :""}
          `}
    >
       <p
        className={`bg-blue-300 shadow-[0px_0px_4px_0.5px_blue] font-semibold ${isDesktop ? "p-2 rounded-2xl text-2xl" : isTablet ? "p-2 rounded-xl v" : "p-1 rounded-lg text-lg"}`}
      >
        Begin the file tranfer
      </p>
      {windowWidth >= 800 && <hr className="border border-black/20 w-full" />}
      <div
        className={`w-full flex-1 min-h-0 ${isDesktop ? "px-4 py-2" : isTablet ? "px-3 py-2" : "px-2 py-1"}
          ${windowWidth >= 1000 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2 overflow-y-auto"}`}
      >
      
        <div
          className={`flex flex-col gap-1 ${windowWidth >= 1000 ? "h-full overflow-y-auto " : "shrink-0"}`}
        >
          <div
            className={`bg-blue-100 flex flex-col items-center justify-start w-full rounded-2xl ${boxPadding} ${windowWidth >= 1000 && "flex-1 "}`}
          >
            <div
              className={`flex flex-col items-center w-full ${windowWidth >= 1280 ? "gap-3" : "gap-2"}`}
            >
              <div className="flex gap-3 items-center justify-center w-full">
                <button
                  onClick={onShare}
                  className={`font-semibold bg-green-400 hover:bg-green-500 px-2 py-1 rounded-xl border border-black/50 ${windowWidth >= 1280 && "flex-1"}`}
                >
                  {busy ? "Sharing..." : "Share Directly"}
                </button>

                {windowWidth >= 1280 && (
                  <button
                    onClick={() => handleGenerateQr(selectedFiles)}
                    className="font-semibold bg-blue-300 hover:bg-blue-400 px-2 py-1 rounded-xl border border-black/50 flex-1"
                  >
                    Generate QR-Code
                  </button>
                )}
              </div>
              <div className="flex gap-2 items-center">
                {selectedPeer && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height={isMobile ? "20px" : "24px"}
                    viewBox="0 -960 960 960"
                    width={isMobile ? "20px" : "24px"}
                    fill="currentColor"
                  >
                    <path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm508.5-291.5Q720-743 720-760t-11.5-28.5Q697-800 680-800t-28.5 11.5Q640-777 640-760t11.5 28.5Q663-720 680-720t28.5-11.5ZM680-200ZM200-480Zm480-280Z" />
                  </svg>
                )}
                <p
                  className={`${hintSize} text-center text-gray-600 ${selectedPeer && "font-semibold"} `}
                >
                  {peers.length > 0 &&
                    (!connected
                      ? "Not connected to the server."
                      : selectedFiles.length === 0
                        ? "Select at least one file first."
                        : !selectedPeer
                          ? "Tap a device below to choose who to send to."
                          : `Share Directly to ${selectedPeer.name}`)}
                </p>
              </div>
            </div>
            <div
              className={`flex-1 w-full flex items-center justify-center ${peers.length > 0 && "bg-blue-50"}  rounded-2xl`}
            >
              {peers.length > 0 ? (
                <ul className="flex w-full gap-3 overflow-x-auto overflow-y-hidden snap-x snap-proximity">
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
                          className={`shrink-0 rounded-full flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed
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
                          className={`max-w-18 text-xs truncate ${selected ? "font-semibold text-blue-700" : ""}`}
                        >
                          {p.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={`flex gap-2 items-center justify-center border border-gray-400 bg-blue-50 rounded-xl px-3 py-1 w-full h-full
                    ${connected ? "text-green-600" : "text-red-600"} 
                    ${isDesktop || isTablet ? "flex-col" : "flex-row"}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height={isDesktop ? "38px" : isTablet ? "38px" : isMobile ? "24px" : undefined}
                    viewBox="0 -960 960 960"
                    width={isDesktop ? "38px" : isTablet ? "38px" : isMobile ? "24px" : undefined}
                    fill="currentColor"
                  >
                    <path d="M720-354ZM487-587ZM354-720l-80-80h486q33 0 56.5 23.5T840-720H354Zm366 260q13 0 21.5-9t8.5-21q0-13-8.5-21.5T720-520q-12 0-21 8.5t-9 21.5q0 12 9 21t21 9Zm156 262-76-76v-286H640v126l-80-80v-66q0-25 17.5-42.5T620-640h200q25 0 42.5 17.5T880-580v360q0 6-1 11.5t-3 10.5ZM820-28 688-160h-68q-25 0-42.5-17.5T560-220v-68L200-648v288h300v80H200q-33 0-56.5-23.5T120-360v-368l-92-92 56-56L876-84l-56 56ZM344-504ZM80-160v-80h420v80H80Z" />
                  </svg>
                  <span className="text-black">No devices found</span>
                </div>
              )}
            </div>
          </div>
          <div
            className={`bg-blue-50 w-full rounded-2xl ${isDesktop ? "px-6 py-4" : isTablet ? "px-4 py-3" : "px-2 py-2"} flex flex-col items-center justify-center
                   ${windowWidth < 1280 && "flex-1"}`}
          >
            {windowWidth >= 1280 ? (
              <div className=" flex flex-col justify-center w-full gap-1">
                <div className="flex gap-2 items-center w-full bg-green-200/80 rounded-xl px-2 py-1 border border-black/30">
                  <svg
                    className="shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    height="28px"
                    viewBox="0 -960 960 960"
                    width="28px"
                    fill="green"
                  >
                    <path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm508.5-291.5Q720-743 720-760t-11.5-28.5Q697-800 680-800t-28.5 11.5Q640-777 640-760t11.5 28.5Q663-720 680-720t28.5-11.5ZM680-200ZM200-480Zm480-280Z" />
                  </svg>
                  <p className="text-sm text-black/70">
                    Automatically detects and connects with other devices on
                    this local network.
                  </p>
                </div>

                <div className="flex gap-2 items-center w-full bg-blue-200/80 rounded-xl px-2 py-1 border border-black/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="32px"
                    viewBox="0 -960 960 960"
                    width="32px"
                    fill="blue"
                  >
                    <path d="M520-120v-80h80v80h-80Zm-80-80v-200h80v200h-80Zm320-120v-160h80v160h-80Zm-80-160v-80h80v80h-80Zm-480 80v-80h80v80h-80Zm-80-80v-80h80v80h-80Zm360-280v-80h80v80h-80ZM180-660h120v-120H180v120Zm-60 60v-240h240v240H120Zm60 420h120v-120H180v120Zm-60 60v-240h240v240H120Zm540-540h120v-120H660v120Zm-60 60v-240h240v240H600Zm80 480v-120h-80v-80h160v120h80v80H680ZM520-400v-80h160v80H520Zm-160 0v-80h-80v-80h240v80h-80v80h-80Zm40-200v-160h80v80h80v80H400Zm-190-90v-60h60v60h-60Zm0 480v-60h60v60h-60Zm480-480v-60h60v60h-60Z" />
                  </svg>
                  <p className="text-sm text-black/70">
                    Share by Scanning the QR-code once generated.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleGenerateQr(selectedFiles)}
                  className="font-semibold bg-blue-300 hover:bg-blue-400 px-2 py-1 rounded-xl border border-black/50"
                >
                  Generate QR-code
                </button>
                <p className={`${hintSize} text-center text-gray-500/80`}>
                  Share by using this generated QR-code
                </p>
                {(isTablet || isMobile) && (
                  <>
                    {qrError ? (
                      <p className="text-xs text-red-500 text-center font-medium">
                        {qrError}
                      </p>
                    ) : showQr && qrSrc ? (
                      <div className="flex flex-col gap-2 w-full items-center rounded-2xl mt-2">
                        <div className="bg-white p-2 rounded-xl border border-gray-100">
                          <img
                            src={qrSrc}
                            alt="Generated Transfer QR"
                            className="w-30 h-30 object-contain"
                          />
                        </div>

                        <div className="flex gap-3 items-center rounded-xl px-3 h-full justify-center">
                          {/* Expand QR */}
                          <button
                            onClick={() => setExpandModal(true)}
                            aria-label="Expand QR"
                            className="text-xs bg-blue-200 hover:bg-blue-400 font-medium px-3 py-1 rounded-lg transition-colors"
                          >
                            {isTablet ? (
                              <span className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="20px"
                                  viewBox="0 -960 960 960"
                                  width="20px"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M120-120v-320h80v184l504-504H520v-80h320v320h-80v-184L256-200h184v80H120Z" />
                                </svg>
                                <span>Expand QR</span>
                              </span>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20px"
                                viewBox="0 -960 960 960"
                                width="20px"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M120-120v-320h80v184l504-504H520v-80h320v320h-80v-184L256-200h184v80H120Z" />
                              </svg>
                            )}
                          </button>

                          {/* Scan Answer QR */}
                          <button
                            onClick={() => setShowAnswerScanner(true)}
                            aria-label="Scan Answer QR"
                            className="text-xs bg-green-400 hover:bg-green-500 font-semibold p-2 rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                          >
                            {isTablet ? (
                              <span className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="20px"
                                  viewBox="0 -960 960 960"
                                  width="20px"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M80-680v-200h200v80H160v120H80Zm0 600v-200h80v120h120v80H80Zm600 0v-80h120v-120h80v200H680Zm120-600v-120H680v-80h200v200h-80ZM700-260h60v60h-60v-60Zm0-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm120-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm240-320v240H520v-240h240ZM440-440v240H200v-240h240Zm0-320v240H200v-240h240Zm-60 500v-120H260v120h120Zm0-320v-120H260v120h120Zm320 0v-120H580v120h120Z" />
                                </svg>
                                <span>Scan Answer QR</span>
                              </span>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20px"
                                viewBox="0 -960 960 960"
                                width="20px"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M80-680v-200h200v80H160v120H80Zm0 600v-200h80v120h120v80H80Zm600 0v-80h120v-120h80v200H680Zm120-600v-120H680v-80h200v200h-80ZM700-260h60v60h-60v-60Zm0-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm120-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm240-320v240H520v-240h240ZM440-440v240H200v-240h240Zm0-320v240H200v-240h240Zm-60 500v-120H260v120h120Zm0-320v-120H260v120h120Zm320 0v-120H580v120h120Z" />
                              </svg>
                            )}
                          </button>

                          {/* Hide QR */}
                          <button
                            onClick={() => setShowQr(false)}
                            className="text-xs bg-red-400/80 hover:bg-red-400 font-semibold p-2 rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                          >
                            {isTablet ? (
                              <span className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="20px"
                                  viewBox="0 -960 960 960"
                                  width="20px"
                                  fill="currentColor"
                                >
                                  <path d="m177-120-57-57 184-183H200v-80h240v240h-80v-104L177-120Zm343-400v-240h80v104l183-184 57 57-184 183h104v80H520Z" />
                                </svg>
                                <span>Collapse QR</span>
                              </span>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20px"
                                viewBox="0 -960 960 960"
                                width="20px"
                                fill="currentColor"
                              >
                                <path d="m177-120-57-57 184-183H200v-80h240v240h-80v-104L177-120Zm343-400v-240h80v104l183-184 57 57-184 183h104v80H520Z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </div>
          {isDesktop && (
            <>
              {qrError ? (
                <p className="text-xs text-red-500 text-center font-medium">
                  {qrError}
                </p>
              ) : showQr && qrSrc ? (
                <div className="flex gap-2 justify-around items-center bg-white p-3 rounded-2xl shadow-md border border-gray-200 mt-2">
                  <div className="bg-white p-2 rounded-xl border border-gray-100">
                    <img
                      src={qrSrc}
                      alt="Generated Transfer QR"
                      className="w-30 h-30 object-contain"
                    />
                  </div>

                  <div className="flex flex-col gap-3 items-center bg-blue-50 border border-black/20 rounded-xl px-3 h-full justify-center">
                    {/* Expand QR */}
                    <button
                      onClick={() => setExpandModal(true)}
                      aria-label="Expand QR"
                      className="text-xs bg-blue-200 hover:bg-blue-400 font-medium px-3 py-1 rounded-lg transition-colors"
                    >
                        <span className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20px"
                            viewBox="0 -960 960 960"
                            width="20px"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M120-120v-320h80v184l504-504H520v-80h320v320h-80v-184L256-200h184v80H120Z" />
                          </svg>
                          <span>Expand QR</span>
                        </span>
                    </button>

                    {/* Scan Answer QR */}
                    <button
                      onClick={() => setShowAnswerScanner(true)}
                      aria-label="Scan Answer QR"
                      className="text-xs bg-green-400 hover:bg-green-500 font-semibold p-2 rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20px"
                            viewBox="0 -960 960 960"
                            width="20px"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M80-680v-200h200v80H160v120H80Zm0 600v-200h80v120h120v80H80Zm600 0v-80h120v-120h80v200H680Zm120-600v-120H680v-80h200v200h-80ZM700-260h60v60h-60v-60Zm0-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm120-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm240-320v240H520v-240h240ZM440-440v240H200v-240h240Zm0-320v240H200v-240h240Zm-60 500v-120H260v120h120Zm0-320v-120H260v120h120Zm320 0v-120H580v120h120Z" />
                          </svg>
                          <span>Scan Answer QR</span>
                        </span>
                    </button>

                    {/* Hide QR */}
                    <button
                      onClick={() => setShowQr(false)}
                      className="text-xs bg-red-400/80 hover:bg-red-400 font-semibold p-2 rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20px"
                            viewBox="0 -960 960 960"
                            width="20px"
                            fill="currentColor"
                          >
                            <path d="m177-120-57-57 184-183H200v-80h240v240h-80v-104L177-120Zm343-400v-240h80v104l183-184 57 57-184 183h104v80H520Z" />
                          </svg>
                          <span>Collapse QR</span>
                        </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
        {selectedFiles.length > 0 && (
          <ul
            className={`w-full bg-blue-100/80 border border-blue-300 shadow-[0px_0px_2px_0.25px_blue] flex flex-col gap-1 p-2 rounded-2xl overflow-y-auto 
                ${windowWidth >= 1000 ? "h-full" : "flex-1 min-h-44"}`}
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
      </div>
      <div className="flex items-center gap-4 w-full">
        <button
          className="flex-1 py-2 bg-blue-400 rounded-xl hover:bg-blue-500 transition-colors duration-200 ease-in-out cursor-pointer"
          onClick={() => {
            setIsTransferPanel(false);
            setIsSelectionPanel(true);
          }}
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
      {showOfferScanner && (
        <QrReceiverScanner onClose={() => setShowOfferScanner(false)} />
      )}

      {/* MODAL 2: Sender scanning Answer QR */}
      {showAnswerScanner && (
        <Modal title="Scan Receiver's Answer">
          <div className="p-2 max-w-sm mx-auto">
            <QrSenderScanner
              expectedPairingId={pairingId}
              onSuccess={() => setShowAnswerScanner(false)}
              onCancel={() => setShowAnswerScanner(false)}
            />
          </div>
        </Modal>
      )}
      {expandModal && qrSrc && (
        <Modal title="Scan Offer QR Code">
          <div className="flex flex-col items-center justify-center p-2 gap-4 text-center max-w-sm mx-auto">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Point the receiving device's camera at this QR code to initiate
              the transfer.
            </p>

            <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-200">
              <img
                src={qrSrc}
                alt="Expanded Offer QR Code"
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain"
              />
            </div>

            <button
              onClick={() => setExpandModal(false)}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
