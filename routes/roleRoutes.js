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
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    searchRoles,
    getRolePermissions,
    assignPermission,
    removePermission,
    getRoleUsers,
    getRoleSummary,
    getUserRoles
} = require("../controllers/roleController");

router.get(
    "/",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.view"),
    getRoles
);

router.get(
    "/search",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.view"),
    searchRoles
);

router.get(
    "/summary",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.view"),
    getRoleSummary
);

router.get(
    "/user/:userId",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.view"),
    getUserRoles
);

router.get(
    "/:id/permissions",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.view"),
    getRolePermissions
);

router.get(
    "/:id/users",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.view"),
    getRoleUsers
);

router.get(
    "/:id",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.view"),
    getRoleById
);

router.post(
    "/",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.create"),
    createRole
);

router.post(
    "/:id/permissions",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.update"),
    assignPermission
);

router.delete(
    "/:id/permissions/:permissionId",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.update"),
    removePermission
);

router.put(
    "/:id",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.update"),
    updateRole
);

router.delete(
    "/:id",
    authenticate,
    requireSchoolContext,
    requirePermission("roles.delete"),
    deleteRole
);

module.exports = router;