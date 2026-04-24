"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Logo />

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/hipaa" className="text-muted-foreground transition-colors hover:text-foreground">
              HIPAA Compliance
            </Link>
            <Link href="/support" className="text-muted-foreground transition-colors hover:text-foreground">
              Support
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kinroster. All rights reserved. Built for healthcare professionals.
          </p>
        </div>
      </div>
    </footer>
  )
}
