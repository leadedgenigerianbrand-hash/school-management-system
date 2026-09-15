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

router.get(
    "/",
    authenticate,
    administratorOnly,
    schoolController.getAllSchools
);

router.get(
    "/count",
    authenticate,
    administratorOnly,
    schoolController.getSchoolCount
);

router.get(
    "/check-code",
    authenticate,
    administratorOnly,
    schoolController.checkSchoolCode
);

router.get(
    "/:id/statistics",
    authenticate,
    requireSchoolContext,
    schoolController.getSchoolStatistics
);

router.get(
    "/:id/dashboard",
    authenticate,
    requireSchoolContext,
    schoolController.getSchoolDashboard
);

router.get(
    "/:id",
    authenticate,
    requireSchoolContext,
    schoolController.getSchoolById
);

router.post(
    "/",
    authenticate,
    administratorOnly,
    schoolController.createSchool
);

router.put(
    "/:id",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    schoolController.updateSchool
);

router.delete(
    "/:id",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    schoolController.deleteSchool
);

module.exports = router;