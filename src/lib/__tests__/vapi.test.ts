import { describe, it, expect } from "vitest";
import { buildAssistantOverrides } from "@/lib/vapi";

describe("vapi", () => {
  describe("buildAssistantOverrides", () => {
    it("builds overrides with all fields", () => {
      const result = buildAssistantOverrides({
        caregiverName: "Maria Santos",
        residentFirstName: "Eleanor",
        residentLastName: "Hughes",
        conditions: "Mild dementia, hypertension",
        careNotesContext: "Prefers morning walks",
      });

      expect(result.variableValues).toEqual({
        caregiver_name: "Maria Santos",
        resident_first_name: "Eleanor",
        resident_last_name: "Hughes",
        conditions: "Mild dementia, hypertension",
        care_context: "Prefers morning walks",
      });
    });

    it("defaults null conditions and context", () => {
      const result = buildAssistantOverrides({
        caregiverName: "John",
        residentFirstName: "Jane",
        residentLastName: "Doe",
        conditions: null,
        careNotesContext: null,
      });

      expect(result.variableValues.conditions).toBe("none on file");
      expect(result.variableValues.care_context).toBe("none on file");
    });
  });
});
