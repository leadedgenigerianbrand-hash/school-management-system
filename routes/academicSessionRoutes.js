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

const authenticate =
    require("../middleware/authMiddleware");

const {
    requireSchoolContext
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/",
    authenticate,
    requireSchoolContext,
    getAcademicSessions
);

router.get(
    "/search",
    authenticate,
    requireSchoolContext,
    searchAcademicSessions
);

router.get(
    "/current",
    authenticate,
    requireSchoolContext,
    getCurrentAcademicSession
);

router.get(
    "/statistics",
    authenticate,
    requireSchoolContext,
    getAcademicSessionStatistics
);

router.post(
    "/",
    authenticate,
    requireSchoolContext,
    createAcademicSession
);

router.get(
    "/:id",
    authenticate,
    requireSchoolContext,
    getAcademicSessionById
);

router.put(
    "/:id",
    authenticate,
    requireSchoolContext,
    updateAcademicSession
);

router.patch(
    "/:id/current",
    authenticate,
    requireSchoolContext,
    setCurrentAcademicSession
);

router.delete(
    "/:id",
    authenticate,
    requireSchoolContext,
    deleteAcademicSession
);

module.exports = router;