"use strict";

const express = require("express");

const {
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
| Authentication:
| All Attendance routes require an authenticated user.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
|
| Apply authentication once to the entire Attendance router.
|
| This ensures that every Attendance endpoint is protected.
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
| Returns school-level attendance statistics.
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
| Returns the school's attendance summary.
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
| Compatibility/search endpoint handled by the Attendance controller.
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
| ATTENDANCE BY DATE
|--------------------------------------------------------------------------
|
| GET /api/attendance/date?date=YYYY-MM-DD
|
| The date is supplied through the query string because the finalized
| Attendance controller reads the selected date from req.query.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/date",
    getAttendanceByDate
);

/*
|--------------------------------------------------------------------------
| GET ALL ATTENDANCE
|--------------------------------------------------------------------------
|
| GET /api/attendance
|
| The controller determines the appropriate attendance query from
| the supplied request parameters.
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
| This parameter route is deliberately placed after all specific routes.
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