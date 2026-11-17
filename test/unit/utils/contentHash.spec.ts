import { describe, expect, it } from "@jest/globals";
import { calculateReportContentHash, normalizeReportContent } from "../../../src/utils/crypto/contentHash.js";

const content = {
  title: "Progress report",
  behavior: "Observed behavior",
  difficulty: "Observed difficulty",
  recommendation: "Recommended action",
};

describe("report content hash", () => {
  it("is stable for identical normalized content and property order", () => {
    const reordered = {
      recommendation: content.recommendation,
      title: content.title,
      difficulty: content.difficulty,
      behavior: content.behavior,
    };
    expect(calculateReportContentHash(content)).toBe(calculateReportContentHash(reordered));
  });

  it.each(["title", "behavior", "difficulty", "recommendation"] as const)(
    "changes when %s changes",
    (field) => {
      expect(calculateReportContentHash({ ...content, [field]: `${content[field]} changed` })).not.toBe(
        calculateReportContentHash(content),
      );
    },
  );

  it("normalizes missing, undefined, and null optional values identically", () => {
    const missing = { title: "Only title" };
    const undefinedValues = {
      title: "Only title",
      behavior: undefined,
      difficulty: undefined,
      recommendation: undefined,
    };
    const nullValues = { title: "Only title", behavior: null, difficulty: null, recommendation: null };

    expect(normalizeReportContent(missing)).toEqual(nullValues);
    expect(calculateReportContentHash(missing)).toBe(calculateReportContentHash(undefinedValues));
    expect(calculateReportContentHash(undefinedValues)).toBe(calculateReportContentHash(nullValues));
  });
});
