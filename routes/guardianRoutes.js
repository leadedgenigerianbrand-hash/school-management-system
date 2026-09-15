"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createGuardian,
    getGuardians,
    getGuardianById,
    updateGuardian,
    deleteGuardian,
    searchGuardians,
    getGuardiansByStudent
} = require("../controllers/guardianController");

/*
|--------------------------------------------------------------------------
| GUARDIAN ROUTES
|--------------------------------------------------------------------------
|
| Base URL:
| /api/guardians
|
| Architecture:
|
| Route
| ↓
| Guardian Controller
| ↓
| Guardian Model
| ↓
| PostgreSQL
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
|
| Every guardian endpoint requires an authenticated user.
|
|--------------------------------------------------------------------------
*/

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| SEARCH GUARDIANS
|--------------------------------------------------------------------------
|
| GET /api/guardians/search?q=searchTerm
|
| This route must remain above /:id so that "search" is not treated
| as a guardian ID.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    searchGuardians
);

/*
|--------------------------------------------------------------------------
| GET GUARDIANS BY STUDENT
|--------------------------------------------------------------------------
|
| GET /api/guardians/student/:studentId
|
| Returns guardians linked to a specific student through the
| student_guardians relationship table.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId",
    getGuardiansByStudent
);

/*
|--------------------------------------------------------------------------
| GET ALL GUARDIANS
|--------------------------------------------------------------------------
|
| GET /api/guardians
|
| Optional query parameters:
|
| ?search=
| ?q=
| ?limit=
| ?offset=
|
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    getGuardians
);

/*
|--------------------------------------------------------------------------
| CREATE GUARDIAN
|--------------------------------------------------------------------------
|
| POST /api/guardians
|
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    createGuardian
);

/*
|--------------------------------------------------------------------------
| GET GUARDIAN BY ID
|--------------------------------------------------------------------------
|
| GET /api/guardians/:id
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    getGuardianById
);

/*
|--------------------------------------------------------------------------
| UPDATE GUARDIAN
|--------------------------------------------------------------------------
|
| PUT /api/guardians/:id
|
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    updateGuardian
);

/*
|--------------------------------------------------------------------------
| DELETE GUARDIAN
|--------------------------------------------------------------------------
|
| DELETE /api/guardians/:id
|
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    deleteGuardian
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;