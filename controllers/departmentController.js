"use strict";

const {
    createDepartment,
    findDepartmentById,
    findDepartments,
    updateDepartment,
    deleteDepartment,
    searchDepartments
} = require("../models/departmentModel");

/*
 * Department Controller
 *
 * Database table:
 * departments
 *
 * Supported database fields:
 * id
 * school_id
 * department_name
 * department_code
 * description
 * is_active
 * created_at
 * updated_at
 *
 * API status values:
 * active
 * inactive
 *
 * Database status field:
 * is_active
 */

/*
 * Get the authenticated user's school ID.
 */
function getSchoolId(req) {
    const schoolId =
        req.user?.schoolId ||
        req.user?.school_id;

    if (!schoolId) {
        throw new Error(
            "Authenticated user's school ID is missing."
        );
    }

    return schoolId;
}

/*
 * Convert API status values to the database boolean value.
 *
 * active   -> true
 * inactive -> false
 *
 * No supplied value defaults to true.
 */
function normalizeStatus(status) {
    if (
        status === undefined ||
        status === null ||
        status === ""
    ) {
        return true;
    }

    if (typeof status === "boolean") {
        return status;
    }

    const normalized =
        String(status)
            .trim()
            .toLowerCase();

    if (normalized === "active") {
        return true;
    }

    if (normalized === "inactive") {
        return false;
    }

    return null;
}

/*
 * Create Department
 * POST /api/departments
 */
async function create(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            departmentName,
            departmentCode,
            description,
            status,
            isActive
        } = req.body || {};

        if (
            typeof departmentName !== "string" ||
            !departmentName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Department name is required."
            });
        }

        let activeValue;

        if (isActive !== undefined) {
            activeValue =
                normalizeStatus(isActive);
        } else {
            activeValue =
                normalizeStatus(status);
        }

        if (activeValue === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be active or inactive."
            });
        }

        const department =
            await createDepartment({
                schoolId,
                departmentName:
                    departmentName.trim(),
                departmentCode:
                    typeof departmentCode === "string" &&
                    departmentCode.trim()
                        ? departmentCode.trim()
                        : null,
                description:
                    typeof description === "string" &&
                    description.trim()
                        ? description.trim()
                        : null,
                isActive:
                    activeValue
            });

        return res.status(201).json({
            success: true,
            message:
                "Department created successfully.",
            data:
                department
        });
    } catch (error) {
        console.error(
            "Create department error:",
            error
        );

        next(error);
    }
}

/*
 * Get Department By ID
 * GET /api/departments/:id
 */
async function getById(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const departmentId =
            req.params.id;

        if (!departmentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Department ID is required."
            });
        }

        const department =
            await findDepartmentById(
                departmentId,
                schoolId
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found."
            });
        }

        return res.status(200).json({
            success: true,
            data:
                department
        });
    } catch (error) {
        console.error(
            "Get department error:",
            error
        );

        next(error);
    }
}

/*
 * Get All Departments
 * GET /api/departments
 */
async function getAll(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            status,
            isActive
        } = req.query;

        let activeFilter = null;

        if (
            isActive !== undefined &&
            isActive !== null &&
            isActive !== ""
        ) {
            activeFilter =
                normalizeStatus(isActive);
        } else if (
            status !== undefined &&
            status !== null &&
            status !== ""
        ) {
            activeFilter =
                normalizeStatus(status);
        }

        if (
            activeFilter === null &&
            (
                isActive !== undefined ||
                status !== undefined
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be active or inactive."
            });
        }

        const departments =
            await findDepartments(
                schoolId,
                {
                    isActive:
                        activeFilter
                }
            );

        return res.status(200).json({
            success: true,
            count:
                departments.length,
            data:
                departments
        });
    } catch (error) {
        console.error(
            "Get departments error:",
            error
        );

        next(error);
    }
}

/*
 * Update Department
 * PUT /api/departments/:id
 */
async function update(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const departmentId =
            req.params.id;

        if (!departmentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Department ID is required."
            });
        }

        const {
            departmentName,
            departmentCode,
            description,
            status,
            isActive
        } = req.body || {};

        const data = {};

        if (departmentName !== undefined) {
            if (
                typeof departmentName !== "string" ||
                !departmentName.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Department name cannot be empty."
                });
            }

            data.departmentName =
                departmentName.trim();
        }

        if (departmentCode !== undefined) {
            if (
                departmentCode === null ||
                departmentCode === ""
            ) {
                data.departmentCode = null;
            } else if (
                typeof departmentCode === "string"
            ) {
                data.departmentCode =
                    departmentCode.trim() ||
                    null;
            } else {
                return res.status(400).json({
                    success: false,
                    message:
                        "Department code must be text."
                });
            }
        }

        if (description !== undefined) {
            if (
                description === null ||
                description === ""
            ) {
                data.description = null;
            } else if (
                typeof description === "string"
            ) {
                data.description =
                    description.trim() ||
                    null;
            } else {
                return res.status(400).json({
                    success: false,
                    message:
                        "Description must be text."
                });
            }
        }

        if (isActive !== undefined) {
            const activeValue =
                normalizeStatus(isActive);

            if (activeValue === null) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Status must be active or inactive."
                });
            }

            data.isActive =
                activeValue;
        } else if (status !== undefined) {
            const activeValue =
                normalizeStatus(status);

            if (activeValue === null) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Status must be active or inactive."
                });
            }

            data.isActive =
                activeValue;
        }

        if (
            Object.keys(data).length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No valid fields supplied for update."
            });
        }

        const updatedDepartment =
            await updateDepartment(
                departmentId,
                schoolId,
                data
            );

        if (!updatedDepartment) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Department updated successfully.",
            data:
                updatedDepartment
        });
    } catch (error) {
        console.error(
            "Update department error:",
            error
        );

        next(error);
    }
}

/*
 * Delete Department
 * DELETE /api/departments/:id
 */
async function remove(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const departmentId =
            req.params.id;

        if (!departmentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Department ID is required."
            });
        }

        const deletedDepartment =
            await deleteDepartment(
                departmentId,
                schoolId
            );

        if (!deletedDepartment) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Department deleted successfully.",
            data:
                deletedDepartment
        });
    } catch (error) {
        console.error(
            "Delete department error:",
            error
        );

        next(error);
    }
}

/*
 * Search Departments
 * GET /api/departments/search?q=...
 */
async function search(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const searchTerm =
            String(
                req.query.q || ""
            ).trim();

        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message:
                    "Search term is required."
            });
        }

        const departments =
            await searchDepartments(
                searchTerm,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count:
                departments.length,
            data:
                departments
        });
    } catch (error) {
        console.error(
            "Search departments error:",
            error
        );

        next(error);
    }
}

/*
 * Export Controller
 */
module.exports = {
    create,
    getById,
    getAll,
    update,
    remove,
    search
};