"use client";

import { useState } from "react";
import { Home, Stethoscope, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsultLauncher } from "./consult-launcher";

const roles = [
  {
    id: "caretaker" as const,
    title: "Caretaker",
    description: "Home healthcare providers and family caregivers",
    icon: Home,
    features: [
      "Daily care documentation",
      "Medication tracking",
      "Symptom monitoring",
      "Family communication",
    ],
    color: "from-teal-500/20 to-teal-600/5",
  },
  {
    id: "doctor" as const,
    title: "Doctor",
    description: "Physicians and clinical healthcare professionals",
    icon: Stethoscope,
    features: [
      "Clinical assessments",
      "Treatment plans",
      "Medical notes",
      "Care coordination",
    ],
    color: "from-cyan-500/20 to-cyan-600/5",
  },
];

// Self-contained client island: owns the role selection state and the
// "Continue as X" launcher. The parent page can mount this without
// hoisting any modal state — keeps the rest of the landing tree
// server-rendered.
export function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<
    "caretaker" | "doctor" | null
  >(null);

  return (
    <section id="how-it-works" className="py-12 md:py-20 scroll-mt-20">
      <div className="mx-auto max-w-4xl">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Select Your Role
          </h2>
          <p className="text-muted-foreground">
            Choose your role to get a tailored experience
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            const Icon = role.icon;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50"
                )}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute right-4 top-4">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>

                {/* Content */}
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {role.title}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {role.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {role.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isSelected ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Hover indicator */}
                <div
                  className={cn(
                    "mt-6 flex items-center gap-2 text-sm font-medium transition-all",
                    isSelected
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {isSelected ? "Selected" : "Select role"}
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isSelected ? "" : "group-hover:translate-x-1"
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Start button when role is selected */}
        {selectedRole && (
          <div className="mt-8 text-center">
            <ConsultLauncher
              variant="role"
              role={selectedRole}
              label={`Continue as ${
                selectedRole === "caretaker" ? "Caretaker" : "Doctor"
              }`}
            />
          </div>
        )}
      </div>
    </section>
  );
}
