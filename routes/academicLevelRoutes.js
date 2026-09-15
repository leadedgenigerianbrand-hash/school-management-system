"use strict";

const express = require("express");

const router = express.Router();

const authenticate =
    require("../middleware/authMiddleware");

const {
    requireSchoolContext
} = require("../middleware/roleMiddleware");

const {
    create,
    getAll,
    getActive,
    getById,
    getWithClasses,
    update,
    rename,
    activate,
    deactivate,
    remove,
    search,
    getStatistics
} = require("../controllers/academicLevelController");

router.get(
    "/search",
    authenticate,
    requireSchoolContext,
    search
);

router.get(
    "/active",
    authenticate,
    requireSchoolContext,
    getActive
);

router.get(
    "/",
    authenticate,
    requireSchoolContext,
    getAll
);

router.post(
    "/",
    authenticate,
    requireSchoolContext,
    create
);

router.get(
    "/:id/classes",
    authenticate,
    requireSchoolContext,
    getWithClasses
);

router.get(
    "/:id/statistics",
    authenticate,
    requireSchoolContext,
    getStatistics
);

router.put(
    "/:id",
    authenticate,
    requireSchoolContext,
    update
);

router.patch(
    "/:id/rename",
    authenticate,
    requireSchoolContext,
    rename
);

router.patch(
    "/:id/activate",
    authenticate,
    requireSchoolContext,
    activate
);

router.patch(
    "/:id/deactivate",
    authenticate,
    requireSchoolContext,
    deactivate
);

router.delete(
    "/:id",
    authenticate,
    requireSchoolContext,
    remove
);

router.get(
    "/:id",
    authenticate,
    requireSchoolContext,
    getById
);

module.exports = router;