import { useState, useEffect } from "react";
import KeyFeatureLabel from "./key_feature_label";
import TechStack from "./tech_stack";

export default function AppBanner({
  windowWidth,
  bannerCondition,
  isDesktop,
  isTablet,
  isMobile,
}: {
  bannerCondition: boolean;
  windowWidth: number;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
}) {

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const numPages = 2;

  useEffect(() => {
    if (!isMobile) {
      setCurrentPageIndex(0);
    }
  }, [isMobile]);

  const handlePageChangeForward = () => {
    setCurrentPageIndex((prev) => (prev + 1) % numPages)
  }

  const handlePageChangeBackward = () => {
    setCurrentPageIndex((prev) => (prev - 1 + numPages) % numPages)
  }

  const FeatureLabelSvgSize =
    windowWidth && windowWidth > 600
      ? "35px"
      : windowWidth && windowWidth > 500
        ? "30px"
        : "25";

  return (
    <div
      className={`flex-1 w-full min-h-0 shadow-[0px_0px_4px_0.35px_rgba(0,0,0,0.3)] p-5 
                  rounded-2xl z-99 transition-all duration-150 ease-in-out bg-white/60
                ${bannerCondition ? "opacity-100 translate-y-0 pointer-events-auto" : "fixed inset-0 opacity-0 -translate-y-2 pointer-events-none"}
                ${isDesktop ? "grid grid-cols-[1.25fr_1fr] gap-6" : "flex flex-col gap-2 overflow-y-auto"}`}
    >
      <div
        className={`flex flex-col gap-3 items-start 
          ${isDesktop && "min-h-0"}
          ${isMobile && currentPageIndex !== 0 ? "hidden" : ""}
        `}
      >
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
          <div className="w-full flex items-center justify-between">
            <p
              className={`font-semibold bg-blue-300 shadow-[0px_0px_4px_0.5px_blue] m-1 px-2 py-1 rounded-xl
                    ${isDesktop ? "text-2xl" : isTablet ? "text-xl" : isMobile && "text-lg"}`}
            >
              App Description
            </p>
            {isMobile && (
              <div className="flex items-center justify-center">
                <svg
                  onClick={handlePageChangeBackward}
                  xmlns="http://www.w3.org/2000/svg"
                  height="18px"
                  viewBox="0 -960 960 960"
                  width="18px"
                  fill="currentColor"
                >
                  <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
                </svg>
                <p className="text-xs">
                  Page: <strong>{currentPageIndex + 1}</strong>
                </p>
                <svg
                  onClick={handlePageChangeForward}
                  xmlns="http://www.w3.org/2000/svg"
                  height="18px"
                  viewBox="0 -960 960 960"
                  width="18px"
                  fill="currentColor"
                >
                  <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.75">
            <p
              className={`text-(--info-text) bg-blue-50/50 text-justify py-1 px-2 ml-1.25 leading-relaxed rounded-lg
                    shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] ${windowWidth < 600 ? "text-sm" : ""}`}
            >
              A compact file-transfer web application ultilizing{" "}
              {<strong>WebRTC</strong>} (Web-Real-Time-Communnication). A
              mondern networking and data transfer archetecture built to
              natively support Web Browers of all kinds. Allowing users to
              securely transfer images, videos, and files directly with another
              device on the same local network. Built with a focus on
              responsiveness across all screen sizes and a clean, intuitive
              interface.
            </p>
            <p
              className={`text-(--info-text) bg-blue-50/50 text-justify py-1 px-2 ml-1.25 leading-relaxed rounded-lg
                    shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] ${windowWidth < 600 ? "text-sm" : ""}`}
            >
              This application offers a simple and reliable way to transfer
              files between different devices. It currently supports local
              network tranfers, but we're working implemementing cloud network
              support aswell.
            </p>
            <p
              className={`text-(--info-text) bg-blue-50/50 text-justify py-1 px-2 ml-1.25 leading-relaxed rounded-lg
                    shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] ${windowWidth < 600 ? "text-sm" : ""}`}
            >
              Local transfers can be executed using one of two signaling
              processes, a local signaling server, and QR-code manual signaling.
              Signal exchange between participating devices is nessecary to
              establish a direct WebRTC connection.
            </p>
            <p
              className={`text-(--info-text) bg-blue-50/50 text-justify py-1 px-2 ml-1.25 leading-relaxed rounded-lg
                  shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] ${windowWidth < 600 ? "text-sm" : ""}`}
            >
              Future updates will extend the support for cross-network
              transfers, utilizing a cloud-hosted signaling server. Any updates
              will be an add-on and will only extend the usability and support
              of the current application.
            </p>
          </div>
        </div>

        {isDesktop && (
          <TechStack
            isDesktop={isDesktop}
            isTablet={isTablet}
            isMobile={isMobile}
          />
        )}
      </div>

      <div
        className={`flex flex-col gap-3 w-full 
          ${isDesktop && "flex-1 min-h-0 overflow-y-auto"}
          ${isMobile && currentPageIndex !== 1 ? "hidden" : ""}
        `}
      >
        <div className="w-full flex items-center justify-between">
            <p
              className={`font-semibold bg-red-300 shadow-[0px_0px_4px_0.5px_red] m-1 px-2 py-1 rounded-xl
                    ${isDesktop ? "text-2xl" : isTablet ? "text-xl" : isMobile && "text-lg"}`}
            >
              Key Features
            </p>
            {isMobile && (
              <div className="flex items-center justify-center">
                <svg
                  onClick={handlePageChangeBackward}
                  xmlns="http://www.w3.org/2000/svg"
                  height="18px"
                  viewBox="0 -960 960 960"
                  width="18px"
                  fill="currentColor"
                >
                  <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
                </svg>
                <p className="text-xs">
                  Page: <strong>{currentPageIndex + 1}</strong>
                </p>
                <svg
                  onClick={handlePageChangeForward}
                  xmlns="http://www.w3.org/2000/svg"
                  height="18px"
                  viewBox="0 -960 960 960"
                  width="18px"
                  fill="currentColor"
                >
                  <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" />
                </svg>
              </div>
            )}
          </div>
        <div className="flex flex-col gap-0.75">
          <KeyFeatureLabel
            Icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height={FeatureLabelSvgSize}
                viewBox="0 -960 960 960"
                width={FeatureLabelSvgSize}
                fill="currentColor"
              >
                <path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Z" />
              </svg>
            }
            FeatureTitle="Security & Privacy"
            Technology="WebRTC DTLS/SCTP"
            Description="End-to-end encrypted direct data streams ensure your files pass securely between peers without ever touching an intermediary server."
            isDesktop={isDesktop}
            isTablet={isTablet}
            isMobile={isMobile}
            className="bg-emerald-200/70 backdrop-blur-lg shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] rounded-lg w-full"
          />

          <KeyFeatureLabel
            Icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height={FeatureLabelSvgSize}
                viewBox="0 -960 960 960"
                width={FeatureLabelSvgSize}
                fill="currentColor"
              >
                <path d="M120-120v-240h240v240H120Zm80-80h80v-80h-80v80Zm-80-440v-240h240v240H120Zm80-80h80v-80h-80v80Zm440 520v-240h240v240H640Zm80-80h80v-80h-80v80ZM480-480v-80h80v80h-80Zm0-160v-80h80v80h-80Zm-160 0v-80h80v80h-80Zm320 0v-80h80v80h-80ZM480-160v-80h80v80h-80Zm-80-80v-80h80v80h-80Zm160-160v-80h80v80h-80Zm0 80v-80h80v80h-80Z" />
              </svg>
            }
            FeatureTitle="Hybrid Signaling"
            Technology="WebSocket & QR Exchange"
            Description="Seamlessly switch between online WebSocket connection matching and fully air-gapped, offline QR code optical handshakes."
            isDesktop={isDesktop}
            isTablet={isTablet}
            isMobile={isMobile}
            className="bg-sky-200/70 backdrop-blur-lg shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] rounded-lg w-full"
          />

          <KeyFeatureLabel
            Icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height={FeatureLabelSvgSize}
                viewBox="0 -960 960 960"
                width={FeatureLabelSvgSize}
                fill="currentColor"
              >
                <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Z" />
              </svg>
            }
            FeatureTitle="Batch Transfer Engine"
            Technology="JSON Batch Protocol"
            Description="Send dozens of files at once with automatic pre-flight JSON metadata negotiation and real-time per-file progress tracking."
            isDesktop={isDesktop}
            isTablet={isTablet}
            isMobile={isMobile}
            className="bg-purple-200/70 backdrop-blur-lg shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] rounded-lg w-full"
          />

          <KeyFeatureLabel
            Icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height={FeatureLabelSvgSize}
                viewBox="0 -960 960 960"
                width={FeatureLabelSvgSize}
                fill="currentColor"
              >
                <path d="M160-160v-80h110l-16-140q-30-13-58-31.5T124-454l68-42q19 22 43.5 39t52.5 27l24 210h136l24-210q28-10 52.5-27t43.5-39l68 42q-24 24-52 42.5T526-380l-16 140h110v80H160Zm320-360q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Z" />
              </svg>
            }
            FeatureTitle="Buffered Chunk Streaming"
            Technology="RTCDataChannel & Flow Control"
            Description="High-speed binary chunking with backpressure buffer drain thresholds to prevent browser memory bloat on multi-gigabyte transfers."
            isDesktop={isDesktop}
            isTablet={isTablet}
            isMobile={isMobile}
            className="bg-amber-200/70 backdrop-blur-lg shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] rounded-lg w-full"
          />

          <KeyFeatureLabel
            Icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height={FeatureLabelSvgSize}
                viewBox="0 -960 960 960"
                width={FeatureLabelSvgSize}
                fill="currentColor"
              >
                <path d="M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q25-92 100-149t170-57q117 0 198.5 81.5T760-520q67 9 113.5 58.5T920-340q0 75-52.5 127.5T740-160H260Zm0-80h480q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-60q0-83-58.5-141.5T480-700q-83 0-141.5 58.5T280-500v20h-20q-58 0-99 41t-41 99q0 58 41 99t99 41Z" />
              </svg>
            }
            FeatureTitle="Zero Server Retention"
            Technology="Direct Device-to-Device"
            Description="Enjoy total confidentiality with no file size limits, zero cloud storage uploads, and complete immunity to server-side data leaks."
            isDesktop={isDesktop}
            isTablet={isTablet}
            isMobile={isMobile}
            className="bg-rose-200/70 backdrop-blur-lg shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] rounded-lg w-full"
          />

          <KeyFeatureLabel
            Icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height={FeatureLabelSvgSize}
                viewBox="0 -960 960 960"
                width={FeatureLabelSvgSize}
                fill="currentColor"
              >
                <path d="M480-120q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Z" />
              </svg>
            }
            FeatureTitle="Isolated Peer Sessions"
            Technology="Scoped Transfer Orchestration"
            Description="Strict targeted signaling ensures file transfers occur exclusively between your selected peer with zero cross-talk or leakage."
            isDesktop={isDesktop}
            isTablet={isTablet}
            isMobile={isMobile}
            className="bg-indigo-200/70 backdrop-blur-lg shadow-[0px_0px_4px_0.15px_rgba(0,0,0,0.3)] rounded-lg w-full"
          />
        </div>
        {isMobile && (
        <TechStack
          isDesktop={isDesktop}
          isTablet={isTablet}
          isMobile={isMobile}
        />
      )}

      </div>
      {isTablet && (
        <TechStack
          isDesktop={isDesktop}
          isTablet={isTablet}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
