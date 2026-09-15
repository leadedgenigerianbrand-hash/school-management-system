"use strict";

const academicLevelModel = require("../models/academicLevelModel");

function getSchoolId(req) {
    return req.user?.schoolId || req.user?.school_id || null;
}

function parseBoolean(value, defaultValue) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (
        value === "true" ||
        value === "1"
    ) {
        return true;
    }

    if (
        value === "false" ||
        value === "0"
    ) {
        return false;
    }

    return defaultValue;
}

function parseLevelOrder(value, defaultValue = 0) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    const order = Number(value);

    if (
        !Number.isInteger(order) ||
        order < 0
    ) {
        return null;
    }

    return order;
}

function normalizeName(value) {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        return null;
    }

    return value.trim();
}

function sendError(res, error, fallbackMessage) {
    const statusCode =
        error.statusCode ||
        error.status ||
        500;

    return res.status(statusCode).json({
        success: false,
        message:
            error.message ||
            fallbackMessage
    });
}

async function create(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        const {
            levelName,
            levelOrder,
            description,
            isActive
        } = req.body;

        const normalizedName =
            normalizeName(levelName);

        if (!normalizedName) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level name is required."
            });
        }

        const normalizedOrder =
            parseLevelOrder(
                levelOrder,
                0
            );

        if (normalizedOrder === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level order must be a non-negative whole number."
            });
        }

        const level =
            await academicLevelModel.createAcademicLevel({
                schoolId,
                levelName:
                    normalizedName,
                levelOrder:
                    normalizedOrder,
                description:
                    description === undefined ||
                    description === null
                        ? null
                        : String(description).trim() || null,
                isActive:
                    parseBoolean(
                        isActive,
                        true
                    )
            });

        return res.status(201).json({
            success: true,
            message:
                "Academic level created successfully.",
            data: level
        });
    } catch (error) {
        console.error(
            "Create academic level error:",
            error
        );

        return next(error);
    }
}

async function getAll(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        let isActive = null;

        if (
            req.query.isActive === "true" ||
            req.query.isActive === "1"
        ) {
            isActive = true;
        }

        if (
            req.query.isActive === "false" ||
            req.query.isActive === "0"
        ) {
            isActive = false;
        }

        const levels =
            await academicLevelModel.findAcademicLevelsBySchool(
                schoolId,
                {
                    isActive
                }
            );

        return res.status(200).json({
            success: true,
            count: levels.length,
            data: levels
        });
    } catch (error) {
        console.error(
            "Get academic levels error:",
            error
        );

        return next(error);
    }
}

async function getActive(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        const levels =
            await academicLevelModel.getActiveAcademicLevels(
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: levels.length,
            data: levels
        });
    } catch (error) {
        console.error(
            "Get active academic levels error:",
            error
        );

        return next(error);
    }
}

async function getById(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level ID is required."
            });
        }

        const level =
            await academicLevelModel.findAcademicLevelById(
                id,
                schoolId
            );

        if (!level) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic level not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: level
        });
    } catch (error) {
        console.error(
            "Get academic level error:",
            error
        );

        return next(error);
    }
}

async function getWithClasses(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level ID is required."
            });
        }

        const level =
            await academicLevelModel.getAcademicLevelWithClasses(
                id,
                schoolId
            );

        if (!level) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic level not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: level
        });
    } catch (error) {
        console.error(
            "Get academic level with classes error:",
            error
        );

        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level ID is required."
            });
        }

        const existing =
            await academicLevelModel.findAcademicLevelById(
                id,
                schoolId
            );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic level not found."
            });
        }

        const {
            levelName,
            levelOrder,
            description,
            isActive
        } = req.body;

        const normalizedName =
            levelName === undefined
                ? existing.level_name
                : normalizeName(levelName);

        if (!normalizedName) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level name is required."
            });
        }

        const normalizedOrder =
            parseLevelOrder(
                levelOrder,
                existing.level_order
            );

        if (normalizedOrder === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level order must be a non-negative whole number."
            });
        }

        const normalizedDescription =
            description === undefined
                ? existing.description
                : description === null
                    ? null
                    : String(description).trim() || null;

        const normalizedActive =
            parseBoolean(
                isActive,
                existing.is_active
            );

        const level =
            await academicLevelModel.updateAcademicLevel(
                id,
                schoolId,
                {
                    levelName:
                        normalizedName,
                    levelOrder:
                        normalizedOrder,
                    description:
                        normalizedDescription,
                    isActive:
                        normalizedActive
                }
            );

        if (!level) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic level not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Academic level updated successfully.",
            data: level
        });
    } catch (error) {
        console.error(
            "Update academic level error:",
            error
        );

        return next(error);
    }
}

async function rename(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level ID is required."
            });
        }

        const newName =
            normalizeName(
                req.body.newName ||
                req.body.levelName
            );

        if (!newName) {
            return res.status(400).json({
                success: false,
                message:
                    "New academic level name is required."
            });
        }

        const level =
            await academicLevelModel.renameAcademicLevel(
                id,
                schoolId,
                newName
            );

        if (!level) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic level not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Academic level renamed successfully.",
            data: level
        });
    } catch (error) {
        console.error(
            "Rename academic level error:",
            error
        );

        return next(error);
    }
}

async function activate(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level ID is required."
            });
        }

        const level =
            await academicLevelModel.activateAcademicLevel(
                id,
                schoolId
            );

        if (!level) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic level not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Academic level activated successfully.",
            data: level
        });
    } catch (error) {
        console.error(
            "Activate academic level error:",
            error
        );

        return next(error);
    }
}

async function deactivate(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        const level =
            await academicLevelModel.deactivateAcademicLevel(
                id,
                schoolId
            );

        if (!level) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic level not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Academic level deactivated successfully.",
            data: level
        });
    } catch (error) {
        console.error(
            "Deactivate academic level error:",
            error
        );

        return next(error);
    }
}

async function remove(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level ID is required."
            });
        }

        const level =
            await academicLevelModel.deleteAcademicLevel(
                id,
                schoolId
            );

        if (!level) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic level not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Academic level deleted successfully.",
            data: level
        });
    } catch (error) {
        console.error(
            "Delete academic level error:",
            error
        );

        return next(error);
    }
}

async function search(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        const searchTerm =
            req.query.q ||
            req.query.search ||
            "";

        const levels =
            await academicLevelModel.searchAcademicLevels(
                String(searchTerm).trim(),
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: levels.length,
            data: levels
        });
    } catch (error) {
        console.error(
            "Search academic levels error:",
            error
        );

        return next(error);
    }
}

async function getStatistics(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(401).json({
                success: false,
                message:
                    "School authentication is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Academic level ID is required."
            });
        }

        const statistics =
            await academicLevelModel.getAcademicLevelStatistics(
                id,
                schoolId
            );

        if (!statistics) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic level not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error(
            "Get academic level statistics error:",
            error
        );

        return next(error);
    }
}

module.exports = {
    create,
    getAll,
    getActive,
    getById,
    getWithClasses,
    update,
    rename,
    activate,
    deactivate,
    remove,
    search,
    getStatistics
};