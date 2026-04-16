"use client"

import { useState } from "react"
import { LandingHeader } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"
import { RoleSelection } from "@/components/landing/role-selection"
import { ConsultModal } from "@/components/landing/consult-modal"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  const [isConsultOpen, setIsConsultOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"caretaker" | "doctor" | null>(null)

  return (
    <div className="min-h-screen bg-background text-foreground">
        <LandingHeader />

        <main className="container mx-auto px-4 py-8 md:py-12">
          <HeroSection onStartConsult={() => setIsConsultOpen(true)} />

          <RoleSelection
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            onStartConsult={() => setIsConsultOpen(true)}
          />

          <Features />
        </main>

        <Footer />

        <ConsultModal
          isOpen={isConsultOpen}
          onClose={() => setIsConsultOpen(false)}
          selectedRole={selectedRole}
        />
    </div>
  )
}
