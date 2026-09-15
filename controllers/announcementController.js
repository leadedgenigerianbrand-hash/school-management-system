"use strict";

const announcementModel = require("../models/announcementModel");

/*
|--------------------------------------------------------------------------
| ANNOUNCEMENT CONTROLLER
|--------------------------------------------------------------------------
|
| This controller handles HTTP/API operations for announcements.
|
| Responsibilities:
| - Resolve the current school
| - Resolve the authenticated user
| - Validate request input
| - Call announcementModel
| - Return consistent HTTP responses
|
| Database operations belong in:
| models/announcementModel.js
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
| CREATE ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function createAnnouncement(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const createdBy = getCurrentUserId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!createdBy) {
            return sendError(
                res,
                401,
                "Authenticated user is required"
            );
        }

        const {
            title,
            content,
            type,
            priority,
            audience,
            isPublished,
            publishedAt,
            startDate,
            endDate
        } = req.body || {};

        if (!title || String(title).trim() === "") {
            return sendError(res, 400, "title is required");
        }

        if (!content || String(content).trim() === "") {
            return sendError(res, 400, "content is required");
        }

        const announcement =
            await announcementModel.createAnnouncement({
                schoolId,
                title,
                content,
                type,
                priority,
                audience,
                isPublished,
                publishedAt,
                startDate,
                endDate,
                createdBy
            });

        return sendCreated(
            res,
            announcement,
            "Announcement created successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| CREATE BULK ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

async function createBulkAnnouncements(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const createdBy = getCurrentUserId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!createdBy) {
            return sendError(
                res,
                401,
                "Authenticated user is required"
            );
        }

        const announcements = req.body?.announcements;

        if (!Array.isArray(announcements) || announcements.length === 0) {
            return sendError(
                res,
                400,
                "announcements must be a non-empty array"
            );
        }

        const preparedAnnouncements = announcements.map((announcement) => ({
            ...announcement,
            schoolId,
            createdBy
        }));

        for (const announcement of preparedAnnouncements) {
            if (
                !announcement.title ||
                String(announcement.title).trim() === ""
            ) {
                return sendError(
                    res,
                    400,
                    "Each announcement must contain title"
                );
            }

            if (
                !announcement.content ||
                String(announcement.content).trim() === ""
            ) {
                return sendError(
                    res,
                    400,
                    "Each announcement must contain content"
                );
            }
        }

        const createdAnnouncements =
            await announcementModel.createBulkAnnouncements(
                preparedAnnouncements
            );

        return sendCreated(
            res,
            createdAnnouncements,
            `${createdAnnouncements.length} announcement(s) created successfully`
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ALL ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

async function getAnnouncements(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        const filters = {
            type: req.query.type,
            priority: req.query.priority,
            audience: req.query.audience,
            isPublished: req.query.isPublished,
            search: req.query.search,
            fromDate: req.query.fromDate,
            toDate: req.query.toDate,
            limit: req.query.limit,
            offset: req.query.offset
        };

        const announcements =
            await announcementModel.getAnnouncements(
                schoolId,
                filters
            );

        return sendSuccess(
            res,
            announcements,
            "Announcements retrieved successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET PUBLISHED ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

async function getPublishedAnnouncements(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        const filters = {
            type: req.query.type,
            priority: req.query.priority,
            audience: req.query.audience,
            search: req.query.search,
            fromDate: req.query.fromDate,
            toDate: req.query.toDate,
            limit: req.query.limit,
            offset: req.query.offset
        };

        const announcements =
            await announcementModel.getPublishedAnnouncements(
                schoolId,
                filters
            );

        return sendSuccess(
            res,
            announcements,
            "Published announcements retrieved successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ANNOUNCEMENT BY ID
|--------------------------------------------------------------------------
*/

async function getAnnouncementById(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);
        const announcementId = req.params.id;

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!announcementId) {
            return sendError(
                res,
                400,
                "Announcement ID is required"
            );
        }

        const announcement =
            await announcementModel.getAnnouncementById(
                announcementId,
                schoolId
            );

        if (!announcement) {
            return sendError(
                res,
                404,
                "Announcement not found"
            );
        }

        return sendSuccess(
            res,
            announcement,
            "Announcement retrieved successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| UPDATE ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function updateAnnouncement(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req, false);
        const announcementId = req.params.id;

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!announcementId) {
            return sendError(
                res,
                400,
                "Announcement ID is required"
            );
        }

        const {
            title,
            content,
            type,
            priority,
            audience,
            isPublished,
            publishedAt,
            startDate,
            endDate
        } = req.body || {};

        if (
            title === undefined &&
            content === undefined &&
            type === undefined &&
            priority === undefined &&
            audience === undefined &&
            isPublished === undefined &&
            publishedAt === undefined &&
            startDate === undefined &&
            endDate === undefined
        ) {
            return sendError(
                res,
                400,
                "No announcement fields were provided for update"
            );
        }

        if (
            title !== undefined &&
            String(title).trim() === ""
        ) {
            return sendError(res, 400, "title cannot be empty");
        }

        if (
            content !== undefined &&
            String(content).trim() === ""
        ) {
            return sendError(res, 400, "content cannot be empty");
        }

        const announcement =
            await announcementModel.updateAnnouncement(
                announcementId,
                schoolId,
                {
                    title,
                    content,
                    type,
                    priority,
                    audience,
                    isPublished,
                    publishedAt,
                    startDate,
                    endDate
                }
            );

        if (!announcement) {
            return sendError(
                res,
                404,
                "Announcement not found"
            );
        }

        return sendSuccess(
            res,
            announcement,
            "Announcement updated successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| PUBLISH ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function publishAnnouncement(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req, false);
        const announcementId = req.params.id;

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!announcementId) {
            return sendError(
                res,
                400,
                "Announcement ID is required"
            );
        }

        const announcement =
            await announcementModel.publishAnnouncement(
                announcementId,
                schoolId
            );

        if (!announcement) {
            return sendError(
                res,
                404,
                "Announcement not found"
            );
        }

        return sendSuccess(
            res,
            announcement,
            "Announcement published successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| UNPUBLISH ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function unpublishAnnouncement(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req, false);
        const announcementId = req.params.id;

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!announcementId) {
            return sendError(
                res,
                400,
                "Announcement ID is required"
            );
        }

        const announcement =
            await announcementModel.unpublishAnnouncement(
                announcementId,
                schoolId
            );

        if (!announcement) {
            return sendError(
                res,
                404,
                "Announcement not found"
            );
        }

        return sendSuccess(
            res,
            announcement,
            "Announcement unpublished successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| DELETE ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function deleteAnnouncement(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req, false);
        const announcementId = req.params.id;

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        if (!announcementId) {
            return sendError(
                res,
                400,
                "Announcement ID is required"
            );
        }

        const announcement =
            await announcementModel.deleteAnnouncement(
                announcementId,
                schoolId
            );

        if (!announcement) {
            return sendError(
                res,
                404,
                "Announcement not found"
            );
        }

        return sendSuccess(
            res,
            announcement,
            "Announcement deleted successfully"
        );
    } catch (error) {
        return next(error);
    }
}

/*
|--------------------------------------------------------------------------
| COUNT ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

async function countAnnouncements(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendError(res, 400, "schoolId is required");
        }

        const count =
            await announcementModel.countAnnouncements(
                schoolId,
                {
                    isPublished: req.query.isPublished,
                    type: req.query.type
                }
            );

        return sendSuccess(
            res,
            { count },
            "Announcement count retrieved successfully"
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
};