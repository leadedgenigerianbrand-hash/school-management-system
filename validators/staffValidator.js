"use strict";

/*
|--------------------------------------------------------------------------
| STAFF VALIDATORS
|--------------------------------------------------------------------------
|
| Centralized validation middleware for staff-related requests.
|
| Responsibilities:
|
| - Validate staff creation requests
| - Validate staff update requests
| - Validate staff identifiers
| - Validate staff numbers
| - Validate names and contact information
| - Validate school and department references
| - Validate employment information
| - Normalize appropriate input values
|
| This file does NOT:
|
| - Query the database
| - Create staff records
| - Update staff records
| - Delete staff records
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

const MAX_STAFF_NUMBER_LENGTH = 50;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_ADDRESS_LENGTH = 500;
const MAX_GENDER_LENGTH = 30;
const MAX_POSITION_LENGTH = 150;
const MAX_EMPLOYMENT_TYPE_LENGTH = 50;
const MAX_STATUS_LENGTH = 30;

const MAX_IDENTIFIER = 2147483647;

/*
|--------------------------------------------------------------------------
| ALLOWED VALUES
|--------------------------------------------------------------------------
|
| These are general application-level values.
|
| Department names, job titles, and school-specific employment categories
| are deliberately NOT hard-coded here.
|
|--------------------------------------------------------------------------
*/

const ALLOWED_GENDERS = new Set([
    "male",
    "female",
    "other"
]);

const ALLOWED_EMPLOYMENT_TYPES = new Set([
    "full-time",
    "part-time",
    "contract",
    "temporary",
    "casual",
    "internship",
    "volunteer"
]);

const ALLOWED_STATUSES = new Set([
    "active",
    "inactive",
    "on_leave",
    "suspended",
    "terminated",
    "resigned",
    "retired"
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

    const normalizedValue = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
        return false;
    }

    const [year, month, day] = normalizedValue
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

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
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

function isValidStaffNumber(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    const staffNumber = value.trim();

    if (staffNumber.length > MAX_STAFF_NUMBER_LENGTH) {
        return false;
    }

    return /^[A-Za-z0-9._/-]+$/.test(staffNumber);
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

function isValidPosition(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    return value.trim().length <= MAX_POSITION_LENGTH;
}

function normalizeEmploymentType(value) {
    return normalizeString(value)
        .toLowerCase()
        .replace(/_/g, "-")
        .replace(/\s+/g, "-");
}

function isValidEmploymentType(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    const employmentType = normalizeEmploymentType(value);

    return (
        employmentType.length <= MAX_EMPLOYMENT_TYPE_LENGTH &&
        ALLOWED_EMPLOYMENT_TYPES.has(employmentType)
    );
}

function normalizeStatus(value) {
    return normalizeString(value)
        .toLowerCase()
        .replace(/-/g, "_")
        .replace(/\s+/g, "_");
}

function isValidStatus(value, required = false) {
    if (!isNonEmptyString(value)) {
        return !required;
    }

    const status = normalizeStatus(value);

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

/*
|--------------------------------------------------------------------------
| STAFF CREATE VALIDATOR
|--------------------------------------------------------------------------
*/

function validateCreateStaff(req, res, next) {
    const body = getRequestBody(req);

    if (!body) {
        return sendValidationError(res, {
            body: "Request body must be a valid JSON object."
        });
    }

    const errors = {};

    const staffNumber = normalizeString(body.staffNumber);
    const firstName = normalizeString(body.firstName);
    const middleName = normalizeString(body.middleName);
    const lastName = normalizeString(body.lastName);
    const gender = normalizeString(body.gender).toLowerCase();
    const dateOfBirth = normalizeString(body.dateOfBirth);
    const phone = normalizeString(body.phone);
    const email = normalizeEmail(body.email);
    const address = normalizeString(body.address);
    const position = normalizeString(body.position);
    const employmentType = normalizeEmploymentType(
        body.employmentType
    );
    const employmentDate = normalizeString(
        body.employmentDate
    );
    const status = normalizeStatus(body.status);

    if (!isValidStaffNumber(staffNumber, true)) {
        errors.staffNumber =
            "Staff number is required and may contain only letters, numbers, dots, underscores, hyphens, or slashes.";
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

    if (!isValidPhone(phone)) {
        errors.phone =
            "Phone number contains invalid characters or is too long.";
    }

    if (email !== "" && !isValidEmail(email)) {
        errors.email =
            "Email address is invalid.";
    }

    if (!isValidAddress(address)) {
        errors.address =
            "Address must not exceed 500 characters.";
    }

    if (!isValidPosition(position, false)) {
        errors.position =
            "Position must not exceed 150 characters.";
    }

    if (!isValidEmploymentType(employmentType, false)) {
        errors.employmentType =
            "Employment type is invalid.";
    }

    if (!isValidDate(employmentDate, false)) {
        errors.employmentDate =
            "Employment date must be a valid date in YYYY-MM-DD format.";
    }

    if (!isValidStatus(status, false)) {
        errors.status =
            "Staff status is invalid.";
    }

    if (!isValidIntegerId(body.schoolId, true)) {
        errors.schoolId =
            "A valid school ID is required.";
    }

    if (
        body.departmentId !== undefined &&
        body.departmentId !== null &&
        body.departmentId !== "" &&
        !isValidIntegerId(body.departmentId, false)
    ) {
        errors.departmentId =
            "Department ID must be a valid positive integer.";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    body.staffNumber = staffNumber;
    body.firstName = firstName;
    body.lastName = lastName;
    body.gender = gender;

    if (middleName !== "") {
        body.middleName = middleName;
    }

    if (dateOfBirth !== "") {
        body.dateOfBirth = dateOfBirth;
    }

    if (phone !== "") {
        body.phone = phone;
    }

    if (email !== "") {
        body.email = email;
    }

    if (address !== "") {
        body.address = address;
    }

    if (position !== "") {
        body.position = position;
    }

    if (employmentType !== "") {
        body.employmentType = employmentType;
    }

    if (employmentDate !== "") {
        body.employmentDate = employmentDate;
    }

    if (status !== "") {
        body.status = status;
    }

    normalizeOptionalInteger(body, "schoolId");
    normalizeOptionalInteger(body, "departmentId");

    return next();
}

/*
|--------------------------------------------------------------------------
| STAFF UPDATE VALIDATOR
|--------------------------------------------------------------------------
|
| Only fields supplied by the request are validated.
| This allows partial staff updates.
|
|--------------------------------------------------------------------------
*/

function validateUpdateStaff(req, res, next) {
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
            "staffNumber"
        )
    ) {
        const staffNumber = normalizeString(
            body.staffNumber
        );

        if (!isValidStaffNumber(staffNumber, true)) {
            errors.staffNumber =
                "Staff number is invalid.";
        } else {
            body.staffNumber = staffNumber;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "firstName"
        )
    ) {
        const firstName = normalizeString(
            body.firstName
        );

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
        const middleName = normalizeString(
            body.middleName
        );

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
        const lastName = normalizeString(
            body.lastName
        );

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
        const gender = normalizeString(
            body.gender
        ).toLowerCase();

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
        const dateOfBirth = normalizeString(
            body.dateOfBirth
        );

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
            "phone"
        )
    ) {
        const phone = normalizeString(
            body.phone
        );

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
            "email"
        )
    ) {
        const email = normalizeEmail(
            body.email
        );

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
        const address = normalizeString(
            body.address
        );

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
            "position"
        )
    ) {
        const position = normalizeString(
            body.position
        );

        if (!isValidPosition(position, false)) {
            errors.position =
                "Position must not exceed 150 characters.";
        } else {
            body.position = position;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "employmentType"
        )
    ) {
        const employmentType = normalizeEmploymentType(
            body.employmentType
        );

        if (!isValidEmploymentType(employmentType, false)) {
            errors.employmentType =
                "Employment type is invalid.";
        } else {
            body.employmentType = employmentType;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "employmentDate"
        )
    ) {
        const employmentDate = normalizeString(
            body.employmentDate
        );

        if (!isValidDate(employmentDate, false)) {
            errors.employmentDate =
                "Employment date must be a valid date in YYYY-MM-DD format.";
        } else {
            body.employmentDate = employmentDate;
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            body,
            "status"
        )
    ) {
        const status = normalizeStatus(
            body.status
        );

        if (!isValidStatus(status, false)) {
            errors.status =
                "Staff status is invalid.";
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
            "departmentId"
        ) &&
        !isValidIntegerId(body.departmentId, false)
    ) {
        errors.departmentId =
            "Department ID must be a valid positive integer.";
    }

    if (Object.keys(errors).length > 0) {
        return sendValidationError(res, errors);
    }

    normalizeOptionalInteger(body, "schoolId");
    normalizeOptionalInteger(body, "departmentId");

    return next();
}

/*
|--------------------------------------------------------------------------
| STAFF ID VALIDATOR
|--------------------------------------------------------------------------
|
| Validates route parameters such as:
|
| GET    /api/staff/:id
| PUT    /api/staff/:id
| DELETE /api/staff/:id
|
|--------------------------------------------------------------------------
*/

function validateStaffId(req, res, next) {
    const rawId = req && req.params
        ? req.params.id
        : undefined;

    if (!isValidIntegerId(rawId, true)) {
        return sendValidationError(res, {
            id: "Staff ID must be a valid positive integer."
        });
    }

    req.params.id = String(Number(rawId));

    return next();
}

/*
|--------------------------------------------------------------------------
| STAFF NUMBER VALIDATOR
|--------------------------------------------------------------------------
*/

function validateStaffNumber(req, res, next) {
    const rawStaffNumber =
        req && req.params
            ? req.params.staffNumber
            : undefined;

    const staffNumber = normalizeString(
        rawStaffNumber
    );

    if (!isValidStaffNumber(staffNumber, true)) {
        return sendValidationError(res, {
            staffNumber: "Staff number is invalid."
        });
    }

    req.params.staffNumber = staffNumber;

    return next();
}

/*
|--------------------------------------------------------------------------
| VALUE VALIDATORS
|--------------------------------------------------------------------------
*/

function validateStaffIdValue(value) {
    return isValidIntegerId(value, true);
}

function validateStaffNumberValue(value) {
    return isValidStaffNumber(value, true);
}

function validateStaffEmailValue(value) {
    return isValidEmail(normalizeEmail(value));
}

function validateStaffDateValue(value) {
    return isValidDate(value, true);
}

function validateStaffGenderValue(value) {
    return isValidGender(value, true);
}

function validateStaffEmploymentTypeValue(value) {
    return isValidEmploymentType(value, true);
}

function validateStaffStatusValue(value) {
    return isValidStatus(value, true);
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    validateCreateStaff,
    validateUpdateStaff,
    validateStaffId,
    validateStaffNumber,
    validateStaffIdValue,
    validateStaffNumberValue,
    validateStaffEmailValue,
    validateStaffDateValue,
    validateStaffGenderValue,
    validateStaffEmploymentTypeValue,
    validateStaffStatusValue,
    isValidIntegerId,
    isValidStaffNumber,
    isValidEmail,
    isValidDate,
    isValidPhone,
    isValidName,
    isValidGender,
    isValidPosition,
    isValidEmploymentType,
    isValidStatus,
    MAX_STAFF_NUMBER_LENGTH,
    MAX_NAME_LENGTH,
    MAX_EMAIL_LENGTH,
    MAX_PHONE_LENGTH,
    MAX_ADDRESS_LENGTH,
    MAX_GENDER_LENGTH,
    MAX_POSITION_LENGTH,
    MAX_EMPLOYMENT_TYPE_LENGTH,
    MAX_STATUS_LENGTH
};