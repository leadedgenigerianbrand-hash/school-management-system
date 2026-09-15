"use strict";

const auditLogModel = require("../models/auditLogModel");

function resolveSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.query?.schoolId ||
        req.body?.schoolId ||
        req.body?.school_id ||
        null
    );
}

function resolveUserId(req) {
    return (
        req.user?.id ||
        req.user?.userId ||
        req.user?.user_id ||
        req.body?.userId ||
        req.body?.user_id ||
        null
    );
}

function getOptionalValue(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    return value;
}

function parseLimit(value, defaultValue = 100) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        return defaultValue;
    }

    return Math.min(parsed, 500);
}

function parseOffset(value) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 0) {
        return 0;
    }

    return parsed;
}

function sendSuccess(
    res,
    data,
    message = "Request successful"
) {
    return res.status(200).json({
        success: true,
        message,
        data
    });
}

function sendCreated(
    res,
    data,
    message = "Audit log created successfully"
) {
    return res.status(201).json({
        success: true,
        message,
        data
    });
}

function sendBadRequest(res, message) {
    return res.status(400).json({
        success: false,
        message
    });
}

function sendNotFound(
    res,
    message = "Audit log not found"
) {
    return res.status(404).json({
        success: false,
        message
    });
}

function sendServerError(res, error) {
    console.error(
        "Audit log controller error:",
        error
    );

    return res.status(500).json({
        success: false,
        message:
            "An error occurred while processing the audit log request"
    });
}

async function createAuditLog(req, res) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = resolveUserId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required"
            );
        }

        if (!userId) {
            return sendBadRequest(
                res,
                "User ID is required"
            );
        }

        const {
            action,
            tableName,
            recordId,
            oldData,
            newData,
            ipAddress,
            userAgent
        } = req.body;

        if (!action) {
            return sendBadRequest(
                res,
                "Action is required"
            );
        }

        const auditLog =
            await auditLogModel.createAuditLog({
                schoolId,
                userId,
                action,
                tableName:
                    getOptionalValue(tableName),
                recordId:
                    getOptionalValue(recordId),
                oldData:
                    getOptionalValue(oldData),
                newData:
                    getOptionalValue(newData),
                ipAddress:
                    getOptionalValue(ipAddress) ||
                    req.ip ||
                    null,
                userAgent:
                    getOptionalValue(userAgent) ||
                    req.get("user-agent") ||
                    null
            });

        return sendCreated(res, auditLog);
    } catch (error) {
        return sendServerError(res, error);
    }
}

async function getAuditLogs(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required"
            );
        }

        const logs =
            await auditLogModel.getAuditLogs({
                schoolId,
                userId:
                    getOptionalValue(
                        req.query.userId ||
                        req.query.user_id
                    ),
                action:
                    getOptionalValue(
                        req.query.action
                    ),
                tableName:
                    getOptionalValue(
                        req.query.tableName ||
                        req.query.table_name
                    ),
                recordId:
                    getOptionalValue(
                        req.query.recordId ||
                        req.query.record_id
                    ),
                startDate:
                    getOptionalValue(
                        req.query.startDate
                    ),
                endDate:
                    getOptionalValue(
                        req.query.endDate
                    ),
                limit:
                    parseLimit(req.query.limit),
                offset:
                    parseOffset(req.query.offset)
            });

        return sendSuccess(
            res,
            logs,
            "Audit logs retrieved successfully"
        );
    } catch (error) {
        return sendServerError(res, error);
    }
}

async function getAuditLogById(req, res) {
    try {
        const schoolId = resolveSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required"
            );
        }

        if (!id) {
            return sendBadRequest(
                res,
                "Audit log ID is required"
            );
        }

        const auditLog =
            await auditLogModel.getAuditLogById(
                id,
                schoolId
            );

        if (!auditLog) {
            return sendNotFound(res);
        }

        return sendSuccess(
            res,
            auditLog,
            "Audit log retrieved successfully"
        );
    } catch (error) {
        return sendServerError(res, error);
    }
}

async function getAuditLogsByUser(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const userId =
            req.params.userId ||
            req.query.userId ||
            req.query.user_id;

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required"
            );
        }

        if (!userId) {
            return sendBadRequest(
                res,
                "User ID is required"
            );
        }

        const logs =
            await auditLogModel.getAuditLogsByUser(
                userId,
                schoolId,
                parseLimit(req.query.limit)
            );

        return sendSuccess(
            res,
            logs,
            "User audit logs retrieved successfully"
        );
    } catch (error) {
        return sendServerError(res, error);
    }
}

async function getAuditLogsByTable(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const tableName =
            req.params.tableName ||
            req.query.tableName ||
            req.query.table_name;

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required"
            );
        }

        if (!tableName) {
            return sendBadRequest(
                res,
                "Table name is required"
            );
        }

        const logs =
            await auditLogModel.getAuditLogsByTable(
                tableName,
                schoolId
            );

        return sendSuccess(
            res,
            logs,
            "Table audit logs retrieved successfully"
        );
    } catch (error) {
        return sendServerError(res, error);
    }
}

async function getAuditLogsByRecord(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const tableName =
            req.params.tableName ||
            req.query.tableName ||
            req.query.table_name;

        const recordId =
            req.params.recordId ||
            req.query.recordId ||
            req.query.record_id;

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required"
            );
        }

        if (!tableName) {
            return sendBadRequest(
                res,
                "Table name is required"
            );
        }

        if (!recordId) {
            return sendBadRequest(
                res,
                "Record ID is required"
            );
        }

        const logs =
            await auditLogModel.getAuditLogsByRecord(
                tableName,
                recordId,
                schoolId
            );

        return sendSuccess(
            res,
            logs,
            "Record audit logs retrieved successfully"
        );
    } catch (error) {
        return sendServerError(res, error);
    }
}

async function countAuditLogs(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required"
            );
        }

        const count =
            await auditLogModel.countAuditLogs({
                schoolId,
                userId:
                    getOptionalValue(
                        req.query.userId ||
                        req.query.user_id
                    ),
                action:
                    getOptionalValue(
                        req.query.action
                    ),
                tableName:
                    getOptionalValue(
                        req.query.tableName ||
                        req.query.table_name
                    ),
                startDate:
                    getOptionalValue(
                        req.query.startDate
                    ),
                endDate:
                    getOptionalValue(
                        req.query.endDate
                    )
            });

        return sendSuccess(
            res,
            { count },
            "Audit log count retrieved successfully"
        );
    } catch (error) {
        return sendServerError(res, error);
    }
}

async function deleteAuditLog(req, res) {
    try {
        const schoolId = resolveSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required"
            );
        }

        if (!id) {
            return sendBadRequest(
                res,
                "Audit log ID is required"
            );
        }

        const deletedLog =
            await auditLogModel.deleteAuditLog(
                id,
                schoolId
            );

        if (!deletedLog) {
            return sendNotFound(res);
        }

        return sendSuccess(
            res,
            deletedLog,
            "Audit log deleted successfully"
        );
    } catch (error) {
        return sendServerError(res, error);
    }
}

async function deleteAuditLogsBefore(req, res) {
    try {
        const schoolId = resolveSchoolId(req);

        const date =
            req.body?.date ||
            req.query?.date;

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required"
            );
        }

        if (!date) {
            return sendBadRequest(
                res,
                "Date is required"
            );
        }

        const deletedCount =
            await auditLogModel.deleteAuditLogsBefore(
                date,
                schoolId
            );

        return sendSuccess(
            res,
            { deletedCount },
            "Old audit logs deleted successfully"
        );
    } catch (error) {
        return sendServerError(res, error);
    }
}

module.exports = {
    createAuditLog,
    getAuditLogs,
    getAuditLogById,
    getAuditLogsByUser,
    getAuditLogsByTable,
    getAuditLogsByRecord,
    countAuditLogs,
    deleteAuditLog,
    deleteAuditLogsBefore
};