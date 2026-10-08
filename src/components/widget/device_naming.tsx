import React from "react";

interface Properties {
  setIsNamingDevice: (status: boolean) => void;
  setDeviceName: (name: string) => void;
  saveDeviceName: () => void;
}

export default function DeviceNaming({
  setIsNamingDevice,
  setDeviceName,
  saveDeviceName,
}: Properties) {
  return (
    <div className="fixed inset-0 flex bg-black/40 items-center justify-center z-100">
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
              The device name is used devices communication and indentification
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
    </div>
  );
}
