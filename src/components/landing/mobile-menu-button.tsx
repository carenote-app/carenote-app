"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

// Tiny client island for the landing-page mobile menu — toggles open
// state and renders the conditional pane. The rest of the LandingHeader
// (logo, desktop nav) stays server-rendered.
export function MobileMenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-2 px-4 py-4">
            <a
              href="#features"
              className="rounded-lg px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="rounded-lg px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              How it Works
            </a>
            <Link href="/login" className="mt-2">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
