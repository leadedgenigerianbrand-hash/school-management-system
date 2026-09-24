"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createResult,
    createBulkResults,
    getAllResults,
    getResultById,
    getStudentResults,
    getClassResults,
    getSubjectResults,
    updateResult,
    deleteResult,
    approveResult,
    searchResults,
    getResultStatistics
} = require("../controllers/resultController");

/*
|--------------------------------------------------------------------------
| RESULTS ROUTES
|--------------------------------------------------------------------------
|
| API base:
| /api/results
|
| Responsibilities:
| - Authenticate all Results requests
| - Map HTTP requests to resultController
| - Keep routing separate from business logic
|
| The controller handles:
| - Request validation
| - School isolation
| - Result processing
| - Calling the Result service/model
| - API responses
|
|--------------------------------------------------------------------------
*/

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| GET ALL RESULTS
|--------------------------------------------------------------------------
|
| GET /api/results
|
| Optional filters may be supplied through query parameters:
| - studentId
| - classId
| - subjectId
| - sessionId
| - termId
|
|--------------------------------------------------------------------------
*/

router.get("/", getAllResults);

/*
|--------------------------------------------------------------------------
| RESULT STATISTICS
|--------------------------------------------------------------------------
|
| GET /api/results/statistics
|
|--------------------------------------------------------------------------
*/

router.get("/statistics", getResultStatistics);

/*
|--------------------------------------------------------------------------
| SEARCH RESULTS
|--------------------------------------------------------------------------
|
| GET /api/results/search?q=
|
|--------------------------------------------------------------------------
*/

router.get("/search", searchResults);

/*
|--------------------------------------------------------------------------
| STUDENT RESULTS
|--------------------------------------------------------------------------
|
| GET /api/results/student/:studentId
|
|--------------------------------------------------------------------------
*/

router.get("/student/:studentId", getStudentResults);

/*
|--------------------------------------------------------------------------
| CLASS RESULTS
|--------------------------------------------------------------------------
|
| GET /api/results/class/:classId
|
|--------------------------------------------------------------------------
*/

router.get("/class/:classId", getClassResults);

/*
|--------------------------------------------------------------------------
| SUBJECT RESULTS
|--------------------------------------------------------------------------
|
| GET /api/results/subject/:subjectId
|
|--------------------------------------------------------------------------
*/

router.get("/subject/:subjectId", getSubjectResults);

/*
|--------------------------------------------------------------------------
| BULK CREATE / UPDATE RESULTS
|--------------------------------------------------------------------------
|
| POST /api/results/bulk
|
| Saves all subject results for a student in one request.
|
| The result controller already contains createBulkResults().
|
| This route must be registered before GET /:id so that "bulk" is
| handled as a route instead of being interpreted as a result ID.
|
|--------------------------------------------------------------------------
*/

router.post("/bulk", createBulkResults);

/*
|--------------------------------------------------------------------------
| GET RESULT BY ID
|--------------------------------------------------------------------------
|
| GET /api/results/:id
|
| This route is intentionally registered after the specific routes above.
|
|--------------------------------------------------------------------------
*/

router.get("/:id", getResultById);

/*
|--------------------------------------------------------------------------
| CREATE RESULT
|--------------------------------------------------------------------------
|
| POST /api/results
|
|--------------------------------------------------------------------------
*/

router.post("/", createResult);

/*
|--------------------------------------------------------------------------
| UPDATE RESULT
|--------------------------------------------------------------------------
|
| PUT /api/results/:id
|
|--------------------------------------------------------------------------
*/

router.put("/:id", updateResult);

/*
|--------------------------------------------------------------------------
| APPROVE / PUBLISH RESULT
|--------------------------------------------------------------------------
|
| PATCH /api/results/:id/approve
|
|--------------------------------------------------------------------------
*/

router.patch("/:id/approve", approveResult);

/*
|--------------------------------------------------------------------------
| DELETE RESULT
|--------------------------------------------------------------------------
|
| DELETE /api/results/:id
|
|--------------------------------------------------------------------------
*/

router.delete("/:id", deleteResult);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;