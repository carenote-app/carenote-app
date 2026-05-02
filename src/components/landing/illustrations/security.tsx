export function SecurityIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label="A shield with HIPAA, RLS, and audit-log badges, illustrating Kinroster's compliance primitives"
    >
      {/* Shield */}
      <path
        d="M200 30 L260 55 C260 55, 265 140, 200 230 C135 140, 140 55, 140 55 Z"
        stroke="currentColor"
        opacity="0.2"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.03"
      />
      <path
        d="M200 50 L245 70 C245 70, 248 135, 200 210 C152 135, 155 70, 155 70 Z"
        stroke="currentColor"
        opacity="0.1"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.03"
      />

      {/* Lock icon in center */}
      <rect x="187" y="108" width="26" height="22" rx="4" stroke="currentColor" opacity="0.4" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
      <path d="M193 108 L193 100 C193 93, 197 89, 200 89 C203 89, 207 93, 207 100 L207 108" stroke="currentColor" opacity="0.35" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="200" cy="119" r="3" fill="currentColor" opacity="0.4" />
      <line x1="200" y1="122" x2="200" y2="126" stroke="currentColor" opacity="0.35" strokeWidth="1.5" strokeLinecap="round" />

      {/* Checkmarks around shield */}
      <g opacity="0.4">
        {/* HIPAA badge */}
        <rect x="90" y="70" width="70" height="24" rx="12" stroke="currentColor" opacity="0.3" strokeWidth="1" fill="currentColor" fillOpacity="0.05" />
        <circle cx="104" cy="82" r="5" stroke="currentColor" opacity="0.4" strokeWidth="1" fill="none" />
        <path d="M101 82 L103 84 L107 80" stroke="currentColor" opacity="0.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="118" y="86" fill="currentColor" opacity="0.4" fontSize="9" fontFamily="sans-serif">HIPAA</text>
      </g>

      <g opacity="0.4">
        {/* Encryption badge */}
        <rect x="240" y="70" width="80" height="24" rx="12" stroke="currentColor" opacity="0.3" strokeWidth="1" fill="currentColor" fillOpacity="0.05" />
        <circle cx="254" cy="82" r="5" stroke="currentColor" opacity="0.4" strokeWidth="1" fill="none" />
        <path d="M251 82 L253 84 L257 80" stroke="currentColor" opacity="0.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="268" y="86" fill="currentColor" opacity="0.4" fontSize="9" fontFamily="sans-serif">AES-256</text>
      </g>

      <g opacity="0.4">
        {/* RLS badge */}
        <rect x="100" y="180" width="60" height="24" rx="12" stroke="currentColor" opacity="0.3" strokeWidth="1" fill="currentColor" fillOpacity="0.05" />
        <circle cx="114" cy="192" r="5" stroke="currentColor" opacity="0.4" strokeWidth="1" fill="none" />
        <path d="M111 192 L113 194 L117 190" stroke="currentColor" opacity="0.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="128" y="196" fill="currentColor" opacity="0.4" fontSize="9" fontFamily="sans-serif">RLS</text>
      </g>

      <g opacity="0.4">
        {/* SOC 2 badge */}
        <rect x="240" y="180" width="70" height="24" rx="12" stroke="currentColor" opacity="0.3" strokeWidth="1" fill="currentColor" fillOpacity="0.05" />
        <circle cx="254" cy="192" r="5" stroke="currentColor" opacity="0.4" strokeWidth="1" fill="none" />
        <path d="M251 192 L253 194 L257 190" stroke="currentColor" opacity="0.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="268" y="196" fill="currentColor" opacity="0.4" fontSize="9" fontFamily="sans-serif">SOC 2</text>
      </g>
    </svg>
  );
}
