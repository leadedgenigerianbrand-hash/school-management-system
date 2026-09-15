"use strict";

const termModel = require("../models/termModel");

function getSchoolId(req) {
    return req.user?.schoolId || req.user?.school_id || null;
}

function validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
        return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return "Invalid start date or end date.";
    }

    if (start > end) {
        return "Start date cannot be later than end date.";
    }

    return null;
}

function parseBoolean(value, defaultValue) {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (value === "true" || value === "1") {
        return true;
    }

    if (value === "false" || value === "0") {
        return false;
    }

    return defaultValue;
}

async function getTerms(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const status = req.query.status || null;

        const terms = await termModel.findTermsBySchool(
            schoolId,
            {
                status
            }
        );

        return res.status(200).json({
            success: true,
            count: terms.length,
            data: terms
        });
    } catch (error) {
        console.error("Get terms error:", error);
        return next(error);
    }
}

async function getTermById(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Term ID is required."
            });
        }

        const term = await termModel.findTermById(
            id,
            schoolId
        );

        if (!term) {
            return res.status(404).json({
                success: false,
                message: "Term not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: term
        });
    } catch (error) {
        console.error("Get term by ID error:", error);
        return next(error);
    }
}

async function createTerm(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const {
            termName,
            termOrder,
            startDate,
            endDate,
            isCurrent,
            isActive
        } = req.body;

        if (
            typeof termName !== "string" ||
            !termName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Term name is required."
            });
        }

        const dateError = validateDateRange(
            startDate,
            endDate
        );

        if (dateError) {
            return res.status(400).json({
                success: false,
                message: dateError
            });
        }

        const normalizedName = termName.trim();

        const exists = await termModel.termExists(
            schoolId,
            normalizedName
        );

        if (exists) {
            return res.status(409).json({
                success: false,
                message:
                    "A term with this name already exists in this school."
            });
        }

        const normalizedOrder =
            termOrder === undefined ||
            termOrder === null ||
            termOrder === ""
                ? 0
                : Number(termOrder);

        if (
            !Number.isInteger(normalizedOrder) ||
            normalizedOrder < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Term order must be a non-negative whole number."
            });
        }

        const term = await termModel.createTerm({
            schoolId,
            termName: normalizedName,
            termOrder: normalizedOrder,
            startDate: startDate || null,
            endDate: endDate || null,
            isCurrent: parseBoolean(
                isCurrent,
                false
            ),
            isActive: parseBoolean(
                isActive,
                true
            )
        });

        return res.status(201).json({
            success: true,
            message: "Term created successfully.",
            data: term
        });
    } catch (error) {
        console.error("Create term error:", error);
        return next(error);
    }
}

async function updateTerm(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Term ID is required."
            });
        }

        const existing = await termModel.findTermById(
            id,
            schoolId
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Term not found."
            });
        }

        const {
            termName,
            termOrder,
            startDate,
            endDate,
            isCurrent,
            isActive
        } = req.body;

        const normalizedName =
            termName === undefined
                ? existing.term_name
                : typeof termName === "string"
                    ? termName.trim()
                    : "";

        if (!normalizedName) {
            return res.status(400).json({
                success: false,
                message: "Term name is required."
            });
        }

        const duplicate = await termModel.findTermByName(
            schoolId,
            normalizedName
        );

        if (
            duplicate &&
            String(duplicate.id) !== String(id)
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "A term with this name already exists in this school."
            });
        }

        const finalStartDate =
            startDate === undefined
                ? existing.start_date
                : startDate || null;

        const finalEndDate =
            endDate === undefined
                ? existing.end_date
                : endDate || null;

        const dateError = validateDateRange(
            finalStartDate,
            finalEndDate
        );

        if (dateError) {
            return res.status(400).json({
                success: false,
                message: dateError
            });
        }

        const normalizedOrder =
            termOrder === undefined ||
            termOrder === null ||
            termOrder === ""
                ? existing.term_order
                : Number(termOrder);

        if (
            !Number.isInteger(normalizedOrder) ||
            normalizedOrder < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Term order must be a non-negative whole number."
            });
        }

        const updatedIsCurrent =
            isCurrent === undefined
                ? existing.is_current
                : parseBoolean(
                    isCurrent,
                    existing.is_current
                );

        const updatedIsActive =
            isActive === undefined
                ? existing.is_active
                : parseBoolean(
                    isActive,
                    existing.is_active
                );

        const term = await termModel.updateTerm(
            id,
            schoolId,
            {
                termName: normalizedName,
                termOrder: normalizedOrder,
                startDate: finalStartDate,
                endDate: finalEndDate,
                isCurrent: updatedIsCurrent,
                isActive: updatedIsActive
            }
        );

        if (!term) {
            return res.status(404).json({
                success: false,
                message: "Term not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Term updated successfully.",
            data: term
        });
    } catch (error) {
        console.error("Update term error:", error);
        return next(error);
    }
}

async function activateTerm(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const term = await termModel.activateTerm(
            id,
            schoolId
        );

        if (!term) {
            return res.status(404).json({
                success: false,
                message: "Term not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Term activated successfully.",
            data: term
        });
    } catch (error) {
        console.error("Activate term error:", error);
        return next(error);
    }
}

async function setTermUpcoming(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const term = await termModel.setTermUpcoming(
            id,
            schoolId
        );

        if (!term) {
            return res.status(404).json({
                success: false,
                message: "Term not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Term set as upcoming successfully.",
            data: term
        });
    } catch (error) {
        console.error(
            "Set term upcoming error:",
            error
        );

        return next(error);
    }
}

async function completeTerm(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const term = await termModel.completeTerm(
            id,
            schoolId
        );

        if (!term) {
            return res.status(404).json({
                success: false,
                message: "Term not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Term completed successfully.",
            data: term
        });
    } catch (error) {
        console.error("Complete term error:", error);
        return next(error);
    }
}

async function deleteTerm(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Term ID is required."
            });
        }

        const existing = await termModel.findTermById(
            id,
            schoolId
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Term not found."
            });
        }

        const term = await termModel.deleteTerm(
            id,
            schoolId
        );

        if (!term) {
            return res.status(404).json({
                success: false,
                message: "Term not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Term deleted successfully.",
            data: term
        });
    } catch (error) {
        console.error("Delete term error:", error);
        return next(error);
    }
}

async function getCurrentTerm(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const term = await termModel.findCurrentTerm(
            schoolId
        );

        if (!term) {
            return res.status(404).json({
                success: false,
                message:
                    "No current term is configured."
            });
        }

        return res.status(200).json({
            success: true,
            data: term
        });
    } catch (error) {
        console.error("Get current term error:", error);
        return next(error);
    }
}

async function getTermStatistics(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const statistics =
            await termModel.getTermStatistics(
                schoolId
            );

        return res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error(
            "Get term statistics error:",
            error
        );

        return next(error);
    }
}

module.exports = {
    getTerms,
    getTermById,
    createTerm,
    updateTerm,
    activateTerm,
    setTermUpcoming,
    completeTerm,
    deleteTerm,
    getCurrentTerm,
    getTermStatistics
};