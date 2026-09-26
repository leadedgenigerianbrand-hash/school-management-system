"use strict";

const express = require("express");

const {
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
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ATTENDANCE ROUTES
|--------------------------------------------------------------------------
|
| Base URL:
| /api/attendance
|
| All attendance routes require authentication.
|
|--------------------------------------------------------------------------
*/

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| ATTENDANCE STATISTICS
|--------------------------------------------------------------------------
|
| GET /api/attendance/statistics
|
|--------------------------------------------------------------------------
*/

router.get(
    "/statistics",
    getAttendanceStatistics
);

/*
|--------------------------------------------------------------------------
| SCHOOL ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
|
| GET /api/attendance/summary
|
|--------------------------------------------------------------------------
*/

router.get(
    "/summary",
    getSchoolAttendanceSummary
);

/*
|--------------------------------------------------------------------------
| SEARCH ATTENDANCE
|--------------------------------------------------------------------------
|
| GET /api/attendance/search
|
| Supports student, staff, or all attendance searches depending
| on the controller query parameters.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    searchAttendance
);

/*
|--------------------------------------------------------------------------
| STUDENT ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
|
| GET /api/attendance/student/:studentId/summary
|
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId/summary",
    getStudentAttendanceSummary
);

/*
|--------------------------------------------------------------------------
| STUDENT ATTENDANCE
|--------------------------------------------------------------------------
|
| GET /api/attendance/student/:studentId
|
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId",
    getStudentAttendance
);

/*
|--------------------------------------------------------------------------
| STAFF ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
|
| GET /api/attendance/staff/:staffId/summary
|
| Covers both teaching and non-teaching staff.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/staff/:staffId/summary",
    getStaffAttendanceSummary
);

/*
|--------------------------------------------------------------------------
| STAFF ATTENDANCE
|--------------------------------------------------------------------------
|
| GET /api/attendance/staff/:staffId
|
| Returns attendance records for a specific staff member.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| STAFF ATTENDANCE BY DATE
|--------------------------------------------------------------------------
|
| GET /api/attendance/staff/date?date=YYYY-MM-DD
|
| IMPORTANT:
| This route must come before /staff/:staffId.
|
| Otherwise Express treats "date" as the staffId.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/staff/date",
    getStaffAttendanceByDate
);

/*
|--------------------------------------------------------------------------
| STAFF ATTENDANCE
|--------------------------------------------------------------------------
|
| GET /api/attendance/staff/:staffId
|
| Returns attendance records for a specific staff member.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/staff/:staffId",
    getStaffAttendance
);
/*
|--------------------------------------------------------------------------
| CLASS ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
|
| GET /api/attendance/class/:classId/summary
|
|--------------------------------------------------------------------------
*/

router.get(
    "/class/:classId/summary",
    getClassAttendanceSummary
);

/*
|--------------------------------------------------------------------------
| CLASS ATTENDANCE
|--------------------------------------------------------------------------
|
| GET /api/attendance/class/:classId
|
|--------------------------------------------------------------------------
*/

router.get(
    "/class/:classId",
    getClassAttendance
);

/*
|--------------------------------------------------------------------------
| ALL ATTENDANCE BY DATE
|--------------------------------------------------------------------------
|
| GET /api/attendance/all/date?date=YYYY-MM-DD
|
| Returns attendance records covering students and staff.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/all/date",
    getAllAttendanceByDate
);

/*
|--------------------------------------------------------------------------
| ATTENDANCE BY DATE
|--------------------------------------------------------------------------
|
| GET /api/attendance/date?date=YYYY-MM-DD&type=student
| GET /api/attendance/date?date=YYYY-MM-DD&type=staff
| GET /api/attendance/date?date=YYYY-MM-DD&type=all
|
|--------------------------------------------------------------------------
*/

router.get(
    "/date",
    getAttendanceByDate
);

/*
|--------------------------------------------------------------------------
| GET ATTENDANCE
|--------------------------------------------------------------------------
|
| GET /api/attendance
|
| Supported types:
|
| ?type=student
| ?type=staff
| ?type=all
|
| The controller also handles the existing student/class/date filters.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    getAttendance
);

/*
|--------------------------------------------------------------------------
| CREATE SINGLE ATTENDANCE
|--------------------------------------------------------------------------
|
| POST /api/attendance
|
| Supports either:
|
| studentId
|
| OR
|
| staffId
|
| but never both in the same attendance record.
|
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    createAttendance
);

/*
|--------------------------------------------------------------------------
| CREATE BULK ATTENDANCE
|--------------------------------------------------------------------------
|
| POST /api/attendance/bulk
|
| Supports mixed student/staff attendance records.
|
|--------------------------------------------------------------------------
*/

router.post(
    "/bulk",
    createBulkAttendance
);

/*
|--------------------------------------------------------------------------
| GET ATTENDANCE BY ID
|--------------------------------------------------------------------------
|
| GET /api/attendance/:id
|
| This parameter route must remain after all specific routes above.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    getAttendanceById
);

/*
|--------------------------------------------------------------------------
| UPDATE ATTENDANCE
|--------------------------------------------------------------------------
|
| PUT /api/attendance/:id
|
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    updateAttendance
);

/*
|--------------------------------------------------------------------------
| DELETE ATTENDANCE
|--------------------------------------------------------------------------
|
| DELETE /api/attendance/:id
|
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    deleteAttendance
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;