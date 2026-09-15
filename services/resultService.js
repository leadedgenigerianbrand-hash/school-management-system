"use strict";

/*
|--------------------------------------------------------------------------
| RESULT SERVICE
|--------------------------------------------------------------------------
|
| This service is the business/coordination layer for the Results module.
|
| Architecture:
|
| Controller
| ↓
| Result Service
| ↓
| Result Model
| ↓
| PostgreSQL
|
| The service does NOT contain direct SQL for the results table.
| Database operations belong to:
|
| models/resultModel.js
|
| This prevents duplicate database logic and keeps the Results module
| consistent throughout the application.
|--------------------------------------------------------------------------
*/

const resultModel = require("../models/resultModel");

/*
|--------------------------------------------------------------------------
| VALIDATION HELPERS
|--------------------------------------------------------------------------
*/

function requireValue(value, message) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        throw new Error(message);
    }

    return value;
}

function normalizeOptionalValue(value) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    return value;
}

function normalizeBoolean(value, defaultValue = false) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (
            normalized === "true" ||
            normalized === "1" ||
            normalized === "yes" ||
            normalized === "on"
        ) {
            return true;
        }

        if (
            normalized === "false" ||
            normalized === "0" ||
            normalized === "no" ||
            normalized === "off"
        ) {
            return false;
        }
    }

    return Boolean(value);
}

function normalizeScore(value, defaultValue = 0) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error("Score must be a valid number.");
    }

    return number;
}

/*
|--------------------------------------------------------------------------
| RESULT INPUT NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeResultInput(data = {}) {
    return {
        schoolId:
            data.schoolId ??
            data.school_id,

        studentId:
            data.studentId ??
            data.student_id,

        subjectId:
            data.subjectId ??
            data.subject_id,

        sessionId:
            data.sessionId ??
            data.session_id,

        termId:
            data.termId ??
            data.term_id,

        classId:
            data.classId ??
            data.class_id,

        caScore:
            data.caScore ??
            data.ca_score ??
            0,

        examScore:
            data.examScore ??
            data.exam_score ??
            0,

        totalScore:
            data.totalScore ??
            data.total_score,

        grade: data.grade,

        gradePoint:
            data.gradePoint ??
            data.grade_point,

        position: data.position,

        teacherRemark:
            data.teacherRemark ??
            data.teacher_remark,

        principalRemark:
            data.principalRemark ??
            data.principal_remark,

        isPublished:
            data.isPublished ??
            data.is_published ??
            false
    };
}

/*
|--------------------------------------------------------------------------
| VALIDATE RESULT INPUT
|--------------------------------------------------------------------------
*/

function validateResultInput(data, options = {}) {
    const input = normalizeResultInput(data);

    requireValue(
        input.schoolId,
        "School ID is required."
    );

    requireValue(
        input.studentId,
        "Student ID is required."
    );

    requireValue(
        input.subjectId,
        "Subject ID is required."
    );

    if (options.requireSession !== false) {
        requireValue(
            input.sessionId,
            "Academic session ID is required."
        );
    }

    const ca = normalizeScore(input.caScore, 0);
    const exam = normalizeScore(input.examScore, 0);

    if (ca < 0 || ca > 40) {
        throw new Error(
            "CA score must be between 0 and 40."
        );
    }

    if (exam < 0 || exam > 60) {
        throw new Error(
            "Exam score must be between 0 and 60."
        );
    }

    let total = input.totalScore;

    if (
        total === undefined ||
        total === null ||
        total === ""
    ) {
        total = ca + exam;
    } else {
        total = normalizeScore(total);
    }

    if (total < 0 || total > 100) {
        throw new Error(
            "Total score must be between 0 and 100."
        );
    }

    return {
        ...input,

        schoolId: input.schoolId,

        studentId: input.studentId,

        subjectId: input.subjectId,

        sessionId: input.sessionId,

        termId:
            normalizeOptionalValue(
                input.termId
            ),

        classId:
            normalizeOptionalValue(
                input.classId
            ),

        caScore: ca,

        examScore: exam,

        totalScore: total,

        grade:
            normalizeOptionalValue(
                input.grade
            ),

        gradePoint:
            input.gradePoint === undefined ||
            input.gradePoint === null ||
            input.gradePoint === ""
                ? null
                : normalizeScore(
                    input.gradePoint
                ),

        position:
            input.position === undefined ||
            input.position === null ||
            input.position === ""
                ? null
                : input.position,

        teacherRemark:
            normalizeOptionalValue(
                input.teacherRemark
            ),

        principalRemark:
            normalizeOptionalValue(
                input.principalRemark
            ),

        isPublished:
            normalizeBoolean(
                input.isPublished,
                false
            )
    };
}

/*
|--------------------------------------------------------------------------
| GET STUDENT RESULTS
|--------------------------------------------------------------------------
*/

async function getStudentResults(
    studentId,
    schoolId,
    filters = {}
) {
    requireValue(
        studentId,
        "Student ID is required."
    );

    requireValue(
        schoolId,
        "School ID is required."
    );

    const {
        sessionId = null,
        termId = null,
        subjectId = null
    } = filters || {};

    return resultModel.getStudentResults(
        studentId,
        schoolId,
        {
            sessionId:
                normalizeOptionalValue(
                    sessionId
                ),

            termId:
                normalizeOptionalValue(
                    termId
                ),

            subjectId:
                normalizeOptionalValue(
                    subjectId
                )
        }
    );
}

/*
|--------------------------------------------------------------------------
| GET RESULT BY ID
|--------------------------------------------------------------------------
*/

async function getResultById(
    resultId,
    schoolId
) {
    requireValue(
        resultId,
        "Result ID is required."
    );

    requireValue(
        schoolId,
        "School ID is required."
    );

    return resultModel.getResultById(
        resultId,
        schoolId
    );
}

/*
|--------------------------------------------------------------------------
| FIND EXISTING RESULT
|--------------------------------------------------------------------------
*/

async function findExistingResult(data = {}) {
    const input = normalizeResultInput(data);

    requireValue(
        input.studentId,
        "Student ID is required."
    );

    requireValue(
        input.subjectId,
        "Subject ID is required."
    );

    requireValue(
        input.schoolId,
        "School ID is required."
    );

    return resultModel.findExistingResult({
        studentId: input.studentId,

        subjectId: input.subjectId,

        sessionId:
            normalizeOptionalValue(
                input.sessionId
            ),

        termId:
            normalizeOptionalValue(
                input.termId
            ),

        schoolId: input.schoolId
    });
}

/*
|--------------------------------------------------------------------------
| CREATE RESULT
|--------------------------------------------------------------------------
*/

async function createResult(data = {}) {
    const input =
        validateResultInput(data);

    return resultModel.createResult({
        schoolId: input.schoolId,

        studentId: input.studentId,

        subjectId: input.subjectId,

        sessionId: input.sessionId,

        termId: input.termId,

        classId: input.classId,

        caScore: input.caScore,

        examScore: input.examScore,

        totalScore: input.totalScore,

        grade: input.grade,

        gradePoint: input.gradePoint,

        position: input.position,

        teacherRemark:
            input.teacherRemark,

        principalRemark:
            input.principalRemark,

        isPublished:
            input.isPublished
    });
}

/*
|--------------------------------------------------------------------------
| CREATE BULK RESULTS
|--------------------------------------------------------------------------
|
| Bulk creation is deliberately coordinated here rather than duplicating
| SQL. Every individual result goes through the finalized result model.
|--------------------------------------------------------------------------
*/

async function createBulkResults(
    results = [],
    schoolId = null
) {
    if (!Array.isArray(results)) {
        throw new Error(
            "Results must be provided as an array."
        );
    }

    requireValue(
        schoolId,
        "School ID is required."
    );

    if (!results.length) {
        return [];
    }

    const createdResults = [];

    for (const item of results) {
        const input = {
            ...item,

            schoolId:
                item.schoolId ??
                item.school_id ??
                schoolId
        };

        const created =
            await createResult(input);

        createdResults.push(created);
    }

    return createdResults;
}

/*
|--------------------------------------------------------------------------
| UPDATE RESULT
|--------------------------------------------------------------------------
*/

async function updateResult(
    resultId,
    schoolId,
    data = {}
) {
    requireValue(
        resultId,
        "Result ID is required."
    );

    requireValue(
        schoolId,
        "School ID is required."
    );

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error(
            "Result update data must be an object."
        );
    }

    const updateData = {};

    const fieldMap = {
        studentId: "studentId",
        student_id: "studentId",

        subjectId: "subjectId",
        subject_id: "subjectId",

        sessionId: "sessionId",
        session_id: "sessionId",

        termId: "termId",
        term_id: "termId",

        classId: "classId",
        class_id: "classId",

        caScore: "caScore",
        ca_score: "caScore",

        examScore: "examScore",
        exam_score: "examScore",

        totalScore: "totalScore",
        total_score: "totalScore",

        grade: "grade",

        gradePoint: "gradePoint",
        grade_point: "gradePoint",

        position: "position",

        teacherRemark: "teacherRemark",
        teacher_remark: "teacherRemark",

        principalRemark: "principalRemark",
        principal_remark: "principalRemark",

        isPublished: "isPublished",
        is_published: "isPublished"
    };

    for (const key of Object.keys(data)) {
        const mappedKey = fieldMap[key];

        if (mappedKey) {
            updateData[mappedKey] =
                data[key];
        }
    }

    if (
        updateData.studentId !== undefined &&
        !updateData.studentId
    ) {
        throw new Error(
            "Student ID cannot be empty."
        );
    }

    if (
        updateData.subjectId !== undefined &&
        !updateData.subjectId
    ) {
        throw new Error(
            "Subject ID cannot be empty."
        );
    }

    if (
        updateData.sessionId !== undefined &&
        !updateData.sessionId
    ) {
        throw new Error(
            "Academic session ID cannot be empty."
        );
    }

    if (updateData.caScore !== undefined) {
        updateData.caScore =
            normalizeScore(
                updateData.caScore
            );

        if (
            updateData.caScore < 0 ||
            updateData.caScore > 40
        ) {
            throw new Error(
                "CA score must be between 0 and 40."
            );
        }
    }

    if (updateData.examScore !== undefined) {
        updateData.examScore =
            normalizeScore(
                updateData.examScore
            );

        if (
            updateData.examScore < 0 ||
            updateData.examScore > 60
        ) {
            throw new Error(
                "Exam score must be between 0 and 60."
            );
        }
    }

    if (updateData.totalScore !== undefined) {
        updateData.totalScore =
            normalizeScore(
                updateData.totalScore
            );

        if (
            updateData.totalScore < 0 ||
            updateData.totalScore > 100
        ) {
            throw new Error(
                "Total score must be between 0 and 100."
            );
        }
    }

    if (updateData.isPublished !== undefined) {
        updateData.isPublished =
            normalizeBoolean(
                updateData.isPublished
            );
    }

    return resultModel.updateResult(
        resultId,
        schoolId,
        updateData
    );
}

/*
|--------------------------------------------------------------------------
| DELETE RESULT
|--------------------------------------------------------------------------
*/

async function deleteResult(
    resultId,
    schoolId
) {
    requireValue(
        resultId,
        "Result ID is required."
    );

    requireValue(
        schoolId,
        "School ID is required."
    );

    return resultModel.deleteResult(
        resultId,
        schoolId
    );
}

/*
|--------------------------------------------------------------------------
| GET RESULTS BY CLASS
|--------------------------------------------------------------------------
*/

async function getResultsByClass(
    classId,
    schoolId,
    filters = {}
) {
    requireValue(
        classId,
        "Class ID is required."
    );

    requireValue(
        schoolId,
        "School ID is required."
    );

    const {
        sessionId = null,
        termId = null,
        subjectId = null
    } = filters || {};

    return resultModel.getResultsByClass(
        classId,
        schoolId,
        {
            sessionId:
                normalizeOptionalValue(
                    sessionId
                ),

            termId:
                normalizeOptionalValue(
                    termId
                ),

            subjectId:
                normalizeOptionalValue(
                    subjectId
                )
        }
    );
}

/*
|--------------------------------------------------------------------------
| GET STUDENT RESULT SUMMARY
|--------------------------------------------------------------------------
*/

async function getStudentResultSummary(
    studentId,
    schoolId,
    filters = {}
) {
    requireValue(
        studentId,
        "Student ID is required."
    );

    requireValue(
        schoolId,
        "School ID is required."
    );

    const {
        sessionId = null,
        termId = null
    } = filters || {};

    return resultModel.getStudentResultSummary(
        studentId,
        schoolId,
        {
            sessionId:
                normalizeOptionalValue(
                    sessionId
                ),

            termId:
                normalizeOptionalValue(
                    termId
                )
        }
    );
}

/*
|--------------------------------------------------------------------------
| GET CLASS RESULT STATISTICS
|--------------------------------------------------------------------------
*/

async function getClassResultStatistics(
    classId,
    schoolId,
    filters = {}
) {
    requireValue(
        classId,
        "Class ID is required."
    );

    requireValue(
        schoolId,
        "School ID is required."
    );

    const {
        sessionId = null,
        termId = null
    } = filters || {};

    return resultModel.getClassResultStatistics(
        classId,
        schoolId,
        {
            sessionId:
                normalizeOptionalValue(
                    sessionId
                ),

            termId:
                normalizeOptionalValue(
                    termId
                )
        }
    );
}

/*
|--------------------------------------------------------------------------
| SEARCH RESULTS
|--------------------------------------------------------------------------
*/

async function searchResults(
    searchTerm,
    schoolId
) {
    requireValue(
        schoolId,
        "School ID is required."
    );

    const term =
        String(searchTerm || "").trim();

    if (!term) {
        return [];
    }

    return resultModel.searchResults(
        term,
        schoolId
    );
}

/*
|--------------------------------------------------------------------------
| PUBLISH RESULTS
|--------------------------------------------------------------------------
*/

async function publishResults(data = {}) {
    const schoolId =
        data.schoolId ??
        data.school_id;

    requireValue(
        schoolId,
        "School ID is required."
    );

    return resultModel.publishResults({
        schoolId,

        studentId:
            normalizeOptionalValue(
                data.studentId ??
                data.student_id
            ),

        classId:
            normalizeOptionalValue(
                data.classId ??
                data.class_id
            ),

        sessionId:
            normalizeOptionalValue(
                data.sessionId ??
                data.session_id
            ),

        termId:
            normalizeOptionalValue(
                data.termId ??
                data.term_id
            )
    });
}

/*
|--------------------------------------------------------------------------
| GET PUBLISHED RESULTS
|--------------------------------------------------------------------------
*/

async function getPublishedResults(
    studentId,
    schoolId,
    sessionId = null,
    termId = null
) {
    requireValue(
        studentId,
        "Student ID is required."
    );

    requireValue(
        schoolId,
        "School ID is required."
    );

    return resultModel.getPublishedResults(
        studentId,
        schoolId,
        normalizeOptionalValue(
            sessionId
        ),
        normalizeOptionalValue(
            termId
        )
    );
}

/*
|--------------------------------------------------------------------------
| GRADE CALCULATION
|--------------------------------------------------------------------------
|
| These functions remain available from the service for compatibility with
| controllers and other Results components.
|
| The database model remains responsible for applying the grade when a
| result is created or updated.
|--------------------------------------------------------------------------
*/

function calculateGrade(score) {
    const value = Number(score);

    if (!Number.isFinite(value)) {
        throw new Error(
            "Score must be a valid number."
        );
    }

    if (value >= 75) {
        return "A";
    }

    if (value >= 65) {
        return "B";
    }

    if (value >= 55) {
        return "C";
    }

    if (value >= 45) {
        return "D";
    }

    if (value >= 40) {
        return "E";
    }

    return "F";
}

function calculateGradePoint(score) {
    const value = Number(score);

    if (!Number.isFinite(value)) {
        throw new Error(
            "Score must be a valid number."
        );
    }

    if (value >= 75) {
        return 4.0;
    }

    if (value >= 65) {
        return 3.0;
    }

    if (value >= 55) {
        return 2.0;
    }

    if (value >= 45) {
        return 1.0;
    }

    return 0.0;
}

/*
|--------------------------------------------------------------------------
| COMPATIBILITY ALIASES
|--------------------------------------------------------------------------
|
| These aliases prevent unnecessary controller changes when older Results
| code uses slightly different service function names.
|--------------------------------------------------------------------------
*/

const getStudentResult = getStudentResults;

const getClassResults = getResultsByClass;

const getClassResult = getResultsByClass;

const getResult = getResultById;

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
    getStudentResults,
    getStudentResult,

    getResultById,
    getResult,

    findExistingResult,

    createResult,
    createBulkResults,

    updateResult,
    deleteResult,

    getResultsByClass,
    getClassResults,
    getClassResult,

    getStudentResultSummary,
    getClassResultStatistics,

    searchResults,

    publishResults,
    getPublishedResults,

    calculateGrade,
    calculateGradePoint
};