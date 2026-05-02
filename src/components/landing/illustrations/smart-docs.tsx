export function SmartDocsIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label="A structured document with section headers, illustrating an AI-generated shift note"
    >
      {/* Document frame */}
      <rect x="100" y="20" width="200" height="240" rx="8" stroke="currentColor" opacity="0.2" strokeWidth="1.5" />
      <rect x="100" y="20" width="200" height="40" rx="8" fill="currentColor" opacity="0.05" />

      {/* Document header */}
      <text x="120" y="46" fill="currentColor" opacity="0.6" fontSize="12" fontWeight="600" fontFamily="sans-serif">Shift Note — Eleanor H.</text>
      <rect x="260" y="35" width="24" height="14" rx="3" fill="currentColor" opacity="0.15" />
      <text x="272" y="45" textAnchor="middle" fill="currentColor" opacity="0.4" fontSize="7" fontFamily="sans-serif">AM</text>

      {/* Summary section */}
      <text x="120" y="80" fill="currentColor" opacity="0.35" fontSize="8" fontFamily="sans-serif" style={{ textTransform: "uppercase", letterSpacing: "1px" }}>SUMMARY</text>
      <rect x="120" y="86" width="160" height="6" rx="3" fill="currentColor" opacity="0.1" />
      <rect x="120" y="96" width="120" height="6" rx="3" fill="currentColor" opacity="0.08" />

      {/* Mood section */}
      <text x="120" y="122" fill="currentColor" opacity="0.35" fontSize="8" fontFamily="sans-serif" style={{ textTransform: "uppercase", letterSpacing: "1px" }}>MOOD &amp; BEHAVIOR</text>
      <rect x="120" y="128" width="155" height="6" rx="3" fill="currentColor" opacity="0.1" />
      <rect x="120" y="138" width="140" height="6" rx="3" fill="currentColor" opacity="0.08" />
      <rect x="120" y="148" width="100" height="6" rx="3" fill="currentColor" opacity="0.06" />

      {/* Nutrition section */}
      <text x="120" y="174" fill="currentColor" opacity="0.35" fontSize="8" fontFamily="sans-serif" style={{ textTransform: "uppercase", letterSpacing: "1px" }}>NUTRITION</text>
      <rect x="120" y="180" width="145" height="6" rx="3" fill="currentColor" opacity="0.1" />
      <rect x="120" y="190" width="110" height="6" rx="3" fill="currentColor" opacity="0.08" />

      {/* Flag indicator */}
      <rect x="120" y="210" width="160" height="28" rx="6" stroke="currentColor" opacity="0.2" strokeWidth="1" fill="currentColor" fillOpacity="0.03" />
      <circle cx="134" cy="224" r="5" fill="currentColor" opacity="0.25" />
      <text x="134" y="227" textAnchor="middle" fill="currentColor" opacity="0.6" fontSize="7" fontFamily="sans-serif">!</text>
      <text x="146" y="221" fill="currentColor" opacity="0.4" fontSize="8" fontFamily="sans-serif">confusion detected</text>
      <text x="146" y="232" fill="currentColor" opacity="0.3" fontSize="7" fontFamily="sans-serif">flagged for follow-up</text>
    </svg>
  );
}
