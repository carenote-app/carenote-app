export function SharingIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label="A central note routed to family, clinician, and team recipients, illustrating role-aware sharing"
    >
      {/* Central note node */}
      <circle cx="200" cy="140" r="28" stroke="currentColor" opacity="0.25" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
      <rect x="188" y="128" width="24" height="28" rx="3" stroke="currentColor" opacity="0.4" strokeWidth="1.5" fill="none" />
      <rect x="192" y="134" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="192" y="140" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
      <rect x="192" y="146" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.2" />

      {/* Family member node - top left */}
      <circle cx="100" cy="60" r="22" stroke="currentColor" opacity="0.2" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <circle cx="100" cy="54" r="6" stroke="currentColor" opacity="0.3" strokeWidth="1.2" fill="none" />
      <path d="M90 68 C90 63, 95 60, 100 60 C105 60, 110 63, 110 68" stroke="currentColor" opacity="0.3" strokeWidth="1.2" fill="none" />
      <text x="100" y="92" textAnchor="middle" fill="currentColor" opacity="0.35" fontSize="9" fontFamily="sans-serif">Family</text>
      <line x1="118" y1="76" x2="176" y2="122" stroke="currentColor" opacity="0.12" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Doctor node - top right */}
      <circle cx="300" cy="60" r="22" stroke="currentColor" opacity="0.2" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <rect x="292" y="48" width="16" height="20" rx="2" stroke="currentColor" opacity="0.3" strokeWidth="1.2" fill="none" />
      <line x1="296" y1="54" x2="304" y2="54" stroke="currentColor" opacity="0.2" strokeWidth="1" />
      <line x1="296" y1="58" x2="302" y2="58" stroke="currentColor" opacity="0.2" strokeWidth="1" />
      <text x="300" y="92" textAnchor="middle" fill="currentColor" opacity="0.35" fontSize="9" fontFamily="sans-serif">Doctor</text>
      <line x1="282" y1="76" x2="224" y2="122" stroke="currentColor" opacity="0.12" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Team node - bottom left */}
      <circle cx="100" cy="220" r="22" stroke="currentColor" opacity="0.2" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <circle cx="94" cy="216" r="5" stroke="currentColor" opacity="0.25" strokeWidth="1" fill="none" />
      <circle cx="106" cy="216" r="5" stroke="currentColor" opacity="0.25" strokeWidth="1" fill="none" />
      <circle cx="100" cy="228" r="5" stroke="currentColor" opacity="0.25" strokeWidth="1" fill="none" />
      <text x="100" y="252" textAnchor="middle" fill="currentColor" opacity="0.35" fontSize="9" fontFamily="sans-serif">Care Team</text>
      <line x1="118" y1="204" x2="176" y2="158" stroke="currentColor" opacity="0.12" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* EMR node - bottom right */}
      <circle cx="300" cy="220" r="22" stroke="currentColor" opacity="0.2" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <rect x="288" y="210" width="24" height="18" rx="3" stroke="currentColor" opacity="0.3" strokeWidth="1.2" fill="none" />
      <rect x="292" y="214" width="8" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="292" y="220" width="12" height="3" rx="1" fill="currentColor" opacity="0.15" />
      <text x="300" y="252" textAnchor="middle" fill="currentColor" opacity="0.35" fontSize="9" fontFamily="sans-serif">EMR Export</text>
      <line x1="282" y1="204" x2="224" y2="158" stroke="currentColor" opacity="0.12" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  );
}
