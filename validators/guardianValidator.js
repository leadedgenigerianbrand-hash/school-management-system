"use strict";

/*
|--------------------------------------------------------------------------
| GUARDIAN VALIDATORS
|--------------------------------------------------------------------------
|
| Centralized validation middleware for guardian-related requests.
|
| Responsibilities:
|
| - Validate guardian creation requests
| - Validate guardian update requests
| - Validate guardian identifiers
| - Validate names
| - Validate contact information
| - Validate relationship information
| - Validate address information
| - Validate optional database reference IDs
| - Normalize appropriate input values
|
| This file does NOT:
|
| - Query the database
| - Create guardian records
| - Update guardian records
| - Delete guardian records
| - Check whether referenced records exist
| - Authenticate users
| - Check user roles
| - Check permissions
|
| Those responsibilities remain in the appropriate models,
| controllers, routes, and authentication/authorization middleware.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_ADDRESS_LENGTH = 500;
const MAX_RELATIONSHIP_LENGTH = 100;
const MAX_OCCUPATION_LENGTH = 150;
const MAX_STATUS_LENGTH = 30;

const MAX_IDENTIFIER = 2147483647;

/*
|--------------------------------------------------------------------------
| ALLOWED STATUS VALUES
|--------------------------------------------------------------------------
|
| Guardian relationship descriptions and occupations are deliberately
| NOT restricted to a fixed list because different schools may use
| different descriptions.
|
|--------------------------------------------------------------------------
*/

const ALLOWED_STATUSES = new Set([
    "active",
    "inactive"
]);

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

function isValidName(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    return value.trim().length <= MAX_NAME_LENGTH;
}

function isValidPhone(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    const phone = value.trim();

    if (phone.length > MAX_PHONE_LENGTH) {
        return false;
    }

    return /^[0-9+()\-.\s]+$/.test(phone);
}

function isValidAddress(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    return value.trim().length <= MAX_ADDRESS_LENGTH;
}

function isValidRelationship(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    return value.trim().length <= MAX_RELATIONSHIP_LENGTH;
}

function isValidOccupation(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    return value.trim().length <= MAX_OCCUPATION_LENGTH;
}

function isValidIntegerId(value, required = false) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return !required;
    }

    const numericValue =
        typeof value === "number"
            ? value
            : Number(value);

    return (
        Number.isInteger(numericValue) &&
        numericValue > 0 &&
        numericValue <= MAX_IDENTIFIER
    );
}

function isValidStatus(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    const status = value
        .trim()
        .toLowerCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");

    return (
        status.length <= MAX_STATUS_LENGTH &&
        ALLOWED_STATUSES.has(status)
    );
}

function normalizeStatus(value) {
    return normalizeString(value)
        .toLowerCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");
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

function normalizeOptionalString(body, fieldName) {
    if (
        Object.prototype.hasOwnProperty.call(body, fieldName) &&
        typeof body[fieldName] === "string"
    ) {
        body[fieldName] = body[fieldName].trim();
    }
}

function normalizeOptionalEmail(body, fieldName) {
    if (
        Object.prototype.hasOwnProperty.call(body, fieldName) &&
        typeof body[fieldName] === "string"
    ) {
        body[fieldName] = normalizeEmail(body[fieldName]);
    }
}

function normalizeOptionalInteger(body, fieldName) {
    if (
        Object.prototype.hasOwnProperty.call(body, fieldName) &&
        body[fieldName] !== "" &&
        body[fieldName] !== null &&
        body[fieldName] !== undefined
    ) {
        const numericValue = Number(body[fieldName]);

        if (Number.isInteger(numericValue)) {
            body[fieldName] = numericValue;
        }
    }
}

/*
|--------------------------------------------------------------------------
| GUARDIAN CREATE VALIDATOR
|--------------------------------------------------------------------------
*/

function validateCreateGuardian(req, res, next) {
    const body = getRequestBody(req);

    if (!body) {
        return sendValidationError(res, {
            body: "Request body must be a valid JSON object."
        });
    }

    const errors = {};

    const firstName = normalizeString(body.firstName);
    const middleName = normalizeString(body.middleName);
    const lastName = normalizeString(body.lastName);
    const relationship = normalizeString(body.relationship);
    const phone = normalizeString(body.phone);
    const email = normalizeEmail(body.email);
    const address = normalizeString(body.address);
    const occupation = normalizeString(body.occupation);
    const status = normalizeStatus(body.status);

    if (!isValidName(firstName, true)) {
        errors.firstName =
            "First name is required and must not exceed 100 characters.";
    }

    if (!isValidName(middleName, false)) {
        errors.middleName =
            "Middle name must not exceed 100 characters.";
    }

    if (!isValidName(lastName, true)) {
        errors.lastName =
            "Last name is required and must not exceed 100 characters.";
    }

    if (!isValidRelationship(relationship, true)) {
        errors.relationship =
            "Relationship is required and must not exceed 100 characters.";
    }

    if (!isValidPhone(phone, true)) {
        errors.phone =
            "A valid phone number is required.";
    }

    if (email !== "" && !isValidEmail(email)) {
        errors.email =
            "Email address is invalid.";
    }

    if (!isValidAddress(address, false)) {
        errors.address =
            "Address must not exceed 500 characters.";
    }

    if (!isValidOccupation(occupation, false)) {
        errors.occupation =
            "Occupation must not exceed 150 characters.";
    }

    if (status !== "" && !isValidStatus(status, false)) {
        errors.status =
            "Guardian status is invalid.";
    }

    if (
        body.schoolId !== undefined &&
        body.schoolId !== null &&
        body.schoolId !== "" &&
        !isValidIntegerId(body.schoolId, false)
    ) {
        errors.schoolId =
            "School ID must be a valid positive integer.";
    }

    if (
        body.studentId !== undefined &&
        body.studentId !== null &&
        body.studentId !== "" &&
        !isValidIntegerId(body.studentId, false)
    ) {
        errors.studentId =
            "Student ID must be a valid positive integer.";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    body.firstName = firstName;
    body.lastName = lastName;
    body.relationship = relationship;
    body.phone = phone;

    if (middleName !== "") {
        body.middleName = middleName;
    }

    if (email !== "") {
        body.email = email;
    }

    if (address !== "") {
        body.address = address;
    }

    if (occupation !== "") {
        body.occupation = occupation;
    }

    if (status !== "") {
        body.status = status;
    }

    normalizeOptionalInteger(body, "schoolId");
    normalizeOptionalInteger(body, "studentId");

    return next();
}

/*
|--------------------------------------------------------------------------
| GUARDIAN UPDATE VALIDATOR
|--------------------------------------------------------------------------
|
| Only fields supplied by the request are validated.
| This allows partial guardian updates.
|
|--------------------------------------------------------------------------
*/

function validateUpdateGuardian(req, res, next) {
    const body = getRequestBody(req);

    if (!body) {
        return sendValidationError(res, {
            body: "Request body must be a valid JSON object."
        });
    }

    const errors = {};

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "firstName"
        )
    ) {
        const firstName = normalizeString(body.firstName);

        if (!isValidName(firstName, true)) {
            errors.firstName =
                "First name is required and must not exceed 100 characters.";
        } else {
            body.firstName = firstName;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "middleName"
        )
    ) {
        const middleName = normalizeString(body.middleName);

        if (!isValidName(middleName, false)) {
            errors.middleName =
                "Middle name must not exceed 100 characters.";
        } else {
            body.middleName = middleName;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "lastName"
        )
    ) {
        const lastName = normalizeString(body.lastName);

        if (!isValidName(lastName, true)) {
            errors.lastName =
                "Last name is required and must not exceed 100 characters.";
        } else {
            body.lastName = lastName;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "relationship"
        )
    ) {
        const relationship = normalizeString(
            body.relationship
        );

        if (!isValidRelationship(relationship, true)) {
            errors.relationship =
                "Relationship is required and must not exceed 100 characters.";
        } else {
            body.relationship = relationship;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "phone"
        )
    ) {
        const phone = normalizeString(body.phone);

        if (!isValidPhone(phone, true)) {
            errors.phone =
                "A valid phone number is required.";
        } else {
            body.phone = phone;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "email"
        )
    ) {
        const email = normalizeEmail(body.email);

        if (email !== "" && !isValidEmail(email)) {
            errors.email =
                "Email address is invalid.";
        } else {
            body.email = email;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "address"
        )
    ) {
        const address = normalizeString(body.address);

        if (!isValidAddress(address, false)) {
            errors.address =
                "Address must not exceed 500 characters.";
        } else {
            body.address = address;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "occupation"
        )
    ) {
        const occupation = normalizeString(
            body.occupation
        );

        if (!isValidOccupation(occupation, false)) {
            errors.occupation =
                "Occupation must not exceed 150 characters.";
        } else {
            body.occupation = occupation;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "status"
        )
    ) {
        const status = normalizeStatus(body.status);

        if (!isValidStatus(status, false)) {
            errors.status =
                "Guardian status is invalid.";
        } else {
            body.status = status;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "schoolId"
        ) &&
        !isValidIntegerId(body.schoolId, false)
    ) {
        errors.schoolId =
            "School ID must be a valid positive integer.";
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "studentId"
        ) &&
        !isValidIntegerId(body.studentId, false)
    ) {
        errors.studentId =
            "Student ID must be a valid positive integer.";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    normalizeOptionalInteger(body, "schoolId");
    normalizeOptionalInteger(body, "studentId");

    return next();
}

/*
|--------------------------------------------------------------------------
| GUARDIAN ID VALIDATOR
|--------------------------------------------------------------------------
|
| Validates route parameters such as:
|
| GET    /api/guardians/:id
| PUT    /api/guardians/:id
| DELETE /api/guardians/:id
|
|--------------------------------------------------------------------------
*/

function validateGuardianId(req, res, next) {
    const rawId = req && req.params
        ? req.params.id
        : undefined;

    if (!isValidIntegerId(rawId, true)) {
        return sendValidationError(res, {
            id: "Guardian ID must be a valid positive integer."
        });
    }

    req.params.id = String(Number(rawId));

    return next();
}

/*
|--------------------------------------------------------------------------
| VALUE VALIDATORS
|--------------------------------------------------------------------------
*/

function validateGuardianIdValue(value) {
    return isValidIntegerId(value, true);
}

function validateGuardianEmailValue(value) {
    return isValidEmail(normalizeEmail(value));
}

function validateGuardianPhoneValue(value) {
    return isValidPhone(value, true);
}

function validateGuardianNameValue(value) {
    return isValidName(value, true);
}

function validateGuardianRelationshipValue(value) {
    return isValidRelationship(value, true);
}

function validateGuardianOccupationValue(value) {
    return isValidOccupation(value, true);
}

function validateGuardianStatusValue(value) {
    return isValidStatus(value, true);
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    validateCreateGuardian,
    validateUpdateGuardian,
    validateGuardianId,
    validateGuardianIdValue,
    validateGuardianEmailValue,
    validateGuardianPhoneValue,
    validateGuardianNameValue,
    validateGuardianRelationshipValue,
    validateGuardianOccupationValue,
    validateGuardianStatusValue,
    isValidIntegerId,
    isValidEmail,
    isValidPhone,
    isValidName,
    isValidAddress,
    isValidRelationship,
    isValidOccupation,
    isValidStatus,
    MAX_NAME_LENGTH,
    MAX_EMAIL_LENGTH,
    MAX_PHONE_LENGTH,
    MAX_ADDRESS_LENGTH,
    MAX_RELATIONSHIP_LENGTH,
    MAX_OCCUPATION_LENGTH,
    MAX_STATUS_LENGTH
};