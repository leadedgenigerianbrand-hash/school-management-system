"use strict";

const resultSettingModel = require("../models/resultSettingModel");

/* ==========================================================================
   RESULT SETTING CONTROLLER
   ==========================================================================

   Handles HTTP/API operations for result grading settings.

   Architecture:

   Routes
   ↓
   Controller
   ↓
   Result Setting Model
   ↓
   PostgreSQL

   Database table:

   result_settings

   Fields supported by the current database schema:

   id
   school_id
   setting_name
   minimum_score
   maximum_score
   grade
   remark
   grade_point
   created_at

   ========================================================================== */

/* ==========================================================================
   SCHOOL RESOLUTION
   ==========================================================================

   The authenticated user's school is the primary source.

   Body/query fallback is retained for compatibility with existing
   development/testing requests.

   ========================================================================== */

function resolveSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.body?.schoolId ||
        req.body?.school_id ||
        req.query?.schoolId ||
        req.query?.school_id ||
        null
    );
}

/* ==========================================================================
   USER RESOLUTION
   ========================================================================== */

function resolveUserId(req) {
    return (
        req.user?.id ||
        req.user?.userId ||
        req.user?.user_id ||
        null
    );
}

/* ==========================================================================
   VALUE HELPERS
   ========================================================================== */

function normalizeOptionalValue(value) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    return value;
}

function parseScore(value, fieldName) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(
            `${fieldName} must be a valid number.`
        );
    }

    if (number < 0 || number > 100) {
        throw new Error(
            `${fieldName} must be between 0 and 100.`
        );
    }

    return number;
}

function parseGradePoint(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(
            "Grade point must be a valid number."
        );
    }

    if (number < 0) {
        throw new Error(
            "Grade point cannot be negative."
        );
    }

    return number;
}

/* ==========================================================================
   BUILD SETTING DATA
   ========================================================================== */

function buildSettingData(req) {
    const body = req.body || {};

    return {
        schoolId: resolveSchoolId(req),

        settingName:
            body.settingName ??
            body.setting_name,

        minimumScore:
            body.minimumScore ??
            body.minimum_score,

        maximumScore:
            body.maximumScore ??
            body.maximum_score,

        grade:
            body.grade,

        remark:
            body.remark,

        gradePoint:
            body.gradePoint ??
            body.grade_point
    };
}

/* ==========================================================================
   VALIDATE SETTING DATA
   ========================================================================== */

function validateSettingData(data, options = {}) {
    const requireSchool =
        options.requireSchool !== false;

    if (
        requireSchool &&
        !data.schoolId
    ) {
        throw new Error(
            "School ID is required."
        );
    }

    if (
        options.requireSettingName &&
        !String(data.settingName || "").trim()
    ) {
        throw new Error(
            "Setting name is required."
        );
    }

    const minimumScore =
        parseScore(
            data.minimumScore,
            "Minimum score"
        );

    const maximumScore =
        parseScore(
            data.maximumScore,
            "Maximum score"
        );

    if (
        minimumScore !== null &&
        maximumScore !== null &&
        minimumScore > maximumScore
    ) {
        throw new Error(
            "Minimum score cannot be greater than maximum score."
        );
    }

    const grade =
        normalizeOptionalValue(data.grade);

    const remark =
        normalizeOptionalValue(data.remark);

    const gradePoint =
        parseGradePoint(data.gradePoint);

    return {
        schoolId:
            data.schoolId,

        settingName:
            options.requireSettingName ||
            data.settingName !== undefined
                ? String(
                    data.settingName || ""
                ).trim()
                : undefined,

        minimumScore,

        maximumScore,

        grade,

        remark,

        gradePoint
    };
}

/* ==========================================================================
   GET RESULT SETTINGS
   ========================================================================== */

async function getResultSettings(req, res, next) {
    try {
        const schoolId =
            resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const filters = {
            settingName:
                normalizeOptionalValue(
                    req.query.settingName ??
                    req.query.setting_name
                ),

            grade:
                normalizeOptionalValue(
                    req.query.grade
                ),

            minimumScore:
                req.query.minimumScore ??
                req.query.minimum_score,

            maximumScore:
                req.query.maximumScore ??
                req.query.maximum_score
        };

        const result =
            await resultSettingModel.getResultSettings(
                schoolId,
                filters
            );

        return res.status(200).json({
            success: true,
            data: result || []
        });
    } catch (error) {
        return next(error);
    }
}

/* ==========================================================================
   GET RESULT SETTING BY ID
   ========================================================================== */

async function getResultSettingById(req, res, next) {
    try {
        const schoolId =
            resolveSchoolId(req);

        const settingId =
            req.params.id;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!settingId) {
            return res.status(400).json({
                success: false,
                message: "Result setting ID is required."
            });
        }

        const result =
            await resultSettingModel.getResultSettingById(
                settingId,
                schoolId
            );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result setting not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return next(error);
    }
}

/* ==========================================================================
   CREATE RESULT SETTING
   ========================================================================== */

async function createResultSetting(req, res, next) {
    try {
        const data =
            buildSettingData(req);

        const validated =
            validateSettingData(
                data,
                {
                    requireSchool: true,
                    requireSettingName: true
                }
            );

        const created =
            await resultSettingModel.createResultSetting(
                validated
            );

        return res.status(201).json({
            success: true,
            message:
                "Result setting created successfully.",
            data: created
        });
    } catch (error) {
        return next(error);
    }
}

/* ==========================================================================
   UPDATE RESULT SETTING
   ========================================================================== */

async function updateResultSetting(req, res, next) {
    try {
        const schoolId =
            resolveSchoolId(req);

        const settingId =
            req.params.id;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!settingId) {
            return res.status(400).json({
                success: false,
                message: "Result setting ID is required."
            });
        }

        const body =
            req.body || {};

        const data = {
            schoolId,

            settingName:
                body.settingName ??
                body.setting_name,

            minimumScore:
                body.minimumScore ??
                body.minimum_score,

            maximumScore:
                body.maximumScore ??
                body.maximum_score,

            grade:
                body.grade,

            remark:
                body.remark,

            gradePoint:
                body.gradePoint ??
                body.grade_point
        };

        const validated =
            validateSettingData(
                data,
                {
                    requireSchool: true,
                    requireSettingName:
                        body.settingName !== undefined ||
                        body.setting_name !== undefined
                }
            );

        const updated =
            await resultSettingModel.updateResultSetting(
                settingId,
                schoolId,
                validated
            );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Result setting not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Result setting updated successfully.",
            data: updated
        });
    } catch (error) {
        return next(error);
    }
}

/* ==========================================================================
   DELETE RESULT SETTING
   ========================================================================== */

async function deleteResultSetting(req, res, next) {
    try {
        const schoolId =
            resolveSchoolId(req);

        const settingId =
            req.params.id;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!settingId) {
            return res.status(400).json({
                success: false,
                message: "Result setting ID is required."
            });
        }

        const deleted =
            await resultSettingModel.deleteResultSetting(
                settingId,
                schoolId
            );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Result setting not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Result setting deleted successfully.",
            data: deleted
        });
    } catch (error) {
        return next(error);
    }
}

/* ==========================================================================
   FIND GRADING SETTING FOR SCORE
   ==========================================================================

   This is used when the Results module needs to determine the grade,
   remark and grade point that apply to a particular score.

   ========================================================================== */

async function findSettingForScore(req, res, next) {
    try {
        const schoolId =
            resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const score =
            req.query.score ??
            req.body?.score;

        if (
            score === undefined ||
            score === null ||
            score === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Score is required."
            });
        }

        const numericScore =
            parseScore(
                score,
                "Score"
            );

        const result =
            await resultSettingModel.findSettingForScore(
                schoolId,
                numericScore
            );

        if (!result) {
            return res.status(404).json({
                success: false,
                message:
                    "No result setting matches this score."
            });
        }

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return next(error);
    }
}

/* ==========================================================================
   GET GRADE FOR SCORE
   ==========================================================================

   Compatibility wrapper for clients that specifically request the grade
   information rather than the complete setting record.

   ========================================================================== */

async function getGradeForScore(req, res, next) {
    return findSettingForScore(
        req,
        res,
        next
    );
}

/* ==========================================================================
   GET CURRENT USER ID
   ==========================================================================

   Kept available for future audit integration without forcing audit logic
   into this controller.

   ========================================================================== */

function getCurrentUserId(req) {
    return resolveUserId(req);
}

/* ==========================================================================
   EXPORT
   ========================================================================== */

module.exports = {
    getResultSettings,
    getResultSettingById,
    createResultSetting,
    updateResultSetting,
    deleteResultSetting,
    findSettingForScore,
    getGradeForScore,
    getCurrentUserId
};