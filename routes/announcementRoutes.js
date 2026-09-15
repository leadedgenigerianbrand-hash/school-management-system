"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createAnnouncement,
    createBulkAnnouncements,
    getAnnouncements,
    getPublishedAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    publishAnnouncement,
    unpublishAnnouncement,
    deleteAnnouncement,
    countAnnouncements
} = require("../controllers/announcementController");

/*
|--------------------------------------------------------------------------
| ANNOUNCEMENT ROUTES
|--------------------------------------------------------------------------
|
| Base route:
|
| /api/announcements
|
| All announcement routes require authentication.
|
|--------------------------------------------------------------------------
*/

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| ANNOUNCEMENT COUNT
|--------------------------------------------------------------------------
*/

router.get(
    "/count",
    countAnnouncements
);

/*
|--------------------------------------------------------------------------
| PUBLISHED ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

router.get(
    "/published",
    getPublishedAnnouncements
);

/*
|--------------------------------------------------------------------------
| BULK CREATE
|--------------------------------------------------------------------------
*/

router.post(
    "/bulk",
    createBulkAnnouncements
);

/*
|--------------------------------------------------------------------------
| ALL ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    getAnnouncements
);

router.post(
    "/",
    createAnnouncement
);

/*
|--------------------------------------------------------------------------
| SINGLE ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    getAnnouncementById
);

router.put(
    "/:id",
    updateAnnouncement
);

/*
|--------------------------------------------------------------------------
| PUBLISH / UNPUBLISH
|--------------------------------------------------------------------------
*/

router.patch(
    "/:id/publish",
    publishAnnouncement
);

router.patch(
    "/:id/unpublish",
    unpublishAnnouncement
);

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    deleteAnnouncement
);

module.exports = router;