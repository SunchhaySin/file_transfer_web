import React from "react";

interface Properties {
  isCheckStatus: boolean;
  setIsCheckStatus: (status: boolean) => void;
  setIsNamingDevice: (status: boolean) => void;
  connected: boolean;
  myDeviceName: string;
}

export default function StatusCheck({
  isCheckStatus,
  setIsCheckStatus,
  setIsNamingDevice,
  connected,
  myDeviceName,
}: Properties) {
  return (
    <div className={`${isCheckStatus && "fixed inset-0 flex bg-black/40 items-center justify-center z-100"}`}>
      <div
        aria-hidden={!isCheckStatus}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 bg-white px-5 py-2 w-80 rounded-lg
              transition-all duration-300 ease-in-out shadow-[0px_0px_2px_0.5px_amber]
              ${
                isCheckStatus
                  ? "opacity-100 translate-y-0"
                  : "invisible opacity-0 -translate-y-2 pointer-events-none"
              }`}
      >
        <span className="relative bg-red-300">
          <svg
            onClick={() => setIsCheckStatus(false)}
            className="absolute right-0 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="currentColor"
          >
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        </span>
        <span className="text-center">
          <span className="font-semibold">Status: </span>
          <span>{connected ? "Connected" : "Not Connected"}</span>
        </span>
        <hr className="border-1/2 border-black/50 w-full mt-1" />
        {connected ? (
          myDeviceName.length > 0 ? (
            <div className="flex flex-col gap-1 items-center justify-center">
              <p>Discoverable as: {myDeviceName}</p>
              <button
                onClick={() => {
                  setIsCheckStatus(false);
                  setIsNamingDevice(true);
                }}
                className="border border-black/60 bg-green-400/60 hover:bg-green-400 py-0.5 px-2 rounded-xl"
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
                className="border border-black/60 bg-green-400/60 hover:bg-green-400 py-0.5 px-2 rounded-xl"
              >
                Name Device
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-1 items-center justify-center">
            <p>Not Discoverable</p>
          </div>
        )}
      </div>
    </div>
  );
}
