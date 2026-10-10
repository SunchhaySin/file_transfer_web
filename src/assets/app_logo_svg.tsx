const AppLogo = ({ size, className  }: {size: string | number | undefined, className?: string}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="P2P File Transfer Logo"
    >
      <defs>
        {/* Deep Forest/Emerald Container Base (Contrasts nicely against mid/light green apps) */}
        <radialGradient id="p2p-green-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#022c22" />
        </radialGradient>

        {/* Sender Device Gradient - Vibrant Mint/Spring Green */}
        <linearGradient id="p2p-sender-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Receiver Device Gradient - Bright Cyan/Teal (High contrast against green) */}
        <linearGradient id="p2p-receiver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Transfer Node Core Gradient - Warm Lime/Gold Accent */}
        <linearGradient id="p2p-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a3e635" />
          <stop offset="100%" stopColor="#65a30d" />
        </linearGradient>

        {/* Glow Filter Effect */}
        <filter id="p2p-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Drop Shadow Filter Effect */}
        <filter id="p2p-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#012017" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* App Container Icon Base (Rounded Squircle) */}
      <rect width="512" height="512" rx="112" fill="url(#p2p-green-bg)" />

      {/* Local Network Radar Ring (Mint Dash) */}
      <circle
        cx="256"
        cy="256"
        r="190"
        fill="none"
        stroke="#34d399"
        strokeWidth="3"
        strokeDasharray="12 16"
        opacity="0.3"
      />

      {/* Wi-Fi Signals (Top & Bottom Peers) */}
      <path
        d="M 176 130 A 110 110 0 0 1 336 130"
        fill="none"
        stroke="#6ee7b7"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.85"
        filter="url(#p2p-glow)"
      />
      <path
        d="M 206 155 A 70 70 0 0 1 306 155"
        fill="none"
        stroke="#6ee7b7"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.5"
      />

      <path
        d="M 336 382 A 110 110 0 0 1 176 382"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.85"
        filter="url(#p2p-glow)"
      />
      <path
        d="M 306 357 A 70 70 0 0 1 206 357"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* MAIN LOGO MARK */}
      <g filter="url(#p2p-shadow)">
        {/* LEFT DEVICE (SENDER) */}
        <g transform="translate(140, 180)">
          <rect x="0" y="0" width="80" height="152" rx="18" fill="url(#p2p-sender-grad)" />
          <rect x="6" y="10" width="68" height="132" rx="12" fill="#022c22" />
          <rect x="28" y="16" width="24" height="3" rx="1.5" fill="#065f46" />
          <circle cx="40" cy="120" r="5" fill="#34d399" filter="url(#p2p-glow)" />
        </g>

        {/* RIGHT DEVICE (RECEIVER) */}
        <g transform="translate(292, 180)">
          <rect x="0" y="0" width="80" height="152" rx="18" fill="url(#p2p-receiver-grad)" />
          <rect x="6" y="10" width="68" height="132" rx="12" fill="#022c22" />
          <rect x="28" y="16" width="24" height="3" rx="1.5" fill="#065f46" />
          <circle cx="40" cy="120" r="5" fill="#22d3ee" filter="url(#p2p-glow)" />
        </g>

        {/* CENTRAL TRANSFER CURVES */}
        {/* Top Transfer Arrow (Mint -> Cyan) */}
        <path
          d="M 210 230 C 230 200, 280 200, 300 230"
          fill="none"
          stroke="url(#p2p-sender-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          filter="url(#p2p-glow)"
        />
        <polygon points="295,220 312,236 290,240" fill="#6ee7b7" />

        {/* Bottom Transfer Arrow (Cyan -> Mint) */}
        <path
          d="M 302 282 C 282 312, 232 312, 212 282"
          fill="none"
          stroke="url(#p2p-receiver-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          filter="url(#p2p-glow)"
        />
        <polygon points="217,292 200,276 222,272" fill="#22d3ee" />

        {/* CENTER FILE TRANSFER NODE (Lime/Gold Accent) */}
        <g transform="translate(236, 236)" filter="url(#p2p-glow)">
          <circle cx="20" cy="20" r="26" fill="url(#p2p-accent-grad)" />
          {/* File Document Icon */}
          <path
            d="M 12 10 L 22 10 L 28 16 L 28 30 C 28 31.1 27.1 32 26 32 L 14 32 C 12.9 32 12 31.1 12 30 Z"
            fill="none"
            stroke="#022c22"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M 22 10 L 22 16 L 28 16"
            fill="none"
            stroke="#022c22"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
};

export default AppLogo;