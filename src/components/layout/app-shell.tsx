"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  LayoutDashboard,
  Menu,
  Settings,
  UserPlus,
  CreditCard,
  LogOut,
  Mic,
  Stethoscope,
  ShieldAlert,
  ScrollText,
  ClipboardList,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User, Organization } from "@/types/database";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";

type UserWithOrg = User & {
  organizations: Organization;
};

// If a nav item has a `visibleTo` predicate, that controls visibility.
// Otherwise it's shown to everyone (subject to downstream RLS).
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  visibleTo?: (role: string) => boolean;
};

const isAdminRole = (role: string) =>
  role === "admin" || role === "compliance_admin";
const isClinicalRole = (role: string) =>
  role !== "ops_staff" && role !== "billing_staff";
const isBillingCapable = (role: string) =>
  isAdminRole(role) || role === "billing_staff";

const navItems: NavItem[] = [
  { href: "/today", label: "Today", icon: CalendarDays, visibleTo: isClinicalRole },
  { href: "/residents", label: "Residents", icon: Users },
  { href: "/voice-sessions", label: "Calls", icon: Mic, visibleTo: isClinicalRole },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle, visibleTo: isAdminRole },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, visibleTo: isAdminRole },
];

export function AppShell({
  user,
  children,
}: {
  user: UserWithOrg;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const role = user.role;
  const isAdmin = isAdminRole(role);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo href="/" size="sm" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{user.full_name}</SheetTitle>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRole(role)}
                </p>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {isAdmin && (
                  <>
                    <Link
                      href="/team"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      <UserPlus className="h-4 w-4" />
                      Team
                    </Link>
                    <Link
                      href="/clinicians"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Stethoscope className="h-4 w-4" />
                      Clinicians
                    </Link>
                    <Link
                      href="/assignments"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Assignments
                    </Link>
                    <Link
                      href="/sensitive-access"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Sensitive Access
                    </Link>
                    <Link
                      href="/audit-log"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      <ScrollText className="h-4 w-4" />
                      Audit Log
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </>
                )}
                {isBillingCapable(role) && (
                  <Link
                    href="/billing"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </nav>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            if (item.visibleTo && !item.visibleTo(role)) return null;

            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function formatRole(role: string): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "compliance_admin":
      return "Compliance admin";
    case "caregiver":
      return "Caregiver";
    case "nurse_reviewer":
      return "Nurse reviewer";
    case "ops_staff":
      return "Operations";
    case "billing_staff":
      return "Billing";
    default:
      return role;
  }
}
