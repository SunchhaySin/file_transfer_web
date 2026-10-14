import useScreenSize from "../../provider/windowWidth";

export default function Footer() {
  const { isTablet, isDesktop } = useScreenSize();

  const paddingClasses = isDesktop
    ? "px-12 md:px-24 py-8 text-sm"
    : isTablet
      ? "px-12 py-6 text-xs"
      : "px-10 py-4 text-xs";

  return (
    <footer
      className={`w-full bg-linear-to-b from-slate-900 via-slate-900/90 to-slate-950 text-slate-300 
        border-t border-slate-700/50 backdrop-blur-md transition-all duration-300 ${paddingClasses}
        md:grid md:6 md:items-center flex flex-col gap-2 grid-cols-[1fr_1.5fr_1fr] 
        `}
    >
      {/* <div className="flex flex-col md:flex-row items-center justify-between gap-4 "> */}

      <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
        <div className="flex items-center gap-2">
          <span className="text-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="18px"
              viewBox="0 -960 960 960"
              width="18px"
              fill="currentColor"
            >
              <path d="M621.5-338.5Q680-397 680-480t-58.5-141.5Q563-680 480-680t-141.5 58.5Q280-563 280-480t58.5 141.5Q397-280 480-280t141.5-58.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" />
            </svg>
          </span>
          <p className="font-semibold text-slate-100">
            Peer-to-Peer{" "}
            <span className="text-blue-400 font-bold">FILE-TRANSFER</span>
          </p>
        </div>
        <p className="text-slate-400 text-xs max-w-sm">
          Fast, secure, and direct local network & offline WebRTC file sharing.
        </p>
        {/* <p className="text-slate-400 text-xs max-w-sm">
          <strong>WebRTC</strong>, <strong>RTCDataChannels</strong>,<strong>DTLS</strong> (Datagram Transport Layer Security), <strong>SCTP</strong> (Stream Control Transmission Protocol) 
        </p> */}
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex flex-wrap items-center justify-start gap-1.5 max-w-lg text-xs text-blue-400/60">
            <span
              className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 font-semibold hover:border-slate-500/50 hover:text-blue-400 transition-colors"
              title="Web Real-Time Communication"
            >
              WebRTC
            </span>
            <span
              className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 font-semibold hover:border-slate-500/50 hover:text-blue-400 transition-colors"
              title="RTC Data Channel"
            >
              RTCDataChannel
            </span>
            <span
              className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 font-semibold hover:border-slate-500/50 hover:text-blue-400 transition-colors"
              title="Datagram Transport Layer Security"
            >
              DTLS
            </span>
            <span
              className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 font-semibold hover:border-slate-500/50 hover:text-blue-400 transition-colors"
              title="Stream Control Transmission Protocol"
            >
              SCTP
            </span>
          </div>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 items-center justify-center gap-2">
        {[
          {
            label: "Direct Peer-to-Peer File Sharing",
            icon: (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h8m-4-4 4 4-4 4M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z"
              />
            ),
            color: "text-orange-400",
          },
          {
            label: "Real-Time Transfer Progress",
            icon: (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12h4l3-9 4 18 3-9h4"
              />
            ),
            color: "text-yellow-400",
          },
          {
            label: "End-to-End Data Encryption",
            icon: (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 11V7a5 5 0 0 1 10 0v4m-11 0h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z"
              />
            ),
            color: "text-green-400",
          },
          {
            label: "Local Network Peer Discovery",
            icon: (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
              />
            ),
            color: "text-blue-400",
          },
        ].map((feature) => (
          <div
            key={feature.label}
            className="flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded-full border border-slate-700/60 text-xs text-slate-400"
          >
            <svg
              className={`w-3.5 h-3.5 shrink-0 ${feature.color}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {feature.icon}
            </svg>
            <span>{feature.label}</span>
          </div>
        ))}
      </div>

      <div className="w-full flex md:flex-col items-center md:items-end gap-2 justify-center md:justify-end ">
        <p className="hidden md:flex font-semibold text-blue-400">PROFILES:</p>
        <a
          href="https://github.com/SunchhaySin/file_transfer_web"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white rounded-xl border border-slate-700 hover:border-blue-500/50 shadow-sm transition-all duration-200 group"
        >
          <GithubIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
          <span className="font-medium text-xs">Project Repository</span>
        </a>
        <a
          href="https://github.com/SunchhaySin"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white rounded-xl border border-slate-700 hover:border-blue-500/50 shadow-sm transition-all duration-200 group"
        >
          <GithubIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
          <span className="font-medium text-xs">GitHub Profile</span>
        </a>
      </div>
      {/* </div> */}
    </footer>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
