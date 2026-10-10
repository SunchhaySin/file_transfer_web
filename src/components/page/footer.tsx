import useScreenSize from '../../provider/windowWidth';

export default function Footer() {
  const { isTablet, isDesktop } = useScreenSize();

  const paddingClasses = isDesktop
    ? "px-12 md:px-24 py-6 text-sm"
    : isTablet
      ? "px-8 py-5 text-xs"
      : "px-4 py-4 text-xs";

  return (
    <footer
      className={`w-full bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 text-slate-300 border-t border-slate-700/50 backdrop-blur-md transition-all duration-300 ${paddingClasses}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Section: Branding & App Description */}
        <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <p className="font-semibold text-slate-100 tracking-wide">
              Peer-to-Peer <span className="text-blue-400 font-bold">FILE-TRANSFER</span>
            </p>
          </div>
          <p className="text-slate-400 text-xs max-w-sm">
            Fast, secure, and direct local network & offline WebRTC file sharing.
          </p>
        </div>

        {/* Center / Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded-full border border-slate-700/60 text-xs text-slate-400">
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Vanilla ICE & Direct RTC Channels</span>
        </div>

        {/* Right Section: GitHub Link Pill */}
        <div className="flex items-center justify-center md:justify-end">
          <a
            href="https://github.com/SunchhaySin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white rounded-xl border border-slate-700 hover:border-blue-500/50 shadow-sm transition-all duration-200 group"
          >
            <GithubIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span className="font-medium text-xs">GitHub Profile</span>
          </a>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
        © {new Date().getFullYear()} P2P File Transfer. Built with React & WebRTC.
      </div>
    </footer>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}