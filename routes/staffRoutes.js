const express = require("express");

const staffController = require("../controllers/staffController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| STAFF ROUTES
|--------------------------------------------------------------------------
| Base URL: /api/staff
|--------------------------------------------------------------------------
*/

// Get all staff
router.get(
    "/",
    authMiddleware,
    staffController.getStaff
);

// Get staff by ID
router.get(
    "/:id",
    authMiddleware,
    staffController.getStaffById
);

// Create staff
router.post(
    "/",
    authMiddleware,
    staffController.createStaff
);

// Update staff
router.put(
    "/:id",
    authMiddleware,
    staffController.updateStaff
);

// Delete staff
router.delete(
    "/:id",
    authMiddleware,
    staffController.deleteStaff
);

module.exports = router;