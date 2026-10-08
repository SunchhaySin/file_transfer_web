import { useState, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import useScreenSize from "../provider/windowWidth";
import AppLabel from "../widget/app_label";
import { useStateProvider } from "../provider/state_provider";
import FileSelectionPanel from "../widget/file_selection_panel";
import FileTransferPanel from "../widget/file_transfer_panel";
import { peerDiscovery } from "../../utils/handlers/peer_discovery";
import StatusCheck from "../widget/statusCheck";
import DeviceNaming from "../widget/device_naming";
import TransferDialogSender from "../dialog/tranfer_dialog_sender";
import TransferDialogReceiver from "../dialog/transfer_dialog_receiver";

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
      className={`relative flex-1 flex flex-col gap-4 items-center bg-white/10 min-h-0 w-full
      ${isDesktop ? "px-20 py-10" : isTablet ? "px-12 py-8" : "px-5 py-5"}`}
    >
      <div className="flex flex-col items-center gap-3 w-full shrink-0">
        <div className="border-2 border-white/60 rounded-full shadow-2xl">
          <p
            className={`font-semibold bg-white/50 rounded-full 
              ${
                isDesktop
                  ? "text-3xl px-6 py-4"
                  : isTablet
                    ? "text-xl px-4 py-3"
                    : isMobile
                      && "text-lg px-3 py-2"
              }`}
          >
            Peer-to-Peer File Transfer
          </p>
        </div>
        <AppLabel />
        <button className="bg-blue-100 rounded-xl p-4 py-1 border border-black flex gap-2 items-center">
          <p className="font-semibold text-sm">Check Connection Status</p>
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
        <StatusCheck
          isCheckStatus={isCheckStatus}
          setIsCheckStatus={setIsCheckStatus}
          setIsNamingDevice={setIsNamingDevice}
          connected={connected}
          myDeviceName={myDeviceName}
        />

        <hr className={`border border-black/50 w-full ${isDesktop ? "mt-2" : isTablet ? "mt-1" : isMobile && "mt-0"}`} />
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
        <DeviceNaming
          setIsNamingDevice={setIsNamingDevice}
          setDeviceName={setDeviceName}
          saveDeviceName={saveDeviceName}
        />
      )}

      {isSelectionPanel && <FileSelectionPanel />}
      {isTransferPanel && <FileTransferPanel />}
      <TransferDialogSender />
      <TransferDialogReceiver />
    </div>
  );
}
