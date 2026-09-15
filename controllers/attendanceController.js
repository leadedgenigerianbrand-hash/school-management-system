"use strict";

const attendanceModel = require("../models/attendanceModel");

/*
|--------------------------------------------------------------------------
| ATTENDANCE CONTROLLER
|--------------------------------------------------------------------------
|
| This controller is the HTTP/API layer for attendance.
|
| It communicates with the attendance model for:
|
| - Recording attendance
| - Bulk attendance
| - Retrieving attendance
| - Student attendance
| - Class attendance
| - Attendance by date
| - Updating attendance
| - Deleting attendance
| - Attendance summaries
| - Attendance statistics
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| GET SCHOOL ID
|--------------------------------------------------------------------------
|
| Authenticated user's school ID is preferred.
| Body/query fallbacks are retained for compatibility with the current
| project while the authentication layer is being finalized.
|
|--------------------------------------------------------------------------
*/

function getSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.body?.schoolId ||
        req.query?.schoolId ||
        null
    );
}

/*
|--------------------------------------------------------------------------
| GET USER ID
|--------------------------------------------------------------------------
*/

function getUserId(req) {
    return (
        req.user?.id ||
        req.user?.userId ||
        null
    );
}

/*
|--------------------------------------------------------------------------
| CREATE ATTENDANCE
|--------------------------------------------------------------------------
*/

async function createAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const recordedBy = getUserId(req);

        const {
            studentId,
            attendanceDate,
            status,
            remarks,
            remark,
            classId,
            classArmId,
            sessionId,
            termId
        } = req.body;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: "Class ID is required."
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Academic session is required."
            });
        }

        if (!termId) {
            return res.status(400).json({
                success: false,
                message: "Term is required."
            });
        }

        if (!attendanceDate) {
            return res.status(400).json({
                success: false,
                message: "Attendance date is required."
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Attendance status is required."
            });
        }

        const attendance =
            await attendanceModel.recordAttendance({
                schoolId,
                studentId,
                classId,
                classArmId:
                    classArmId || null,
                sessionId,
                termId,
                attendanceDate,
                status,
                remarks:
                    remarks !== undefined
                        ? remarks
                        : (remark || null),
                recordedBy
            });

        return res.status(201).json({
            success: true,
            message: "Attendance recorded successfully.",
            data: attendance
        });
    } catch (error) {
        console.error(
            "Create attendance error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| CREATE BULK ATTENDANCE
|--------------------------------------------------------------------------
*/

async function createBulkAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const recordedBy = getUserId(req);

        const {
            attendanceDate,
            records,
            classId,
            classArmId,
            sessionId,
            termId
        } = req.body;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!attendanceDate) {
            return res.status(400).json({
                success: false,
                message: "Attendance date is required."
            });
        }

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: "Class ID is required."
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Academic session is required."
            });
        }

        if (!termId) {
            return res.status(400).json({
                success: false,
                message: "Term is required."
            });
        }

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Attendance records are required."
            });
        }

        const normalizedRecords = records.map((record) => ({
            schoolId,

            studentId:
                record.studentId ||
                record.student_id,

            classId:
                record.classId ||
                record.class_id ||
                classId,

            classArmId:
                record.classArmId ||
                record.class_arm_id ||
                classArmId ||
                null,

            sessionId:
                record.sessionId ||
                record.academicSessionId ||
                record.academic_session_id ||
                sessionId,

            termId:
                record.termId ||
                record.term_id ||
                termId,

            attendanceDate:
                record.attendanceDate ||
                record.attendance_date ||
                attendanceDate,

            status:
                record.status,

            remarks:
                record.remarks !== undefined
                    ? record.remarks
                    : (
                        record.remark !== undefined
                            ? record.remark
                            : null
                    ),

            recordedBy
        }));

        const invalidRecord =
            normalizedRecords.find(
                (record) =>
                    !record.studentId ||
                    !record.status
            );

        if (invalidRecord) {
            return res.status(400).json({
                success: false,
                message:
                    "Every attendance record must contain a student ID and attendance status."
            });
        }

        const attendance =
            await attendanceModel.recordBulkAttendance(
                normalizedRecords
            );

        return res.status(201).json({
            success: true,
            message:
                "Bulk attendance recorded successfully.",
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        console.error(
            "Create bulk attendance error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ATTENDANCE BY ID
|--------------------------------------------------------------------------
*/

async function getAttendanceById(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Attendance ID is required."
            });
        }

        const attendance =
            await attendanceModel.findAttendanceById(
                id,
                schoolId
            );

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: attendance
        });
    } catch (error) {
        console.error(
            "Get attendance by ID error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET STUDENT ATTENDANCE
|--------------------------------------------------------------------------
*/

async function getStudentAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { studentId } = req.params;

        const {
            startDate,
            endDate,
            sessionId,
            termId,
            limit = 100,
            offset = 0
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        const attendance =
            await attendanceModel.getStudentAttendance({
                schoolId,
                studentId,
                startDate:
                    startDate || null,
                endDate:
                    endDate || null,
                sessionId:
                    sessionId || null,
                termId:
                    termId || null,
                limit:
                    Number(limit),
                offset:
                    Number(offset)
            });

        return res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        console.error(
            "Get student attendance error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET CLASS ATTENDANCE
|--------------------------------------------------------------------------
*/

async function getClassAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { classId } = req.params;

        const {
            attendanceDate,
            classArmId,
            sessionId,
            termId
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: "Class ID is required."
            });
        }

        if (!attendanceDate) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance date is required."
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic session is required."
            });
        }

        if (!termId) {
            return res.status(400).json({
                success: false,
                message:
                    "Term is required."
            });
        }

        const attendance =
            await attendanceModel.getClassAttendance({
                schoolId,
                classId,
                classArmId:
                    classArmId || null,
                attendanceDate,
                sessionId,
                termId
            });

        return res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        console.error(
            "Get class attendance error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ATTENDANCE BY DATE
|--------------------------------------------------------------------------
*/

async function getAttendanceByDate(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        const {
            date,
            attendanceDate,
            classId
        } = req.query;

        const selectedDate =
            date ||
            attendanceDate;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!selectedDate) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance date is required."
            });
        }

        const attendance =
            await attendanceModel.getAttendanceByDate(
                schoolId,
                selectedDate,
                classId || null
            );

        return res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        console.error(
            "Get attendance by date error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ATTENDANCE
|--------------------------------------------------------------------------
|
| General attendance endpoint.
|
| The finalized model intentionally does not contain a generic
| findAttendance() function.
|
| Therefore this controller routes the request to the appropriate
| finalized model function according to the supplied filters.
|
|--------------------------------------------------------------------------
*/

async function getAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        const {
            studentId,
            classId,
            classArmId,
            attendanceDate,
            date,
            startDate,
            endDate,
            sessionId,
            termId,
            limit = 100,
            offset = 0
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (studentId) {
            const attendance =
                await attendanceModel.getStudentAttendance({
                    schoolId,
                    studentId,
                    sessionId:
                        sessionId || null,
                    termId:
                        termId || null,
                    startDate:
                        startDate || null,
                    endDate:
                        endDate || null,
                    limit:
                        Number(limit),
                    offset:
                        Number(offset)
                });

            return res.status(200).json({
                success: true,
                count: attendance.length,
                data: attendance
            });
        }

        const selectedDate =
            attendanceDate ||
            date;

        if (classId && selectedDate) {
            if (!sessionId || !termId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Academic session and term are required for class attendance."
                });
            }

            const attendance =
                await attendanceModel.getClassAttendance({
                    schoolId,
                    classId,
                    classArmId:
                        classArmId || null,
                    attendanceDate:
                        selectedDate,
                    sessionId,
                    termId
                });

            return res.status(200).json({
                success: true,
                count: attendance.length,
                data: attendance
            });
        }

        if (selectedDate) {
            const attendance =
                await attendanceModel.getAttendanceByDate(
                    schoolId,
                    selectedDate,
                    classId || null
                );

            return res.status(200).json({
                success: true,
                count: attendance.length,
                data: attendance
            });
        }

        return res.status(400).json({
            success: false,
            message:
                "Provide a student ID or attendance date."
        });
    } catch (error) {
        console.error(
            "Get attendance error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| UPDATE ATTENDANCE
|--------------------------------------------------------------------------
*/

async function updateAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        const {
            attendanceDate,
            status,
            remarks,
            remark,
            classId,
            sessionId,
            termId
        } = req.body;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance ID is required."
            });
        }

        const data = {};

        if (attendanceDate !== undefined) {
            data.attendanceDate =
                attendanceDate;
        }

        if (status !== undefined) {
            data.status =
                status;
        }

        if (remarks !== undefined) {
            data.remarks =
                remarks;
        } else if (remark !== undefined) {
            data.remark =
                remark;
        }

        if (classId !== undefined) {
            data.classId =
                classId;
        }

        if (sessionId !== undefined) {
            data.sessionId =
                sessionId;
        }

        if (termId !== undefined) {
            data.termId =
                termId;
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "No valid fields supplied for update."
            });
        }

        const attendance =
            await attendanceModel.updateAttendance(
                id,
                schoolId,
                data
            );

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Attendance updated successfully.",
            data: attendance
        });
    } catch (error) {
        console.error(
            "Update attendance error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| DELETE ATTENDANCE
|--------------------------------------------------------------------------
*/

async function deleteAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance ID is required."
            });
        }

        const attendance =
            await attendanceModel.deleteAttendance(
                id,
                schoolId
            );

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message:
                    "Attendance record not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Attendance record deleted successfully.",
            data: attendance
        });
    } catch (error) {
        console.error(
            "Delete attendance error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET STUDENT ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
*/

async function getStudentAttendanceSummary(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const { studentId } = req.params;

        const {
            startDate,
            endDate,
            sessionId,
            termId
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student ID is required."
            });
        }

        const summary =
            await attendanceModel.getStudentAttendanceSummary({
                schoolId,
                studentId,
                startDate:
                    startDate || null,
                endDate:
                    endDate || null,
                sessionId:
                    sessionId || null,
                termId:
                    termId || null
            });

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error(
            "Get student attendance summary error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET CLASS ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
*/

async function getClassAttendanceSummary(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const { classId } = req.params;

        const {
            startDate,
            endDate,
            sessionId,
            termId
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!classId) {
            return res.status(400).json({
                success: false,
                message:
                    "Class ID is required."
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic session is required."
            });
        }

        if (!termId) {
            return res.status(400).json({
                success: false,
                message:
                    "Term is required."
            });
        }

        const summary =
            await attendanceModel.getClassAttendanceSummary({
                schoolId,
                classId,
                startDate:
                    startDate || null,
                endDate:
                    endDate || null,
                sessionId,
                termId
            });

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error(
            "Get class attendance summary error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET SCHOOL ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
|
| The finalized attendance model does not contain a separate
| getSchoolAttendanceSummary() function.
|
| School-level totals are therefore provided by the finalized
| getAttendanceStatistics() function.
|
|--------------------------------------------------------------------------
*/

async function getSchoolAttendanceSummary(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            attendanceDate,
            date
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const selectedDate =
            attendanceDate ||
            date ||
            null;

        const statistics =
            await attendanceModel.getAttendanceStatistics(
                schoolId,
                selectedDate
            );

        return res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error(
            "Get school attendance summary error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| SEARCH ATTENDANCE
|--------------------------------------------------------------------------
|
| There is intentionally no fake search function in the finalized
| attendance model.
|
| Attendance search is handled through the supported filters:
|
| - studentId
| - classId
| - attendanceDate
| - sessionId
| - termId
|
|--------------------------------------------------------------------------
*/

async function searchAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        const {
            studentId,
            classId,
            attendanceDate,
            date,
            sessionId,
            termId,
            limit = 100,
            offset = 0
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (studentId) {
            const attendance =
                await attendanceModel.getStudentAttendance({
                    schoolId,
                    studentId,
                    sessionId:
                        sessionId || null,
                    termId:
                        termId || null,
                    limit:
                        Number(limit),
                    offset:
                        Number(offset)
                });

            return res.status(200).json({
                success: true,
                count: attendance.length,
                data: attendance
            });
        }

        const selectedDate =
            attendanceDate ||
            date;

        if (selectedDate) {
            const attendance =
                await attendanceModel.getAttendanceByDate(
                    schoolId,
                    selectedDate,
                    classId || null
                );

            return res.status(200).json({
                success: true,
                count: attendance.length,
                data: attendance
            });
        }

        if (classId) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance date is required when searching by class."
            });
        }

        return res.status(400).json({
            success: false,
            message:
                "Provide a student ID or attendance date."
        });
    } catch (error) {
        console.error(
            "Search attendance error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ATTENDANCE STATISTICS
|--------------------------------------------------------------------------
*/

async function getAttendanceStatistics(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            attendanceDate,
            date
        } = req.query;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const selectedDate =
            attendanceDate ||
            date ||
            null;

        const statistics =
            await attendanceModel.getAttendanceStatistics(
                schoolId,
                selectedDate
            );

        return res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error(
            "Get attendance statistics error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    createAttendance,
    createBulkAttendance,
    getAttendance,
    getAttendanceById,
    getStudentAttendance,
    getClassAttendance,
    getAttendanceByDate,
    updateAttendance,
    deleteAttendance,
    getStudentAttendanceSummary,
    getClassAttendanceSummary,
    getSchoolAttendanceSummary,
    searchAttendance,
    getAttendanceStatistics
};