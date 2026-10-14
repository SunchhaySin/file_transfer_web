import useScreenSize from "../../provider/windowWidth";
import AppLogo from "../../../public/assets/app_logo_svg";


interface HeaderProps {
    connected: boolean;
    isCheckStatus: boolean;
    setIsCheckStatus: (open: boolean) => void;
    isBannerOpened: boolean
    setBanner: (open: boolean) => void;
};

export default function Header({connected, isCheckStatus, setIsCheckStatus, isBannerOpened, setBanner}: HeaderProps) {
  const { isMobile, isTablet, isDesktop, windowWidth } = useScreenSize();
  const svgSize = isDesktop
    ? "24px"
    : isTablet
      ? "20px"
      : isMobile
        ? "20px"
        : undefined;
            
  return (
    <div
      className="flex items-center justify-between w-full py-1 px-3 border-b-2 border-black/40
         bg-linear-to-b from-green-500/60 to-green-600/60
        "
    >
      <div className="flex items-center rounded-full">
        <AppLogo
          size={isDesktop ? "45" : isTablet ? "38" : "30"}
          className="shrink-0"
        />
        <p
          className={`font-semibold 
              ${
                isDesktop
                  ? "text-2xl px-6 py-3"
                  : isTablet
                    ? "text-xl px-4 py-2"
                    : isMobile && "text-md px-3 py-1.5"
              }`}
        >
          {windowWidth >= 665
            ? "Peer-to-Peer File Transfer"
            : "P2P File Transfer"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setBanner(!isBannerOpened)}
          className="bg-blue-200 rounded-xl p-4 py-1 shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.7)] flex gap-2 items-center "
        >
          {isBannerOpened ? (
            <svg
              className="text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              height={svgSize}
              viewBox="0 -960 960 960"
              width={svgSize}
              fill="currentColor"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-440H200v440Z" />
            </svg>
          ) : (
            <svg
              className="text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              height={svgSize}
              viewBox="0 -960 960 960"
              width={svgSize}
              fill="currentColor"
            >
              <path d="m791-56-64-64H200q-33 0-56.5-23.5T120-200v-527l-64-65 56-56 736 736-57 56ZM200-200h447L200-647v447Zm640-33-80-80v-327H433L233-840h527q33 0 56.5 23.5T840-760v527Z" />
            </svg>
          )}

          {windowWidth > 600 && <p className="font-semibold text-sm">Banner</p>}
        </button>
        <button
          onClick={() => setIsCheckStatus(!isCheckStatus)}
          className="bg-blue-200 rounded-xl p-4 py-1 shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.7)] flex gap-2 items-center"
        >
          <svg
            className={`${connected ? "text-green-600" : "text-red-600"}`}
            xmlns="http://www.w3.org/2000/svg"
            height={svgSize}
            viewBox="0 -960 960 960"
            width={svgSize}
            fill="currentColor"
          >
            <path d="M200-160v-240h120v240H200Zm240 0v-440h120v440H440Zm240 0v-640h120v640H680Z" />
          </svg>
          {windowWidth > 600 && <p className="font-semibold text-sm">Signal</p>}
        </button>
        <button
          // onClick={() => setIsCheckStatus(!isCheckStatus)}
          className="bg-blue-200 rounded-xl p-4 py-1 shadow-[0px_0px_4px_0.5px_rgba(0,0,0,0.7)] flex gap-2 items-center"
        >
          <svg
            className={`${connected ? "text-green-600" : "text-red-600"}`}
            xmlns="http://www.w3.org/2000/svg"
            height={svgSize}
            viewBox="0 -960 960 960"
            width={svgSize}
            fill="currentColor"
          >
            <path d="M409-149q-29-29-29-71t29-71q29-29 71-29t71 29q29 29 29 71t-29 71q-29 29-71 29t-71-29ZM254-346l-84-86q59-59 138.5-93.5T480-560q92 0 171.5 35T790-430l-84 84q-44-44-102-69t-124-25q-66 0-124 25t-102 69ZM84-516 0-600q92-94 215-147t265-53q142 0 265 53t215 147l-84 84q-77-77-178.5-120.5T480-680q-116 0-217.5 43.5T84-516Z" />
          </svg>
          {windowWidth > 600 && (
            <p className="font-semibold text-sm">Internet</p>
          )}
        </button>
      </div>
    </div>
  );
}
