"use strict";

const express = require("express");

const {
    getSubjects,
    getSubjectById,
    getSubjectByCode,
    searchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    assignSubjectToClass,
    getSubjectsForClass,
    removeSubjectFromClass,
    getSubjectStatistics
} = require("../controllers/subjectController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();

/*
 * Subject Routes
 *
 * Base URL:
 * /api/subjects
 *
 * All subject routes require authentication.
 */

/*
 * Get All Subjects
 *
 * GET /api/subjects
 */
router.get(
    "/",
    authMiddleware,
    getSubjects
);

/*
 * Search Subjects
 *
 * GET /api/subjects/search?q=
 *
 * This route must come before /:id.
 */
router.get(
    "/search",
    authMiddleware,
    searchSubjects
);

/*
 * Get Subject By Code
 *
 * GET /api/subjects/code/:code
 *
 * This route must come before /:id.
 */
router.get(
    "/code/:code",
    authMiddleware,
    getSubjectByCode
);

/*
 * Get Subject Statistics
 *
 * GET /api/subjects/statistics
 *
 * This route must come before /:id.
 */
router.get(
    "/statistics",
    authMiddleware,
    getSubjectStatistics
);

/*
 * Get Subjects For Class
 *
 * GET /api/subjects/class/:classId
 *
 * This route must come before /:id.
 */
router.get(
    "/class/:classId",
    authMiddleware,
    getSubjectsForClass
);

/*
 * Remove Subject From Class
 *
 * DELETE /api/subjects/class/:classSubjectId
 */
router.delete(
    "/class/:classSubjectId",
    authMiddleware,
    removeSubjectFromClass
);

/*
 * Assign Subject To Class
 *
 * POST /api/subjects/class/:classId
 */
router.post(
    "/class/:classId",
    authMiddleware,
    assignSubjectToClass
);

/*
 * Get Subject By ID
 *
 * GET /api/subjects/:id
 */
router.get(
    "/:id",
    authMiddleware,
    getSubjectById
);

/*
 * Create Subject
 *
 * POST /api/subjects
 */
router.post(
    "/",
    authMiddleware,
    createSubject
);

/*
 * Update Subject
 *
 * PUT /api/subjects/:id
 */
router.put(
    "/:id",
    authMiddleware,
    updateSubject
);

/*
 * Delete Subject
 *
 * DELETE /api/subjects/:id
 */
router.delete(
    "/:id",
    authMiddleware,
    deleteSubject
);

/*
 * Export Router
 */
module.exports = router;