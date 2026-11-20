import pino, { type LoggerOptions } from "pino";
import { pinoHttp } from "pino-http";
import type { Request, Response } from "express";
import { env } from "../config/env.js";

export const loggerOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.x-mfa-proof",
      "req.body.password",
      "req.body.currentPassword",
      "req.body.newPassword",
      "req.body.code",
      "req.body.recoveryCode",
      "req.body.recoveryCodes",
      "req.body.secret",
      "req.body.manualSecret",
      "req.body.otpauthUri",
      "req.body.refreshToken",
      "res.headers['set-cookie']",
    ],
    remove: true,
  },
};

export const logger = pino(loggerOptions);

export const httpLogger = pinoHttp<Request, Response>({
  logger,

  autoLogging: {
    ignore: (req) => req.url === "/health",
  },

  customProps: (req) => ({
    requestId: (req as any).id,
  }),

  // ✅ make it stop dumping all headers
  serializers: {
    req(req) {
      return {
        id: (req as any).id,
        method: req.method,
        url: req.url,
        ip: req.remoteAddress,
        // include user agent only if you want it
        // ua: req.headers["user-agent"],
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },

  // ✅ nicer one-line message
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} -> ${res.statusCode}`,

  // ✅ sensible log levels
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});
