"use strict";

const express = require("express");

const {
    login,
    getCurrentUser,
    logout
} = require("../controllers/authController");

const authenticate =
    require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/login",
    login
);

router.get(
    "/me",
    authenticate,
    getCurrentUser
);

router.post(
    "/logout",
    authenticate,
    logout
);

module.exports = router;