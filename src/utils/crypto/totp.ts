import { generateSecret, generateURI, verifySync } from "otplib";

const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

export type TotpVerificationResult =
  | { valid: false }
  | { valid: true; matchedTimeStep: number };

export function generateTotpSecret(): string {
  return generateSecret({ length: 20 });
}

export function buildTotpUri(params: {
  issuer: string;
  accountName: string;
  secret: string;
}): string {
  return generateURI({
    strategy: "totp",
    issuer: params.issuer,
    label: params.accountName,
    secret: params.secret,
    algorithm: "sha1",
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
  });
}

export function verifyTotpCode(params: {
  secret: string;
  code: string;
  now?: Date;
  adjacentSteps?: number;
}): TotpVerificationResult {
  if (!/^\d{6}$/.test(params.code)) return { valid: false };

  const adjacentSteps = params.adjacentSteps ?? 1;
  const result = verifySync({
    strategy: "totp",
    secret: params.secret,
    token: params.code,
    algorithm: "sha1",
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    epoch: Math.floor((params.now?.getTime() ?? Date.now()) / 1000),
    epochTolerance: adjacentSteps * TOTP_PERIOD_SECONDS,
  });

  if (!result.valid || !("timeStep" in result)) return { valid: false };
  return { valid: true, matchedTimeStep: result.timeStep };
}
