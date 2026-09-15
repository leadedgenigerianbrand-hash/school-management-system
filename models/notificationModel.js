"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| NOTIFICATION MODEL
|--------------------------------------------------------------------------
|
| Database table:
|
| notifications
|
| Expected fields:
|
| id
| school_id
| user_id
| title
| message
| type
| priority
| is_read
| read_at
| created_at
| updated_at
|
| This model contains database operations only.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| VALIDATION HELPERS
|--------------------------------------------------------------------------
*/

function requireValue(value, fieldName) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        const error = new Error(
            `${fieldName} is required.`
        );

        error.statusCode = 400;

        throw error;
    }

    return value;
}

function requireId(value, fieldName) {
    requireValue(value, fieldName);

    return String(value).trim();
}

function normalizeLimit(value, defaultValue = 50) {
    const parsed = parseInt(value, 10);

    if (
        Number.isNaN(parsed) ||
        parsed < 1
    ) {
        return defaultValue;
    }

    return Math.min(
        parsed,
        200
    );
}

function normalizeOffset(value) {
    const parsed = parseInt(value, 10);

    if (
        Number.isNaN(parsed) ||
        parsed < 0
    ) {
        return 0;
    }

    return parsed;
}

/*
|--------------------------------------------------------------------------
| SELECT
|--------------------------------------------------------------------------
*/

const notificationSelect = `
    SELECT
        n.id,
        n.school_id,
        n.user_id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.is_read,
        n.read_at,
        n.created_at,
        n.updated_at
    FROM notifications n
`;

/*
|--------------------------------------------------------------------------
| CREATE NOTIFICATION
|--------------------------------------------------------------------------
*/

async function createNotification(data) {
    if (!data || typeof data !== "object") {
        const error = new Error(
            "Notification data is required."
        );

        error.statusCode = 400;

        throw error;
    }

    const schoolId = requireId(
        data.schoolId || data.school_id,
        "School ID"
    );

    const userId = requireId(
        data.userId || data.user_id,
        "User ID"
    );

    const title = requireValue(
        data.title,
        "Title"
    );

    const message = requireValue(
        data.message,
        "Message"
    );

    const type =
        data.type ||
        "General";

    const priority =
        data.priority ||
        "Normal";

    const result = await query(
        `
        INSERT INTO notifications (
            school_id,
            user_id,
            title,
            message,
            type,
            priority,
            is_read
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            FALSE
        )
        RETURNING
            id,
            school_id,
            user_id,
            title,
            message,
            type,
            priority,
            is_read,
            read_at,
            created_at,
            updated_at
        `,
        [
            schoolId,
            userId,
            String(title).trim(),
            String(message).trim(),
            String(type).trim(),
            String(priority).trim()
        ]
    );

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| CREATE MULTIPLE NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function createBulkNotifications(notifications) {
    if (
        !Array.isArray(notifications) ||
        notifications.length === 0
    ) {
        const error = new Error(
            "At least one notification is required."
        );

        error.statusCode = 400;

        throw error;
    }

    const createdNotifications = [];

    for (const notification of notifications) {
        const created = await createNotification(
            notification
        );

        createdNotifications.push(
            created
        );
    }

    return createdNotifications;
}

/*
|--------------------------------------------------------------------------
| GET NOTIFICATION BY ID
|--------------------------------------------------------------------------
*/

async function getNotificationById(
    notificationId,
    schoolId
) {
    const id = requireId(
        notificationId,
        "Notification ID"
    );

    const school = requireId(
        schoolId,
        "School ID"
    );

    const result = await query(
        `
        ${notificationSelect}
        WHERE
            n.id = $1
            AND n.school_id = $2
        LIMIT 1
        `,
        [
            id,
            school
        ]
    );

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| GET USER NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function getUserNotifications(
    userId,
    schoolId,
    filters = {}
) {
    const user = requireId(
        userId,
        "User ID"
    );

    const school = requireId(
        schoolId,
        "School ID"
    );

    const limit = normalizeLimit(
        filters.limit
    );

    const offset = normalizeOffset(
        filters.offset
    );

    const values = [
        school,
        user
    ];

    const conditions = [
        "n.school_id = $1",
        "n.user_id = $2"
    ];

    let parameterIndex = 3;

    if (
        filters.isRead !== undefined &&
        filters.isRead !== null &&
        filters.isRead !== ""
    ) {
        conditions.push(
            `n.is_read = $${parameterIndex}`
        );

        values.push(
            filters.isRead === true ||
            filters.isRead === "true"
        );

        parameterIndex++;
    }

    if (filters.type) {
        conditions.push(
            `n.type = $${parameterIndex}`
        );

        values.push(
            String(
                filters.type
            ).trim()
        );

        parameterIndex++;
    }

    if (filters.priority) {
        conditions.push(
            `n.priority = $${parameterIndex}`
        );

        values.push(
            String(
                filters.priority
            ).trim()
        );

        parameterIndex++;
    }

    if (filters.search) {
        conditions.push(
            `(
                n.title ILIKE $${parameterIndex}
                OR n.message ILIKE $${parameterIndex}
            )`
        );

        values.push(
            `%${String(
                filters.search
            ).trim()}%`
        );

        parameterIndex++;
    }

    values.push(limit);

    const limitIndex =
        parameterIndex;

    values.push(offset);

    const offsetIndex =
        parameterIndex + 1;

    const result = await query(
        `
        ${notificationSelect}
        WHERE ${conditions.join(
            " AND "
        )}
        ORDER BY
            n.created_at DESC,
            n.id DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
        `,
        values
    );

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET ALL SCHOOL NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function getNotifications(
    schoolId,
    filters = {}
) {
    const school = requireId(
        schoolId,
        "School ID"
    );

    const limit = normalizeLimit(
        filters.limit
    );

    const offset = normalizeOffset(
        filters.offset
    );

    const values = [
        school
    ];

    const conditions = [
        "n.school_id = $1"
    ];

    let parameterIndex = 2;

    if (filters.userId) {
        conditions.push(
            `n.user_id = $${parameterIndex}`
        );

        values.push(
            String(
                filters.userId
            ).trim()
        );

        parameterIndex++;
    }

    if (
        filters.isRead !== undefined &&
        filters.isRead !== null &&
        filters.isRead !== ""
    ) {
        conditions.push(
            `n.is_read = $${parameterIndex}`
        );

        values.push(
            filters.isRead === true ||
            filters.isRead === "true"
        );

        parameterIndex++;
    }

    if (filters.type) {
        conditions.push(
            `n.type = $${parameterIndex}`
        );

        values.push(
            String(
                filters.type
            ).trim()
        );

        parameterIndex++;
    }

    if (filters.priority) {
        conditions.push(
            `n.priority = $${parameterIndex}`
        );

        values.push(
            String(
                filters.priority
            ).trim()
        );

        parameterIndex++;
    }

    if (filters.search) {
        conditions.push(
            `(
                n.title ILIKE $${parameterIndex}
                OR n.message ILIKE $${parameterIndex}
            )`
        );

        values.push(
            `%${String(
                filters.search
            ).trim()}%`
        );

        parameterIndex++;
    }

    values.push(limit);

    const limitIndex =
        parameterIndex;

    values.push(offset);

    const offsetIndex =
        parameterIndex + 1;

    const result = await query(
        `
        ${notificationSelect}
        WHERE ${conditions.join(
            " AND "
        )}
        ORDER BY
            n.created_at DESC,
            n.id DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
        `,
        values
    );

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| COUNT USER NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function countUserNotifications(
    userId,
    schoolId,
    filters = {}
) {
    const user = requireId(
        userId,
        "User ID"
    );

    const school = requireId(
        schoolId,
        "School ID"
    );

    const values = [
        school,
        user
    ];

    const conditions = [
        "n.school_id = $1",
        "n.user_id = $2"
    ];

    let parameterIndex = 3;

    if (
        filters.isRead !== undefined &&
        filters.isRead !== null &&
        filters.isRead !== ""
    ) {
        conditions.push(
            `n.is_read = $${parameterIndex}`
        );

        values.push(
            filters.isRead === true ||
            filters.isRead === "true"
        );

        parameterIndex++;
    }

    const result = await query(
        `
        SELECT COUNT(*)::INTEGER AS count
        FROM notifications n
        WHERE ${conditions.join(
            " AND "
        )}
        `,
        values
    );

    return result.rows[0]?.count || 0;
}

/*
|--------------------------------------------------------------------------
| COUNT UNREAD NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function countUnreadNotifications(
    userId,
    schoolId
) {
    const user = requireId(
        userId,
        "User ID"
    );

    const school = requireId(
        schoolId,
        "School ID"
    );

    const result = await query(
        `
        SELECT COUNT(*)::INTEGER AS count
        FROM notifications n
        WHERE
            n.school_id = $1
            AND n.user_id = $2
            AND n.is_read = FALSE
        `,
        [
            school,
            user
        ]
    );

    return result.rows[0]?.count || 0;
}

/*
|--------------------------------------------------------------------------
| MARK NOTIFICATION AS READ
|--------------------------------------------------------------------------
*/

async function markAsRead(
    notificationId,
    userId,
    schoolId
) {
    const id = requireId(
        notificationId,
        "Notification ID"
    );

    const user = requireId(
        userId,
        "User ID"
    );

    const school = requireId(
        schoolId,
        "School ID"
    );

    const result = await query(
        `
        UPDATE notifications
        SET
            is_read = TRUE,
            read_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE
            id = $1
            AND user_id = $2
            AND school_id = $3
        RETURNING
            id,
            school_id,
            user_id,
            title,
            message,
            type,
            priority,
            is_read,
            read_at,
            created_at,
            updated_at
        `,
        [
            id,
            user,
            school
        ]
    );

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| MARK NOTIFICATION AS UNREAD
|--------------------------------------------------------------------------
*/

async function markAsUnread(
    notificationId,
    userId,
    schoolId
) {
    const id = requireId(
        notificationId,
        "Notification ID"
    );

    const user = requireId(
        userId,
        "User ID"
    );

    const school = requireId(
        schoolId,
        "School ID"
    );

    const result = await query(
        `
        UPDATE notifications
        SET
            is_read = FALSE,
            read_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE
            id = $1
            AND user_id = $2
            AND school_id = $3
        RETURNING
            id,
            school_id,
            user_id,
            title,
            message,
            type,
            priority,
            is_read,
            read_at,
            created_at,
            updated_at
        `,
        [
            id,
            user,
            school
        ]
    );

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| MARK ALL USER NOTIFICATIONS AS READ
|--------------------------------------------------------------------------
*/

async function markAllAsRead(
    userId,
    schoolId
) {
    const user = requireId(
        userId,
        "User ID"
    );

    const school = requireId(
        schoolId,
        "School ID"
    );

    const result = await query(
        `
        UPDATE notifications
        SET
            is_read = TRUE,
            read_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE
            user_id = $1
            AND school_id = $2
            AND is_read = FALSE
        RETURNING id
        `,
        [
            user,
            school
        ]
    );

    return result.rowCount;
}

/*
|--------------------------------------------------------------------------
| DELETE NOTIFICATION
|--------------------------------------------------------------------------
*/

async function deleteNotification(
    notificationId,
    userId,
    schoolId
) {
    const id = requireId(
        notificationId,
        "Notification ID"
    );

    const user = requireId(
        userId,
        "User ID"
    );

    const school = requireId(
        schoolId,
        "School ID"
    );

    const result = await query(
        `
        DELETE FROM notifications
        WHERE
            id = $1
            AND user_id = $2
            AND school_id = $3
        RETURNING id
        `,
        [
            id,
            user,
            school
        ]
    );

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| DELETE ALL READ NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function deleteReadNotifications(
    userId,
    schoolId
) {
    const user = requireId(
        userId,
        "User ID"
    );

    const school = requireId(
        schoolId,
        "School ID"
    );

    const result = await query(
        `
        DELETE FROM notifications
        WHERE
            user_id = $1
            AND school_id = $2
            AND is_read = TRUE
        RETURNING id
        `,
        [
            user,
            school
        ]
    );

    return result.rowCount;
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    createNotification,
    createBulkNotifications,
    getNotificationById,
    getUserNotifications,
    getNotifications,
    countUserNotifications,
    countUnreadNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications
};