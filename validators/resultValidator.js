"use strict";

/*
|--------------------------------------------------------------------------
| RESULT VALIDATOR
|--------------------------------------------------------------------------
|
| Central validation layer for student academic result requests.
|
| This file handles:
| - Result record validation
| - Student and academic relationship IDs
| - Subject and class references
| - Score validation
| - Grade and remark validation
| - Result status validation
| - Examination/assessment information
| - Result dates
| - Input normalization
|
| This file does NOT handle:
| - Database queries
| - SQL
| - Grade calculation
| - Average calculation
| - Position calculation
| - Result publication logic
| - Authentication
| - Authorization
| - Roles
| - Permissions
| - Controller business logic
|
|--------------------------------------------------------------------------
*/

const MAX_TEXT = 150;
const MAX_REMARK = 500;
const MAX_CODE = 50;
const MAX_EXAMINATION = 150;

const MIN_SCORE = 0;
const MAX_SCORE = 100;

const ALLOWED_STATUSES = new Set([
    "draft",
    "submitted",
    "approved",
    "published",
    "locked",
    "cancelled"
]);

const ALLOWED_GRADES = new Set([
    "A",
    "B",
    "C",
    "D",
    "E",
    "F"
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

function normalizeGrade(value) {
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

function isValidText(value) {
    if (!isNonEmptyString(value, MAX_TEXT)) {
        return false;
    }

    return /^[A-Za-z0-9][A-Za-z0-9 .,'()&/\\-]*$/.test(
        value.trim()
    );
}

function isValidRemark(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    return (
        typeof value === "string" &&
        value.trim().length <= MAX_REMARK
    );
}

function isValidCode(value) {
    if (!isNonEmptyString(value, MAX_CODE)) {
        return false;
    }

    return /^[A-Za-z0-9][A-Za-z0-9._/\\- ]*$/.test(
        value.trim()
    );
}

function isValidExaminationName(value) {
    if (!isNonEmptyString(value, MAX_EXAMINATION)) {
        return false;
    }

    return /^[A-Za-z0-9][A-Za-z0-9 .,'()&/\\-]*$/.test(
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

function isValidScore(value) {
    if (typeof value === "number") {
        return (
            Number.isFinite(value) &&
            value >= MIN_SCORE &&
            value <= MAX_SCORE
        );
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

        return (
            Number.isFinite(number) &&
            number >= MIN_SCORE &&
            number <= MAX_SCORE
        );
    }

    return false;
}

function normalizeScore(value) {
    if (!isValidScore(value)) {
        return value;
    }

    return Number(Number(value).toFixed(2));
}

function isValidOptionalScore(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    return isValidScore(value);
}

function isValidGrade(value) {
    if (typeof value !== "string") {
        return false;
    }

    return ALLOWED_GRADES.has(
        normalizeGrade(value)
    );
}

function isValidOptionalGrade(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    return isValidGrade(value);
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

function isValidDate(value) {
    if (typeof value !== "string") {
        return false;
    }

    const normalized = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        return false;
    }

    const date = new Date(
        `${normalized}T00:00:00Z`
    );

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return (
        date.toISOString().slice(0, 10) ===
        normalized
    );
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

function validateRequiredTextField(
    body,
    fieldName,
    errors
) {
    if (!isValidText(body[fieldName])) {
        errors.push(
            `${fieldName} is required and must be valid text.`
        );
    }
}

function validateOptionalTextField(
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

    if (!isValidText(value)) {
        errors.push(
            `${fieldName} must contain valid text.`
        );
    }
}

function validateOptionalRemarkField(
    body,
    fieldName,
    errors
) {
    if (!isValidRemark(body[fieldName])) {
        errors.push(
            `${fieldName} must not exceed ${MAX_REMARK} characters.`
        );
    }
}

function validateOptionalCodeField(
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

    if (!isValidCode(value)) {
        errors.push(
            `${fieldName} must be a valid code.`
        );
    }
}

function validateOptionalExaminationField(
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

    if (!isValidExaminationName(value)) {
        errors.push(
            `${fieldName} must be a valid examination name.`
        );
    }
}

function validateOptionalScoreField(
    body,
    fieldName,
    errors
) {
    if (!isValidOptionalScore(body[fieldName])) {
        errors.push(
            `${fieldName} must be a number between 0 and 100.`
        );
    }
}

function validateOptionalGradeField(
    body,
    fieldName,
    errors
) {
    if (!isValidOptionalGrade(body[fieldName])) {
        errors.push(
            `${fieldName} must be one of: A, B, C, D, E, F.`
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
            `${fieldName} must be one of: draft, submitted, approved, published, locked, cancelled.`
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

function normalizeResultBody(body) {
    const idFields = [
        "schoolId",
        "studentId",
        "academicSessionId",
        "sessionId",
        "termId",
        "classId",
        "classArmId",
        "subjectId",
        "resultId"
    ];

    idFields.forEach((fieldName) => {
        if (body[fieldName] !== undefined) {
            body[fieldName] = normalizeIntegerId(
                body[fieldName]
            );
        }
    });

    const textFields = [
        "studentNumber",
        "studentName",
        "subjectName",
        "className",
        "classArmName"
    ];

    textFields.forEach((fieldName) => {
        if (body[fieldName] !== undefined) {
            body[fieldName] = normalizeString(
                body[fieldName]
            );
        }
    });

    const codeFields = [
        "studentCode",
        "subjectCode",
        "resultCode"
    ];

    codeFields.forEach((fieldName) => {
        if (body[fieldName] !== undefined) {
            body[fieldName] = normalizeCode(
                body[fieldName]
            );
        }
    });

    const examinationFields = [
        "examination",
        "examinationName",
        "assessmentName"
    ];

    examinationFields.forEach((fieldName) => {
        if (body[fieldName] !== undefined) {
            body[fieldName] = normalizeString(
                body[fieldName]
            );
        }
    });

    const scoreFields = [
        "score",
        "caScore",
        "examScore",
        "totalScore",
        "firstTestScore",
        "secondTestScore",
        "thirdTestScore",
        "assignmentScore",
        "continuousAssessment",
        "continuousAssessmentScore"
    ];

    scoreFields.forEach((fieldName) => {
        if (body[fieldName] !== undefined) {
            body[fieldName] = normalizeScore(
                body[fieldName]
            );
        }
    });

    if (body.grade !== undefined) {
        body.grade = normalizeGrade(
            body.grade
        );
    }

    if (body.status !== undefined) {
        body.status = normalizeStatus(
            body.status
        );
    }

    if (body.remark !== undefined) {
        body.remark =
            typeof body.remark === "string"
                ? body.remark.trim()
                : body.remark;
    }

    if (body.remarks !== undefined) {
        body.remarks =
            typeof body.remarks === "string"
                ? body.remarks.trim()
                : body.remarks;
    }

    const dateFields = [
        "resultDate",
        "assessmentDate",
        "examDate",
        "publishedAt"
    ];

    dateFields.forEach((fieldName) => {
        if (body[fieldName] !== undefined) {
            if (typeof body[fieldName] === "string") {
                body[fieldName] =
                    body[fieldName].trim();
            }
        }
    });

    return body;
}

function validateCreateResult(req, res, next) {
    const body = getRequestBody(req);
    const errors = [];

    validateRequiredIdField(
        body,
        "studentId",
        errors
    );

    if (body.schoolId !== undefined) {
        validateOptionalIdField(
            body,
            "schoolId",
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

    validateRequiredIdField(
        body,
        "subjectId",
        errors
    );

    if (body.examination !== undefined) {
        validateOptionalExaminationField(
            body,
            "examination",
            errors
        );
    }

    if (body.examinationName !== undefined) {
        validateOptionalExaminationField(
            body,
            "examinationName",
            errors
        );
    }

    if (body.assessmentName !== undefined) {
        validateOptionalExaminationField(
            body,
            "assessmentName",
            errors
        );
    }

    if (body.score !== undefined) {
        validateOptionalScoreField(
            body,
            "score",
            errors
        );
    }

    if (body.caScore !== undefined) {
        validateOptionalScoreField(
            body,
            "caScore",
            errors
        );
    }

    if (body.examScore !== undefined) {
        validateOptionalScoreField(
            body,
            "examScore",
            errors
        );
    }

    if (body.totalScore !== undefined) {
        validateOptionalScoreField(
            body,
            "totalScore",
            errors
        );
    }

    if (body.firstTestScore !== undefined) {
        validateOptionalScoreField(
            body,
            "firstTestScore",
            errors
        );
    }

    if (body.secondTestScore !== undefined) {
        validateOptionalScoreField(
            body,
            "secondTestScore",
            errors
        );
    }

    if (body.thirdTestScore !== undefined) {
        validateOptionalScoreField(
            body,
            "thirdTestScore",
            errors
        );
    }

    if (body.assignmentScore !== undefined) {
        validateOptionalScoreField(
            body,
            "assignmentScore",
            errors
        );
    }

    if (body.continuousAssessment !== undefined) {
        validateOptionalScoreField(
            body,
            "continuousAssessment",
            errors
        );
    }

    if (
        body.continuousAssessmentScore !==
        undefined
    ) {
        validateOptionalScoreField(
            body,
            "continuousAssessmentScore",
            errors
        );
    }

    if (body.grade !== undefined) {
        validateOptionalGradeField(
            body,
            "grade",
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

    if (body.remark !== undefined) {
        validateOptionalRemarkField(
            body,
            "remark",
            errors
        );
    }

    if (body.remarks !== undefined) {
        validateOptionalRemarkField(
            body,
            "remarks",
            errors
        );
    }

    if (body.resultDate !== undefined) {
        validateOptionalDateField(
            body,
            "resultDate",
            errors
        );
    }

    if (body.assessmentDate !== undefined) {
        validateOptionalDateField(
            body,
            "assessmentDate",
            errors
        );
    }

    if (body.examDate !== undefined) {
        validateOptionalDateField(
            body,
            "examDate",
            errors
        );
    }

    if (errors.length > 0) {
        return sendValidationError(
            res,
            errors
        );
    }

    req.body = normalizeResultBody(body);

    return next();
}

function validateUpdateResult(req, res, next) {
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

    if (body.subjectId !== undefined) {
        validateOptionalIdField(
            body,
            "subjectId",
            errors
        );
    }

    if (body.examination !== undefined) {
        validateOptionalExaminationField(
            body,
            "examination",
            errors
        );
    }

    if (body.examinationName !== undefined) {
        validateOptionalExaminationField(
            body,
            "examinationName",
            errors
        );
    }

    if (body.assessmentName !== undefined) {
        validateOptionalExaminationField(
            body,
            "assessmentName",
            errors
        );
    }

    if (body.score !== undefined) {
        validateOptionalScoreField(
            body,
            "score",
            errors
        );
    }

    if (body.caScore !== undefined) {
        validateOptionalScoreField(
            body,
            "caScore",
            errors
        );
    }

    if (body.examScore !== undefined) {
        validateOptionalScoreField(
            body,
            "examScore",
            errors
        );
    }

    if (body.totalScore !== undefined) {
        validateOptionalScoreField(
            body,
            "totalScore",
            errors
        );
    }

    if (body.firstTestScore !== undefined) {
        validateOptionalScoreField(
            body,
            "firstTestScore",
            errors
        );
    }

    if (body.secondTestScore !== undefined) {
        validateOptionalScoreField(
            body,
            "secondTestScore",
            errors
        );
    }

    if (body.thirdTestScore !== undefined) {
        validateOptionalScoreField(
            body,
            "thirdTestScore",
            errors
        );
    }

    if (body.assignmentScore !== undefined) {
        validateOptionalScoreField(
            body,
            "assignmentScore",
            errors
        );
    }

    if (body.continuousAssessment !== undefined) {
        validateOptionalScoreField(
            body,
            "continuousAssessment",
            errors
        );
    }

    if (
        body.continuousAssessmentScore !==
        undefined
    ) {
        validateOptionalScoreField(
            body,
            "continuousAssessmentScore",
            errors
        );
    }

    if (body.grade !== undefined) {
        validateOptionalGradeField(
            body,
            "grade",
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

    if (body.remark !== undefined) {
        validateOptionalRemarkField(
            body,
            "remark",
            errors
        );
    }

    if (body.remarks !== undefined) {
        validateOptionalRemarkField(
            body,
            "remarks",
            errors
        );
    }

    if (body.resultDate !== undefined) {
        validateOptionalDateField(
            body,
            "resultDate",
            errors
        );
    }

    if (body.assessmentDate !== undefined) {
        validateOptionalDateField(
            body,
            "assessmentDate",
            errors
        );
    }

    if (body.examDate !== undefined) {
        validateOptionalDateField(
            body,
            "examDate",
            errors
        );
    }

    if (errors.length > 0) {
        return sendValidationError(
            res,
            errors
        );
    }

    req.body = normalizeResultBody(body);

    return next();
}

function validateResultId(req, res, next) {
    const id =
        req.params &&
        (req.params.id || req.params.resultId);

    if (!isValidIntegerId(id)) {
        return sendValidationError(
            res,
            [
                "A valid positive result ID is required."
            ]
        );
    }

    if (req.params.id !== undefined) {
        req.params.id = String(Number(id));
    }

    if (req.params.resultId !== undefined) {
        req.params.resultId = String(Number(id));
    }

    return next();
}

function validateStudentResultQuery(
    req,
    res,
    next
) {
    const source = req.query || {};
    const errors = [];

    const idFields = [
        "studentId",
        "schoolId",
        "academicSessionId",
        "sessionId",
        "termId",
        "classId",
        "classArmId",
        "subjectId"
    ];

    idFields.forEach((fieldName) => {
        if (source[fieldName] !== undefined) {
            if (!isValidIntegerId(source[fieldName])) {
                errors.push(
                    `${fieldName} must be a valid positive integer.`
                );
            }
        }
    });

    if (source.status !== undefined) {
        if (!isValidStatus(source.status)) {
            errors.push(
                "status must be one of: draft, submitted, approved, published, locked, cancelled."
            );
        }
    }

    if (source.grade !== undefined) {
        if (!isValidGrade(source.grade)) {
            errors.push(
                "grade must be one of: A, B, C, D, E, F."
            );
        }
    }

    if (source.fromDate !== undefined) {
        if (!isValidDate(source.fromDate)) {
            errors.push(
                "fromDate must be a valid date in YYYY-MM-DD format."
            );
        }
    }

    if (source.toDate !== undefined) {
        if (!isValidDate(source.toDate)) {
            errors.push(
                "toDate must be a valid date in YYYY-MM-DD format."
            );
        }
    }

    if (
        isValidDate(source.fromDate) &&
        isValidDate(source.toDate) &&
        source.fromDate > source.toDate
    ) {
        errors.push(
            "fromDate cannot be later than toDate."
        );
    }

    if (errors.length > 0) {
        return sendValidationError(
            res,
            errors
        );
    }

    idFields.forEach((fieldName) => {
        if (source[fieldName] !== undefined) {
            source[fieldName] = normalizeIntegerId(
                source[fieldName]
            );
        }
    });

    if (source.status !== undefined) {
        source.status = normalizeStatus(
            source.status
        );
    }

    if (source.grade !== undefined) {
        source.grade = normalizeGrade(
            source.grade
        );
    }

    if (source.fromDate !== undefined) {
        source.fromDate = source.fromDate.trim();
    }

    if (source.toDate !== undefined) {
        source.toDate = source.toDate.trim();
    }

    req.query = source;

    return next();
}

function validateResultIdValue(value) {
    return isValidIntegerId(value);
}

function validateStudentIdValue(value) {
    return isValidIntegerId(value);
}

function validateSubjectIdValue(value) {
    return isValidIntegerId(value);
}

function validateScoreValue(value) {
    return isValidScore(value);
}

function validateGradeValue(value) {
    return isValidGrade(value);
}

function validateResultStatusValue(value) {
    return isValidStatus(value);
}

function validateResultDateValue(value) {
    return isValidDate(value);
}

module.exports = {
    validateCreateResult,
    validateUpdateResult,
    validateResultId,
    validateStudentResultQuery,

    validateResultIdValue,
    validateStudentIdValue,
    validateSubjectIdValue,
    validateScoreValue,
    validateGradeValue,
    validateResultStatusValue,
    validateResultDateValue,

    isPlainObject,
    normalizeString,
    normalizeCode,
    normalizeStatus,
    normalizeGrade,
    normalizeIntegerId,
    normalizeScore,

    isNonEmptyString,
    isValidText,
    isValidRemark,
    isValidCode,
    isValidExaminationName,
    isValidIntegerId,
    isValidScore,
    isValidOptionalScore,
    isValidGrade,
    isValidOptionalGrade,
    isValidStatus,
    isValidOptionalStatus,
    isValidDate,
    isValidOptionalDate,

    ALLOWED_STATUSES,
    ALLOWED_GRADES,

    MIN_SCORE,
    MAX_SCORE,
    MAX_TEXT,
    MAX_REMARK,
    MAX_CODE,
    MAX_EXAMINATION
};