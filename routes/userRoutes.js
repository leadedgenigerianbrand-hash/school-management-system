"use strict";

const express = require("express");

const router = express.Router();

const authenticate =
    require("../middleware/authMiddleware");

const {
    requirePermission,
    requireSchoolContext
} = require("../middleware/roleMiddleware");

const {
    createUser,
    getUsers,
    getUserById,
    getCurrentUser,
    updateUser,
    changePassword,
    activateUser,
    deactivateUser,
    deleteUser,
    updateLastLogin
} = require("../controllers/userController");

router.get(
    "/me",
    authenticate,
    getCurrentUser
);

router.post(
    "/me/last-login",
    authenticate,
    updateLastLogin
);

router.put(
    "/:id/password",
    authenticate,
    changePassword
);

router.get(
    "/",
    authenticate,
    requireSchoolContext,
    requirePermission("users.view"),
    getUsers
);

router.get(
    "/:id",
    authenticate,
    requireSchoolContext,
    requirePermission("users.view"),
    getUserById
);

router.post(
    "/",
    authenticate,
    requireSchoolContext,
    requirePermission("users.create"),
    createUser
);

router.put(
    "/:id",
    authenticate,
    requireSchoolContext,
    requirePermission("users.update"),
    updateUser
);

router.patch(
    "/:id/activate",
    authenticate,
    requireSchoolContext,
    requirePermission("users.activate"),
    activateUser
);

router.patch(
    "/:id/deactivate",
    authenticate,
    requireSchoolContext,
    requirePermission("users.deactivate"),
    deactivateUser
);

router.delete(
    "/:id",
    authenticate,
    requireSchoolContext,
    requirePermission("users.delete"),
    deleteUser
);

module.exports = router;