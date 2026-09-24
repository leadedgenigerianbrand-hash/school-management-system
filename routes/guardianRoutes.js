"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
createGuardian,
getGuardians,
getGuardianById,
updateGuardian,
deleteGuardian,
searchGuardians,
linkGuardianToStudent,
unlinkGuardianFromStudent,
getGuardiansByStudent,
getGuardianStudents,
setPrimaryGuardian,
countGuardians,
getGuardianRelationshipStats
} = require("../controllers/guardianController");

router.use(authMiddleware);

router.get(
"/search",
searchGuardians
);

router.get(
"/student/:studentId",
getGuardiansByStudent
);

router.post(
"/link-student",
linkGuardianToStudent
);

router.post(
"/unlink-student",
unlinkGuardianFromStudent
);

router.post(
"/set-primary",
setPrimaryGuardian
);

router.get(
"/stats/relationships",
getGuardianRelationshipStats
);

router.get(
"/count",
countGuardians
);

router.get(
"/",
getGuardians
);

router.post(
"/",
createGuardian
);

router.get(
"/:guardianId/students",
getGuardianStudents
);

router.get(
"/:id",
getGuardianById
);

router.put(
"/:id",
updateGuardian
);

router.delete(
"/:id",
deleteGuardian
);

module.exports = router;
