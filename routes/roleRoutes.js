const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
getRoles,
getRoleById,
createRole,
updateRole,
deleteRole,
searchRoles
} = require("../controllers/roleController");

const {
requireRole
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
"/",
authenticate,
getRoles
);

router.get(
"/search",
authenticate,
searchRoles
);

router.get(
"/:id",
authenticate,
getRoleById
);

router.post(
"/",
authenticate,
requireRole("Administrator"),
createRole
);

router.put(
"/:id",
authenticate,
requireRole("Administrator"),
updateRole
);

router.delete(
"/:id",
authenticate,
requireRole("Administrator"),
deleteRole
);

module.exports = router;
