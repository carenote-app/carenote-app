import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoteInputForm } from "../note-input-form";

// Get the mocked supabase client
const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-cg-1" } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  }),
}));

describe("NoteInputForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with all fields", () => {
    render(
      <NoteInputForm residentId="resident-1" organizationId="org-1" />
    );

    expect(screen.getByPlaceholderText(/describe what you observed/i)).toBeInTheDocument();
    expect(screen.getByText("Save Note")).toBeInTheDocument();
  });

  it("shows character counter", () => {
    render(
      <NoteInputForm residentId="resident-1" organizationId="org-1" />
    );

    expect(screen.getByText("0/2000")).toBeInTheDocument();
  });

  it("disables submit button when input is empty", () => {
    render(
      <NoteInputForm residentId="resident-1" organizationId="org-1" />
    );

    const submitBtn = screen.getByText("Save Note");
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit button when text is entered", async () => {
    const user = userEvent.setup();
    render(
      <NoteInputForm residentId="resident-1" organizationId="org-1" />
    );

    const textarea = screen.getByPlaceholderText(/describe what you observed/i);
    await user.type(textarea, "Dorothy had a good day");

    const submitBtn = screen.getByText("Save Note");
    expect(submitBtn).not.toBeDisabled();
  });

  it("updates character counter as user types", async () => {
    const user = userEvent.setup();
    render(
      <NoteInputForm residentId="resident-1" organizationId="org-1" />
    );

    const textarea = screen.getByPlaceholderText(/describe what you observed/i);
    await user.type(textarea, "Hello");

    expect(screen.getByText("5/2000")).toBeInTheDocument();
  });

  it("auto-selects shift based on time of day", () => {
    render(
      <NoteInputForm residentId="resident-1" organizationId="org-1" />
    );

    // The shift selector stores the value in a hidden input
    const hour = new Date().getHours();
    let expectedShift: string;
    if (hour < 12) expectedShift = "morning";
    else if (hour < 18) expectedShift = "afternoon";
    else expectedShift = "night";

    // Check hidden input value set by the Select component
    const hiddenInputs = document.querySelectorAll('input[type="hidden"], input[aria-hidden="true"]');
    const shiftInput = Array.from(hiddenInputs).find(
      (input) => (input as HTMLInputElement).value === expectedShift
    );
    expect(shiftInput).toBeTruthy();
  });
});
