import { createHash } from "node:crypto";

export type ReportContent = {
  title: string;
  behavior?: string | null | undefined;
  difficulty?: string | null | undefined;
  recommendation?: string | null | undefined;
};

export function normalizeReportContent(content: ReportContent) {
  return {
    title: content.title,
    behavior: content.behavior ?? null,
    difficulty: content.difficulty ?? null,
    recommendation: content.recommendation ?? null,
  };
}

export function calculateReportContentHash(content: ReportContent): string {
  const canonicalJson = JSON.stringify(normalizeReportContent(content));
  return createHash("sha256").update(canonicalJson, "utf8").digest("hex");
}

export default calculateReportContentHash;
