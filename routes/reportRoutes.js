"use strict";

const express = require("express");

const {
    getDashboardReport,
    getStudentReport,
    getAcademicReport,
    getAttendanceReport,
    getFeeReport,
    getStaffReport,
    getCompleteSchoolReport
} = require("../controllers/reportController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router =
    express.Router();

/*
|--------------------------------------------------------------------------
| REPORT ROUTES
|--------------------------------------------------------------------------
|
| Base URL:
| /api/reports
|
| All report endpoints require authentication.
|
|--------------------------------------------------------------------------
*/

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| DASHBOARD REPORT
|--------------------------------------------------------------------------
|
| GET /api/reports/dashboard
|
|--------------------------------------------------------------------------
*/

router.get(
    "/dashboard",
    getDashboardReport
);

/*
|--------------------------------------------------------------------------
| STUDENT REPORT
|--------------------------------------------------------------------------
|
| GET /api/reports/students
|
| Optional query parameters:
| - sessionId
| - classId
|
|--------------------------------------------------------------------------
*/

router.get(
    "/students",
    getStudentReport
);

/*
|--------------------------------------------------------------------------
| ACADEMIC REPORT
|--------------------------------------------------------------------------
|
| GET /api/reports/academic
|
| Optional query parameters:
| - sessionId
| - termId
| - classId
|
|--------------------------------------------------------------------------
*/

router.get(
    "/academic",
    getAcademicReport
);

/*
|--------------------------------------------------------------------------
| ATTENDANCE REPORT
|--------------------------------------------------------------------------
|
| GET /api/reports/attendance
|
| Optional query parameters:
| - sessionId
| - startDate
| - endDate
|
|--------------------------------------------------------------------------
*/

router.get(
    "/attendance",
    getAttendanceReport
);

/*
|--------------------------------------------------------------------------
| FEE REPORT
|--------------------------------------------------------------------------
|
| GET /api/reports/fees
|
|--------------------------------------------------------------------------
*/

router.get(
    "/fees",
    getFeeReport
);

/*
|--------------------------------------------------------------------------
| STAFF REPORT
|--------------------------------------------------------------------------
|
| GET /api/reports/staff
|
| Optional query parameter:
| - departmentId
|
|--------------------------------------------------------------------------
*/

router.get(
    "/staff",
    getStaffReport
);

/*
|--------------------------------------------------------------------------
| COMPLETE SCHOOL REPORT
|--------------------------------------------------------------------------
|
| GET /api/reports/complete
|
| Optional query parameters:
| - sessionId
| - termId
| - startDate
| - endDate
|
|--------------------------------------------------------------------------
*/

router.get(
    "/complete",
    getCompleteSchoolReport
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;