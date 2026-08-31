const express = require("express");

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
    getPermissionSummary
} = require("../controllers/permissionController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PERMISSION ROUTES
|--------------------------------------------------------------------------
| Base URL: /api/permissions
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET PERMISSION SUMMARY
|--------------------------------------------------------------------------
| GET /api/permissions/summary
|--------------------------------------------------------------------------
*/

router.get(
    "/summary",
    authMiddleware,
    getPermissionSummary
);


/*
|--------------------------------------------------------------------------
| GET PERMISSION COUNT
|--------------------------------------------------------------------------
| GET /api/permissions/count
|--------------------------------------------------------------------------
*/

router.get(
    "/count",
    authMiddleware,
    countPermissions
);


/*
|--------------------------------------------------------------------------
| GET PERMISSION MODULES
|--------------------------------------------------------------------------
| GET /api/permissions/modules
|--------------------------------------------------------------------------
*/

router.get(
    "/modules",
    authMiddleware,
    getPermissionModules
);


/*
|--------------------------------------------------------------------------
| GET PERMISSIONS BY MODULE
|--------------------------------------------------------------------------
| GET /api/permissions/module/:module
|--------------------------------------------------------------------------
*/

router.get(
    "/module/:module",
    authMiddleware,
    getPermissionsByModule
);


/*
|--------------------------------------------------------------------------
| SEARCH PERMISSIONS
|--------------------------------------------------------------------------
| GET /api/permissions/search?q=
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    authMiddleware,
    searchPermissions
);


/*
|--------------------------------------------------------------------------
| CHECK PERMISSION EXISTS
|--------------------------------------------------------------------------
| GET /api/permissions/check/:permissionName
|--------------------------------------------------------------------------
*/

router.get(
    "/check/:permissionName",
    authMiddleware,
    checkPermissionExists
);


/*
|--------------------------------------------------------------------------
| GET PERMISSION BY NAME
|--------------------------------------------------------------------------
| GET /api/permissions/name/:name
|--------------------------------------------------------------------------
*/

router.get(
    "/name/:name",
    authMiddleware,
    getPermissionByName
);


/*
|--------------------------------------------------------------------------
| GET PERMISSION ROLES
|--------------------------------------------------------------------------
| GET /api/permissions/:id/roles
|--------------------------------------------------------------------------
*/

router.get(
    "/:id/roles",
    authMiddleware,
    getPermissionRoles
);


/*
|--------------------------------------------------------------------------
| GET ALL PERMISSIONS
|--------------------------------------------------------------------------
| GET /api/permissions
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authMiddleware,
    getPermissions
);


/*
|--------------------------------------------------------------------------
| GET PERMISSION BY ID
|--------------------------------------------------------------------------
| GET /api/permissions/:id
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    authMiddleware,
    getPermissionById
);


/*
|--------------------------------------------------------------------------
| CREATE PERMISSION
|--------------------------------------------------------------------------
| POST /api/permissions
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authMiddleware,
    createPermission
);


/*
|--------------------------------------------------------------------------
| UPDATE PERMISSION
|--------------------------------------------------------------------------
| PUT /api/permissions/:id
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authMiddleware,
    updatePermission
);


/*
|--------------------------------------------------------------------------
| DELETE PERMISSION
|--------------------------------------------------------------------------
| DELETE /api/permissions/:id
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    authMiddleware,
    deletePermission
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;