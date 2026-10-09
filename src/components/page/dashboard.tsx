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
import QrReceiverScanner from "../dialog/qrReceiverScanner";

export default function Dashboard() {
  // Screen Sizes and confirguration
  const { isMobile, isTablet, isDesktop } = useScreenSize();

  const {
    isSelectionPanel,
    isTransferPanel,
    setIsSelectionPanel,
    connected,
    myDeviceName,
    setMyDeviceName,

    isCheckStatus,
    setIsCheckStatus,
    isNamingDevice,
    setIsNamingDevice,
  } = useStateProvider(
    useShallow((state) => ({
      isSelectionPanel: state.isSelectionPanel,
      isTransferPanel: state.isTransferPanel,
      setIsSelectionPanel: state.setIsSelectionPanel,

      connected: state.connected,
      myDeviceName: state.myDeviceName,
      setMyDeviceName: state.setMyDeviceName,

      isCheckStatus: state.isCheckStatus,
      setIsCheckStatus: state.setIsCheckStatus,
      isNamingDevice: state.isNamingDevice,
      setIsNamingDevice: state.setIsNamingDevice,
    })),
  );

  useEffect(() => {
    peerDiscovery.start(myDeviceName);
  }, [myDeviceName]);

  const [deviceName, setDeviceName] = useState("");

  const saveDeviceName = () => {
    if (deviceName.length === 0) {
      alert("Name your device !!");
      return;
    }
    setMyDeviceName(deviceName);
  };

  const [showScanner, setShowScanner] = useState(false);

  return (
    <div
      className={`flex-1 flex flex-col gap-4 items-center bg-white/10 min-h-0 w-full 
      ${isDesktop ? "px-16 py-8 max-h-[calc(100lvh-75px)]" : isTablet ? "px-10 py-5 max-h-[calc(100lvh-54px)]" : "px-5 py-3 max-h-[calc(100lvh-46px)]"}`}
    >
      <StatusCheck
        isCheckStatus={isCheckStatus}
        setIsCheckStatus={setIsCheckStatus}
        setIsNamingDevice={setIsNamingDevice}
        connected={connected}
        myDeviceName={myDeviceName}
      />
      <AppLabel />
      {!isSelectionPanel && !isTransferPanel && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsSelectionPanel(true);
              setIsCheckStatus(false);
              setIsNamingDevice(false);
            }}
            className={`h-12 w-45 flex gap-3 items-center justify-center rounded-full px-5 py-2 cursor-pointer bg-green-300/60 shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.7)]
              ${
                isDesktop || isTablet
                  ? "hover:bg-green-400 hover:h-14 hover:w-50 transition-all duration-500 ease-in-out"
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
          <button
            className="flex items-center justify-center bg-blue-300 p-2 rounded-lg border border-black/60 h-10 w-10 hover:h-12 hover:w-12 transition-all duration-500 ease-in-out shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.4)]"
            onClick={() => {
              setShowScanner(true);
              setIsCheckStatus(false);
              setIsNamingDevice(false);
            }}
          >
            <svg
              className="shirnk-0"
              xmlns="http://www.w3.org/2000/svg"
              height="28px"
              viewBox="0 -960 960 960"
              width="28px"
              fill="currentColor"
            >
              <path d="M80-680v-200h200v80H160v120H80Zm0 600v-200h80v120h120v80H80Zm600 0v-80h120v-120h80v200H680Zm120-600v-120H680v-80h200v200h-80ZM700-260h60v60h-60v-60Zm0-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm120-120h60v60h-60v-60Zm-60 60h60v60h-60v-60Zm-60-60h60v60h-60v-60Zm240-320v240H520v-240h240ZM440-440v240H200v-240h240Zm0-320v240H200v-240h240Zm-60 500v-120H260v120h120Zm0-320v-120H260v120h120Zm320 0v-120H580v120h120Z" />
            </svg>
          </button>
        </div>
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

      {showScanner && (
        <QrReceiverScanner onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
