import Link from "next/link";

export function Logo({ href = "/", size = "default" }: { href?: string; size?: "default" | "sm" }) {
  const iconSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-base" : "text-lg";
  const subSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <Link href={href} className="flex items-center gap-2.5">
      <div className={`${iconSize} text-primary`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" className="h-full w-full">
          <rect width="40" height="40" rx="10" fill="currentColor" opacity="0.1"/>
          <circle cx="20" cy="14" r="6" stroke="currentColor" strokeWidth="2.2" fill="none"/>
          <polyline points="14,14 17,14 18.5,10 20,18 21.5,12 23,14 26,14" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 14 C14 14, 12 16, 12 20 C12 24, 16 27, 20 27" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M26 14 C26 14, 28 16, 28 20 C28 24, 24 27, 20 27" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <circle cx="20" cy="27" r="2.5" fill="currentColor"/>
          <path d="M15 30 C15 30, 17.5 33, 20 33 C22.5 33, 25 30, 25 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={`${textSize} font-semibold tracking-tight text-foreground`}>
          Kinroster
        </span>
        <span className={`${subSize} text-muted-foreground leading-none`}>
          Clinical Voice Assistant
        </span>
      </div>
    </Link>
  );
}
