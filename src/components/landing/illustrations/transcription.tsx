export function TranscriptionIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label="A chat conversation between a caregiver and an AI, illustrating real-time follow-up questions during a voice session"
    >
      {/* Chat container */}
      <rect x="80" y="20" width="240" height="240" rx="12" stroke="currentColor" opacity="0.15" strokeWidth="1.5" />

      {/* AI message bubble */}
      <rect x="100" y="40" width="180" height="36" rx="12" fill="currentColor" opacity="0.08" />
      <circle cx="116" cy="58" r="8" fill="currentColor" opacity="0.15" />
      <text x="116" y="62" textAnchor="middle" fill="currentColor" opacity="0.4" fontSize="8" fontFamily="sans-serif">AI</text>
      <rect x="132" y="50" width="100" height="5" rx="2.5" fill="currentColor" opacity="0.12" />
      <rect x="132" y="59" width="70" height="5" rx="2.5" fill="currentColor" opacity="0.08" />

      {/* User message bubble */}
      <rect x="120" y="88" width="180" height="50" rx="12" fill="currentColor" opacity="0.12" />
      <circle cx="284" cy="113" r="8" fill="currentColor" opacity="0.2" />
      <text x="284" y="117" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="8" fontFamily="sans-serif">You</text>
      <rect x="136" y="98" width="130" height="5" rx="2.5" fill="currentColor" opacity="0.15" />
      <rect x="136" y="107" width="140" height="5" rx="2.5" fill="currentColor" opacity="0.12" />
      <rect x="136" y="116" width="90" height="5" rx="2.5" fill="currentColor" opacity="0.08" />

      {/* Real-time indicator */}
      <circle cx="136" y="126" r="3" fill="currentColor" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* AI response generating */}
      <rect x="100" y="150" width="160" height="36" rx="12" fill="currentColor" opacity="0.08" />
      <circle cx="116" cy="168" r="8" fill="currentColor" opacity="0.15" />
      <text x="116" y="172" textAnchor="middle" fill="currentColor" opacity="0.4" fontSize="8" fontFamily="sans-serif">AI</text>
      <rect x="132" y="162" width="80" height="5" rx="2.5" fill="currentColor" opacity="0.12" />
      <rect x="132" y="171" width="50" height="5" rx="2.5" fill="currentColor" opacity="0.08" />

      {/* Live transcription bar at bottom */}
      <rect x="100" y="200" width="200" height="40" rx="8" stroke="currentColor" opacity="0.15" strokeWidth="1" fill="currentColor" fillOpacity="0.03" />
      <circle cx="118" cy="220" r="6" fill="currentColor" opacity="0.3">
        <animate attributeName="r" values="6;7;6" dur="1s" repeatCount="indefinite" />
      </circle>
      <text x="132" y="216" fill="currentColor" opacity="0.4" fontSize="8" fontFamily="sans-serif">Listening...</text>
      <text x="132" y="228" fill="currentColor" opacity="0.25" fontSize="7" fontFamily="sans-serif">Streaming voice recognition</text>
    </svg>
  );
}
