"use strict";

const notificationModel = require("../models/notificationModel");

/*
|--------------------------------------------------------------------------
| NOTIFICATION CONTROLLER
|--------------------------------------------------------------------------
|
| This controller is the API/business layer for notifications.
|
| Responsibilities:
| - Resolve the current school
| - Resolve the current user
| - Validate request data
| - Call notificationModel
| - Return consistent HTTP responses
|
| Database operations belong in:
| models/notificationModel.js
|
|--------------------------------------------------------------------------
*/

function getCurrentUserId(req) {
    return (
        req.user?.id ||
        req.user?.userId ||
        req.user?.user_id ||
        null
    );
}

function resolveSchoolId(req, allowQuery = true) {
    const schoolId =
        req.user?.schoolId ||
        req.user?.school_id ||
        req.body?.schoolId ||
        (allowQuery ? req.query?.schoolId : null);

    return schoolId ? String(schoolId).trim() : null;
}

function sendSuccess(
    res,
    data = null,
    message = "Request completed successfully"
) {
    return res.status(200).json({
        success: true,
        message,
        data
    });
}

function sendCreated(
    res,
    data = null,
    message = "Created successfully"
) {
    return res.status(201).json({
        success: true,
        message,
        data
    });
}

function sendError(res, statusCode, message, error = null) {
    const response = {
        success: false,
        message
    };

    if (error && process.env.NODE_ENV !== "production") {
        response.error = error.message || String(error);
    }

    return res.status(statusCode).json(response);
}

/*
|--------------------------------------------------------------------------
| CREATE NOTIFICATION
|--------------------------------------------------------------------------
*/

async function createNotification(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const currentUserId = getCurrentUserId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        const {
            userId,
            title,
            message,
            type,
            priority,
            isRead,
            readAt
        } = req.body || {};

        if (!userId) {
            return sendError(res, 400, "userId is required");
        }

        if (!title || String(title).trim() === "") {
            return sendError(res, 400, "title is required");
        }

        if (!message || String(message).trim() === "") {
            return sendError(res, 400, "message is required");
        }

        const notification = await notificationModel.createNotification({
            schoolId,
            userId,
            title,
            message,
            type,
            priority,
            isRead,
            readAt,
            createdBy: currentUserId
        });

        return sendCreated(
            res,
            notification,
            "Notification created successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| CREATE BULK NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function createBulkNotifications(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const currentUserId = getCurrentUserId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        const notifications = req.body?.notifications;

        if (!Array.isArray(notifications) || notifications.length === 0) {
            return sendError(
                res,
                400,
                "notifications must be a non-empty array"
            );
        }

        const preparedNotifications = notifications.map((notification) => ({
            ...notification,
            schoolId,
            createdBy: currentUserId
        }));

        for (const notification of preparedNotifications) {
            if (!notification.userId) {
                return sendError(
                    res,
                    400,
                    "Each notification must contain userId"
                );
            }

            if (
                !notification.title ||
                String(notification.title).trim() === ""
            ) {
                return sendError(
                    res,
                    400,
                    "Each notification must contain title"
                );
            }

            if (
                !notification.message ||
                String(notification.message).trim() === ""
            ) {
                return sendError(
                    res,
                    400,
                    "Each notification must contain message"
                );
            }
        }

        const createdNotifications =
            await notificationModel.createBulkNotifications(
                preparedNotifications
            );

        return sendCreated(
            res,
            createdNotifications,
            `${createdNotifications.length} notification(s) created successfully`
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ALL SCHOOL NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function getNotifications(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        const filters = {
            userId: req.query.userId,
            type: req.query.type,
            priority: req.query.priority,
            isRead: req.query.isRead,
            search: req.query.search,
            limit: req.query.limit,
            offset: req.query.offset
        };

        const notifications = await notificationModel.getNotifications(
            schoolId,
            filters
        );

        return sendSuccess(
            res,
            notifications,
            "Notifications retrieved successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET CURRENT USER NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function getMyNotifications(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!userId) {
            return sendError(res, 401, "Authenticated user is required");
        }

        const filters = {
            type: req.query.type,
            priority: req.query.priority,
            isRead: req.query.isRead,
            search: req.query.search,
            limit: req.query.limit,
            offset: req.query.offset
        };

        const notifications =
            await notificationModel.getUserNotifications(
                userId,
                schoolId,
                filters
            );

        return sendSuccess(
            res,
            notifications,
            "Your notifications retrieved successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET NOTIFICATION BY ID
|--------------------------------------------------------------------------
*/

async function getNotificationById(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const notificationId = req.params.id;

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!notificationId) {
            return sendError(res, 400, "Notification ID is required");
        }

        const notification =
            await notificationModel.getNotificationById(
                notificationId,
                schoolId
            );

        if (!notification) {
            return sendError(res, 404, "Notification not found");
        }

        return sendSuccess(
            res,
            notification,
            "Notification retrieved successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| COUNT CURRENT USER NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function countMyNotifications(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!userId) {
            return sendError(res, 401, "Authenticated user is required");
        }

        const count = await notificationModel.countUserNotifications(
            userId,
            schoolId,
            {
                type: req.query.type,
                priority: req.query.priority,
                isRead: req.query.isRead
            }
        );

        return sendSuccess(
            res,
            { count },
            "Notification count retrieved successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| COUNT UNREAD NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function countUnreadNotifications(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!userId) {
            return sendError(res, 401, "Authenticated user is required");
        }

        const count = await notificationModel.countUnreadNotifications(
            userId,
            schoolId
        );

        return sendSuccess(
            res,
            { count },
            "Unread notification count retrieved successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| MARK NOTIFICATION AS READ
|--------------------------------------------------------------------------
*/

async function markAsRead(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);
        const notificationId = req.params.id;

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!userId) {
            return sendError(res, 401, "Authenticated user is required");
        }

        if (!notificationId) {
            return sendError(res, 400, "Notification ID is required");
        }

        const notification = await notificationModel.markAsRead(
            notificationId,
            userId,
            schoolId
        );

        if (!notification) {
            return sendError(res, 404, "Notification not found");
        }

        return sendSuccess(
            res,
            notification,
            "Notification marked as read"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| MARK NOTIFICATION AS UNREAD
|--------------------------------------------------------------------------
*/

async function markAsUnread(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);
        const notificationId = req.params.id;

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!userId) {
            return sendError(res, 401, "Authenticated user is required");
        }

        if (!notificationId) {
            return sendError(res, 400, "Notification ID is required");
        }

        const notification = await notificationModel.markAsUnread(
            notificationId,
            userId,
            schoolId
        );

        if (!notification) {
            return sendError(res, 404, "Notification not found");
        }

        return sendSuccess(
            res,
            notification,
            "Notification marked as unread"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| MARK ALL NOTIFICATIONS AS READ
|--------------------------------------------------------------------------
*/

async function markAllAsRead(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!userId) {
            return sendError(res, 401, "Authenticated user is required");
        }

        const result = await notificationModel.markAllAsRead(
            userId,
            schoolId
        );

        return sendSuccess(
            res,
            result,
            "All notifications marked as read"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| DELETE NOTIFICATION
|--------------------------------------------------------------------------
*/

async function deleteNotification(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);
        const notificationId = req.params.id;

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!userId) {
            return sendError(res, 401, "Authenticated user is required");
        }

        if (!notificationId) {
            return sendError(res, 400, "Notification ID is required");
        }

        const notification =
            await notificationModel.deleteNotification(
                notificationId,
                userId,
                schoolId
            );

        if (!notification) {
            return sendError(res, 404, "Notification not found");
        }

        return sendSuccess(
            res,
            notification,
            "Notification deleted successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| DELETE READ NOTIFICATIONS
|--------------------------------------------------------------------------
*/

async function deleteReadNotifications(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const userId = getCurrentUserId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!userId) {
            return sendError(res, 401, "Authenticated user is required");
        }

        const result = await notificationModel.deleteReadNotifications(
            userId,
            schoolId
        );

        return sendSuccess(
            res,
            result,
            "Read notifications deleted successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    createNotification,
    createBulkNotifications,
    getNotifications,
    getMyNotifications,
    getNotificationById,
    countMyNotifications,
    countUnreadNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications
};