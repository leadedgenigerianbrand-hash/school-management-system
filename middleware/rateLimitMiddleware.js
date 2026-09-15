"use strict";

/*
|--------------------------------------------------------------------------
| RATE LIMIT MIDDLEWARE
|--------------------------------------------------------------------------
|
| Centralized request rate limiting for the School Management System.
|
| This middleware provides:
|
| - General API rate limiting
| - Stricter authentication rate limiting
| - Automatic cleanup of expired request records
| - Configurable limits through environment variables
| - HTTP 429 responses when a limit is exceeded
| - Standard rate-limit response headers
|
| No external npm package is required.
|
|--------------------------------------------------------------------------
*/

const requestStore = new Map();

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 300;

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_REQUESTS = 10;

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const WINDOW_MS = parsePositiveInteger(
    process.env.RATE_LIMIT_WINDOW_MS,
    DEFAULT_WINDOW_MS
);

const MAX_REQUESTS = parsePositiveInteger(
    process.env.RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_MAX_REQUESTS
);

const AUTH_RATE_LIMIT_WINDOW_MS = parsePositiveInteger(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS,
    AUTH_WINDOW_MS
);

const AUTH_RATE_LIMIT_MAX_REQUESTS = parsePositiveInteger(
    process.env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    AUTH_MAX_REQUESTS
);

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function parsePositiveInteger(value, fallback) {
    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        return fallback;
    }

    return parsedValue;
}

function getClientIp(req) {
    if (!req) {
        return "unknown";
    }

    const forwardedFor = req.headers && req.headers["x-forwarded-for"];

    if (typeof forwardedFor === "string" && forwardedFor.trim() !== "") {
        return forwardedFor.split(",")[0].trim();
    }

    if (req.ip && typeof req.ip === "string") {
        return req.ip;
    }

    if (req.socket && req.socket.remoteAddress) {
        return req.socket.remoteAddress;
    }

    return "unknown";
}

function getRateLimitKey(req, prefix) {
    const clientIp = getClientIp(req);

    return `${prefix}:${clientIp}`;
}

function setRateLimitHeaders(res, limit, remaining, resetTime) {
    const safeRemaining = Math.max(0, remaining);
    const resetSeconds = Math.ceil(
        Math.max(0, resetTime - Date.now()) / 1000
    );

    res.setHeader("RateLimit-Limit", String(limit));
    res.setHeader("RateLimit-Remaining", String(safeRemaining));
    res.setHeader("RateLimit-Reset", String(resetSeconds));
}

function createRateLimiter(options = {}) {
    const windowMs = parsePositiveInteger(
        options.windowMs,
        WINDOW_MS
    );

    const maxRequests = parsePositiveInteger(
        options.maxRequests,
        MAX_REQUESTS
    );

    const keyPrefix =
        typeof options.keyPrefix === "string" && options.keyPrefix.trim() !== ""
            ? options.keyPrefix.trim()
            : "api";

    return function rateLimiter(req, res, next) {
        const key = getRateLimitKey(req, keyPrefix);
        const now = Date.now();

        let record = requestStore.get(key);

        if (!record || now >= record.resetTime) {
            record = {
                count: 0,
                resetTime: now + windowMs
            };

            requestStore.set(key, record);
        }

        record.count += 1;

        const remaining = maxRequests - record.count;

        setRateLimitHeaders(
            res,
            maxRequests,
            remaining,
            record.resetTime
        );

        if (record.count > maxRequests) {
            const retryAfterSeconds = Math.ceil(
                Math.max(0, record.resetTime - now) / 1000
            );

            res.setHeader(
                "Retry-After",
                String(Math.max(1, retryAfterSeconds))
            );

            return res.status(429).json({
                success: false,
                message: "Too many requests. Please try again later.",
                error: "RATE_LIMIT_EXCEEDED",
                retryAfter: Math.max(1, retryAfterSeconds)
            });
        }

        return next();
    };
}

/*
|--------------------------------------------------------------------------
| GENERAL API RATE LIMITER
|--------------------------------------------------------------------------
|
| Use this middleware for general API protection.
|
*/

const rateLimitMiddleware = createRateLimiter({
    windowMs: WINDOW_MS,
    maxRequests: MAX_REQUESTS,
    keyPrefix: "api"
});

/*
|--------------------------------------------------------------------------
| AUTHENTICATION RATE LIMITER
|--------------------------------------------------------------------------
|
| Authentication endpoints receive a stricter limit because login and
| authentication requests are common targets for automated abuse.
|
*/

const authRateLimitMiddleware = createRateLimiter({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    maxRequests: AUTH_RATE_LIMIT_MAX_REQUESTS,
    keyPrefix: "auth"
});

/*
|--------------------------------------------------------------------------
| CLEANUP
|--------------------------------------------------------------------------
|
| Remove expired entries so the in-memory store does not grow indefinitely.
|
*/

function cleanupExpiredRecords() {
    const now = Date.now();

    for (const [key, record] of requestStore.entries()) {
        if (!record || now >= record.resetTime) {
            requestStore.delete(key);
        }
    }
}

const cleanupTimer = setInterval(
    cleanupExpiredRecords,
    CLEANUP_INTERVAL_MS
);

if (cleanupTimer && typeof cleanupTimer.unref === "function") {
    cleanupTimer.unref();
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = rateLimitMiddleware;

module.exports.rateLimitMiddleware = rateLimitMiddleware;
module.exports.authRateLimitMiddleware = authRateLimitMiddleware;
module.exports.createRateLimiter = createRateLimiter;
module.exports.cleanupExpiredRecords = cleanupExpiredRecords;