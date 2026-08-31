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
| Base URL: /api/attendance
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET ATTENDANCE STATISTICS
|--------------------------------------------------------------------------
| GET /api/attendance/statistics
|--------------------------------------------------------------------------
*/

router.get(
    "/statistics",
    authMiddleware,
    getAttendanceStatistics
);


/*
|--------------------------------------------------------------------------
| GET SCHOOL ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
| GET /api/attendance/summary
|--------------------------------------------------------------------------
*/

router.get(
    "/summary",
    authMiddleware,
    getSchoolAttendanceSummary
);


/*
|--------------------------------------------------------------------------
| SEARCH ATTENDANCE
|--------------------------------------------------------------------------
| GET /api/attendance/search?q=
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    authMiddleware,
    searchAttendance
);


/*
|--------------------------------------------------------------------------
| GET STUDENT ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
| GET /api/attendance/student/:studentId/summary
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId/summary",
    authMiddleware,
    getStudentAttendanceSummary
);


/*
|--------------------------------------------------------------------------
| GET STUDENT ATTENDANCE
|--------------------------------------------------------------------------
| GET /api/attendance/student/:studentId
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId",
    authMiddleware,
    getStudentAttendance
);


/*
|--------------------------------------------------------------------------
| GET CLASS ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
| GET /api/attendance/class/:classId/summary
|--------------------------------------------------------------------------
*/

router.get(
    "/class/:classId/summary",
    authMiddleware,
    getClassAttendanceSummary
);


/*
|--------------------------------------------------------------------------
| GET CLASS ATTENDANCE
|--------------------------------------------------------------------------
| GET /api/attendance/class/:classId
|--------------------------------------------------------------------------
*/

router.get(
    "/class/:classId",
    authMiddleware,
    getClassAttendance
);


/*
|--------------------------------------------------------------------------
| GET ATTENDANCE BY DATE
|--------------------------------------------------------------------------
| GET /api/attendance/date/:date
|--------------------------------------------------------------------------
*/

router.get(
    "/date/:date",
    authMiddleware,
    getAttendanceByDate
);


/*
|--------------------------------------------------------------------------
| GET ATTENDANCE BY ID
|--------------------------------------------------------------------------
| GET /api/attendance/:id
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    authMiddleware,
    getAttendanceById
);


/*
|--------------------------------------------------------------------------
| GET ALL ATTENDANCE
|--------------------------------------------------------------------------
| GET /api/attendance
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authMiddleware,
    getAttendance
);


/*
|--------------------------------------------------------------------------
| CREATE ATTENDANCE
|--------------------------------------------------------------------------
| POST /api/attendance
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authMiddleware,
    createAttendance
);


/*
|--------------------------------------------------------------------------
| CREATE BULK ATTENDANCE
|--------------------------------------------------------------------------
| POST /api/attendance/bulk
|--------------------------------------------------------------------------
*/

router.post(
    "/bulk",
    authMiddleware,
    createBulkAttendance
);


/*
|--------------------------------------------------------------------------
| UPDATE ATTENDANCE
|--------------------------------------------------------------------------
| PUT /api/attendance/:id
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authMiddleware,
    updateAttendance
);


/*
|--------------------------------------------------------------------------
| DELETE ATTENDANCE
|--------------------------------------------------------------------------
| DELETE /api/attendance/:id
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    authMiddleware,
    deleteAttendance
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;