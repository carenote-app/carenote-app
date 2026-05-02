export function VoiceRecordingIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label="A phone with a microphone icon, illustrating voice note capture"
    >
      {/* Phone frame */}
      <rect x="120" y="10" width="160" height="260" rx="20" stroke="currentColor" opacity="0.2" strokeWidth="2" />
      <rect x="170" y="18" width="60" height="6" rx="3" fill="currentColor" opacity="0.1" />

      {/* Mic button */}
      <circle cx="200" cy="140" r="36" fill="currentColor" opacity="0.1" />
      <circle cx="200" cy="140" r="28" fill="currentColor" opacity="0.15" />
      {/* Pulse rings */}
      <circle cx="200" cy="140" r="50" stroke="currentColor" opacity="0.08" strokeWidth="1.5" />
      <circle cx="200" cy="140" r="65" stroke="currentColor" opacity="0.05" strokeWidth="1" />

      {/* Mic icon */}
      <rect x="193" y="124" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M187 140 C187 147, 193 153, 200 153 C207 153, 213 147, 213 140" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="200" y1="153" x2="200" y2="160" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* Waveform bars */}
      <rect x="136" y="190" width="4" height="16" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="146" y="185" width="4" height="26" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="156" y="178" width="4" height="40" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="166" y="182" width="4" height="32" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="176" y="175" width="4" height="46" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="186" y="180" width="4" height="36" rx="2" fill="currentColor" opacity="0.8" />
      <rect x="196" y="172" width="4" height="52" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="206" y="178" width="4" height="40" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="216" y="183" width="4" height="30" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="226" y="180" width="4" height="36" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="236" y="186" width="4" height="24" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="246" y="190" width="4" height="16" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="256" y="192" width="4" height="12" rx="2" fill="currentColor" opacity="0.2" />

      {/* Timer */}
      <text x="200" y="240" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="14" fontFamily="monospace">01:24</text>
    </svg>
  );
}
