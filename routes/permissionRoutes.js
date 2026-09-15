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
    createPermission,
    getPermissions,
    getPermissionById,
    getPermissionByName,
    updatePermission,
    deletePermission,
    searchPermissions,
    getPermissionsByModule,
    getPermissionModules,
    getPermissionRoles,
    checkPermissionExists,
    countPermissions,
    getPermissionSummary,
    getPermissionUsage
} = require("../controllers/permissionController");

router.get(
    "/summary",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    getPermissionSummary
);

router.get(
    "/count",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    countPermissions
);

router.get(
    "/modules",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    getPermissionModules
);

router.get(
    "/module/:module",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    getPermissionsByModule
);

router.get(
    "/search",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    searchPermissions
);

router.get(
    "/check/:permissionName",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    checkPermissionExists
);

router.get(
    "/name/:name",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    getPermissionByName
);

router.get(
    "/:id/roles",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    getPermissionRoles
);

router.get(
    "/:id/usage",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    getPermissionUsage
);

router.get(
    "/",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    getPermissions
);

router.get(
    "/:id",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.view"),
    getPermissionById
);

router.post(
    "/",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.create"),
    createPermission
);

router.put(
    "/:id",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.update"),
    updatePermission
);

router.delete(
    "/:id",
    authenticate,
    requireSchoolContext,
    requirePermission("permissions.delete"),
    deletePermission
);

module.exports = router;