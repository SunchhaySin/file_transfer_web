import React from 'react'
import { useShallow } from 'zustand/shallow';
import { useStateProvider } from '../provider/state_provider';
import useScreenSize from '../provider/windowWidth';
import IconCategorizer from '../../utils/misc/iconHelper';

export default function FileTransferPanel() {
    const {windowWidth, isTablet, isDesktop} = useScreenSize();
    const { setIsSelectionPanel, selectedFiles, setIsTransferPanel, resetFilesList, peers } = useStateProvider(
            useShallow((state) => ({
                setIsSelectionPanel: state.setIsSelectionPanel,
                selectedFiles: state.selectedFiles,
                setIsTransferPanel: state.setIsTransferPanel,
                resetFilesList: state.resetFilesList,

                peers: state.peers,
            }))
        );
  return (
    <div
      className={`flex-1 flex flex-col justify-between items-center bg-blue-200/80 rounded-3xl shadow-2xl gap-4 transition-all duration-300 ease-in-out min-h-0
            ${
              isDesktop
                ? "px-10 py-6 w-250"
                : isTablet && windowWidth >= 1100
                  ? "px-8 py-4 w-200"
                  : windowWidth >= 800
                    ? "px-6 py-3 w-175"
                    : "px-3 py-2 w-80"
            }`}
    >
      <p className="text-2xl font-semibold">Begin the file tranfer</p>
      {windowWidth >= 800 && (
        <hr className="border border-black/20 w-full mt-1" />
      )}
      <div
        className={`${windowWidth >= 800 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"} w-full h-full min-h-0 ${isDesktop ? "px-6 py-4" : isTablet ? "px-4 py-3" : "px-2 py-2"}`}
      >
        {selectedFiles.length > 0 && (
          <ul className="w-full bg-blue-100/80 border border-blue-300 shadow-[0px_0px_2px_0.25px_blue] flex-1 flex flex-col gap-1 p-2 rounded-2xl overflow-y-auto min-h-0">
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
        <div className="flex flex-col gap-1 justify-center items-center">
          <div
            className={`bg-gray-200 flex-1 flex flex-col min-h-0 w-full rounded-2xl ${isDesktop ? "px-6 py-4" : isTablet ? "px-4 py-3" : "px-2 py-2"}`}
          >
            <div className="flex flex-col items-center">
              <button className="font-semibold bg-green-400 hover:bg-green-500 px-2 py-1 rounded-xl border border-black/50">
                Share Directly
              </button>
              <p
                className={`${isDesktop ? "text-[12px]" : isTablet ? "text-[11px]" : "text-[10px]"} text-center text-gray-500/80`}
              >
                Automatically detects and connects with other devices on this
                local network.
              </p>
            </div>
            {peers.length > 0 ? (
              <ul className="flex w-full flex-row gap-3 overflow-x-auto overflow-y-hidden py-2 snap-x snap-proximity">
                {peers.map((p) => (
                  <li
                    key={p.id}
                    className="shrink-0 snap-start min-w-35 rounded-xl border border-gray-300 px-4 py-3"
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No devices found</p>
            )}
          </div>
          <div
            className={`bg-gray-200 flex-1 w-full rounded-2xl ${isDesktop ? "px-6 py-4" : isTablet ? "px-4 py-3" : "px-2 py-2"}`}
          >
            Generate QR-code
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full">
        <button
          className="flex-1 py-2 bg-blue-400 rounded-xl hover:bg-blue-500 transition-colors duration-200 ease-in-out cursor-pointer"
          //   onClick={handleOnContinue}
        >
          Back
        </button>
        <button
          className="flex-1 py-2 bg-gray-400/80 rounded-xl hover:bg-gray-400 transition-colors duration-200 ease-in-out cursor-pointer"
          onClick={() => {
            setIsSelectionPanel(false);
            setIsTransferPanel(false);
            resetFilesList();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
