"use strict";

const jwt = require("jsonwebtoken");

const DEFAULT_TOKEN_EXPIRATION = "8h";

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (
        typeof secret !== "string" ||
        secret.trim().length < 32
    ) {
        const error = new Error(
            "JWT_SECRET is not configured correctly."
        );

        error.statusCode = 500;

        throw error;
    }

    return secret;
}

function getTokenExpiration() {
    const expiration =
        process.env.JWT_EXPIRES_IN ||
        DEFAULT_TOKEN_EXPIRATION;

    if (
        typeof expiration !== "string" ||
        expiration.trim().length === 0
    ) {
        return DEFAULT_TOKEN_EXPIRATION;
    }

    return expiration.trim();
}

function generateToken(payload) {
    if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
    ) {
        const error = new Error(
            "Token payload must be a valid object."
        );

        error.statusCode = 500;

        throw error;
    }

    const tokenPayload = {
        userId:
            payload.userId ??
            payload.user_id ??
            null,
        schoolId:
            payload.schoolId ??
            payload.school_id ??
            null,
        roleId:
            payload.roleId ??
            payload.role_id ??
            null,
        roleName:
            payload.roleName ??
            payload.role_name ??
            payload.role ??
            null
    };

    if (!tokenPayload.userId) {
        const error = new Error(
            "User ID is required to generate an authentication token."
        );

        error.statusCode = 500;

        throw error;
    }

    return jwt.sign(
        tokenPayload,
        getJwtSecret(),
        {
            expiresIn: getTokenExpiration()
        }
    );
}

function verifyToken(token) {
    if (
        typeof token !== "string" ||
        token.trim().length === 0
    ) {
        const error = new Error(
            "Authentication token is required."
        );

        error.statusCode = 401;

        throw error;
    }

    return jwt.verify(
        token.trim(),
        getJwtSecret()
    );
}

module.exports = {
    generateToken,
    verifyToken,
    getTokenExpiration
};