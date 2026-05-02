import { describe, it, expect } from "vitest";
import { buildAssistantOverrides } from "@/lib/vapi";

describe("vapi", () => {
  describe("buildAssistantOverrides", () => {
    it("builds overrides with all multilingual + grounding fields", () => {
      const result = buildAssistantOverrides({
        caregiverName: "Maria Santos",
        caregiverLanguage: "en",
        residentFirstName: "Eleanor",
        residentLastName: "Hughes",
        residentLanguage: "en",
        outputLanguage: "en",
        honorificPreference: "Mrs.",
        culturalRegister: "direct",
        conditions: "Mild dementia, hypertension",
        careNotesContext: "Prefers morning walks",
        recentNotesSummary: "5/1: ate full meal. 4/30: walked 15 min.",
        recentIncidents: "",
      });

      expect(result.variableValues).toEqual({
        caregiver_name: "Maria Santos",
        caregiver_language: "en",
        resident_first_name: "Eleanor",
        resident_last_name: "Hughes",
        resident_language: "en",
        output_language: "en",
        honorific_preference: "Mrs.",
        cultural_register: "direct",
        conditions: "Mild dementia, hypertension",
        care_context: "Prefers morning walks",
        recent_notes_summary: "5/1: ate full meal. 4/30: walked 15 min.",
        recent_incidents: "no recent incidents",
      });
    });

    it("defaults null conditions, context, and empty grounding", () => {
      const result = buildAssistantOverrides({
        caregiverName: "Mai",
        caregiverLanguage: "vi",
        residentFirstName: "Hương",
        residentLastName: "Nguyễn",
        residentLanguage: "vi",
        outputLanguage: "zh-TW",
        honorificPreference: "Bác",
        culturalRegister: "indirect",
        conditions: null,
        careNotesContext: null,
        recentNotesSummary: "",
        recentIncidents: "",
      });

      expect(result.variableValues.conditions).toBe("none on file");
      expect(result.variableValues.care_context).toBe("none on file");
      expect(result.variableValues.recent_notes_summary).toBe("no recent notes");
      expect(result.variableValues.recent_incidents).toBe("no recent incidents");
      expect(result.variableValues.cultural_register).toBe("indirect");
      expect(result.transcriber).toBeUndefined();
    });

    it("attaches per-call keyterms when provided", () => {
      const result = buildAssistantOverrides({
        caregiverName: "Mai",
        caregiverLanguage: "vi",
        residentFirstName: "雅婷",
        residentLastName: "陳",
        residentLanguage: "zh-TW",
        outputLanguage: "zh-TW",
        honorificPreference: "阿嬤",
        culturalRegister: "indirect",
        conditions: "type 2 diabetes",
        careNotesContext: null,
        recentNotesSummary: "",
        recentIncidents: "",
        keyterms: ["雅婷", "metformin", "  ", ""],
      });

      expect(result.transcriber?.keyterms).toEqual(["雅婷", "metformin"]);
    });
  });
});
