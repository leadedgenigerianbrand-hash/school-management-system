"use strict";

const express = require("express");

const router = express.Router();

const schoolController =
    require("../controllers/schoolController");

const authenticate =
    require("../middleware/authMiddleware");

const {
    administratorOnly,
    requireSchoolContext
} = require("../middleware/roleMiddleware");


/*
|--------------------------------------------------------------------------
| SCHOOL ROUTES
|--------------------------------------------------------------------------
|
| Base route:
|
| /api/schools
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET ALL SCHOOLS
|--------------------------------------------------------------------------
|
| GET /api/schools
|
| Optional query parameters:
|
| ?status=Active
| ?search=Leadedge
|
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authenticate,
    administratorOnly,
    schoolController.getAllSchools
);


/*
|--------------------------------------------------------------------------
| GET SCHOOL BY ID
|--------------------------------------------------------------------------
|
| GET /api/schools/:id
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    authenticate,
    requireSchoolContext,
    schoolController.getSchoolById
);


/*
|--------------------------------------------------------------------------
| GET SCHOOL STATISTICS
|--------------------------------------------------------------------------
|
| GET /api/schools/:id/statistics
|
| IMPORTANT:
| This route must appear before any future generic /:id handling
| if additional parameter-based routes are introduced.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:id/statistics",
    authenticate,
    requireSchoolContext,
    schoolController.getSchoolStatistics
);


/*
|--------------------------------------------------------------------------
| GET SCHOOL DASHBOARD
|--------------------------------------------------------------------------
|
| GET /api/schools/:id/dashboard
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:id/dashboard",
    authenticate,
    requireSchoolContext,
    schoolController.getSchoolDashboard
);


/*
|--------------------------------------------------------------------------
| CREATE SCHOOL
|--------------------------------------------------------------------------
|
| POST /api/schools
|
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authenticate,
    administratorOnly,
    schoolController.createSchool
);


/*
|--------------------------------------------------------------------------
| UPDATE SCHOOL
|--------------------------------------------------------------------------
|
| PUT /api/schools/:id
|
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    schoolController.updateSchool
);


/*
|--------------------------------------------------------------------------
| DELETE SCHOOL
|--------------------------------------------------------------------------
|
| DELETE /api/schools/:id
|
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    schoolController.deleteSchool
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = router;