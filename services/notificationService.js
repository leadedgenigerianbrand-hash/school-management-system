const { query } = require("../config/database");


/*
|--------------------------------------------------------------------------
| Notification Service
|--------------------------------------------------------------------------
|
| Handles application notifications.
|
| Responsibilities:
|
| - Create notifications
| - Send notifications to users
| - Get user notifications
| - Get unread notifications
| - Mark notifications as read
| - Mark all notifications as read
| - Delete notifications
| - Count unread notifications
|
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

    if (!title || !title.trim()) {
        throw new Error("Notification title is required.");
    }

    if (!message || !message.trim()) {
        throw new Error("Notification message is required.");
    }


    const sql = `
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
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            FALSE
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            userId,
            title.trim(),
            message.trim(),
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

async function getNotificationById(
    notificationId,
    userId = null
) {

    let sql = `
        SELECT
            n.*

        FROM notifications n

        WHERE n.id = $1
    `;


    const values = [
        notificationId
    ];


    if (userId) {

        values.push(userId);

        sql += `
            AND n.user_id = $${values.length}
        `;
    }


    sql += `
        LIMIT 1
    `;


    const result = await query(
        sql,
        values
    );


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

    let sql = `
        SELECT
            n.*

        FROM notifications n

        WHERE n.user_id = $1
    `;


    const values = [
        userId
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND n.school_id = $${values.length}
        `;
    }


    if (unreadOnly) {

        sql += `
            AND n.is_read = FALSE
        `;
    }


    values.push(Number(limit));

    const limitPosition =
        values.length;


    values.push(Number(offset));

    const offsetPosition =
        values.length;


    sql += `
        ORDER BY
            n.created_at DESC

        LIMIT $${limitPosition}

        OFFSET $${offsetPosition}
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Unread Notifications
|--------------------------------------------------------------------------
*/

async function getUnreadNotifications(
    userId,
    schoolId = null
) {

    return getUserNotifications(
        userId,
        {
            schoolId,
            unreadOnly: true,
            limit: 100,
            offset: 0
        }
    );
}


/*
|--------------------------------------------------------------------------
| Count User Notifications
|--------------------------------------------------------------------------
*/

async function countNotifications(
    userId,
    {
        schoolId = null,
        unreadOnly = false
    } = {}
) {

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS notification_count

        FROM notifications

        WHERE user_id = $1
    `;


    const values = [
        userId
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND school_id = $${values.length}
        `;
    }


    if (unreadOnly) {

        sql += `
            AND is_read = FALSE
        `;
    }


    const result = await query(
        sql,
        values
    );


    return Number(
        result.rows[0].notification_count
    );
}


/*
|--------------------------------------------------------------------------
| Count Unread Notifications
|--------------------------------------------------------------------------
*/

async function countUnreadNotifications(
    userId,
    schoolId = null
) {

    return countNotifications(
        userId,
        {
            schoolId,
            unreadOnly: true
        }
    );
}


/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

async function markAsRead(
    notificationId,
    userId
) {

    const sql = `
        UPDATE notifications

        SET
            is_read = TRUE,
            read_at = NOW()

        WHERE id = $1

          AND user_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            notificationId,
            userId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Mark Notification As Unread
|--------------------------------------------------------------------------
*/

async function markAsUnread(
    notificationId,
    userId
) {

    const sql = `
        UPDATE notifications

        SET
            is_read = FALSE,
            read_at = NULL

        WHERE id = $1

          AND user_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            notificationId,
            userId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

async function markAllAsRead(
    userId,
    schoolId = null
) {

    let sql = `
        UPDATE notifications

        SET
            is_read = TRUE,
            read_at = NOW()

        WHERE user_id = $1

          AND is_read = FALSE
    `;


    const values = [
        userId
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND school_id = $${values.length}
        `;
    }


    sql += `
        RETURNING id
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows.length;
}


/*
|--------------------------------------------------------------------------
| Delete Notification
|--------------------------------------------------------------------------
*/

async function deleteNotification(
    notificationId,
    userId
) {

    const sql = `
        DELETE FROM notifications

        WHERE id = $1

          AND user_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            notificationId,
            userId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Delete All User Notifications
|--------------------------------------------------------------------------
*/

async function deleteAllNotifications(
    userId,
    schoolId = null
) {

    let sql = `
        DELETE FROM notifications

        WHERE user_id = $1
    `;


    const values = [
        userId
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND school_id = $${values.length}
        `;
    }


    sql += `
        RETURNING id
    `;


    const result = await query(
        sql,
        values
    );


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

    if (!title || !title.trim()) {
        throw new Error("Notification title is required.");
    }

    if (!message || !message.trim()) {
        throw new Error("Notification message is required.");
    }


    const sql = `
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
            $1,
            UNNEST($2::INTEGER[]),
            $3,
            $4,
            $5,
            $6,
            $7,
            FALSE

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            userIds,
            title.trim(),
            message.trim(),
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


    const sql = `
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

        WHERE u.school_id = $1

          AND u.role_id = $2

          AND u.is_active = TRUE

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            roleId,
            title.trim(),
            message.trim(),
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


    const sql = `
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

        WHERE u.school_id = $1

          AND u.is_active = TRUE

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            title.trim(),
            message.trim(),
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

    let sql = `
        SELECT
            n.*

        FROM notifications n

        WHERE n.user_id = $1

          AND (
              n.title ILIKE $2
              OR n.message ILIKE $2
          )
    `;


    const values = [
        userId,
        `%${searchTerm}%`
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND n.school_id = $${values.length}
        `;
    }


    sql += `
        ORDER BY
            n.created_at DESC

        LIMIT 100
    `;


    const result = await query(
        sql,
        values
    );


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

    let sql = `
        SELECT

            COUNT(*)::INTEGER
                AS total_notifications,

            COUNT(
                CASE
                    WHEN is_read = FALSE
                    THEN 1
                END
            )::INTEGER
                AS unread_notifications,

            COUNT(
                CASE
                    WHEN is_read = TRUE
                    THEN 1
                END
            )::INTEGER
                AS read_notifications

        FROM notifications

        WHERE user_id = $1
    `;


    const values = [
        userId
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND school_id = $${values.length}
        `;
    }


    const result = await query(
        sql,
        values
    );


    const row = result.rows[0];


    return {

        totalNotifications:
            Number(row.total_notifications),

        unreadNotifications:
            Number(row.unread_notifications),

        readNotifications:
            Number(row.read_notifications)

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