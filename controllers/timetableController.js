"use strict";

const timetableModel = require("../models/timetableModel");

/*
|--------------------------------------------------------------------------
| TIMETABLE CONTROLLER
|--------------------------------------------------------------------------
|
| This controller handles HTTP/API operations for timetable entries.
|
| Responsibilities:
| - Resolve the current school
| - Validate request data
| - Call the timetable model
| - Return consistent API responses
| - Handle controller-level errors
|
| Database operations remain inside:
| models/timetableModel.js
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function resolveSchoolId(req) {
    const schoolId =
        req.user?.schoolId ||
        req.user?.school_id ||
        req.body?.schoolId ||
        req.body?.school_id ||
        req.query?.schoolId ||
        req.query?.school_id;

    if (!schoolId) {
        const error = new Error("School ID is required.");
        error.statusCode = 400;
        throw error;
    }

    return schoolId;
}

function getCurrentUserId(req) {
    return (
        req.user?.id ||
        req.user?.userId ||
        req.user?.user_id ||
        req.body?.userId ||
        req.body?.user_id ||
        null
    );
}

function sendSuccess(res, statusCode, message, data = null) {
    const response = {
        success: true,
        message
    };

    if (data !== null && data !== undefined) {
        if (Array.isArray(data)) {
            response.data = data;
        } else if (typeof data === "object") {
            Object.assign(response, data);
        } else {
            response.data = data;
        }
    }

    return res.status(statusCode).json(response);
}

function sendError(
    res,
    error,
    defaultMessage = "An error occurred."
) {
    console.error("Timetable Controller Error:", error);

    const statusCode =
        Number.isInteger(error?.statusCode) &&
        error.statusCode >= 400
            ? error.statusCode
            : 500;

    return res.status(statusCode).json({
        success: false,
        message: error?.message || defaultMessage
    });
}

function getRequestId(req) {
    return (
        req.params?.id ||
        req.params?.timetableId ||
        req.body?.id ||
        req.body?.timetableId ||
        null
    );
}

function getPagination(req) {
    const page = Math.max(
        parseInt(req.query?.page, 10) || 1,
        1
    );

    const limit = Math.min(
        Math.max(parseInt(req.query?.limit, 10) || 50, 1),
        200
    );

    return {
        page,
        limit
    };
}

/*
|--------------------------------------------------------------------------
| CREATE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

async function createTimetable(req, res) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);

        const {
            academicSessionId,
            classId,
            classArmId,
            subjectId,
            teacherId,
            dayOfWeek,
            startTime,
            endTime,
            room
        } = req.body || {};

        if (!academicSessionId) {
            return res.status(400).json({
                success: false,
                message: "Academic session is required."
            });
        }

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: "Class is required."
            });
        }

        if (!classArmId) {
            return res.status(400).json({
                success: false,
                message: "Class arm is required."
            });
        }

        if (!subjectId) {
            return res.status(400).json({
                success: false,
                message: "Subject is required."
            });
        }

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: "Teacher is required."
            });
        }

        if (!dayOfWeek) {
            return res.status(400).json({
                success: false,
                message: "Day of week is required."
            });
        }

        if (!startTime) {
            return res.status(400).json({
                success: false,
                message: "Start time is required."
            });
        }

        if (!endTime) {
            return res.status(400).json({
                success: false,
                message: "End time is required."
            });
        }

        const classConflict =
            await timetableModel.checkClassConflict(
                schoolId,
                academicSessionId,
                classId,
                classArmId,
                dayOfWeek,
                startTime,
                endTime
            );

        if (classConflict) {
            return res.status(409).json({
                success: false,
                message:
                    "The class already has a timetable entry during this time."
            });
        }

        const teacherConflict =
            await timetableModel.checkTeacherConflict(
                schoolId,
                academicSessionId,
                teacherId,
                dayOfWeek,
                startTime,
                endTime
            );

        if (teacherConflict) {
            return res.status(409).json({
                success: false,
                message:
                    "The teacher already has a timetable entry during this time."
            });
        }

        const timetableEntry =
            await timetableModel.createTimetableEntry({
                schoolId,
                academicSessionId,
                classId,
                classArmId,
                subjectId,
                teacherId,
                dayOfWeek,
                startTime,
                endTime,
                room,
                createdBy: userId
            });

        return sendSuccess(
            res,
            201,
            "Timetable entry created successfully.",
            {
                timetable: timetableEntry
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to create timetable entry."
        );
    }
}

/*
|--------------------------------------------------------------------------
| GET ALL TIMETABLE ENTRIES
|--------------------------------------------------------------------------
*/

async function getTimetable(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const filters = {
            academicSessionId:
                req.query.academicSessionId ||
                req.query.academic_session_id ||
                null,

            classId:
                req.query.classId ||
                req.query.class_id ||
                null,

            classArmId:
                req.query.classArmId ||
                req.query.class_arm_id ||
                null,

            subjectId:
                req.query.subjectId ||
                req.query.subject_id ||
                null,

            teacherId:
                req.query.teacherId ||
                req.query.teacher_id ||
                null,

            dayOfWeek:
                req.query.dayOfWeek ||
                req.query.day_of_week ||
                null,

            search:
                req.query.search ||
                null
        };

        const pagination = getPagination(req);

        const result =
            await timetableModel.getTimetable(
                schoolId,
                filters,
                pagination
            );

        return sendSuccess(
            res,
            200,
            "Timetable entries retrieved successfully.",
            {
                timetable: result
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to retrieve timetable entries."
        );
    }
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE ENTRY BY ID
|--------------------------------------------------------------------------
*/

async function getTimetableById(req, res) {
    try {
        const schoolId = resolveSchoolId(req);
        const timetableId = getRequestId(req);

        if (!timetableId) {
            return res.status(400).json({
                success: false,
                message: "Timetable entry ID is required."
            });
        }

        const timetableEntry =
            await timetableModel.getTimetableById(
                timetableId,
                schoolId
            );

        if (!timetableEntry) {
            return res.status(404).json({
                success: false,
                message: "Timetable entry not found."
            });
        }

        return sendSuccess(
            res,
            200,
            "Timetable entry retrieved successfully.",
            {
                timetable: timetableEntry
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to retrieve timetable entry."
        );
    }
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE BY CLASS
|--------------------------------------------------------------------------
*/

async function getTimetableByClass(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const classId =
            req.params.classId ||
            req.query.classId ||
            req.query.class_id;

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: "Class ID is required."
            });
        }

        const academicSessionId =
            req.query.academicSessionId ||
            req.query.academic_session_id ||
            null;

        const classArmId =
            req.query.classArmId ||
            req.query.class_arm_id ||
            null;

        const timetable =
            await timetableModel.getTimetableByClass(
                classId,
                schoolId,
                academicSessionId,
                classArmId
            );

        return sendSuccess(
            res,
            200,
            "Class timetable retrieved successfully.",
            {
                timetable
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to retrieve class timetable."
        );
    }
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE BY CLASS ARM
|--------------------------------------------------------------------------
*/

async function getTimetableByClassArm(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const classArmId =
            req.params.classArmId ||
            req.query.classArmId ||
            req.query.class_arm_id;

        if (!classArmId) {
            return res.status(400).json({
                success: false,
                message: "Class arm ID is required."
            });
        }

        const academicSessionId =
            req.query.academicSessionId ||
            req.query.academic_session_id ||
            null;

        const timetable =
            await timetableModel.getTimetableByClassArm(
                classArmId,
                schoolId,
                academicSessionId
            );

        return sendSuccess(
            res,
            200,
            "Class arm timetable retrieved successfully.",
            {
                timetable
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to retrieve class arm timetable."
        );
    }
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE BY TEACHER
|--------------------------------------------------------------------------
*/

async function getTimetableByTeacher(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const teacherId =
            req.params.teacherId ||
            req.query.teacherId ||
            req.query.teacher_id;

        if (!teacherId) {
            return res.status(400).json({
                success: false,
                message: "Teacher ID is required."
            });
        }

        const academicSessionId =
            req.query.academicSessionId ||
            req.query.academic_session_id ||
            null;

        const timetable =
            await timetableModel.getTimetableByTeacher(
                teacherId,
                schoolId,
                academicSessionId
            );

        return sendSuccess(
            res,
            200,
            "Teacher timetable retrieved successfully.",
            {
                timetable
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to retrieve teacher timetable."
        );
    }
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE BY SUBJECT
|--------------------------------------------------------------------------
*/

async function getTimetableBySubject(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const subjectId =
            req.params.subjectId ||
            req.query.subjectId ||
            req.query.subject_id;

        if (!subjectId) {
            return res.status(400).json({
                success: false,
                message: "Subject ID is required."
            });
        }

        const academicSessionId =
            req.query.academicSessionId ||
            req.query.academic_session_id ||
            null;

        const timetable =
            await timetableModel.getTimetableBySubject(
                subjectId,
                schoolId,
                academicSessionId
            );

        return sendSuccess(
            res,
            200,
            "Subject timetable retrieved successfully.",
            {
                timetable
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to retrieve subject timetable."
        );
    }
}

/*
|--------------------------------------------------------------------------
| CHECK CLASS CONFLICT
|--------------------------------------------------------------------------
*/

async function checkClassConflict(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const {
            academicSessionId,
            classId,
            classArmId,
            dayOfWeek,
            startTime,
            endTime,
            excludeId
        } = req.body || {};

        if (!academicSessionId || !classId || !classArmId) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic session, class and class arm are required."
            });
        }

        if (!dayOfWeek || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message:
                    "Day, start time and end time are required."
            });
        }

        const conflict =
            await timetableModel.checkClassConflict(
                schoolId,
                academicSessionId,
                classId,
                classArmId,
                dayOfWeek,
                startTime,
                endTime,
                excludeId || null
            );

        return sendSuccess(
            res,
            200,
            "Class timetable conflict check completed.",
            {
                conflict: Boolean(conflict),
                entry: conflict || null
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to check class timetable conflict."
        );
    }
}

/*
|--------------------------------------------------------------------------
| CHECK TEACHER CONFLICT
|--------------------------------------------------------------------------
*/

async function checkTeacherConflict(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const {
            academicSessionId,
            teacherId,
            dayOfWeek,
            startTime,
            endTime,
            excludeId
        } = req.body || {};

        if (!academicSessionId || !teacherId) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic session and teacher are required."
            });
        }

        if (!dayOfWeek || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message:
                    "Day, start time and end time are required."
            });
        }

        const conflict =
            await timetableModel.checkTeacherConflict(
                schoolId,
                academicSessionId,
                teacherId,
                dayOfWeek,
                startTime,
                endTime,
                excludeId || null
            );

        return sendSuccess(
            res,
            200,
            "Teacher timetable conflict check completed.",
            {
                conflict: Boolean(conflict),
                entry: conflict || null
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to check teacher timetable conflict."
        );
    }
}

/*
|--------------------------------------------------------------------------
| UPDATE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

async function updateTimetable(req, res) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);
        const timetableId = getRequestId(req);

        if (!timetableId) {
            return res.status(400).json({
                success: false,
                message: "Timetable entry ID is required."
            });
        }

        const existingEntry =
            await timetableModel.getTimetableById(
                timetableId,
                schoolId
            );

        if (!existingEntry) {
            return res.status(404).json({
                success: false,
                message: "Timetable entry not found."
            });
        }

        const data = {
            academicSessionId:
                req.body?.academicSessionId ??
                req.body?.academic_session_id ??
                existingEntry.academic_session_id,

            classId:
                req.body?.classId ??
                req.body?.class_id ??
                existingEntry.class_id,

            classArmId:
                req.body?.classArmId ??
                req.body?.class_arm_id ??
                existingEntry.class_arm_id,

            subjectId:
                req.body?.subjectId ??
                req.body?.subject_id ??
                existingEntry.subject_id,

            teacherId:
                req.body?.teacherId ??
                req.body?.teacher_id ??
                existingEntry.teacher_id,

            dayOfWeek:
                req.body?.dayOfWeek ??
                req.body?.day_of_week ??
                existingEntry.day_of_week,

            startTime:
                req.body?.startTime ??
                req.body?.start_time ??
                existingEntry.start_time,

            endTime:
                req.body?.endTime ??
                req.body?.end_time ??
                existingEntry.end_time,

            room:
                req.body?.room ??
                existingEntry.room,

            updatedBy: userId
        };

        const classConflict =
            await timetableModel.checkClassConflict(
                schoolId,
                data.academicSessionId,
                data.classId,
                data.classArmId,
                data.dayOfWeek,
                data.startTime,
                data.endTime,
                timetableId
            );

        if (classConflict) {
            return res.status(409).json({
                success: false,
                message:
                    "The class already has a timetable entry during this time."
            });
        }

        const teacherConflict =
            await timetableModel.checkTeacherConflict(
                schoolId,
                data.academicSessionId,
                data.teacherId,
                data.dayOfWeek,
                data.startTime,
                data.endTime,
                timetableId
            );

        if (teacherConflict) {
            return res.status(409).json({
                success: false,
                message:
                    "The teacher already has a timetable entry during this time."
            });
        }

        const updatedEntry =
            await timetableModel.updateTimetable(
                timetableId,
                schoolId,
                data
            );

        return sendSuccess(
            res,
            200,
            "Timetable entry updated successfully.",
            {
                timetable: updatedEntry
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to update timetable entry."
        );
    }
}

/*
|--------------------------------------------------------------------------
| DELETE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

async function deleteTimetable(req, res) {
    try {
        const schoolId = resolveSchoolId(req);
        const timetableId = getRequestId(req);

        if (!timetableId) {
            return res.status(400).json({
                success: false,
                message: "Timetable entry ID is required."
            });
        }

        const existingEntry =
            await timetableModel.getTimetableById(
                timetableId,
                schoolId
            );

        if (!existingEntry) {
            return res.status(404).json({
                success: false,
                message: "Timetable entry not found."
            });
        }

        await timetableModel.deleteTimetable(
            timetableId,
            schoolId
        );

        return sendSuccess(
            res,
            200,
            "Timetable entry deleted successfully."
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to delete timetable entry."
        );
    }
}

/*
|--------------------------------------------------------------------------
| COUNT TIMETABLE ENTRIES
|--------------------------------------------------------------------------
*/

async function countTimetable(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const filters = {
            academicSessionId:
                req.query.academicSessionId ||
                req.query.academic_session_id ||
                null,

            classId:
                req.query.classId ||
                req.query.class_id ||
                null,

            classArmId:
                req.query.classArmId ||
                req.query.class_id ||
                req.query.class_arm_id ||
                null,

            subjectId:
                req.query.subjectId ||
                req.query.subject_id ||
                null,

            teacherId:
                req.query.teacherId ||
                req.query.teacher_id ||
                null,

            dayOfWeek:
                req.query.dayOfWeek ||
                req.query.day_of_week ||
                null
        };

        const count =
            await timetableModel.countTimetable(
                schoolId,
                filters
            );

        return sendSuccess(
            res,
            200,
            "Timetable count retrieved successfully.",
            {
                count: Number(count) || 0
            }
        );
    } catch (error) {
        return sendError(
            res,
            error,
            "Unable to count timetable entries."
        );
    }
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    createTimetable,
    getTimetable,
    getTimetableById,
    getTimetableByClass,
    getTimetableByClassArm,
    getTimetableByTeacher,
    getTimetableBySubject,
    checkClassConflict,
    checkTeacherConflict,
    updateTimetable,
    deleteTimetable,
    countTimetable
};