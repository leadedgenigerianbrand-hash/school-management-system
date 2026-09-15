"use strict";

/*
|--------------------------------------------------------------------------
| ACADEMIC VALIDATOR
|--------------------------------------------------------------------------
|
| This validator provides shared validation and normalization helpers for
| academic-related resources in the school management system.
|
| It is intentionally independent of:
| - Database queries
| - SQL
| - Authentication
| - Authorization
| - Roles
| - Permissions
| - Controller business logic
|
| The validator is designed to support academic resources such as:
| - Academic sessions
| - Terms
| - Academic levels
| - Classes
| - Class arms
| - Subjects
| - Departments
|
|--------------------------------------------------------------------------
*/

const MAX_IDENTIFIER = 100;
const MAX_NAME = 150;
const MAX_CODE = 50;
const MAX_DESCRIPTION = 500;
const MAX_DATE = 10;

const ALLOWED_STATUSES = new Set([
    "active",
    "inactive",
    "archived"
]);

function isPlainObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function normalizeString(value) {
    if (typeof value !== "string") {
        return value;
    }

    return value.trim().replace(/\s+/g, " ");
}

function normalizeCode(value) {
    if (typeof value !== "string") {
        return value;
    }

    return value.trim().toUpperCase();
}

function normalizeStatus(value) {
    if (typeof value !== "string") {
        return value;
    }

    return value.trim().toLowerCase();
}

function isNonEmptyString(value, maxLength) {
    if (typeof value !== "string") {
        return false;
    }

    const normalized = value.trim();

    return normalized.length > 0 && normalized.length <= maxLength;
}

function isValidIdentifier(value) {
    if (typeof value !== "string") {
        return false;
    }

    const normalized = value.trim();

    if (
        normalized.length === 0 ||
        normalized.length > MAX_IDENTIFIER
    ) {
        return false;
    }

    return /^[A-Za-z0-9][A-Za-z0-9._\-\/ ]*$/.test(normalized);
}

function isValidName(value) {
    if (!isNonEmptyString(value, MAX_NAME)) {
        return false;
    }

    return /^[A-Za-z0-9][A-Za-z0-9 .,'()&\/\-]*$/.test(
        value.trim()
    );
}

function isValidCode(value) {
    if (!isNonEmptyString(value, MAX_CODE)) {
        return false;
    }

    return /^[A-Za-z0-9][A-Za-z0-9._\-\/ ]*$/.test(
        value.trim()
    );
}

function isValidDescription(value) {
    if (value === undefined || value === null || value === "") {
        return true;
    }

    if (typeof value !== "string") {
        return false;
    }

    return value.trim().length <= MAX_DESCRIPTION;
}

function isValidIntegerId(value) {
    if (typeof value === "number") {
        return Number.isInteger(value) && value > 0;
    }

    if (typeof value === "string") {
        const normalized = value.trim();

        if (!/^\d+$/.test(normalized)) {
            return false;
        }

        const number = Number(normalized);

        return Number.isSafeInteger(number) && number > 0;
    }

    return false;
}

function normalizeIntegerId(value) {
    if (value === undefined || value === null || value === "") {
        return value;
    }

    if (!isValidIntegerId(value)) {
        return value;
    }

    return Number(value);
}

function isValidDate(value) {
    if (typeof value !== "string") {
        return false;
    }

    const normalized = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        return false;
    }

    const date = new Date(`${normalized}T00:00:00Z`);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return date.toISOString().slice(0, 10) === normalized;
}

function isValidOptionalDate(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    return isValidDate(value);
}

function isValidStatus(value) {
    if (typeof value !== "string") {
        return false;
    }

    return ALLOWED_STATUSES.has(
        normalizeStatus(value)
    );
}

function isValidOptionalStatus(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    return isValidStatus(value);
}

function getRequestBody(req) {
    if (!req || !isPlainObject(req.body)) {
        return {};
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

function validateRequiredIdField(body, fieldName, errors) {
    if (!isValidIntegerId(body[fieldName])) {
        errors.push(
            `${fieldName} must be a valid positive integer.`
        );
    }
}

function validateOptionalIdField(body, fieldName, errors) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidIntegerId(value)) {
        errors.push(
            `${fieldName} must be a valid positive integer.`
        );
    }
}

function validateRequiredNameField(body, fieldName, errors) {
    if (!isValidName(body[fieldName])) {
        errors.push(
            `${fieldName} is required and must be a valid name.`
        );
    }
}

function validateOptionalNameField(body, fieldName, errors) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidName(value)) {
        errors.push(
            `${fieldName} must be a valid name.`
        );
    }
}

function validateOptionalCodeField(body, fieldName, errors) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidCode(value)) {
        errors.push(
            `${fieldName} must be a valid academic code.`
        );
    }
}

function validateOptionalDescriptionField(
    body,
    fieldName,
    errors
) {
    if (!isValidDescription(body[fieldName])) {
        errors.push(
            `${fieldName} must not exceed ${MAX_DESCRIPTION} characters.`
        );
    }
}

function validateOptionalDateField(
    body,
    fieldName,
    errors
) {
    if (!isValidOptionalDate(body[fieldName])) {
        errors.push(
            `${fieldName} must be a valid date in YYYY-MM-DD format.`
        );
    }
}

function validateOptionalStatusField(
    body,
    fieldName,
    errors
) {
    if (!isValidOptionalStatus(body[fieldName])) {
        errors.push(
            `${fieldName} must be one of: active, inactive, archived.`
        );
    }
}

function validateAcademicRecord(
    req,
    res,
    next
) {
    const body = getRequestBody(req);
    const errors = [];

    if (body.schoolId !== undefined) {
        validateOptionalIdField(
            body,
            "schoolId",
            errors
        );
    }

    if (body.name !== undefined) {
        validateOptionalNameField(
            body,
            "name",
            errors
        );
    }

    if (body.code !== undefined) {
        validateOptionalCodeField(
            body,
            "code",
            errors
        );
    }

    if (body.description !== undefined) {
        validateOptionalDescriptionField(
            body,
            "description",
            errors
        );
    }

    if (body.startDate !== undefined) {
        validateOptionalDateField(
            body,
            "startDate",
            errors
        );
    }

    if (body.endDate !== undefined) {
        validateOptionalDateField(
            body,
            "endDate",
            errors
        );
    }

    if (body.status !== undefined) {
        validateOptionalStatusField(
            body,
            "status",
            errors
        );
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    if (body.schoolId !== undefined) {
        body.schoolId = normalizeIntegerId(
            body.schoolId
        );
    }

    if (body.name !== undefined) {
        body.name = normalizeString(body.name);
    }

    if (body.code !== undefined) {
        body.code = normalizeCode(body.code);
    }

    if (body.description !== undefined) {
        body.description =
            typeof body.description === "string"
                ? body.description.trim()
                : body.description;
    }

    if (body.startDate !== undefined) {
        body.startDate =
            typeof body.startDate === "string"
                ? body.startDate.trim()
                : body.startDate;
    }

    if (body.endDate !== undefined) {
        body.endDate =
            typeof body.endDate === "string"
                ? body.endDate.trim()
                : body.endDate;
    }

    if (body.status !== undefined) {
        body.status = normalizeStatus(body.status);
    }

    req.body = body;

    return next();
}

function validateCreateAcademicRecord(
    req,
    res,
    next
) {
    const body = getRequestBody(req);
    const errors = [];

    if (body.schoolId !== undefined) {
        validateOptionalIdField(
            body,
            "schoolId",
            errors
        );
    }

    if (!isValidName(body.name)) {
        errors.push(
            "name is required and must be a valid name."
        );
    }

    if (body.code !== undefined) {
        validateOptionalCodeField(
            body,
            "code",
            errors
        );
    }

    if (body.description !== undefined) {
        validateOptionalDescriptionField(
            body,
            "description",
            errors
        );
    }

    if (body.startDate !== undefined) {
        validateOptionalDateField(
            body,
            "startDate",
            errors
        );
    }

    if (body.endDate !== undefined) {
        validateOptionalDateField(
            body,
            "endDate",
            errors
        );
    }

    if (body.status !== undefined) {
        validateOptionalStatusField(
            body,
            "status",
            errors
        );
    }

    if (
        body.startDate !== undefined &&
        body.endDate !== undefined &&
        isValidDate(body.startDate) &&
        isValidDate(body.endDate) &&
        body.startDate > body.endDate
    ) {
        errors.push(
            "startDate cannot be later than endDate."
        );
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    body.name = normalizeString(body.name);

    if (body.schoolId !== undefined) {
        body.schoolId = normalizeIntegerId(
            body.schoolId
        );
    }

    if (body.code !== undefined) {
        body.code = normalizeCode(body.code);
    }

    if (body.description !== undefined) {
        body.description =
            typeof body.description === "string"
                ? body.description.trim()
                : body.description;
    }

    if (body.startDate !== undefined) {
        body.startDate =
            typeof body.startDate === "string"
                ? body.startDate.trim()
                : body.startDate;
    }

    if (body.endDate !== undefined) {
        body.endDate =
            typeof body.endDate === "string"
                ? body.endDate.trim()
                : body.endDate;
    }

    if (body.status !== undefined) {
        body.status = normalizeStatus(body.status);
    }

    req.body = body;

    return next();
}

function validateUpdateAcademicRecord(
    req,
    res,
    next
) {
    const body = getRequestBody(req);
    const errors = [];

    if (Object.keys(body).length === 0) {
        errors.push(
            "At least one field is required for an update."
        );
    }

    if (body.schoolId !== undefined) {
        validateOptionalIdField(
            body,
            "schoolId",
            errors
        );
    }

    if (body.name !== undefined) {
        validateOptionalNameField(
            body,
            "name",
            errors
        );
    }

    if (body.code !== undefined) {
        validateOptionalCodeField(
            body,
            "code",
            errors
        );
    }

    if (body.description !== undefined) {
        validateOptionalDescriptionField(
            body,
            "description",
            errors
        );
    }

    if (body.startDate !== undefined) {
        validateOptionalDateField(
            body,
            "startDate",
            errors
        );
    }

    if (body.endDate !== undefined) {
        validateOptionalDateField(
            body,
            "endDate",
            errors
        );
    }

    if (body.status !== undefined) {
        validateOptionalStatusField(
            body,
            "status",
            errors
        );
    }

    if (
        body.startDate !== undefined &&
        body.endDate !== undefined &&
        isValidDate(body.startDate) &&
        isValidDate(body.endDate) &&
        body.startDate > body.endDate
    ) {
        errors.push(
            "startDate cannot be later than endDate."
        );
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    if (body.schoolId !== undefined) {
        body.schoolId = normalizeIntegerId(
            body.schoolId
        );
    }

    if (body.name !== undefined) {
        body.name = normalizeString(body.name);
    }

    if (body.code !== undefined) {
        body.code = normalizeCode(body.code);
    }

    if (body.description !== undefined) {
        body.description =
            typeof body.description === "string"
                ? body.description.trim()
                : body.description;
    }

    if (body.startDate !== undefined) {
        body.startDate =
            typeof body.startDate === "string"
                ? body.startDate.trim()
                : body.startDate;
    }

    if (body.endDate !== undefined) {
        body.endDate =
            typeof body.endDate === "string"
                ? body.endDate.trim()
                : body.endDate;
    }

    if (body.status !== undefined) {
        body.status = normalizeStatus(body.status);
    }

    req.body = body;

    return next();
}

function validateAcademicId(
    req,
    res,
    next
) {
    const id =
        req.params &&
        (req.params.id ||
            req.params.academicId);

    if (!isValidIntegerId(id)) {
        return sendValidationError(res, [
            "A valid positive academic ID is required."
        ]);
    }

    if (req.params.id !== undefined) {
        req.params.id = String(
            Number(id)
        );
    }

    if (req.params.academicId !== undefined) {
        req.params.academicId = String(
            Number(id)
        );
    }

    return next();
}

function validateAcademicIdValue(value) {
    return isValidIntegerId(value);
}

function validateAcademicNameValue(value) {
    return isValidName(value);
}

function validateAcademicCodeValue(value) {
    return isValidCode(value);
}

function validateAcademicDateValue(value) {
    return isValidDate(value);
}

function validateAcademicStatusValue(value) {
    return isValidStatus(value);
}

module.exports = {
    validateAcademicRecord,
    validateCreateAcademicRecord,
    validateUpdateAcademicRecord,
    validateAcademicId,

    validateAcademicIdValue,
    validateAcademicNameValue,
    validateAcademicCodeValue,
    validateAcademicDateValue,
    validateAcademicStatusValue,

    isPlainObject,
    normalizeString,
    normalizeCode,
    normalizeStatus,
    isValidIdentifier,
    isValidName,
    isValidCode,
    isValidDescription,
    isValidIntegerId,
    normalizeIntegerId,
    isValidDate,
    isValidOptionalDate,
    isValidStatus,
    isValidOptionalStatus,

    ALLOWED_STATUSES,
    MAX_IDENTIFIER,
    MAX_NAME,
    MAX_CODE,
    MAX_DESCRIPTION,
    MAX_DATE
};