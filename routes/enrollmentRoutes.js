"use strict";

const express = require("express");

const enrollmentController = require("../controllers/enrollmentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/student/:studentId",
    authMiddleware,
    enrollmentController.getStudentEnrollment
);

router.get(
    "/student/:studentId/session/:academicSessionId",
    authMiddleware,
    function (req, res, next) {
        req.query.academicSessionId =
            req.params.academicSessionId;

        return enrollmentController.getStudentEnrollment(
            req,
            res,
            next
        );
    }
);

router.post(
    "/student/:studentId",
    authMiddleware,
    enrollmentController.enrollStudent
);

module.exports = router;