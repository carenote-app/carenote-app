export function AiProcessingIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label="A central AI brain with input and output streams, illustrating Claude structuring a caregiver's voice note"
    >
      {/* Central brain/processor */}
      <circle cx="200" cy="140" r="45" stroke="currentColor" opacity="0.15" strokeWidth="2" />
      <circle cx="200" cy="140" r="30" stroke="currentColor" opacity="0.25" strokeWidth="1.5" />

      {/* Neural connections - left input */}
      <circle cx="80" cy="80" r="12" stroke="currentColor" opacity="0.3" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <line x1="92" y1="86" x2="170" y2="130" stroke="currentColor" opacity="0.15" strokeWidth="1" strokeDasharray="4 3" />

      <circle cx="70" cy="140" r="12" stroke="currentColor" opacity="0.3" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <line x1="82" y1="140" x2="170" y2="140" stroke="currentColor" opacity="0.15" strokeWidth="1" strokeDasharray="4 3" />

      <circle cx="80" cy="200" r="12" stroke="currentColor" opacity="0.3" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <line x1="92" y1="194" x2="170" y2="150" stroke="currentColor" opacity="0.15" strokeWidth="1" strokeDasharray="4 3" />

      {/* Input labels */}
      <text x="80" y="84" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="8" fontFamily="sans-serif">voice</text>
      <text x="70" y="144" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="8" fontFamily="sans-serif">text</text>
      <text x="80" y="204" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="8" fontFamily="sans-serif">context</text>

      {/* Neural connections - right output */}
      <circle cx="320" cy="80" r="12" stroke="currentColor" opacity="0.3" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <line x1="230" y1="130" x2="308" y2="86" stroke="currentColor" opacity="0.15" strokeWidth="1" strokeDasharray="4 3" />

      <circle cx="330" cy="140" r="12" stroke="currentColor" opacity="0.3" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <line x1="230" y1="140" x2="318" y2="140" stroke="currentColor" opacity="0.15" strokeWidth="1" strokeDasharray="4 3" />

      <circle cx="320" cy="200" r="12" stroke="currentColor" opacity="0.3" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <line x1="230" y1="150" x2="308" y2="194" stroke="currentColor" opacity="0.15" strokeWidth="1" strokeDasharray="4 3" />

      {/* Output labels */}
      <text x="320" y="84" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="8" fontFamily="sans-serif">notes</text>
      <text x="330" y="144" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="8" fontFamily="sans-serif">flags</text>
      <text x="320" y="204" textAnchor="middle" fill="currentColor" opacity="0.5" fontSize="8" fontFamily="sans-serif">reports</text>

      {/* Center icon - sparkle/AI */}
      <path d="M200 118 L203 132 L217 135 L203 138 L200 152 L197 138 L183 135 L197 132 Z" fill="currentColor" opacity="0.6" />
      <path d="M188 125 L189 130 L194 131 L189 132 L188 137 L187 132 L182 131 L187 130 Z" fill="currentColor" opacity="0.3" />
      <path d="M212 145 L213 150 L218 151 L213 152 L212 157 L211 152 L206 151 L211 150 Z" fill="currentColor" opacity="0.3" />

      {/* Processing text */}
      <text x="200" y="250" textAnchor="middle" fill="currentColor" opacity="0.4" fontSize="11" fontFamily="sans-serif">Claude AI structuring in real-time</text>
    </svg>
  );
}
