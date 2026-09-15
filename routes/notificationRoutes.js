"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
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
} = require("../controllers/notificationController");

/*
|--------------------------------------------------------------------------
| NOTIFICATION ROUTES
|--------------------------------------------------------------------------
|
| Base route:
|
| /api/notifications
|
| All notification routes require authentication.
|
|--------------------------------------------------------------------------
*/

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| NOTIFICATION COUNTS
|--------------------------------------------------------------------------
*/

router.get(
    "/my/count",
    countMyNotifications
);

router.get(
    "/my/unread-count",
    countUnreadNotifications
);

/*
|--------------------------------------------------------------------------
| CURRENT USER NOTIFICATIONS
|--------------------------------------------------------------------------
*/

router.get(
    "/my",
    getMyNotifications
);

/*
|--------------------------------------------------------------------------
| MARK ALL CURRENT USER NOTIFICATIONS AS READ
|--------------------------------------------------------------------------
*/

router.patch(
    "/my/mark-all-read",
    markAllAsRead
);

/*
|--------------------------------------------------------------------------
| DELETE ALL READ CURRENT USER NOTIFICATIONS
|--------------------------------------------------------------------------
*/

router.delete(
    "/my/read",
    deleteReadNotifications
);

/*
|--------------------------------------------------------------------------
| BULK CREATE
|--------------------------------------------------------------------------
*/

router.post(
    "/bulk",
    createBulkNotifications
);

/*
|--------------------------------------------------------------------------
| SCHOOL NOTIFICATIONS
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    getNotifications
);

router.post(
    "/",
    createNotification
);

/*
|--------------------------------------------------------------------------
| SINGLE NOTIFICATION
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    getNotificationById
);

router.patch(
    "/:id/read",
    markAsRead
);

router.patch(
    "/:id/unread",
    markAsUnread
);

router.delete(
    "/:id",
    deleteNotification
);

module.exports = router;