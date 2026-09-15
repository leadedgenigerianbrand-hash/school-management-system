"use strict";

const jwt = require("jsonwebtoken");

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured in .env");
    }

    return secret;
}

function authMiddleware(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            const error = new Error("Authentication required.");
            error.statusCode = 401;
            return next(error);
        }

        if (!authorization.startsWith("Bearer ")) {
            const error = new Error("Invalid authentication header.");
            error.statusCode = 401;
            return next(error);
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            const error = new Error("Authentication token is required.");
            error.statusCode = 401;
            return next(error);
        }

        const decoded = jwt.verify(
            token,
            getJwtSecret()
        );

        if (!decoded || typeof decoded !== "object") {
            const error = new Error("Invalid authentication token.");
            error.statusCode = 401;
            return next(error);
        }

        req.user = decoded;

        return next();
    } catch (error) {
        console.error(
            "Authentication error:",
            error.message
        );

        return next(error);
    }
}

module.exports = authMiddleware;