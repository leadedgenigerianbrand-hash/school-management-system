"use strict";

const express = require("express");

const {
    getTerms,
    getTermById,
    createTerm,
    updateTerm,
    deleteTerm
} = require("../controllers/termController");

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
    getTerms
);

router.get(
    "/:id",
    authenticate,
    requireSchoolContext,
    getTermById
);

router.post(
    "/",
    authenticate,
    requireSchoolContext,
    createTerm
);

router.put(
    "/:id",
    authenticate,
    requireSchoolContext,
    updateTerm
);

router.delete(
    "/:id",
    authenticate,
    requireSchoolContext,
    deleteTerm
);

module.exports = router;