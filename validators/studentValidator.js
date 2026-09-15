"use strict";

/*
|--------------------------------------------------------------------------
| STUDENT VALIDATORS
|--------------------------------------------------------------------------
|
| Centralized validation middleware for student-related requests.
|
| Responsibilities:
|
| - Validate student creation requests
| - Validate student update requests
| - Validate student identifiers
| - Validate student numbers
| - Validate names and contact information
| - Validate school/class/class-arm references
| - Validate admission information
| - Validate student status
| - Normalize appropriate input values
|
| This file does NOT:
|
| - Query the database
| - Create students
| - Update students
| - Delete students
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

const MAX_STUDENT_NUMBER_LENGTH = 50;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_ADDRESS_LENGTH = 500;
const MAX_GENDER_LENGTH = 30;
const MAX_STATUS_LENGTH = 30;

const MAX_IDENTIFIER = 2147483647;

/*
|--------------------------------------------------------------------------
| ALLOWED VALUES
|--------------------------------------------------------------------------
|
| These values represent common database/application values.
| They are intentionally kept broad enough for the Nigerian school
| management system without hard-coding specific school classes.
|
|--------------------------------------------------------------------------
*/

const ALLOWED_GENDERS = new Set([
    "male",
    "female",
    "other"
]);

const ALLOWED_STATUSES = new Set([
    "active",
    "inactive",
    "graduated",
    "withdrawn",
    "transferred",
    "suspended"
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

function isValidDate(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const normalizedInput = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedInput)) {
        return false;
    }

    const [year, month, day] = normalizedInput
        .split("-")
        .map(Number);

    if (
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return false;
    }

    const utcDate = new Date(
        Date.UTC(year, month - 1, day)
    );

    return (
        utcDate.getUTCFullYear() === year &&
        utcDate.getUTCMonth() === month - 1 &&
        utcDate.getUTCDate() === day
    );
}

function isValidPhone(value) {
    if (!isNonEmptyString(value)) {
        return true;
    }

    const phone = value.trim();

    if (phone.length > MAX_PHONE_LENGTH) {
        return false;
    }

    return /^[0-9+()\-.\s]+$/.test(phone);
}

function isValidStudentNumber(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    const studentNumber = value.trim();

    if (studentNumber.length > MAX_STUDENT_NUMBER_LENGTH) {
        return false;
    }

    return /^[A-Za-z0-9._/-]+$/.test(studentNumber);
}

function isValidAddress(value) {
    if (!isNonEmptyString(value)) {
        return true;
    }

    return value.trim().length <= MAX_ADDRESS_LENGTH;
}

function isValidGender(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    const gender = value.trim().toLowerCase();

    return (
        gender.length <= MAX_GENDER_LENGTH &&
        ALLOWED_GENDERS.has(gender)
    );
}

function isValidStatus(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    const status = value.trim().toLowerCase();

    return (
        status.length <= MAX_STATUS_LENGTH &&
        ALLOWED_STATUSES.has(status)
    );
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
| STUDENT CREATE VALIDATOR
|--------------------------------------------------------------------------
*/

function validateCreateStudent(req, res, next) {
    const body = getRequestBody(req);

    if (!body) {
        return sendValidationError(res, {
            body: "Request body must be a valid JSON object."
        });
    }

    const errors = {};

    const studentNumber = normalizeString(body.studentNumber);
    const firstName = normalizeString(body.firstName);
    const middleName = normalizeString(body.middleName);
    const lastName = normalizeString(body.lastName);
    const gender = normalizeString(body.gender).toLowerCase();
    const dateOfBirth = normalizeString(body.dateOfBirth);
    const email = normalizeEmail(body.email);
    const phone = normalizeString(body.phone);
    const address = normalizeString(body.address);
    const status = normalizeString(body.status).toLowerCase();

    if (!isValidStudentNumber(studentNumber, true)) {
        errors.studentNumber =
            "Student number is required and may contain only letters, numbers, dots, underscores, hyphens, or slashes.";
    }

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

    if (!isValidGender(gender, true)) {
        errors.gender =
            "Gender must be male, female, or other.";
    }

    if (!isValidDate(dateOfBirth, false)) {
        errors.dateOfBirth =
            "Date of birth must be a valid date in YYYY-MM-DD format.";
    }

    if (email !== "" && !isValidEmail(email)) {
        errors.email =
            "Email address is invalid.";
    }

    if (!isValidPhone(phone)) {
        errors.phone =
            "Phone number contains invalid characters or is too long.";
    }

    if (!isValidAddress(address)) {
        errors.address =
            "Address must not exceed 500 characters.";
    }

    if (status !== "" && !isValidStatus(status, false)) {
        errors.status =
            "Student status is invalid.";
    }

    if (!isValidIntegerId(body.schoolId, true)) {
        errors.schoolId =
            "A valid school ID is required.";
    }

    if (
        body.classId !== undefined &&
        body.classId !== null &&
        body.classId !== "" &&
        !isValidIntegerId(body.classId, false)
    ) {
        errors.classId =
            "Class ID must be a valid positive integer.";
    }

    if (
        body.classArmId !== undefined &&
        body.classArmId !== null &&
        body.classArmId !== "" &&
        !isValidIntegerId(body.classArmId, false)
    ) {
        errors.classArmId =
            "Class arm ID must be a valid positive integer.";
    }

    if (
        body.guardianId !== undefined &&
        body.guardianId !== null &&
        body.guardianId !== "" &&
        !isValidIntegerId(body.guardianId, false)
    ) {
        errors.guardianId =
            "Guardian ID must be a valid positive integer.";
    }

    if (
        body.admissionDate !== undefined &&
        body.admissionDate !== null &&
        body.admissionDate !== "" &&
        !isValidDate(
            normalizeString(body.admissionDate),
            false
        )
    ) {
        errors.admissionDate =
            "Admission date must be a valid date in YYYY-MM-DD format.";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    body.studentNumber = studentNumber;
    body.firstName = firstName;
    body.lastName = lastName;
    body.gender = gender;

    if (middleName !== "") {
        body.middleName = middleName;
    }

    if (dateOfBirth !== "") {
        body.dateOfBirth = dateOfBirth;
    }

    if (email !== "") {
        body.email = email;
    }

    if (phone !== "") {
        body.phone = phone;
    }

    if (address !== "") {
        body.address = address;
    }

    if (status !== "") {
        body.status = status;
    }

    normalizeOptionalString(body, "admissionDate");
    normalizeOptionalInteger(body, "schoolId");
    normalizeOptionalInteger(body, "classId");
    normalizeOptionalInteger(body, "classArmId");
    normalizeOptionalInteger(body, "guardianId");

    return next();
}

/*
|--------------------------------------------------------------------------
| STUDENT UPDATE VALIDATOR
|--------------------------------------------------------------------------
|
| All supplied fields are validated, but fields are not forced to exist.
| This allows partial updates while still rejecting invalid values.
|
*/

function validateUpdateStudent(req, res, next) {
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
            "studentNumber"
        )
    ) {
        const studentNumber = normalizeString(body.studentNumber);

        if (!isValidStudentNumber(studentNumber, true)) {
            errors.studentNumber =
                "Student number is invalid.";

        } else {
            body.studentNumber = studentNumber;
        }
    }

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
            "gender"
        )
    ) {
        const gender = normalizeString(body.gender).toLowerCase();

        if (!isValidGender(gender, true)) {
            errors.gender =
                "Gender must be male, female, or other.";
        } else {
            body.gender = gender;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "dateOfBirth"
        )
    ) {
        const dateOfBirth = normalizeString(body.dateOfBirth);

        if (!isValidDate(dateOfBirth, false)) {
            errors.dateOfBirth =
                "Date of birth must be a valid date in YYYY-MM-DD format.";
        } else {
            body.dateOfBirth = dateOfBirth;
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
            "phone"
        )
    ) {
        const phone = normalizeString(body.phone);

        if (!isValidPhone(phone)) {
            errors.phone =
                "Phone number contains invalid characters or is too long.";
        } else {
            body.phone = phone;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "address"
        )
    ) {
        const address = normalizeString(body.address);

        if (!isValidAddress(address)) {
            errors.address =
                "Address must not exceed 500 characters.";
        } else {
            body.address = address;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "status"
        )
    ) {
        const status = normalizeString(body.status).toLowerCase();

        if (!isValidStatus(status, false)) {
            errors.status =
                "Student status is invalid.";
        } else {
            body.status = status;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "schoolId"
        ) &&
        !isValidIntegerId(body.schoolId, true)
    ) {
        errors.schoolId =
            "School ID must be a valid positive integer.";
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "classId"
        ) &&
        !isValidIntegerId(body.classId, false)
    ) {
        errors.classId =
            "Class ID must be a valid positive integer.";
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "classArmId"
        ) &&
        !isValidIntegerId(body.classArmId, false)
    ) {
        errors.classArmId =
            "Class arm ID must be a valid positive integer.";
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "guardianId"
        ) &&
        !isValidIntegerId(body.guardianId, false)
    ) {
        errors.guardianId =
            "Guardian ID must be a valid positive integer.";
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "admissionDate"
        )
    ) {
        const admissionDate = normalizeString(
            body.admissionDate
        );

        if (!isValidDate(admissionDate, false)) {
            errors.admissionDate =
                "Admission date must be a valid date in YYYY-MM-DD format.";
        } else {
            body.admissionDate = admissionDate;
        }
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    normalizeOptionalInteger(body, "schoolId");
    normalizeOptionalInteger(body, "classId");
    normalizeOptionalInteger(body, "classArmId");
    normalizeOptionalInteger(body, "guardianId");

    return next();
}

/*
|--------------------------------------------------------------------------
| STUDENT ID VALIDATOR
|--------------------------------------------------------------------------
|
| Validates IDs supplied through routes such as:
|
| GET    /api/students/:id
| PUT    /api/students/:id
| DELETE /api/students/:id
|
*/

function validateStudentId(req, res, next) {
    const rawId = req && req.params
        ? req.params.id
        : undefined;

    if (!isValidIntegerId(rawId, true)) {
        return sendValidationError(res, {
            id: "Student ID must be a valid positive integer."
        });
    }

    req.params.id = String(Number(rawId));

    return next();
}

/*
|--------------------------------------------------------------------------
| STUDENT NUMBER VALIDATOR
|--------------------------------------------------------------------------
*/

function validateStudentNumber(req, res, next) {
    const rawStudentNumber =
        req && req.params
            ? req.params.studentNumber
            : undefined;

    const studentNumber = normalizeString(
        rawStudentNumber
    );

    if (!isValidStudentNumber(studentNumber, true)) {
        return sendValidationError(res, {
            studentNumber: "Student number is invalid."
        });
    }

    req.params.studentNumber = studentNumber;

    return next();
}

/*
|--------------------------------------------------------------------------
| EXPORTED VALUE VALIDATORS
|--------------------------------------------------------------------------
|
| These helpers can also be used by controllers or tests when a direct
| validation check is required.
|
*/

function validateStudentIdValue(value) {
    return isValidIntegerId(value, true);
}

function validateStudentNumberValue(value) {
    return isValidStudentNumber(value, true);
}

function validateStudentEmailValue(value) {
    return isValidEmail(normalizeEmail(value));
}

function validateStudentDateValue(value) {
    return isValidDate(value, true);
}

function validateStudentGenderValue(value) {
    return isValidGender(value, true);
}

function validateStudentStatusValue(value) {
    return isValidStatus(value, true);
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    validateCreateStudent,
    validateUpdateStudent,
    validateStudentId,
    validateStudentNumber,
    validateStudentIdValue,
    validateStudentNumberValue,
    validateStudentEmailValue,
    validateStudentDateValue,
    validateStudentGenderValue,
    validateStudentStatusValue,
    isValidIntegerId,
    isValidStudentNumber,
    isValidEmail,
    isValidDate,
    isValidPhone,
    isValidName,
    isValidGender,
    isValidStatus,
    MAX_STUDENT_NUMBER_LENGTH,
    MAX_NAME_LENGTH,
    MAX_EMAIL_LENGTH,
    MAX_PHONE_LENGTH,
    MAX_ADDRESS_LENGTH,
    MAX_GENDER_LENGTH,
    MAX_STATUS_LENGTH
};