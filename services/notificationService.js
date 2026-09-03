```javascript
const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Notification Service
|--------------------------------------------------------------------------
| Business logic for application notifications.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Notification
|--------------------------------------------------------------------------
*/

async function createNotification({
    schoolId,
    userId,
    title,
    message,
    type = "info",
    referenceType = null,
    referenceId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!userId) {
        throw new Error("User ID is required.");
    }

    if (!title || !String(title).trim()) {
        throw new Error("Notification title is required.");
    }

    if (!message || !String(message).trim()) {
        throw new Error("Notification message is required.");
    }

    const result = await query(
        `
        INSERT INTO notifications (
            school_id,
            user_id,
            title,
            message,
            type,
            reference_type,
            reference_id,
            is_read
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
        RETURNING *
        `,
        [
            schoolId,
            userId,
            String(title).trim(),
            String(message).trim(),
            type,
            referenceType,
            referenceId
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Get Notification By ID
|--------------------------------------------------------------------------
*/

async function getNotificationById(notificationId, userId = null) {
    if (!notificationId) {
        throw new Error("Notification ID is required.");
    }

    let sql = `
        SELECT n.*
        FROM notifications n
        WHERE n.id = $1
    `;

    const values = [notificationId];

    if (userId) {
        values.push(userId);
        sql += ` AND n.user_id = $${values.length}`;
    }

    sql += ` LIMIT 1`;

    const result = await query(sql, values);

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Get User Notifications
|--------------------------------------------------------------------------
*/

async function getUserNotifications(
    userId,
    {
        schoolId = null,
        unreadOnly = false,
        limit = 50,
        offset = 0
    } = {}
) {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    const safeLimit = Math.max(
        1,
        Math.min(Number(limit) || 50, 100)
    );

    const safeOffset = Math.max(
        0,
        Number(offset) || 0
    );

    let sql = `
        SELECT n.*
        FROM notifications n
        WHERE n.user_id = $1
    `;

    const values = [userId];

    if (schoolId) {
        values.push(schoolId);
        sql += ` AND n.school_id = $${values.length}`;
    }

    if (unreadOnly) {
        sql += ` AND n.is_read = FALSE`;
    }

    values.push(safeLimit);
    const limitPosition = values.length;

    values.push(safeOffset);
    const offsetPosition = values.length;

    sql += `
        ORDER BY n.created_at DESC
        LIMIT $${limitPosition}
        OFFSET $${offsetPosition}
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Unread Notifications
|--------------------------------------------------------------------------
*/

async function getUnreadNotifications(userId, schoolId = null) {
    return getUserNotifications(userId, {
        schoolId,
        unreadOnly: true,
        limit: 100,
        offset: 0
    });
}


/*
|--------------------------------------------------------------------------
| Count Notifications
|--------------------------------------------------------------------------
*/

async function countNotifications(
    userId,
    {
        schoolId = null,
        unreadOnly = false
    } = {}
) {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    let sql = `
        SELECT COUNT(*)::INTEGER AS notification_count
        FROM notifications
        WHERE user_id = $1
    `;

    const values = [userId];

    if (schoolId) {
        values.push(schoolId);
        sql += ` AND school_id = $${values.length}`;
    }

    if (unreadOnly) {
        sql += ` AND is_read = FALSE`;
    }

    const result = await query(sql, values);

    return Number(result.rows[0]?.notification_count || 0);
}


/*
|--------------------------------------------------------------------------
| Count Unread Notifications
|--------------------------------------------------------------------------
*/

async function countUnreadNotifications(userId, schoolId = null) {
    return countNotifications(userId, {
        schoolId,
        unreadOnly: true
    });
}


/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

async function markAsRead(notificationId, userId) {
    if (!notificationId) {
        throw new Error("Notification ID is required.");
    }

    if (!userId) {
        throw new Error("User ID is required.");
    }

    const result = await query(
        `
        UPDATE notifications
        SET
            is_read = TRUE,
            read_at = NOW()
        WHERE id = $1
          AND user_id = $2
        RETURNING *
        `,
        [notificationId, userId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Mark Notification As Unread
|--------------------------------------------------------------------------
*/

async function markAsUnread(notificationId, userId) {
    if (!notificationId) {
        throw new Error("Notification ID is required.");
    }

    if (!userId) {
        throw new Error("User ID is required.");
    }

    const result = await query(
        `
        UPDATE notifications
        SET
            is_read = FALSE,
            read_at = NULL
        WHERE id = $1
          AND user_id = $2
        RETURNING *
        `,
        [notificationId, userId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

async function markAllAsRead(userId, schoolId = null) {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    let sql = `
        UPDATE notifications
        SET
            is_read = TRUE,
            read_at = NOW()
        WHERE user_id = $1
          AND is_read = FALSE
    `;

    const values = [userId];

    if (schoolId) {
        values.push(schoolId);
        sql += ` AND school_id = $${values.length}`;
    }

    sql += ` RETURNING id`;

    const result = await query(sql, values);

    return result.rows.length;
}


/*
|--------------------------------------------------------------------------
| Delete Notification
|--------------------------------------------------------------------------
*/

async function deleteNotification(notificationId, userId) {
    if (!notificationId) {
        throw new Error("Notification ID is required.");
    }

    if (!userId) {
        throw new Error("User ID is required.");
    }

    const result = await query(
        `
        DELETE FROM notifications
        WHERE id = $1
          AND user_id = $2
        RETURNING *
        `,
        [notificationId, userId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Delete All User Notifications
|--------------------------------------------------------------------------
*/

async function deleteAllNotifications(userId, schoolId = null) {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    let sql = `
        DELETE FROM notifications
        WHERE user_id = $1
    `;

    const values = [userId];

    if (schoolId) {
        values.push(schoolId);
        sql += ` AND school_id = $${values.length}`;
    }

    sql += ` RETURNING id`;

    const result = await query(sql, values);

    return result.rows.length;
}


/*
|--------------------------------------------------------------------------
| Send Notification To Multiple Users
|--------------------------------------------------------------------------
*/

async function sendToUsers({
    schoolId,
    userIds,
    title,
    message,
    type = "info",
    referenceType = null,
    referenceId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("At least one user is required.");
    }

    if (!title || !String(title).trim()) {
        throw new Error("Notification title is required.");
    }

    if (!message || !String(message).trim()) {
        throw new Error("Notification message is required.");
    }

    const uniqueUserIds = [
        ...new Set(
            userIds
                .filter(Boolean)
                .map(String)
        )
    ];

    if (uniqueUserIds.length === 0) {
        throw new Error("At least one valid user is required.");
    }

    const result = await query(
        `
        INSERT INTO notifications (
            school_id,
            user_id,
            title,
            message,
            type,
            reference_type,
            reference_id,
            is_read
        )
        SELECT
            $1::UUID,
            u.id,
            $3,
            $4,
            $5,
            $6,
            $7,
            FALSE
        FROM users u
        WHERE u.school_id = $1::UUID
          AND u.id = ANY($2::UUID[])
        RETURNING *
        `,
        [
            schoolId,
            uniqueUserIds,
            String(title).trim(),
            String(message).trim(),
            type,
            referenceType,
            referenceId
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Send Notification To Role
|--------------------------------------------------------------------------
*/

async function sendToRole({
    schoolId,
    roleId,
    title,
    message,
    type = "info",
    referenceType = null,
    referenceId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!roleId) {
        throw new Error("Role ID is required.");
    }

    if (!title || !String(title).trim()) {
        throw new Error("Notification title is required.");
    }

    if (!message || !String(message).trim()) {
        throw new Error("Notification message is required.");
    }

    const result = await query(
        `
        INSERT INTO notifications (
            school_id,
            user_id,
            title,
            message,
            type,
            reference_type,
            reference_id,
            is_read
        )
        SELECT
            u.school_id,
            u.id,
            $3,
            $4,
            $5,
            $6,
            $7,
            FALSE
        FROM users u
        WHERE u.school_id = $1::UUID
          AND u.role_id = $2::UUID
          AND u.is_active = TRUE
        RETURNING *
        `,
        [
            schoolId,
            roleId,
            String(title).trim(),
            String(message).trim(),
            type,
            referenceType,
            referenceId
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Send Notification To All School Users
|--------------------------------------------------------------------------
*/

async function sendToSchool({
    schoolId,
    title,
    message,
    type = "info",
    referenceType = null,
    referenceId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!title || !String(title).trim()) {
        throw new Error("Notification title is required.");
    }

    if (!message || !String(message).trim()) {
        throw new Error("Notification message is required.");
    }

    const result = await query(
        `
        INSERT INTO notifications (
            school_id,
            user_id,
            title,
            message,
            type,
            reference_type,
            reference_id,
            is_read
        )
        SELECT
            u.school_id,
            u.id,
            $2,
            $3,
            $4,
            $5,
            $6,
            FALSE
        FROM users u
        WHERE u.school_id = $1::UUID
          AND u.is_active = TRUE
        RETURNING *
        `,
        [
            schoolId,
            String(title).trim(),
            String(message).trim(),
            type,
            referenceType,
            referenceId
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Search Notifications
|--------------------------------------------------------------------------
*/

async function searchNotifications(
    userId,
    searchTerm,
    schoolId = null
) {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    if (
        !searchTerm ||
        !String(searchTerm).trim()
    ) {
        return [];
    }

    let sql = `
        SELECT n.*
        FROM notifications n
        WHERE n.user_id = $1
          AND (
              n.title ILIKE $2
              OR n.message ILIKE $2
          )
    `;

    const values = [
        userId,
        `%${String(searchTerm).trim()}%`
    ];

    if (schoolId) {
        values.push(schoolId);
        sql += ` AND n.school_id = $${values.length}`;
    }

    sql += `
        ORDER BY n.created_at DESC
        LIMIT 100
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Notification Statistics
|--------------------------------------------------------------------------
*/

async function getNotificationStatistics(
    userId,
    schoolId = null
) {
    if (!userId) {
        throw new Error("User ID is required.");
    }

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_notifications,

            COUNT(
                CASE
                    WHEN is_read = FALSE THEN 1
                END
            )::INTEGER AS unread_notifications,

            COUNT(
                CASE
                    WHEN is_read = TRUE THEN 1
                END
            )::INTEGER AS read_notifications

        FROM notifications
        WHERE user_id = $1
    `;

    const values = [userId];

    if (schoolId) {
        values.push(schoolId);
        sql += ` AND school_id = $${values.length}`;
    }

    const result = await query(sql, values);

    const row = result.rows[0] || {};

    return {
        totalNotifications:
            Number(row.total_notifications || 0),

        unreadNotifications:
            Number(row.unread_notifications || 0),

        readNotifications:
            Number(row.read_notifications || 0)
    };
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    createNotification,
    getNotificationById,
    getUserNotifications,
    getUnreadNotifications,
    countNotifications,
    countUnreadNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    sendToUsers,
    sendToRole,
    sendToSchool,
    searchNotifications,
    getNotificationStatistics
};