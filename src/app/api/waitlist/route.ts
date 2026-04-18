import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
  marketingOptIn: z.boolean().default(false),
  source: z.string().default("landing"),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { email, marketingOptIn, source } = parsed.data;
  const supabase = createAdminClient();

  // @ts-expect-error — waitlist_signups not in generated types until migration runs + gen types
  const { error } = await supabase.from("waitlist_signups").insert({
    email,
    marketing_opt_in: marketingOptIn,
    source,
  });

  if (error) {
    if (error.code === "23505") {
      // Unique violation — already on waitlist
      return NextResponse.json({ message: "You're already on the waitlist!" });
    }
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "You're on the waitlist!" });
}
