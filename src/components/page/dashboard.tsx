import { useState, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import useScreenSize from "../provider/windowWidth";
import AppLabel from "../widget/app_label";
import { useStateProvider } from "../provider/state_provider";
import FileSelectionPanel from "../widget/file_selection_panel";
import FileTransferPanel from "../widget/file_transfer_panel";
import { peerDiscovery } from "../../utils/handlers/peer_discovery";

export default function Dashboard() {
  // Screen Sizes and confirguration
  const { isMobile, isTablet, isDesktop } = useScreenSize();

  const { isSelectionPanel, isTransferPanel, setIsSelectionPanel, connected, myDeviceName, setMyDeviceName} =
    useStateProvider(
      useShallow((state) => ({
        isSelectionPanel: state.isSelectionPanel,
        isTransferPanel: state.isTransferPanel,
        setIsSelectionPanel: state.setIsSelectionPanel,

        connected: state.connected,
        myDeviceName: state.myDeviceName,
        setMyDeviceName: state.setMyDeviceName
      })),
    );
  
  useEffect(() => {
    peerDiscovery.start(myDeviceName);
  }, [myDeviceName]);

  const [isCheckStatus, setIsCheckStatus] = useState(false);
  const [isNamingDevice, setIsNamingDevice] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  const saveDeviceName = () => {
    if(deviceName.length === 0) {
      alert("Name your device !!");
      return;
    }
    setMyDeviceName(deviceName);
  }

  return (
    <div
      className={`flex-1 flex flex-col gap-4 items-center bg-white/10 min-h-0 w-full
      ${isDesktop ? "px-25 py-12" : isTablet ? "px-12 py-10" : "px-5 py-5"}`}
    >
      <div className="flex flex-col items-center gap-3 w-full shrink-0">
        <div className="border-2 border-white/60 rounded-full shadow-2xl">
          <p
            className={`font-semibold bg-white/50 rounded-full 
              ${
                isDesktop
                  ? "text-4xl px-6 py-4"
                  : isTablet
                    ? "text-2xl px-4 py-3"
                    : isMobile
                      ? "text-lg px-3 py-2"
                      : "text-xl"
              }`}
          >
            Peer-to-Peer File Transfer
          </p>
        </div>
        <AppLabel />
        <div className="flex flex-col items-center">
          <button className="bg-blue-200 rounded-xl p-4 py-1 border border-black flex gap-2 items-center">
            <p className="font-semibold">Check Connection Status</p>
            {isCheckStatus ? (
              <svg
                onClick={() => setIsCheckStatus(false)}
                className="border border-black rounded-full bg-green-300"
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
              </svg>
            ) : (
              <svg
                onClick={() => {
                  setIsCheckStatus(true);
                  setIsSelectionPanel(false)
                }}
                className="border border-black rounded-full bg-green-300"
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
              </svg>
            )}
          </button>

          <div
            aria-hidden={!isCheckStatus}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 bg-blue-200 px-5 py-2 w-80 rounded-lg
              transition-all duration-300 ease-in-out shadow-[0px_0px_2px_0.5px_green]
              ${
                isCheckStatus
                  ? "opacity-100 translate-y-0"
                  : "invisible opacity-0 -translate-y-2 pointer-events-none"
              }`}
          >
            <span className="text-center">
              <span className="font-semibold">Status: </span>
              <span>{connected ? "Connected" : "Not Connected"}</span>
            </span>
            <hr className="border-1/2 border-black/50 w-full mt-1" />
            {myDeviceName.length > 0 ? (
              <div className="flex flex-col gap-1 items-center justify-center">
                <p>Discoverable as: {myDeviceName}</p>
                <button
                  onClick={() => {
                    setIsCheckStatus(false);
                    setIsNamingDevice(true);
                  }}
                  className="border border-black/60 bg-gray-400/80 hover:bg-gray-400/60 py-0.5 px-2 rounded-xl"
                >
                Rename Device
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1 items-center justify-center">
                <p>{"Discoverable - (Device Not Named)"}</p>
                <button
                  onClick={() => {
                    setIsCheckStatus(false);
                    setIsNamingDevice(true);
                  }}
                  className="border border-black/60 bg-gray-400/80 hover:bg-gray-400/60 py-0.5 px-2 rounded-xl"
                >
                  Name Device
                </button>
              </div>
            )}
          </div>
        </div>
        <hr className="border border-black/50 w-full mt-2" />
      </div>
      {!isSelectionPanel && !isTransferPanel && (
        <button
          onClick={() => {
            setIsSelectionPanel(true);
            setIsCheckStatus(false);
            setIsNamingDevice(false);
          }}
          className={`h-12 w-45 flex gap-3 items-center justify-center rounded-full px-5 py-2 cursor-pointer bg-white/60 
            ${
              isDesktop || isTablet
                ? "hover:bg-green-400 hover:shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.7)] hover:h-14 hover:w-50 transition-all duration-500 ease-in-out"
                : ""
            } 
            `}
        >
          <svg
            className="shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            height="28px"
            viewBox="0 -960 960 960"
            width="28px"
            fill="currentColor"
          >
            <path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
          </svg>
          <p className="text-lg font-semibold">Upload</p>
        </button>
      )}
      {!isSelectionPanel && !isTransferPanel && isNamingDevice && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 flex flex-col item-center justify-center gap-6 px-10 py-4 rounded-2xl">
          <div>
            <div className="relative flex items-center justify-center">
              <p className="text-center font-semibold">Name your device</p>
              <svg
                onClick={() => setIsNamingDevice(false)}
                className="absolute right-0 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
              </svg>
            </div>
            <hr className="border-1/2 border-black w-full mt-2" />
          </div>
          <div className="flex flex-col gap-1">
            <input
              className="bg-gray-200 outline-0 border border-black/80 rounded-lg pl-2 text-sm h-8"
              placeholder="Enter device name"
              // value={myDeviceName}
              onChange={(e) => setDeviceName(e.target.value)}
            />
            <span className="flex gap-2 text-black/60">
              <svg
                className="shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M440-280h80v-240h-80v240Zm68.5-331.5Q520-623 520-640t-11.5-28.5Q497-680 480-680t-28.5 11.5Q440-657 440-640t11.5 28.5Q463-600 480-600t28.5-11.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
              </svg>
              <p className="text-[12px] text-gray-500 text-center">
                The device name is used devices communication and
                indentification
              </p>
            </span>
          </div>

          <button
            onClick={saveDeviceName}
            className="px-2 py-1 bg-green-400 hover:bg-green-500 rounded-xl"
          >
            Confirm
          </button>
        </div>
      )}

      {isSelectionPanel && <FileSelectionPanel />}
      {isTransferPanel && <FileTransferPanel />}
    </div>
  );
}
