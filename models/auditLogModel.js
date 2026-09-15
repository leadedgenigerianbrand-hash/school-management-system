"use strict";

const { query } = require("../config/database");

function validateId(value, fieldName) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        throw new Error(`${fieldName} is required`);
    }

    return value;
}

function normalizeOptional(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    return value;
}

function getEntityTypeValue(data) {
    return (
        data.entityType ??
        data.tableName ??
        null
    );
}

function getEntityIdValue(data) {
    return (
        data.entityId ??
        data.recordId ??
        null
    );
}

async function createAuditLog({
    schoolId,
    userId,
    action,
    entityType,
    entityId,
    tableName,
    recordId,
    description,
    oldData,
    newData,
    ipAddress,
    userAgent,
    metadata
}) {
    validateId(schoolId, "schoolId");
    validateId(userId, "userId");
    validateId(action, "action");

    const resolvedEntityType =
        getEntityTypeValue({
            entityType,
            tableName
        });

    const resolvedEntityId =
        getEntityIdValue({
            entityId,
            recordId
        });

    const result = await query(
        `
        INSERT INTO audit_logs (
            school_id,
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            ip_address,
            user_agent,
            metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
            schoolId,
            userId,
            action,
            normalizeOptional(resolvedEntityType),
            normalizeOptional(resolvedEntityId),
            normalizeOptional(description),
            normalizeOptional(ipAddress),
            normalizeOptional(userAgent),
            normalizeOptional(metadata)
        ]
    );

    return result.rows[0];
}

async function getAuditLogs({
    schoolId,
    userId,
    action,
    entityType,
    entityId,
    tableName,
    recordId,
    startDate,
    endDate,
    limit = 100,
    offset = 0
}) {
    validateId(schoolId, "schoolId");

    const values = [schoolId];
    const conditions = [
        "al.school_id = $1"
    ];

    const resolvedEntityType =
        getEntityTypeValue({
            entityType,
            tableName
        });

    const resolvedEntityId =
        getEntityIdValue({
            entityId,
            recordId
        });

    if (
        userId !== undefined &&
        userId !== null &&
        userId !== ""
    ) {
        values.push(userId);

        conditions.push(
            `al.user_id = $${values.length}`
        );
    }

    if (
        action !== undefined &&
        action !== null &&
        action !== ""
    ) {
        values.push(action);

        conditions.push(
            `al.action = $${values.length}`
        );
    }

    if (
        resolvedEntityType !== undefined &&
        resolvedEntityType !== null &&
        resolvedEntityType !== ""
    ) {
        values.push(resolvedEntityType);

        conditions.push(
            `al.entity_type = $${values.length}`
        );
    }

    if (
        resolvedEntityId !== undefined &&
        resolvedEntityId !== null &&
        resolvedEntityId !== ""
    ) {
        values.push(resolvedEntityId);

        conditions.push(
            `al.entity_id = $${values.length}`
        );
    }

    if (
        startDate !== undefined &&
        startDate !== null &&
        startDate !== ""
    ) {
        values.push(startDate);

        conditions.push(
            `al.created_at >= $${values.length}`
        );
    }

    if (
        endDate !== undefined &&
        endDate !== null &&
        endDate !== ""
    ) {
        values.push(endDate);

        conditions.push(
            `al.created_at <= $${values.length}`
        );
    }

    const numericLimit = Number(limit);
    const numericOffset = Number(offset);

    const safeLimit =
        Number.isInteger(numericLimit) &&
        numericLimit > 0
            ? Math.min(numericLimit, 500)
            : 100;

    const safeOffset =
        Number.isInteger(numericOffset) &&
        numericOffset >= 0
            ? numericOffset
            : 0;

    values.push(safeLimit);

    const limitParameter =
        `$${values.length}`;

    values.push(safeOffset);

    const offsetParameter =
        `$${values.length}`;

    const result = await query(
        `
        SELECT
            al.*
        FROM audit_logs al
        WHERE ${conditions.join(" AND ")}
        ORDER BY al.created_at DESC
        LIMIT ${limitParameter}
        OFFSET ${offsetParameter}
        `,
        values
    );

    return result.rows;
}

async function getAuditLogById(id, schoolId) {
    validateId(id, "id");
    validateId(schoolId, "schoolId");

    const result = await query(
        `
        SELECT
            al.*
        FROM audit_logs al
        WHERE al.id = $1
          AND al.school_id = $2
        LIMIT 1
        `,
        [
            id,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

async function getAuditLogsByUser(
    userId,
    schoolId,
    limit = 100
) {
    validateId(userId, "userId");
    validateId(schoolId, "schoolId");

    const numericLimit = Number(limit);

    const safeLimit =
        Number.isInteger(numericLimit) &&
        numericLimit > 0
            ? Math.min(numericLimit, 500)
            : 100;

    const result = await query(
        `
        SELECT
            al.*
        FROM audit_logs al
        WHERE al.user_id = $1
          AND al.school_id = $2
        ORDER BY al.created_at DESC
        LIMIT $3
        `,
        [
            userId,
            schoolId,
            safeLimit
        ]
    );

    return result.rows;
}

async function getAuditLogsByEntity(
    entityType,
    entityId,
    schoolId
) {
    validateId(entityType, "entityType");
    validateId(entityId, "entityId");
    validateId(schoolId, "schoolId");

    const result = await query(
        `
        SELECT
            al.*
        FROM audit_logs al
        WHERE al.entity_type = $1
          AND al.entity_id = $2
          AND al.school_id = $3
        ORDER BY al.created_at DESC
        `,
        [
            entityType,
            entityId,
            schoolId
        ]
    );

    return result.rows;
}

async function getAuditLogsByTable(
    tableName,
    schoolId
) {
    validateId(tableName, "tableName");
    validateId(schoolId, "schoolId");

    return getAuditLogsByEntity(
        tableName,
        null,
        schoolId
    ).then(async () => {
        const result = await query(
            `
            SELECT
                al.*
            FROM audit_logs al
            WHERE al.entity_type = $1
              AND al.school_id = $2
            ORDER BY al.created_at DESC
            `,
            [
                tableName,
                schoolId
            ]
        );

        return result.rows;
    });
}

async function getAuditLogsByRecord(
    tableName,
    recordId,
    schoolId
) {
    validateId(tableName, "tableName");
    validateId(recordId, "recordId");
    validateId(schoolId, "schoolId");

    return getAuditLogsByEntity(
        tableName,
        recordId,
        schoolId
    );
}

async function countAuditLogs({
    schoolId,
    userId,
    action,
    entityType,
    entityId,
    tableName,
    recordId,
    startDate,
    endDate
}) {
    validateId(schoolId, "schoolId");

    const values = [schoolId];
    const conditions = [
        "al.school_id = $1"
    ];

    const resolvedEntityType =
        getEntityTypeValue({
            entityType,
            tableName
        });

    const resolvedEntityId =
        getEntityIdValue({
            entityId,
            recordId
        });

    if (
        userId !== undefined &&
        userId !== null &&
        userId !== ""
    ) {
        values.push(userId);

        conditions.push(
            `al.user_id = $${values.length}`
        );
    }

    if (
        action !== undefined &&
        action !== null &&
        action !== ""
    ) {
        values.push(action);

        conditions.push(
            `al.action = $${values.length}`
        );
    }

    if (
        resolvedEntityType !== undefined &&
        resolvedEntityType !== null &&
        resolvedEntityType !== ""
    ) {
        values.push(resolvedEntityType);

        conditions.push(
            `al.entity_type = $${values.length}`
        );
    }

    if (
        resolvedEntityId !== undefined &&
        resolvedEntityId !== null &&
        resolvedEntityId !== ""
    ) {
        values.push(resolvedEntityId);

        conditions.push(
            `al.entity_id = $${values.length}`
        );
    }

    if (
        startDate !== undefined &&
        startDate !== null &&
        startDate !== ""
    ) {
        values.push(startDate);

        conditions.push(
            `al.created_at >= $${values.length}`
        );
    }

    if (
        endDate !== undefined &&
        endDate !== null &&
        endDate !== ""
    ) {
        values.push(endDate);

        conditions.push(
            `al.created_at <= $${values.length}`
        );
    }

    const result = await query(
        `
        SELECT COUNT(*)::integer AS count
        FROM audit_logs al
        WHERE ${conditions.join(" AND ")}
        `,
        values
    );

    return Number(
        result.rows[0]?.count || 0
    );
}

async function deleteAuditLog(
    id,
    schoolId
) {
    validateId(id, "id");
    validateId(schoolId, "schoolId");

    const result = await query(
        `
        DELETE FROM audit_logs
        WHERE id = $1
          AND school_id = $2
        RETURNING *
        `,
        [
            id,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

async function deleteAuditLogsBefore(
    date,
    schoolId
) {
    validateId(date, "date");
    validateId(schoolId, "schoolId");

    const result = await query(
        `
        DELETE FROM audit_logs
        WHERE school_id = $1
          AND created_at < $2
        RETURNING id
        `,
        [
            schoolId,
            date
        ]
    );

    return result.rows.length;
}

module.exports = {
    createAuditLog,
    getAuditLogs,
    getAuditLogById,
    getAuditLogsByUser,
    getAuditLogsByEntity,
    getAuditLogsByTable,
    getAuditLogsByRecord,
    countAuditLogs,
    deleteAuditLog,
    deleteAuditLogsBefore
};