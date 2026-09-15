"use strict";

const express = require("express");

const staffController = require("../controllers/staffController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| STAFF ROUTES
|--------------------------------------------------------------------------
|
| Base URL:
| /api/staff
|
| All staff routes require authentication.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| GET ALL STAFF
|--------------------------------------------------------------------------
|
| GET /api/staff
|
| Optional query parameters:
| - schoolId
| - departmentId
| - status
|
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authMiddleware,
    staffController.getStaff
);

/*
|--------------------------------------------------------------------------
| SEARCH STAFF
|--------------------------------------------------------------------------
|
| GET /api/staff/search?q=searchTerm
|
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    authMiddleware,
    staffController.searchStaff
);

/*
|--------------------------------------------------------------------------
| COUNT STAFF
|--------------------------------------------------------------------------
|
| GET /api/staff/count
|
| Optional query parameters:
| - schoolId
| - departmentId
| - status
|
|--------------------------------------------------------------------------
*/

router.get(
    "/count",
    authMiddleware,
    staffController.countStaff
);

/*
|--------------------------------------------------------------------------
| STAFF STATISTICS
|--------------------------------------------------------------------------
|
| GET /api/staff/statistics
|
|--------------------------------------------------------------------------
*/

router.get(
    "/statistics",
    authMiddleware,
    staffController.getStaffStatistics
);

/*
|--------------------------------------------------------------------------
| GET STAFF BY NUMBER
|--------------------------------------------------------------------------
|
| GET /api/staff/by-number/:staffNumber
|
|--------------------------------------------------------------------------
*/

router.get(
    "/by-number/:staffNumber",
    authMiddleware,
    staffController.getStaffByNumber
);

/*
|--------------------------------------------------------------------------
| GET STAFF BY DEPARTMENT
|--------------------------------------------------------------------------
|
| GET /api/staff/by-department/:departmentId
|
|--------------------------------------------------------------------------
*/

router.get(
    "/by-department/:departmentId",
    authMiddleware,
    staffController.getStaffByDepartment
);

/*
|--------------------------------------------------------------------------
| CHECK STAFF NUMBER
|--------------------------------------------------------------------------
|
| GET /api/staff/check-number/:staffNumber
|
|--------------------------------------------------------------------------
*/

router.get(
    "/check-number/:staffNumber",
    authMiddleware,
    staffController.checkStaffNumber
);

/*
|--------------------------------------------------------------------------
| GET STAFF BY ID
|--------------------------------------------------------------------------
|
| GET /api/staff/:id
|
| This route must remain AFTER the named routes above.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    authMiddleware,
    staffController.getStaffById
);

/*
|--------------------------------------------------------------------------
| CREATE STAFF
|--------------------------------------------------------------------------
|
| POST /api/staff
|
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authMiddleware,
    staffController.createStaff
);

/*
|--------------------------------------------------------------------------
| UPDATE STAFF
|--------------------------------------------------------------------------
|
| PUT /api/staff/:id
|
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authMiddleware,
    staffController.updateStaff
);

/*
|--------------------------------------------------------------------------
| DELETE STAFF
|--------------------------------------------------------------------------
|
| DELETE /api/staff/:id
|
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    authMiddleware,
    staffController.deleteStaff
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;