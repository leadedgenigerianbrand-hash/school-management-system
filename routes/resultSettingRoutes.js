"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getResultSettings,
    getResultSettingById,
    createResultSetting,
    updateResultSetting,
    deleteResultSetting,
    findSettingForScore,
    getGradeForScore,
    getCurrentUserId
} = require("../controllers/resultSettingController");

/* ==========================================================================
   RESULT SETTINGS ROUTES
   ==========================================================================

   API base:
   /api/result-settings

   Responsibilities:
   - Protect Result Settings endpoints with authentication
   - Route HTTP requests to resultSettingController
   - Keep routing separate from business logic

   The controller is responsible for:
   - Validation
   - School isolation
   - Request data handling
   - Calling the Result Settings model
   - Sending API responses

   ========================================================================== */

/* ==========================================================================
   AUTHENTICATION
   ==========================================================================

   Every Result Settings endpoint requires an authenticated user.

   ========================================================================== */

router.use(authMiddleware);

/* ==========================================================================
   CURRENT USER
   ==========================================================================

   GET /api/result-settings/current-user

   Returns the authenticated user's ID.

   ========================================================================== */

router.get("/current-user", getCurrentUserId);

/* ==========================================================================
   FIND GRADE FOR SCORE
   ==========================================================================

   GET /api/result-settings/grade-for-score?score=85

   This endpoint finds the grading setting that applies to a
   particular score.

   ========================================================================== */

router.get("/grade-for-score", getGradeForScore);

/* ==========================================================================
   FIND SETTING FOR SCORE
   ==========================================================================

   GET /api/result-settings/for-score?score=85

   Returns the complete grading setting that matches the score.

   ========================================================================== */

router.get("/for-score", findSettingForScore);

/* ==========================================================================
   LIST RESULT SETTINGS
   ==========================================================================

   GET /api/result-settings

   Optional filters may be supplied through the query string.

   ========================================================================== */

router.get("/", getResultSettings);

/* ==========================================================================
   CREATE RESULT SETTING
   ==========================================================================

   POST /api/result-settings

   ========================================================================== */

router.post("/", createResultSetting);

/* ==========================================================================
   GET RESULT SETTING BY ID
   ==========================================================================

   GET /api/result-settings/:id

   ========================================================================== */

router.get("/:id", getResultSettingById);

/* ==========================================================================
   UPDATE RESULT SETTING
   ==========================================================================

   PUT /api/result-settings/:id

   ========================================================================== */

router.put("/:id", updateResultSetting);

/* ==========================================================================
   DELETE RESULT SETTING
   ==========================================================================

   DELETE /api/result-settings/:id

   ========================================================================== */

router.delete("/:id", deleteResultSetting);

/* ==========================================================================
   EXPORT ROUTER
   ========================================================================== */

module.exports = router;