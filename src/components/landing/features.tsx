import { Mic, FileText, Share2, Lock, Zap, Brain, ArrowDown } from "lucide-react"

const features = [
  {
    id: "voice-recording",
    icon: Mic,
    title: "Voice Recording",
    description: "Speak naturally about patient care. Our AI understands medical terminology and context."
  },
  {
    id: "ai-processing",
    icon: Brain,
    title: "AI Processing",
    description: "Advanced language models convert your voice notes into structured clinical documentation."
  },
  {
    id: "smart-documentation",
    icon: FileText,
    title: "Smart Documentation",
    description: "Generate professional notes, care plans, and reports automatically from your recordings."
  },
  {
    id: "instant-transcription",
    icon: Zap,
    title: "Real-Time Conversation",
    description: "Talk to an AI assistant that asks follow-up questions and ensures nothing is missed."
  },
  {
    id: "easy-sharing",
    icon: Share2,
    title: "Easy Sharing",
    description: "Share reports with families, healthcare teams, or export to EMR systems seamlessly."
  },
  {
    id: "security",
    icon: Lock,
    title: "Compliance-Ready",
    description: "Append-only audit log, role-based access, revocable magic-link portals for clinician sharing, and 42 CFR Part 2 data segregation — the primitives your security review actually asks for."
  }
]

export function Features() {
  return (
    <section id="features" className="py-12 md:py-20 scroll-mt-20">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
            <span>Features</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Streamlined Clinical Documentation
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            From voice to documentation in seconds. Our AI-powered platform handles the complexity
            so you can focus on what matters most — patient care.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <a
                key={feature.id}
                href={`#${feature.id}`}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-secondary/30"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ArrowDown className="h-3 w-3" />
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
