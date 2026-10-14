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
    <div
      className={`
        fixed inset-0 flex items-center justify-center z-100 bg-black/40 transition-opacity duration-300
        ${
          isCheckStatus
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }
      `}
    >
      <div
        aria-hidden={!isCheckStatus}
        className={` flex flex-col gap-2 bg-blue-50 px-5 py-3 w-80 rounded-lg shadow-[0px_0px_2px_0.5px_rgba(0,0,0,0.3)]
              transition-all duration-300 ease-in-out
              ${
                isCheckStatus
                  ? "opacity-100 translate-y-0"
                  : "invisible opacity-0 -translate-y-2 pointer-events-none"
              }`}
      >
        <span className="relative w-full flex items-center gap-1 justify-center">
          <span className="font-semibold">Status: </span>
          <span
            className={`${connected ? "text-green-700" : "text-red-700"} font-semibold`}
          >
            {connected ? "Connected" : "Not Connected"}
          </span>

          <svg
            onClick={() => setIsCheckStatus(false)}
            className="absolute right-0 top-0 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="currentColor"
          >
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        </span>
        <hr className="border-1/2 border-black/50 w-full mt-1" />
        {connected ? (
          myDeviceName.length > 0 ? (
            <div className="flex flex-col gap-4 items-center justify-center">
              <p className="shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.25)] w-fit mx-auto px-6 py-1 my-1 rounded-xl">
                Discoverable as: {myDeviceName}
              </p>
              <button
                onClick={() => {
                  setIsCheckStatus(false);
                  setIsNamingDevice(true);
                }}
                className="px-2 py-1 bg-blue-400 hover:bg-blue-500 rounded-xl w-full"
              >
                Rename Device
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center justify-center">
              <p>{"Discoverable - (Device Not Named)"}</p>
              <button
                onClick={() => {
                  setIsCheckStatus(false);
                  setIsNamingDevice(true);
                }}
                className="px-2 py-1 bg-green-400 hover:bg-green-500 rounded-xl w-full"
              >
                Name Device
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-1 items-center justify-center">
            <p>Not Discoverable</p>
            <p className="bg-blue-100 shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.5)] w-fit mx-auto px-6 py-1 my-1 rounded-xl text-green-700 font-semibold">
              {"Share by QR-code (Accepted)"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
