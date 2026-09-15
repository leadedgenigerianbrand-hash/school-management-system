"use strict";

const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

function validatePassword(password) {
    if (
        typeof password !== "string" ||
        password.length === 0
    ) {
        const error = new Error(
            "Password is required."
        );

        error.statusCode = 400;

        throw error;
    }
}

async function hashPassword(password) {
    validatePassword(password);

    return bcrypt.hash(
        password,
        SALT_ROUNDS
    );
}

async function comparePassword(
    password,
    passwordHash
) {
    validatePassword(password);

    if (
        typeof passwordHash !== "string" ||
        passwordHash.length === 0
    ) {
        return false;
    }

    return bcrypt.compare(
        password,
        passwordHash
    );
}

module.exports = {
    hashPassword,
    comparePassword
};