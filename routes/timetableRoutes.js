"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
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
} = require("../controllers/timetableController");

/*
|--------------------------------------------------------------------------
| TIMETABLE ROUTES
|--------------------------------------------------------------------------
|
| Base API path:
|
| /api/timetable
|
| These routes connect HTTP requests to:
|
| controllers/timetableController.js
|
| Authentication is required for all timetable operations.
|
|--------------------------------------------------------------------------
*/

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| COLLECTION ROUTES
|--------------------------------------------------------------------------
*/

/*
| GET /api/timetable
| Retrieve timetable entries.
|
| Supported query filters:
| - academicSessionId
| - classId
| - classArmId
| - subjectId
| - teacherId
| - dayOfWeek
| - search
| - page
| - limit
*/
router.get("/", getTimetable);

/*
| GET /api/timetable/count
| Retrieve the number of timetable entries.
*/
router.get("/count", countTimetable);

/*
|--------------------------------------------------------------------------
| CONFLICT CHECK ROUTES
|--------------------------------------------------------------------------
*/

/*
| POST /api/timetable/check-class-conflict
| Check whether a class/class arm already has
| another timetable entry during the requested time.
*/
router.post(
    "/check-class-conflict",
    checkClassConflict
);

/*
| POST /api/timetable/check-teacher-conflict
| Check whether a teacher already has another
| timetable entry during the requested time.
*/
router.post(
    "/check-teacher-conflict",
    checkTeacherConflict
);

/*
|--------------------------------------------------------------------------
| FILTERED TIMETABLE ROUTES
|--------------------------------------------------------------------------
|
| These routes are deliberately placed before /:id so that
| "class", "class-arm", "teacher" and "subject" are treated
| as route names rather than timetable entry IDs.
|
|--------------------------------------------------------------------------
*/

/*
| GET /api/timetable/class/:classId
| Retrieve timetable entries for a class.
*/
router.get(
    "/class/:classId",
    getTimetableByClass
);

/*
| GET /api/timetable/class-arm/:classArmId
| Retrieve timetable entries for a class arm.
*/
router.get(
    "/class-arm/:classArmId",
    getTimetableByClassArm
);

/*
| GET /api/timetable/teacher/:teacherId
| Retrieve timetable entries for a teacher.
*/
router.get(
    "/teacher/:teacherId",
    getTimetableByTeacher
);

/*
| GET /api/timetable/subject/:subjectId
| Retrieve timetable entries for a subject.
*/
router.get(
    "/subject/:subjectId",
    getTimetableBySubject
);

/*
|--------------------------------------------------------------------------
| SINGLE ENTRY ROUTES
|--------------------------------------------------------------------------
*/

/*
| GET /api/timetable/:id
| Retrieve one timetable entry.
*/
router.get(
    "/:id",
    getTimetableById
);

/*
| POST /api/timetable
| Create a timetable entry.
*/
router.post(
    "/",
    createTimetable
);

/*
| PUT /api/timetable/:id
| Update a timetable entry.
*/
router.put(
    "/:id",
    updateTimetable
);

/*
| DELETE /api/timetable/:id
| Delete a timetable entry.
*/
router.delete(
    "/:id",
    deleteTimetable
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;