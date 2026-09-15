"use strict";

/*
|--------------------------------------------------------------------------
| AUTHENTICATION VALIDATORS
|--------------------------------------------------------------------------
|
| Centralized validation middleware for authentication-related requests.
|
| Responsibilities:
|
| - Validate login requests
| - Validate registration requests
| - Validate password-change requests
| - Validate password-reset requests
| - Normalize email addresses
| - Reject malformed request bodies
| - Return consistent validation errors
|
| This file does NOT:
|
| - Authenticate users
| - Query the database
| - Generate JWT tokens
| - Hash passwords
| - Check user roles
| - Check permissions
|
| Those responsibilities remain in the appropriate controllers,
| services, models, and authentication middleware.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const MAX_EMAIL_LENGTH = 254;
const MAX_USERNAME_LENGTH = 100;

const MAX_NAME_LENGTH = 100;

/*
|--------------------------------------------------------------------------
| BASIC HELPERS
|--------------------------------------------------------------------------
*/

function isPlainObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function isNonEmptyString(value) {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}

function normalizeString(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function normalizeEmail(value) {
    return normalizeString(value).toLowerCase();
}

function isValidEmail(email) {
    if (!isNonEmptyString(email)) {
        return false;
    }

    if (email.length > MAX_EMAIL_LENGTH) {
        return false;
    }

    const emailPattern =
        /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

    return emailPattern.test(email);
}

function isValidPassword(password) {
    return (
        typeof password === "string" &&
        password.length >= MIN_PASSWORD_LENGTH &&
        password.length <= MAX_PASSWORD_LENGTH
    );
}

function isValidName(value) {
    return (
        isNonEmptyString(value) &&
        value.trim().length <= MAX_NAME_LENGTH
    );
}

function isValidUsername(value) {
    if (!isNonEmptyString(value)) {
        return false;
    }

    const username = value.trim();

    if (username.length > MAX_USERNAME_LENGTH) {
        return false;
    }

    return /^[A-Za-z0-9._@-]+$/.test(username);
}

function getRequestBody(req) {
    if (!req || !isPlainObject(req.body)) {
        return null;
    }

    return req.body;
}

function sendValidationError(res, errors) {
    return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors
    });
}

/*
|--------------------------------------------------------------------------
| LOGIN VALIDATOR
|--------------------------------------------------------------------------
|
| Accepts either:
|
| - email + password
| - username + password
|
| The controller remains responsible for deciding how the credentials
| are authenticated.
|
*/

function validateLogin(req, res, next) {
    const body = getRequestBody(req);

    if (!body) {
        return sendValidationError(res, {
            body: "Request body must be a valid JSON object."
        });
    }

    const password = body.password;
    const email = normalizeEmail(body.email);
    const username = normalizeString(body.username);

    const errors = {};

    if (!isNonEmptyString(password)) {
        errors.password = "Password is required.";
    } else if (!isValidPassword(password)) {
        errors.password = `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`;
    }

    const hasEmail = email !== "";
    const hasUsername = username !== "";

    if (!hasEmail && !hasUsername) {
        errors.identifier = "Email or username is required.";
    }

    if (hasEmail && !isValidEmail(email)) {
        errors.email = "A valid email address is required.";
    }

    if (hasUsername && !isValidUsername(username)) {
        errors.username = "Username contains invalid characters.";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    if (hasEmail) {
        req.body.email = email;
    }

    if (hasUsername) {
        req.body.username = username;
    }

    return next();
}

/*
|--------------------------------------------------------------------------
| REGISTRATION VALIDATOR
|--------------------------------------------------------------------------
|
| This validator supports the standard account fields without assuming
| that registration is currently enabled in the application.
|
*/

function validateRegistration(req, res, next) {
    const body = getRequestBody(req);

    if (!body) {
        return sendValidationError(res, {
            body: "Request body must be a valid JSON object."
        });
    }

    const errors = {};

    const firstName = normalizeString(body.firstName);
    const lastName = normalizeString(body.lastName);
    const email = normalizeEmail(body.email);
    const username = normalizeString(body.username);
    const password = body.password;
    const confirmPassword = body.confirmPassword;

    if (!isValidName(firstName)) {
        errors.firstName = "First name is required and must not exceed 100 characters.";
    }

    if (!isValidName(lastName)) {
        errors.lastName = "Last name is required and must not exceed 100 characters.";
    }

    if (!isValidEmail(email)) {
        errors.email = "A valid email address is required.";
    }

    if (username !== "" && !isValidUsername(username)) {
        errors.username = "Username contains invalid characters.";
    }

    if (!isValidPassword(password)) {
        errors.password = `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`;
    }

    if (confirmPassword !== undefined && confirmPassword !== password) {
        errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    req.body.firstName = firstName;
    req.body.lastName = lastName;
    req.body.email = email;

    if (username !== "") {
        req.body.username = username;
    }

    return next();
}

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD VALIDATOR
|--------------------------------------------------------------------------
*/

function validateChangePassword(req, res, next) {
    const body = getRequestBody(req);

    if (!body) {
        return sendValidationError(res, {
            body: "Request body must be a valid JSON object."
        });
    }

    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;

    const errors = {};

    if (!isNonEmptyString(currentPassword)) {
        errors.currentPassword = "Current password is required.";
    }

    if (!isValidPassword(newPassword)) {
        errors.newPassword = `New password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`;
    }

    if (
        isNonEmptyString(currentPassword) &&
        isNonEmptyString(newPassword) &&
        currentPassword === newPassword
    ) {
        errors.newPassword = "New password must be different from the current password.";
    }

    if (
        confirmPassword !== undefined &&
        confirmPassword !== newPassword
    ) {
        errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    return next();
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD VALIDATOR
|--------------------------------------------------------------------------
|
| Used when an authentication flow accepts a reset token and a new
| password. Token verification itself belongs to the controller/service.
|
*/

function validateResetPassword(req, res, next) {
    const body = getRequestBody(req);

    if (!body) {
        return sendValidationError(res, {
            body: "Request body must be a valid JSON object."
        });
    }

    const token = normalizeString(body.token);
    const newPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;

    const errors = {};

    if (token === "") {
        errors.token = "Password reset token is required.";
    }

    if (!isValidPassword(newPassword)) {
        errors.newPassword = `New password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`;
    }

    if (
        confirmPassword !== undefined &&
        confirmPassword !== newPassword
    ) {
        errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    req.body.token = token;

    return next();
}

/*
|--------------------------------------------------------------------------
| EMAIL VALIDATOR
|--------------------------------------------------------------------------
|
| Useful for authentication endpoints that only require an email address,
| such as password-reset requests.
|
*/

function validateEmail(req, res, next) {
    const body = getRequestBody(req);

    if (!body) {
        return sendValidationError(res, {
            body: "Request body must be a valid JSON object."
        });
    }

    const email = normalizeEmail(body.email);

    if (!isValidEmail(email)) {
        return sendValidationError(res, {
            email: "A valid email address is required."
        });
    }

    req.body.email = email;

    return next();
}

/*
|--------------------------------------------------------------------------
| VALIDATION RULE HELPERS
|--------------------------------------------------------------------------
*/

function validatePasswordValue(password) {
    return isValidPassword(password);
}

function validateEmailValue(email) {
    return isValidEmail(normalizeEmail(email));
}

function validateUsernameValue(username) {
    return isValidUsername(username);
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    validateLogin,
    validateRegistration,
    validateChangePassword,
    validateResetPassword,
    validateEmail,
    validatePasswordValue,
    validateEmailValue,
    validateUsernameValue,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
    MAX_EMAIL_LENGTH,
    MAX_USERNAME_LENGTH,
    MAX_NAME_LENGTH
};