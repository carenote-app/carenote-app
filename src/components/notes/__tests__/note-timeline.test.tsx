import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NoteTimeline } from "../note-timeline";
import { mockNote, mockIncidentNote } from "@/test/fixtures";

const makeNoteWithRelations = (note: typeof mockNote) => ({
  ...note,
  residents: { first_name: "Dorothy", last_name: "Chen" },
  users: { full_name: "James Wilson" },
});

describe("NoteTimeline", () => {
  it("renders a list of notes", () => {
    const notes = [makeNoteWithRelations(mockNote)];
    render(<NoteTimeline notes={notes} />);

    expect(screen.getByText("Dorothy Chen")).toBeInTheDocument();
    expect(screen.getByText("James Wilson", { exact: false })).toBeInTheDocument();
  });

  it("displays structured output when available", () => {
    const notes = [makeNoteWithRelations(mockNote)];
    render(<NoteTimeline notes={notes} />);

    expect(
      screen.getByText(
        "Dorothy had a positive day with good appetite and outdoor activity."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Mood & Behavior")).toBeInTheDocument();
  });

  it("displays raw input when note is not structured", () => {
    const unstructuredNote = makeNoteWithRelations({
      ...mockNote,
      is_structured: false,
      structured_output: null,
    });
    render(<NoteTimeline notes={[unstructuredNote]} />);

    expect(
      screen.getByText(mockNote.raw_input)
    ).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows incident flag for flagged notes", () => {
    const notes = [makeNoteWithRelations(mockIncidentNote)];
    render(<NoteTimeline notes={notes} />);

    // The card should have the destructive border class
    const card = screen.getByText("Dorothy Chen").closest("[class*='border-destructive']");
    expect(card).toBeInTheDocument();
  });

  it("displays shift badge", () => {
    const notes = [makeNoteWithRelations(mockNote)];
    render(<NoteTimeline notes={notes} />);

    expect(screen.getByText("morning")).toBeInTheDocument();
  });

  it("renders flags from structured output", () => {
    const notes = [makeNoteWithRelations(mockIncidentNote)];
    render(<NoteTimeline notes={notes} />);

    // Flag type is shown as a label with underscores replaced by spaces; the
    // free-form reason wraps as body text underneath.
    expect(screen.getByText("fall risk")).toBeInTheDocument();
    expect(
      screen.getByText("Near-fall event getting out of bed")
    ).toBeInTheDocument();
  });

  it("renders empty state gracefully with no notes", () => {
    const { container } = render(<NoteTimeline notes={[]} />);
    // Should render an empty div with no cards
    expect(container.querySelector("[class*='space-y']")?.children.length).toBe(0);
  });

  it("shows edited output over structured output when edited", () => {
    const editedNote = makeNoteWithRelations({
      ...mockNote,
      is_edited: true,
      edited_output: JSON.stringify({
        summary: "Edited summary for Dorothy.",
        sections: {},
        follow_up: "None noted.",
        flags: [],
      }),
    });
    render(<NoteTimeline notes={[editedNote]} />);

    expect(
      screen.getByText("Edited summary for Dorothy.")
    ).toBeInTheDocument();
  });
});
