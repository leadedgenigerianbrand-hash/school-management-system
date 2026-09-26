"use strict";

const attendanceModel = require("../models/attendanceModel");

/* ==========================================================================
   HELPERS
========================================================================== */

function getSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.body?.schoolId ||
        req.body?.school_id ||
        req.query?.schoolId ||
        req.query?.school_id ||
        null
    );
}

function getQueryValue(req, ...keys) {
    for (const key of keys) {
        const value = req.query?.[key];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return null;
}

function sendSuccess(res, data = [], status = 200) {
    return res.status(status).json({
        success: true,
        count: Array.isArray(data) ? data.length : 0,
        data
    });
}

function sendError(res, message, status = 400) {
    return res.status(status).json({
        success: false,
        message
    });
}

/* ==========================================================================
   CREATE ATTENDANCE
========================================================================== */

async function createAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const body = {
            ...req.body,
            schoolId
        };

        const attendance =
            await attendanceModel.createAttendance(body);

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

/* ==========================================================================
   CREATE BULK ATTENDANCE
========================================================================== */

async function createBulkAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const body = {
            ...req.body,
            schoolId
        };

        const attendance =
            await attendanceModel.createBulkAttendance(body);

        return res.status(201).json({
            success: true,
            message:
                "Bulk attendance recorded successfully.",
            count: Array.isArray(attendance)
                ? attendance.length
                : 0,
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

/* ==========================================================================
   GET ATTENDANCE
========================================================================== */

async function getAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const studentId = getQueryValue(
            req,
            "studentId",
            "student_id"
        );

        const staffId = getQueryValue(
            req,
            "staffId",
            "staff_id"
        );

        const date = getQueryValue(
            req,
            "date",
            "attendanceDate",
            "attendance_date"
        );

        const sessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const termId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const classId = getQueryValue(
            req,
            "classId",
            "class_id"
        );

        const type = getQueryValue(
            req,
            "type",
            "attendanceType",
            "personType"
        );

        if (studentId) {
            const attendance =
                await attendanceModel.getStudentAttendance(
                    schoolId,
                    studentId,
                    sessionId,
                    termId
                );

            return sendSuccess(
                res,
                attendance
            );
        }

        if (staffId) {
            const attendance =
                await attendanceModel.getStaffAttendance(
                    schoolId,
                    staffId,
                    sessionId,
                    termId
                );

            return sendSuccess(
                res,
                attendance
            );
        }

        if (
            type === "staff" &&
            date
        ) {
            const attendance =
                await attendanceModel.getStaffAttendanceByDate({
                    schoolId,
                    attendanceDate: date,
                    sessionId,
                    termId
                });

            return sendSuccess(
                res,
                attendance
            );
        }

        if (
            type === "all" &&
            date
        ) {
            const attendance =
                await attendanceModel.getAllAttendanceByDate({
                    schoolId,
                    attendanceDate: date,
                    sessionId,
                    termId,
                    classId
                });

            return sendSuccess(
                res,
                attendance
            );
        }

        if (date) {
            const attendance =
                await attendanceModel.getAttendanceByDate(
                    schoolId,
                    date,
                    sessionId,
                    termId,
                    classId
                );

            return sendSuccess(
                res,
                attendance
            );
        }

        const attendance =
            await attendanceModel.getAttendance({
                schoolId,
                studentId,
                staffId,
                sessionId,
                termId,
                classId,
                attendanceDate: date,
                type
            });

        return sendSuccess(
            res,
            attendance
        );
    } catch (error) {
        console.error(
            "Get attendance error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   GET ATTENDANCE BY ID
========================================================================== */

async function getAttendanceById(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const attendanceId =
            req.params.id;

        if (!attendanceId) {
            return sendError(
                res,
                "Attendance ID is required.",
                400
            );
        }

        const attendance =
            await attendanceModel.getAttendanceById(
                schoolId,
                attendanceId
            );

        if (!attendance) {
            return sendError(
                res,
                "Attendance record not found.",
                404
            );
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

/* ==========================================================================
   GET STUDENT ATTENDANCE
========================================================================== */

async function getStudentAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const studentId =
            req.params.studentId;

        if (!studentId) {
            return sendError(
                res,
                "Student ID is required.",
                400
            );
        }

        const sessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const termId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const attendance =
            await attendanceModel.getStudentAttendance(
                schoolId,
                studentId,
                sessionId,
                termId
            );

        return sendSuccess(
            res,
            attendance
        );
    } catch (error) {
        console.error(
            "Get student attendance error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   GET STAFF ATTENDANCE
========================================================================== */

async function getStaffAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const staffId =
            req.params.staffId;

        if (!staffId) {
            return sendError(
                res,
                "Staff ID is required.",
                400
            );
        }

        const sessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const termId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const attendance =
            await attendanceModel.getStaffAttendance(
                schoolId,
                staffId,
                sessionId,
                termId
            );

        return sendSuccess(
            res,
            attendance
        );
    } catch (error) {
        console.error(
            "Get staff attendance error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   GET CLASS ATTENDANCE
========================================================================== */

async function getClassAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const classId =
            req.params.classId;

        if (!classId) {
            return sendError(
                res,
                "Class ID is required.",
                400
            );
        }

        const sessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const termId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const attendance =
            await attendanceModel.getClassAttendance(
                schoolId,
                classId,
                sessionId,
                termId
            );

        return sendSuccess(
            res,
            attendance
        );
    } catch (error) {
        console.error(
            "Get class attendance error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   GET ATTENDANCE BY DATE
========================================================================== */

async function getAttendanceByDate(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const selectedDate = getQueryValue(
            req,
            "date",
            "attendanceDate",
            "attendance_date"
        );

        const selectedSessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const selectedTermId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const selectedClassId = getQueryValue(
            req,
            "classId",
            "class_id"
        );

        const selectedType = getQueryValue(
            req,
            "type",
            "attendanceType",
            "personType"
        );

        if (!selectedDate) {
            return sendError(
                res,
                "Attendance date is required.",
                400
            );
        }

        if (selectedType === "staff") {
            const attendance =
                await attendanceModel.getStaffAttendanceByDate({
                    schoolId,
                    attendanceDate: selectedDate,
                    sessionId: selectedSessionId,
                    termId: selectedTermId
                });

            return sendSuccess(
                res,
                attendance
            );
        }

        if (selectedType === "all") {
            const attendance =
                await attendanceModel.getAllAttendanceByDate({
                    schoolId,
                    attendanceDate: selectedDate,
                    sessionId: selectedSessionId,
                    termId: selectedTermId,
                    classId: selectedClassId
                });

            return sendSuccess(
                res,
                attendance
            );
        }

        const attendance =
            await attendanceModel.getAttendanceByDate(
                schoolId,
                selectedDate,
                selectedSessionId,
                selectedTermId,
                selectedClassId
            );

        return sendSuccess(
            res,
            attendance
        );
    } catch (error) {
        console.error(
            "Get attendance by date error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   GET STAFF ATTENDANCE BY DATE
========================================================================== */

async function getStaffAttendanceByDate(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const selectedDate = getQueryValue(
            req,
            "date",
            "attendanceDate",
            "attendance_date"
        );

        const selectedSessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const selectedTermId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        if (!selectedDate) {
            return sendError(
                res,
                "Attendance date is required.",
                400
            );
        }

        const attendance =
            await attendanceModel.getStaffAttendanceByDate({
                schoolId,
                attendanceDate: selectedDate,
                sessionId: selectedSessionId,
                termId: selectedTermId
            });

        return sendSuccess(
            res,
            attendance
        );
    } catch (error) {
        console.error(
            "Get staff attendance by date error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   GET ALL ATTENDANCE BY DATE
========================================================================== */

async function getAllAttendanceByDate(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const selectedDate = getQueryValue(
            req,
            "date",
            "attendanceDate",
            "attendance_date"
        );

        const selectedSessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const selectedTermId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const selectedClassId = getQueryValue(
            req,
            "classId",
            "class_id"
        );

        if (!selectedDate) {
            return sendError(
                res,
                "Attendance date is required.",
                400
            );
        }

        const attendance =
            await attendanceModel.getAllAttendanceByDate({
                schoolId,
                attendanceDate: selectedDate,
                sessionId: selectedSessionId,
                termId: selectedTermId,
                classId: selectedClassId
            });

        return sendSuccess(
            res,
            attendance
        );
    } catch (error) {
        console.error(
            "Get all attendance by date error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   UPDATE ATTENDANCE
========================================================================== */

async function updateAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const attendanceId =
            req.params.id;

        if (!attendanceId) {
            return sendError(
                res,
                "Attendance ID is required.",
                400
            );
        }

        const body = {
            ...req.body,
            schoolId
        };

        const attendance =
            await attendanceModel.updateAttendance(
                schoolId,
                attendanceId,
                body
            );

        if (!attendance) {
            return sendError(
                res,
                "Attendance record not found.",
                404
            );
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

/* ==========================================================================
   DELETE ATTENDANCE
========================================================================== */

async function deleteAttendance(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const attendanceId =
            req.params.id;

        if (!attendanceId) {
            return sendError(
                res,
                "Attendance ID is required.",
                400
            );
        }

        const deleted =
            await attendanceModel.deleteAttendance(
                schoolId,
                attendanceId
            );

        if (!deleted) {
            return sendError(
                res,
                "Attendance record not found.",
                404
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "Attendance deleted successfully."
        });
    } catch (error) {
        console.error(
            "Delete attendance error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   STUDENT ATTENDANCE SUMMARY
========================================================================== */

async function getStudentAttendanceSummary(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const studentId =
            req.params.studentId;

        if (!studentId) {
            return sendError(
                res,
                "Student ID is required.",
                400
            );
        }

        const sessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const termId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const summary =
            await attendanceModel.getAttendanceSummary(
                schoolId,
                studentId,
                sessionId,
                termId
            );

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

/* ==========================================================================
   STAFF ATTENDANCE SUMMARY
========================================================================== */

async function getStaffAttendanceSummary(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const staffId =
            req.params.staffId;

        if (!staffId) {
            return sendError(
                res,
                "Staff ID is required.",
                400
            );
        }

        const sessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const termId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const summary =
            await attendanceModel.getStaffAttendanceSummary(
                schoolId,
                staffId,
                sessionId,
                termId
            );

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error(
            "Get staff attendance summary error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   CLASS ATTENDANCE SUMMARY
========================================================================== */

async function getClassAttendanceSummary(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const classId =
            req.params.classId;

        if (!classId) {
            return sendError(
                res,
                "Class ID is required.",
                400
            );
        }

        const sessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const termId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const summary =
            await attendanceModel.getClassAttendanceSummary(
                schoolId,
                classId,
                sessionId,
                termId
            );

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

/* ==========================================================================
   SCHOOL ATTENDANCE SUMMARY
========================================================================== */

async function getSchoolAttendanceSummary(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const sessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const termId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const summary =
            await attendanceModel.getSchoolAttendanceSummary(
                schoolId,
                sessionId,
                termId
            );

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error(
            "Get school attendance summary error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   ATTENDANCE STATISTICS
========================================================================== */

async function getAttendanceStatistics(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const sessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const termId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const classId = getQueryValue(
            req,
            "classId",
            "class_id"
        );

        const startDate = getQueryValue(
            req,
            "startDate",
            "start_date"
        );

        const endDate = getQueryValue(
            req,
            "endDate",
            "end_date"
        );

        const statistics =
            await attendanceModel.getAttendanceStatistics({
                schoolId,
                sessionId,
                termId,
                classId,
                startDate,
                endDate
            });

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

/* ==========================================================================
   SEARCH ATTENDANCE
========================================================================== */

async function searchAttendance(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return sendError(
                res,
                "School ID is required.",
                400
            );
        }

        const search = getQueryValue(
            req,
            "q",
            "search"
        );

        const selectedDate = getQueryValue(
            req,
            "date",
            "attendanceDate",
            "attendance_date"
        );

        const selectedSessionId = getQueryValue(
            req,
            "sessionId",
            "session_id"
        );

        const selectedTermId = getQueryValue(
            req,
            "termId",
            "term_id"
        );

        const selectedType = getQueryValue(
            req,
            "type",
            "attendanceType",
            "personType"
        );

        if (!search) {
            return sendError(
                res,
                "Search term is required.",
                400
            );
        }

        if (
            selectedType === "staff" &&
            selectedDate
        ) {
            const attendance =
                await attendanceModel.getStaffAttendanceByDate({
                    schoolId,
                    attendanceDate: selectedDate,
                    sessionId: selectedSessionId,
                    termId: selectedTermId
                });

            const normalizedSearch =
                String(search)
                    .trim()
                    .toLowerCase();

            const filtered =
                Array.isArray(attendance)
                    ? attendance.filter(record => {
                          const searchableText = [
                              record.first_name,
                              record.middle_name,
                              record.last_name,
                              record.staff_number,
                              record.department,
                              record.department_name,
                              record.position,
                              record.employment_type
                          ]
                              .filter(Boolean)
                              .join(" ")
                              .toLowerCase();

                          return searchableText.includes(
                              normalizedSearch
                          );
                      })
                    : [];

            return sendSuccess(
                res,
                filtered
            );
        }

        const attendance =
            await attendanceModel.searchAttendance({
                schoolId,
                search,
                attendanceDate: selectedDate,
                sessionId: selectedSessionId,
                termId: selectedTermId,
                type: selectedType
            });

        return sendSuccess(
            res,
            attendance
        );
    } catch (error) {
        console.error(
            "Search attendance error:",
            error
        );

        next(error);
    }
}

/* ==========================================================================
   EXPORTS
========================================================================== */

module.exports = {
    createAttendance,
    createBulkAttendance,

    getAttendance,
    getAttendanceById,

    getStudentAttendance,
    getStaffAttendance,
    getClassAttendance,

    getAttendanceByDate,
    getStaffAttendanceByDate,
    getAllAttendanceByDate,

    updateAttendance,
    deleteAttendance,

    getStudentAttendanceSummary,
    getStaffAttendanceSummary,
    getClassAttendanceSummary,

    getSchoolAttendanceSummary,

    searchAttendance,

    getAttendanceStatistics
};