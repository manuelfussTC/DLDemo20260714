import type { NextFunction, Request, Response } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const attemptsByIp = new Map<string, RateLimitEntry>();
const windowMs = 60_000;
const maxAttempts = 12;

export function extractRateLimit(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const now = Date.now();
  const key = request.ip || request.socket.remoteAddress || "unknown";
  const current = attemptsByIp.get(key);

  if (!current || current.resetAt <= now) {
    attemptsByIp.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (current.count >= maxAttempts) {
    response.status(429).json({
      error: "Zu viele Extraktionen. Bitte versuche es in einer Minute erneut.",
    });
    return;
  }

  current.count += 1;
  next();
}
