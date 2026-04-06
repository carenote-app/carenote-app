import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResidentCard } from "../resident-card";
import { mockResident } from "@/test/fixtures";

describe("ResidentCard", () => {
  it("renders resident name", () => {
    render(<ResidentCard resident={mockResident} />);

    expect(screen.getByText("Dorothy Chen")).toBeInTheDocument();
  });

  it("shows room number", () => {
    render(<ResidentCard resident={mockResident} />);

    expect(screen.getByText("Room 3A")).toBeInTheDocument();
  });

  it("shows conditions", () => {
    render(<ResidentCard resident={mockResident} />);

    expect(screen.getByText("dementia, diabetes")).toBeInTheDocument();
  });

  it("shows status badge", () => {
    render(<ResidentCard resident={mockResident} />);

    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("links to resident detail page", () => {
    render(<ResidentCard resident={mockResident} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/residents/resident-1");
  });

  it("handles missing optional fields", () => {
    const minimalResident = {
      ...mockResident,
      room_number: null,
      conditions: null,
    };
    render(<ResidentCard resident={minimalResident} />);

    expect(screen.getByText("Dorothy Chen")).toBeInTheDocument();
    expect(screen.queryByText(/Room/)).not.toBeInTheDocument();
  });

  it("shows discharged status", () => {
    const dischargedResident = { ...mockResident, status: "discharged" as const };
    render(<ResidentCard resident={dischargedResident} />);

    expect(screen.getByText("discharged")).toBeInTheDocument();
  });
});
