import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { MobileMenuButton } from "./mobile-menu-button";

// Server-rendered. Only the mobile menu toggle is interactive — that
// lives in the MobileMenuButton client island below.
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container relative mx-auto flex h-16 items-center justify-between px-4">
        <Logo />

        {/* Desktop Navigation */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 md:flex"
        >
          {/* py-3 brings the click target to ~44px tall — WCAG 2.5.5 /
              Lighthouse minimum. The link itself is still text-sm. */}
          <a
            href="#features"
            className="py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it Works
          </a>
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu — client island */}
        <MobileMenuButton />
      </div>
    </header>
  );
}
