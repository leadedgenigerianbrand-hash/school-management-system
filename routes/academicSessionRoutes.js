"use strict";

const express = require("express");

const {
    createAcademicSession,
    getAcademicSessions,
    getAcademicSessionById,
    getCurrentAcademicSession,
    updateAcademicSession,
    setCurrentAcademicSession,
    deleteAcademicSession,
    searchAcademicSessions,
    getAcademicSessionStatistics
} = require("../controllers/academicSessionController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| ACADEMIC SESSION ROUTES
|--------------------------------------------------------------------------
|
| Base URL:
|
| /api/academic-sessions
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET ALL ACADEMIC SESSIONS
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authMiddleware,
    getAcademicSessions
);


/*
|--------------------------------------------------------------------------
| SEARCH ACADEMIC SESSIONS
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    authMiddleware,
    searchAcademicSessions
);


/*
|--------------------------------------------------------------------------
| GET CURRENT ACADEMIC SESSION
|--------------------------------------------------------------------------
*/

router.get(
    "/current",
    authMiddleware,
    getCurrentAcademicSession
);


/*
|--------------------------------------------------------------------------
| GET ACADEMIC SESSION STATISTICS
|--------------------------------------------------------------------------
*/

router.get(
    "/statistics",
    authMiddleware,
    getAcademicSessionStatistics
);


/*
|--------------------------------------------------------------------------
| CREATE ACADEMIC SESSION
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authMiddleware,
    createAcademicSession
);


/*
|--------------------------------------------------------------------------
| GET ACADEMIC SESSION BY ID
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    authMiddleware,
    getAcademicSessionById
);


/*
|--------------------------------------------------------------------------
| UPDATE ACADEMIC SESSION
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authMiddleware,
    updateAcademicSession
);


/*
|--------------------------------------------------------------------------
| SET CURRENT ACADEMIC SESSION
|--------------------------------------------------------------------------
*/

router.patch(
    "/:id/current",
    authMiddleware,
    setCurrentAcademicSession
);


/*
|--------------------------------------------------------------------------
| DELETE ACADEMIC SESSION
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    authMiddleware,
    deleteAcademicSession
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;