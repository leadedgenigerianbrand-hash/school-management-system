"use strict";

const express = require("express");

const {
createAuditLog,
getAuditLogs,
getAuditLogById,
getAuditLogsByUser,
getAuditLogsByTable,
getAuditLogsByRecord,
countAuditLogs,
deleteAuditLog,
deleteAuditLogsBefore
} = require("../controllers/auditLogController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAuditLogs);

router.get("/count", countAuditLogs);

router.get("/user/:userId", getAuditLogsByUser);

router.get("/table/:tableName", getAuditLogsByTable);

router.get("/table/:tableName/record/:recordId", getAuditLogsByRecord);

router.get("/:id", getAuditLogById);

router.post("/", createAuditLog);

router.delete("/cleanup", deleteAuditLogsBefore);

router.delete("/:id", deleteAuditLog);

module.exports = router;
