"use strict";

/*
|--------------------------------------------------------------------------
| RESULT CONTROLLER
|--------------------------------------------------------------------------
|
| HTTP/API controller for the Results module.
|
| Architecture:
|
| Routes
| ↓
| Controller
| ↓
| Result Service
| ↓
| Result Model
| ↓
| PostgreSQL
|
| The controller is responsible for:
|
| - Reading request parameters
| - Resolving the authenticated school
| - Basic request validation
| - Calling the Results service
| - Returning consistent API responses
| - Passing errors to the application error middleware
|
| SQL and database logic do not belong in this file.
|--------------------------------------------------------------------------
*/

const resultService = require("../services/resultService");

const resultModel = require("../models/resultModel");

/*
|--------------------------------------------------------------------------
| SCHOOL RESOLUTION
|--------------------------------------------------------------------------
*/

function getSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.school?.id ||
        req.schoolId ||
        req.body?.schoolId ||
        req.body?.school_id ||
        req.query?.schoolId ||
        req.query?.school_id ||
        null
    );
}

/*
|--------------------------------------------------------------------------
| VALUE HELPERS
|--------------------------------------------------------------------------
*/

function optionalValue(value) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    return value;
}

function requiredValue(value, message) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        throw new Error(message);
    }

    return value;
}

/*
|--------------------------------------------------------------------------
| GET ALL RESULTS
|--------------------------------------------------------------------------
*/

async function getAllResults(req, res, next) {
    try {


const schoolId = getSchoolId(req);

if (!schoolId) {
    return res.status(400).json({
        success: false,
        message: "School ID is required."
    });
}
        const {
            sessionId,
            termId,
            classId,
            subjectId
        } = req.query;

        const results = await resultModel.getAllResults({
            schoolId,

            sessionId: optionalValue(sessionId),

            termId: optionalValue(termId),

            classId: optionalValue(classId),

            subjectId: optionalValue(subjectId)
        });

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error(
            "Get all results error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| CREATE RESULT
|--------------------------------------------------------------------------
*/

async function createResult(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const body = req.body || {};

        requiredValue(
            body.studentId ?? body.student_id,
            "Student ID is required."
        );

        requiredValue(
            body.sessionId ?? body.session_id,
            "Academic session ID is required."
        );

        requiredValue(
            body.subjectId ?? body.subject_id,
            "Subject ID is required."
        );

        const result = await resultService.createResult({
            schoolId,

            studentId:
                body.studentId ??
                body.student_id,

            sessionId:
                body.sessionId ??
                body.session_id,

            termId:
                body.termId ??
                body.term_id,

            subjectId:
                body.subjectId ??
                body.subject_id,

            classId:
                body.classId ??
                body.class_id,

            caScore:
                body.caScore ??
                body.ca_score ??
                0,

            examScore:
                body.examScore ??
                body.exam_score ??
                0,

            totalScore:
                body.totalScore ??
                body.total_score,

            grade: body.grade,

            gradePoint:
                body.gradePoint ??
                body.grade_point,

            position: body.position,

            teacherRemark:
                body.teacherRemark ??
                body.teacher_remark ??
                body.teacherComment ??
                body.teacher_comment ??
                body.remark,

            principalRemark:
                body.principalRemark ??
                body.principal_remark,

            isPublished:
                body.isPublished ??
                body.is_published ??
                false
        });

        return res.status(201).json({
            success: true,
            message: "Result created successfully.",
            data: result
        });
    } catch (error) {
        console.error(
            "Create result error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| CREATE BULK RESULTS
|--------------------------------------------------------------------------
*/

async function createBulkResults(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const results = req.body?.results;

        if (!Array.isArray(results)) {
            return res.status(400).json({
                success: false,
                message: "Results must be provided as an array."
            });
        }

        const createdResults =
            await resultService.createBulkResults(
                results,
                schoolId
            );

        return res.status(201).json({
            success: true,
            message: "Results created successfully.",
            count: createdResults.length,
            data: createdResults
        });
    } catch (error) {
        console.error(
            "Create bulk results error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET RESULT BY ID
|--------------------------------------------------------------------------
*/

async function getResultById(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const resultId = req.params.id;

        if (!resultId) {
            return res.status(400).json({
                success: false,
                message: "Result ID is required."
            });
        }

        const result =
            await resultService.getResultById(
                resultId,
                schoolId
            );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error(
            "Get result by ID error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET STUDENT RESULTS
|--------------------------------------------------------------------------
*/

async function getStudentResults(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const studentId = req.params.studentId;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        const {
            sessionId,
            termId,
            subjectId
        } = req.query;

        const results =
            await resultService.getStudentResults(
                studentId,
                schoolId,
                {
                    sessionId:
                        optionalValue(sessionId),

                    termId:
                        optionalValue(termId),

                    subjectId:
                        optionalValue(subjectId)
                }
            );

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error(
            "Get student results error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET CLASS RESULTS
|--------------------------------------------------------------------------
*/

async function getClassResults(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const classId = req.params.classId;

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: "Class ID is required."
            });
        }

        const {
            sessionId,
            termId,
            subjectId
        } = req.query;

        const results =
            await resultService.getResultsByClass(
                classId,
                schoolId,
                {
                    sessionId:
                        optionalValue(sessionId),

                    termId:
                        optionalValue(termId),

                    subjectId:
                        optionalValue(subjectId)
                }
            );

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error(
            "Get class results error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET SUBJECT RESULTS
|--------------------------------------------------------------------------
|
| The current finalized result model already exposes subject-level
| retrieval. It is used here until the service contract is intentionally
| expanded with a dedicated subject-result service method.
|--------------------------------------------------------------------------
*/

async function getSubjectResults(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const subjectId = req.params.subjectId;

        if (!subjectId) {
            return res.status(400).json({
                success: false,
                message: "Subject ID is required."
            });
        }

        const {
            sessionId,
            termId,
            classId
        } = req.query;

        if (!sessionId || !termId) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic session ID and term ID are required."
            });
        }

        const results =
            await resultModel.getSubjectResults(
                subjectId,
                schoolId,
                {
                    sessionId,
                    termId,

                    classId:
                        optionalValue(classId)
                }
            );

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error(
            "Get subject results error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| UPDATE RESULT
|--------------------------------------------------------------------------
*/

async function updateResult(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const resultId = req.params.id;

        if (!resultId) {
            return res.status(400).json({
                success: false,
                message: "Result ID is required."
            });
        }

        const body = req.body || {};

        const allowedFields = [
            "studentId",
            "student_id",

            "subjectId",
            "subject_id",

            "sessionId",
            "session_id",

            "termId",
            "term_id",

            "classId",
            "class_id",

            "caScore",
            "ca_score",

            "examScore",
            "exam_score",

            "totalScore",
            "total_score",

            "grade",

            "gradePoint",
            "grade_point",

            "position",

            "teacherRemark",
            "teacher_remark",

            "principalRemark",
            "principal_remark",

            "isPublished",
            "is_published"
        ];

        const updateData = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "No valid fields supplied for update."
            });
        }

        const result =
            await resultService.updateResult(
                resultId,
                schoolId,
                updateData
            );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Result updated successfully.",
            data: result
        });
    } catch (error) {
        console.error(
            "Update result error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| DELETE RESULT
|--------------------------------------------------------------------------
*/

async function deleteResult(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const resultId = req.params.id;

        if (!resultId) {
            return res.status(400).json({
                success: false,
                message: "Result ID is required."
            });
        }

        const result =
            await resultService.deleteResult(
                resultId,
                schoolId
            );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Result deleted successfully.",
            data: result
        });
    } catch (error) {
        console.error(
            "Delete result error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| APPROVE RESULT
|--------------------------------------------------------------------------
|
| In the current Results design, approval means publishing the result.
| The finalized result model exposes approveResult as a compatibility
| alias for publishResult.
|--------------------------------------------------------------------------
*/

async function approveResult(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const resultId = req.params.id;

        if (!resultId) {
            return res.status(400).json({
                success: false,
                message: "Result ID is required."
            });
        }

        const result =
            await resultModel.approveResult(
                resultId,
                schoolId
            );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Result approved successfully.",
            data: result
        });
    } catch (error) {
        console.error(
            "Approve result error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| PUBLISH RESULTS
|--------------------------------------------------------------------------
*/

async function publishResults(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const body = req.body || {};

        const results =
            await resultService.publishResults({
                schoolId,

                studentId:
                    body.studentId ??
                    body.student_id ??
                    req.query.studentId ??
                    req.query.student_id,

                classId:
                    body.classId ??
                    body.class_id ??
                    req.query.classId ??
                    req.query.class_id,

                sessionId:
                    body.sessionId ??
                    body.session_id ??
                    req.query.sessionId ??
                    req.query.session_id,

                termId:
                    body.termId ??
                    body.term_id ??
                    req.query.termId ??
                    req.query.term_id
            });

        return res.status(200).json({
            success: true,
            message: "Results published successfully.",
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error(
            "Publish results error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET PUBLISHED STUDENT RESULTS
|--------------------------------------------------------------------------
*/

async function getPublishedResults(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const studentId = req.params.studentId;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        const {
            sessionId,
            termId
        } = req.query;

        const results =
            await resultService.getPublishedResults(
                studentId,
                schoolId,
                optionalValue(sessionId),
                optionalValue(termId)
            );

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error(
            "Get published results error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| SEARCH RESULTS
|--------------------------------------------------------------------------
*/

async function searchResults(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const searchTerm = String(
            req.query.q ||
            req.query.search ||
            ""
        ).trim();

        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: "Search term is required."
            });
        }

        const results =
            await resultService.searchResults(
                searchTerm,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error(
            "Search results error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| RESULT STATISTICS
|--------------------------------------------------------------------------
*/

async function getResultStatistics(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const {
            sessionId,
            termId,
            classId
        } = req.query;

        if (classId) {
            const statistics =
                await resultService.getClassResultStatistics(
                    classId,
                    schoolId,
                    {
                        sessionId:
                            optionalValue(sessionId),

                        termId:
                            optionalValue(termId)
                    }
                );

            return res.status(200).json({
                success: true,
                data: statistics
            });
        }

        const statistics =
            await resultModel.getResultStatistics({
                schoolId,

                sessionId:
                    optionalValue(sessionId),

                termId:
                    optionalValue(termId)
            });

        return res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error(
            "Get result statistics error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET STUDENT RESULT SUMMARY
|--------------------------------------------------------------------------
*/

async function getStudentResultSummary(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const studentId = req.params.studentId;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        const {
            sessionId,
            termId
        } = req.query;

        const summary =
            await resultService.getStudentResultSummary(
                studentId,
                schoolId,
                {
                    sessionId:
                        optionalValue(sessionId),

                    termId:
                        optionalValue(termId)
                }
            );

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error(
            "Get student result summary error:",
            error
        );

        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
    createResult,
    createBulkResults,

    getAllResults,
    getResultById,

    getStudentResults,
    getStudentResultSummary,

    getClassResults,
    getSubjectResults,

    updateResult,
    deleteResult,

    approveResult,
    publishResults,
    getPublishedResults,

    searchResults,
    getResultStatistics

};
