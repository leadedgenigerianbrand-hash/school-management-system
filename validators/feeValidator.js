"use strict";

/*
|--------------------------------------------------------------------------
| FEE VALIDATOR
|--------------------------------------------------------------------------
|
| Central validation layer for fee and payment related requests.
|
| This file is responsible for:
| - Validating fee input
| - Validating payment input
| - Validating fee/payment identifiers
| - Validating monetary values
| - Validating payment dates
| - Validating payment methods
| - Validating fee/payment statuses
| - Normalizing safe input values
|
| This file does NOT:
| - Query the database
| - Execute SQL
| - Calculate balances
| - Process payments
| - Generate receipts
| - Handle authentication
| - Handle authorization
| - Check roles or permissions
| - Contain controller business logic
|
|--------------------------------------------------------------------------
*/

const MAX_NAME = 150;
const MAX_DESCRIPTION = 500;
const MAX_REFERENCE = 100;
const MAX_RECEIPT_NUMBER = 100;
const MAX_PAYMENT_METHOD = 50;
const MAX_CURRENCY = 10;

const MAX_MONEY = 999999999999.99;

const ALLOWED_FEE_STATUSES = new Set([
    "active",
    "inactive",
    "archived"
]);

const ALLOWED_PAYMENT_STATUSES = new Set([
    "pending",
    "completed",
    "failed",
    "cancelled",
    "refunded"
]);

const ALLOWED_PAYMENT_METHODS = new Set([
    "cash",
    "bank_transfer",
    "card",
    "pos",
    "online",
    "cheque",
    "mobile_money",
    "other"
]);

const ALLOWED_CURRENCIES = new Set([
    "NGN"
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

function normalizePaymentMethod(value) {
    if (typeof value !== "string") {
        return value;
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");
}

function normalizeCurrency(value) {
    if (typeof value !== "string") {
        return value;
    }

    return value.trim().toUpperCase();
}

function isNonEmptyString(value, maxLength) {
    if (typeof value !== "string") {
        return false;
    }

    const normalized = value.trim();

    return (
        normalized.length > 0 &&
        normalized.length <= maxLength
    );
}

function isValidName(value) {
    if (!isNonEmptyString(value, MAX_NAME)) {
        return false;
    }

    return /^[A-Za-z0-9][A-Za-z0-9 .,'()&/\\-]*$/.test(
        value.trim()
    );
}

function isValidDescription(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    return (
        typeof value === "string" &&
        value.trim().length <= MAX_DESCRIPTION
    );
}

function isValidReference(value) {
    if (!isNonEmptyString(value, MAX_REFERENCE)) {
        return false;
    }

    return /^[A-Za-z0-9][A-Za-z0-9._:/\- ]*$/.test(
        value.trim()
    );
}

function isValidReceiptNumber(value) {
    if (!isNonEmptyString(value, MAX_RECEIPT_NUMBER)) {
        return false;
    }

    return /^[A-Za-z0-9][A-Za-z0-9._:/\- ]*$/.test(
        value.trim()
    );
}

function isValidIntegerId(value) {
    if (typeof value === "number") {
        return Number.isSafeInteger(value) && value > 0;
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
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return value;
    }

    if (!isValidIntegerId(value)) {
        return value;
    }

    return Number(value);
}

function isValidMoney(value) {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value)
    ) {
        return false;
    }

    if (value < 0 || value > MAX_MONEY) {
        return false;
    }

    return Number.isInteger(
        Math.round(value * 100)
    );
}

function isValidMoneyInput(value) {
    if (typeof value === "number") {
        return isValidMoney(value);
    }

    if (typeof value === "string") {
        const normalized = value.trim();

        if (normalized === "") {
            return false;
        }

        if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
            return false;
        }

        const number = Number(normalized);

        return isValidMoney(number);
    }

    return false;
}

function normalizeMoney(value) {
    if (!isValidMoneyInput(value)) {
        return value;
    }

    return Number(Number(value).toFixed(2));
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

function isValidFeeStatus(value) {
    if (typeof value !== "string") {
        return false;
    }

    return ALLOWED_FEE_STATUSES.has(
        normalizeStatus(value)
    );
}

function isValidPaymentStatus(value) {
    if (typeof value !== "string") {
        return false;
    }

    return ALLOWED_PAYMENT_STATUSES.has(
        normalizeStatus(value)
    );
}

function isValidPaymentMethod(value) {
    if (typeof value !== "string") {
        return false;
    }

    return ALLOWED_PAYMENT_METHODS.has(
        normalizePaymentMethod(value)
    );
}

function isValidCurrency(value) {
    if (typeof value !== "string") {
        return false;
    }

    return (
        value.trim().length > 0 &&
        value.trim().length <= MAX_CURRENCY &&
        ALLOWED_CURRENCIES.has(
            normalizeCurrency(value)
        )
    );
}

function isValidOptionalCurrency(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    return isValidCurrency(value);
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

function validateRequiredIdField(
    body,
    fieldName,
    errors
) {
    if (!isValidIntegerId(body[fieldName])) {
        errors.push(
            `${fieldName} must be a valid positive integer.`
        );
    }
}

function validateOptionalIdField(
    body,
    fieldName,
    errors
) {
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

function validateRequiredNameField(
    body,
    fieldName,
    errors
) {
    if (!isValidName(body[fieldName])) {
        errors.push(
            `${fieldName} is required and must be a valid name.`
        );
    }
}

function validateOptionalNameField(
    body,
    fieldName,
    errors
) {
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

function validateRequiredMoneyField(
    body,
    fieldName,
    errors
) {
    if (!isValidMoneyInput(body[fieldName])) {
        errors.push(
            `${fieldName} must be a valid non-negative monetary amount with a maximum of two decimal places.`
        );
    }
}

function validateOptionalMoneyField(
    body,
    fieldName,
    errors
) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidMoneyInput(value)) {
        errors.push(
            `${fieldName} must be a valid non-negative monetary amount with a maximum of two decimal places.`
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

function validateOptionalReferenceField(
    body,
    fieldName,
    errors
) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidReference(value)) {
        errors.push(
            `${fieldName} must be a valid payment reference.`
        );
    }
}

function validateOptionalReceiptField(
    body,
    fieldName,
    errors
) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidReceiptNumber(value)) {
        errors.push(
            `${fieldName} must be a valid receipt number.`
        );
    }
}

function validateOptionalFeeStatusField(
    body,
    fieldName,
    errors
) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidFeeStatus(value)) {
        errors.push(
            `${fieldName} must be one of: active, inactive, archived.`
        );
    }
}

function validateOptionalPaymentStatusField(
    body,
    fieldName,
    errors
) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidPaymentStatus(value)) {
        errors.push(
            `${fieldName} must be one of: pending, completed, failed, cancelled, refunded.`
        );
    }
}

function validateOptionalPaymentMethodField(
    body,
    fieldName,
    errors
) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidPaymentMethod(value)) {
        errors.push(
            `${fieldName} must be one of: cash, bank_transfer, card, pos, online, cheque, mobile_money, other.`
        );
    }
}

function validateOptionalCurrencyField(
    body,
    fieldName,
    errors
) {
    const value = body[fieldName];

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    if (!isValidCurrency(value)) {
        errors.push(
            `${fieldName} must be NGN.`
        );
    }
}

function normalizeFeeBody(body) {
    if (body.schoolId !== undefined) {
        body.schoolId = normalizeIntegerId(
            body.schoolId
        );
    }

    if (body.studentId !== undefined) {
        body.studentId = normalizeIntegerId(
            body.studentId
        );
    }

    if (body.sessionId !== undefined) {
        body.sessionId = normalizeIntegerId(
            body.sessionId
        );
    }

    if (body.academicSessionId !== undefined) {
        body.academicSessionId =
            normalizeIntegerId(
                body.academicSessionId
            );
    }

    if (body.termId !== undefined) {
        body.termId = normalizeIntegerId(
            body.termId
        );
    }

    if (body.classId !== undefined) {
        body.classId = normalizeIntegerId(
            body.classId
        );
    }

    if (body.classArmId !== undefined) {
        body.classArmId = normalizeIntegerId(
            body.classArmId
        );
    }

    if (body.feeCategoryId !== undefined) {
        body.feeCategoryId = normalizeIntegerId(
            body.feeCategoryId
        );
    }

    if (body.feeId !== undefined) {
        body.feeId = normalizeIntegerId(
            body.feeId
        );
    }

    if (body.name !== undefined) {
        body.name = normalizeString(body.name);
    }

    if (body.description !== undefined) {
        body.description =
            typeof body.description === "string"
                ? body.description.trim()
                : body.description;
    }

    if (body.amount !== undefined) {
        body.amount = normalizeMoney(body.amount);
    }

    if (body.totalAmount !== undefined) {
        body.totalAmount = normalizeMoney(
            body.totalAmount
        );
    }

    if (body.paidAmount !== undefined) {
        body.paidAmount = normalizeMoney(
            body.paidAmount
        );
    }

    if (body.balance !== undefined) {
        body.balance = normalizeMoney(
            body.balance
        );
    }

    if (body.paymentAmount !== undefined) {
        body.paymentAmount = normalizeMoney(
            body.paymentAmount
        );
    }

    if (body.currency !== undefined) {
        body.currency = normalizeCurrency(
            body.currency
        );
    }

    if (body.paymentMethod !== undefined) {
        body.paymentMethod =
            normalizePaymentMethod(
                body.paymentMethod
            );
    }

    if (body.status !== undefined) {
        body.status = normalizeStatus(
            body.status
        );
    }

    if (body.paymentStatus !== undefined) {
        body.paymentStatus = normalizeStatus(
            body.paymentStatus
        );
    }

    if (body.reference !== undefined) {
        body.reference = normalizeString(
            body.reference
        );
    }

    if (body.paymentReference !== undefined) {
        body.paymentReference =
            normalizeString(
                body.paymentReference
            );
    }

    if (body.receiptNumber !== undefined) {
        body.receiptNumber = normalizeString(
            body.receiptNumber
        );
    }

    if (body.feeDate !== undefined) {
        body.feeDate =
            typeof body.feeDate === "string"
                ? body.feeDate.trim()
                : body.feeDate;
    }

    if (body.paymentDate !== undefined) {
        body.paymentDate =
            typeof body.paymentDate === "string"
                ? body.paymentDate.trim()
                : body.paymentDate;
    }

    return body;
}

function validateCreateFee(req, res, next) {
    const body = getRequestBody(req);
    const errors = [];

    if (body.schoolId !== undefined) {
        validateOptionalIdField(
            body,
            "schoolId",
            errors
        );
    }

    if (body.studentId !== undefined) {
        validateOptionalIdField(
            body,
            "studentId",
            errors
        );
    }

    if (body.academicSessionId !== undefined) {
        validateOptionalIdField(
            body,
            "academicSessionId",
            errors
        );
    }

    if (body.sessionId !== undefined) {
        validateOptionalIdField(
            body,
            "sessionId",
            errors
        );
    }

    if (body.termId !== undefined) {
        validateOptionalIdField(
            body,
            "termId",
            errors
        );
    }

    if (body.classId !== undefined) {
        validateOptionalIdField(
            body,
            "classId",
            errors
        );
    }

    if (body.classArmId !== undefined) {
        validateOptionalIdField(
            body,
            "classArmId",
            errors
        );
    }

    if (body.feeCategoryId !== undefined) {
        validateOptionalIdField(
            body,
            "feeCategoryId",
            errors
        );
    }

    validateRequiredNameField(
        body,
        "name",
        errors
    );

    if (body.description !== undefined) {
        validateOptionalDescriptionField(
            body,
            "description",
            errors
        );
    }

    validateRequiredMoneyField(
        body,
        "amount",
        errors
    );

    if (body.currency !== undefined) {
        validateOptionalCurrencyField(
            body,
            "currency",
            errors
        );
    }

    if (body.status !== undefined) {
        validateOptionalFeeStatusField(
            body,
            "status",
            errors
        );
    }

    if (body.feeDate !== undefined) {
        validateOptionalDateField(
            body,
            "feeDate",
            errors
        );
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    req.body = normalizeFeeBody(body);

    return next();
}

function validateUpdateFee(req, res, next) {
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

    if (body.studentId !== undefined) {
        validateOptionalIdField(
            body,
            "studentId",
            errors
        );
    }

    if (body.academicSessionId !== undefined) {
        validateOptionalIdField(
            body,
            "academicSessionId",
            errors
        );
    }

    if (body.sessionId !== undefined) {
        validateOptionalIdField(
            body,
            "sessionId",
            errors
        );
    }

    if (body.termId !== undefined) {
        validateOptionalIdField(
            body,
            "termId",
            errors
        );
    }

    if (body.classId !== undefined) {
        validateOptionalIdField(
            body,
            "classId",
            errors
        );
    }

    if (body.classArmId !== undefined) {
        validateOptionalIdField(
            body,
            "classArmId",
            errors
        );
    }

    if (body.feeCategoryId !== undefined) {
        validateOptionalIdField(
            body,
            "feeCategoryId",
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

    if (body.description !== undefined) {
        validateOptionalDescriptionField(
            body,
            "description",
            errors
        );
    }

    if (body.amount !== undefined) {
        validateOptionalMoneyField(
            body,
            "amount",
            errors
        );
    }

    if (body.currency !== undefined) {
        validateOptionalCurrencyField(
            body,
            "currency",
            errors
        );
    }

    if (body.status !== undefined) {
        validateOptionalFeeStatusField(
            body,
            "status",
            errors
        );
    }

    if (body.feeDate !== undefined) {
        validateOptionalDateField(
            body,
            "feeDate",
            errors
        );
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    req.body = normalizeFeeBody(body);

    return next();
}

function validateCreatePayment(req, res, next) {
    const body = getRequestBody(req);
    const errors = [];

    if (body.schoolId !== undefined) {
        validateOptionalIdField(
            body,
            "schoolId",
            errors
        );
    }

    if (body.studentId !== undefined) {
        validateOptionalIdField(
            body,
            "studentId",
            errors
        );
    }

    if (body.feeId !== undefined) {
        validateOptionalIdField(
            body,
            "feeId",
            errors
        );
    }

    if (body.academicSessionId !== undefined) {
        validateOptionalIdField(
            body,
            "academicSessionId",
            errors
        );
    }

    if (body.sessionId !== undefined) {
        validateOptionalIdField(
            body,
            "sessionId",
            errors
        );
    }

    if (body.termId !== undefined) {
        validateOptionalIdField(
            body,
            "termId",
            errors
        );
    }

    validateRequiredMoneyField(
        body,
        "amount",
        errors
    );

    if (body.paymentAmount !== undefined) {
        validateOptionalMoneyField(
            body,
            "paymentAmount",
            errors
        );
    }

    if (body.currency !== undefined) {
        validateOptionalCurrencyField(
            body,
            "currency",
            errors
        );
    }

    if (body.paymentMethod !== undefined) {
        validateOptionalPaymentMethodField(
            body,
            "paymentMethod",
            errors
        );
    }

    if (body.paymentStatus !== undefined) {
        validateOptionalPaymentStatusField(
            body,
            "paymentStatus",
            errors
        );
    }

    if (body.status !== undefined) {
        validateOptionalPaymentStatusField(
            body,
            "status",
            errors
        );
    }

    if (body.reference !== undefined) {
        validateOptionalReferenceField(
            body,
            "reference",
            errors
        );
    }

    if (body.paymentReference !== undefined) {
        validateOptionalReferenceField(
            body,
            "paymentReference",
            errors
        );
    }

    if (body.receiptNumber !== undefined) {
        validateOptionalReceiptField(
            body,
            "receiptNumber",
            errors
        );
    }

    if (body.paymentDate !== undefined) {
        validateOptionalDateField(
            body,
            "paymentDate",
            errors
        );
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    req.body = normalizeFeeBody(body);

    return next();
}

function validateUpdatePayment(req, res, next) {
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

    if (body.studentId !== undefined) {
        validateOptionalIdField(
            body,
            "studentId",
            errors
        );
    }

    if (body.feeId !== undefined) {
        validateOptionalIdField(
            body,
            "feeId",
            errors
        );
    }

    if (body.academicSessionId !== undefined) {
        validateOptionalIdField(
            body,
            "academicSessionId",
            errors
        );
    }

    if (body.sessionId !== undefined) {
        validateOptionalIdField(
            body,
            "sessionId",
            errors
        );
    }

    if (body.termId !== undefined) {
        validateOptionalIdField(
            body,
            "termId",
            errors
        );
    }

    if (body.amount !== undefined) {
        validateOptionalMoneyField(
            body,
            "amount",
            errors
        );
    }

    if (body.paymentAmount !== undefined) {
        validateOptionalMoneyField(
            body,
            "paymentAmount",
            errors
        );
    }

    if (body.currency !== undefined) {
        validateOptionalCurrencyField(
            body,
            "currency",
            errors
        );
    }

    if (body.paymentMethod !== undefined) {
        validateOptionalPaymentMethodField(
            body,
            "paymentMethod",
            errors
        );
    }

    if (body.paymentStatus !== undefined) {
        validateOptionalPaymentStatusField(
            body,
            "paymentStatus",
            errors
        );
    }

    if (body.status !== undefined) {
        validateOptionalPaymentStatusField(
            body,
            "status",
            errors
        );
    }

    if (body.reference !== undefined) {
        validateOptionalReferenceField(
            body,
            "reference",
            errors
        );
    }

    if (body.paymentReference !== undefined) {
        validateOptionalReferenceField(
            body,
            "paymentReference",
            errors
        );
    }

    if (body.receiptNumber !== undefined) {
        validateOptionalReceiptField(
            body,
            "receiptNumber",
            errors
        );
    }

    if (body.paymentDate !== undefined) {
        validateOptionalDateField(
            body,
            "paymentDate",
            errors
        );
    }

    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    req.body = normalizeFeeBody(body);

    return next();
}

function validateFeeId(req, res, next) {
    const id =
        req.params &&
        (req.params.id || req.params.feeId);

    if (!isValidIntegerId(id)) {
        return sendValidationError(res, [
            "A valid positive fee ID is required."
        ]);
    }

    if (req.params.id !== undefined) {
        req.params.id = String(Number(id));
    }

    if (req.params.feeId !== undefined) {
        req.params.feeId = String(Number(id));
    }

    return next();
}

function validatePaymentId(req, res, next) {
    const id =
        req.params &&
        (req.params.id || req.params.paymentId);

    if (!isValidIntegerId(id)) {
        return sendValidationError(res, [
            "A valid positive payment ID is required."
        ]);
    }

    if (req.params.id !== undefined) {
        req.params.id = String(Number(id));
    }

    if (req.params.paymentId !== undefined) {
        req.params.paymentId = String(Number(id));
    }

    return next();
}

function validateFeeIdValue(value) {
    return isValidIntegerId(value);
}

function validatePaymentIdValue(value) {
    return isValidIntegerId(value);
}

function validateFeeAmountValue(value) {
    return isValidMoneyInput(value);
}

function validatePaymentAmountValue(value) {
    return isValidMoneyInput(value);
}

function validateFeeDateValue(value) {
    return isValidDate(value);
}

function validatePaymentDateValue(value) {
    return isValidDate(value);
}

function validatePaymentMethodValue(value) {
    return isValidPaymentMethod(value);
}

function validatePaymentStatusValue(value) {
    return isValidPaymentStatus(value);
}

function validateFeeStatusValue(value) {
    return isValidFeeStatus(value);
}

function validateCurrencyValue(value) {
    return isValidCurrency(value);
}

module.exports = {
    validateCreateFee,
    validateUpdateFee,
    validateCreatePayment,
    validateUpdatePayment,
    validateFeeId,
    validatePaymentId,

    validateFeeIdValue,
    validatePaymentIdValue,
    validateFeeAmountValue,
    validatePaymentAmountValue,
    validateFeeDateValue,
    validatePaymentDateValue,
    validatePaymentMethodValue,
    validatePaymentStatusValue,
    validateFeeStatusValue,
    validateCurrencyValue,

    isPlainObject,
    normalizeString,
    normalizeCode,
    normalizeStatus,
    normalizePaymentMethod,
    normalizeCurrency,
    normalizeMoney,

    isNonEmptyString,
    isValidName,
    isValidDescription,
    isValidReference,
    isValidReceiptNumber,
    isValidIntegerId,
    normalizeIntegerId,
    isValidMoney,
    isValidMoneyInput,
    isValidDate,
    isValidOptionalDate,
    isValidFeeStatus,
    isValidPaymentStatus,
    isValidPaymentMethod,
    isValidCurrency,

    ALLOWED_FEE_STATUSES,
    ALLOWED_PAYMENT_STATUSES,
    ALLOWED_PAYMENT_METHODS,
    ALLOWED_CURRENCIES,

    MAX_NAME,
    MAX_DESCRIPTION,
    MAX_REFERENCE,
    MAX_RECEIPT_NUMBER,
    MAX_PAYMENT_METHOD,
    MAX_CURRENCY,
    MAX_MONEY
};