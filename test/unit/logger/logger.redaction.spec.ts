import { PassThrough } from "node:stream";
import { describe, expect, it } from "@jest/globals";
import pino from "pino";
import { loggerOptions } from "../../../src/core/logger/logger.js";

describe("security log redaction", () => {
  it("removes MFA and password material from captured logs", () => {
    const output = new PassThrough();
    let captured = "";
    output.on("data", (chunk: Buffer) => {
      captured += chunk.toString("utf8");
    });
    const testLogger = pino(loggerOptions, output);

    testLogger.info({
      req: {
        body: {
          currentPassword: "password-that-must-not-leak",
          code: "123456",
          recoveryCodes: ["AAAAA-BBBBB-CCCCC-DDDDD"],
          manualSecret: "MANUALBASE32SECRET",
          otpauthUri: "otpauth://totp/MINDWAY:user",
        },
      },
    });

    expect(captured).not.toContain("password-that-must-not-leak");
    expect(captured).not.toContain("123456");
    expect(captured).not.toContain("AAAAA-BBBBB-CCCCC-DDDDD");
    expect(captured).not.toContain("MANUALBASE32SECRET");
    expect(captured).not.toContain("otpauth://");
  });
});
