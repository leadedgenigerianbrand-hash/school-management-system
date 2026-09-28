"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    getSchoolSettings,
    updateSchoolSettings,
    resetSchoolSettings
} =
    require("../controllers/schoolSettingController");


/*
===============================================================================
 SCHOOL SETTINGS ROUTES
===============================================================================

API base:

    /api/school-settings

All endpoints require authentication.

School context is taken from the authenticated user's JWT.
===============================================================================
*/

router.use(
    authMiddleware
);


/*
===============================================================================
 GET SCHOOL SETTINGS
===============================================================================

GET /api/school-settings

Returns the settings belonging to the authenticated user's school.

If no settings record exists yet, the controller creates one using defaults.
===============================================================================
*/

router.get(
    "/",
    getSchoolSettings
);


/*
===============================================================================
 UPDATE SCHOOL SETTINGS
===============================================================================

PUT /api/school-settings

Updates the settings belonging to the authenticated user's school.
===============================================================================
*/

router.put(
    "/",
    updateSchoolSettings
);


/*
===============================================================================
 RESET SCHOOL SETTINGS
===============================================================================

POST /api/school-settings/reset

Restores the school's settings to the platform defaults.
===============================================================================
*/

router.post(
    "/reset",
    resetSchoolSettings
);


/*
===============================================================================
 EXPORT
===============================================================================
*/

module.exports = router;