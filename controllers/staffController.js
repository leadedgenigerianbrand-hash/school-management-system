"use strict";

const staffModel = require("../models/staffModel");

/*
|--------------------------------------------------------------------------
| STAFF CONTROLLER
|--------------------------------------------------------------------------
|
| This controller handles HTTP/API operations for staff.
|
| Responsibilities:
| - Validate request data
| - Resolve the current school
| - Normalize staff status values
| - Call the staff model
| - Return consistent JSON responses
| - Pass unexpected errors to the global error middleware
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| STAFF STATUS VALUES
|--------------------------------------------------------------------------
|
| These values must match the PostgreSQL staff.status check constraint:
|
| Active
| Inactive
| Suspended
| Resigned
|
|--------------------------------------------------------------------------
*/

const STAFF_STATUSES = Object.freeze([
    "Active",
    "Inactive",
    "Suspended",
    "Resigned"
]);

/*
|--------------------------------------------------------------------------
| NORMALIZE STAFF STATUS
|--------------------------------------------------------------------------
|
| Accepts case-insensitive status input from the frontend/API and converts
| it to the exact canonical value expected by PostgreSQL.
|
| Examples:
| active     -> Active
| ACTIVE     -> Active
| inactive   -> Inactive
| SUSPENDED  -> Suspended
| resigned   -> Resigned
|
|--------------------------------------------------------------------------
*/

function normalizeStaffStatus(value, defaultValue = "Active") {
    if (value === undefined || value === null || String(value).trim() === "") {
        return defaultValue;
    }

    const normalizedInput = String(value).trim().toLowerCase();

    const matchedStatus = STAFF_STATUSES.find(
        (status) => status.toLowerCase() === normalizedInput
    );

    return matchedStatus || null;
}

/*
|--------------------------------------------------------------------------
| RESOLVE SCHOOL ID
|--------------------------------------------------------------------------
*/

function resolveSchoolId(req, allowQuery = true) {
    if (allowQuery && req.query?.schoolId) {
        return req.query.schoolId;
    }

    if (req.body?.schoolId) {
        return req.body.schoolId;
    }

    if (req.user?.schoolId) {
        return req.user.schoolId;
    }

    if (req.user?.school_id) {
        return req.user.school_id;
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| CREATE STAFF
|--------------------------------------------------------------------------
*/

async function createStaff(req, res, next) {
    try {
        const {
            schoolId,
            staffNumber,
            firstName,
            lastName,
            middleName,
            gender,
            dateOfBirth,
            phone,
            email,
            address,
            departmentId,
            position,
            employmentType,
            employmentDate,
            qualification,
            status
        } = req.body;

        const finalSchoolId =
            schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

        if (!finalSchoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!firstName || !String(firstName).trim()) {
            return res.status(400).json({
                success: false,
                message: "First name is required."
            });
        }

        if (!lastName || !String(lastName).trim()) {
            return res.status(400).json({
                success: false,
                message: "Last name is required."
            });
        }

        const normalizedStatus = normalizeStaffStatus(
            status,
            "Active"
        );

        if (!normalizedStatus) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid staff status. Allowed values are Active, Inactive, Suspended, and Resigned."
            });
        }

        if (staffNumber) {
            const exists = await staffModel.staffNumberExists(
                String(staffNumber).trim(),
                finalSchoolId
            );

            if (exists) {
                return res.status(409).json({
                    success: false,
                    message:
                        "A staff member with this staff number already exists."
                });
            }
        }

        const staff = await staffModel.createStaff({
            schoolId: finalSchoolId,

            staffNumber: staffNumber
                ? String(staffNumber).trim()
                : null,

            firstName: String(firstName).trim(),

            lastName: String(lastName).trim(),

            middleName: middleName
                ? String(middleName).trim()
                : null,

            gender: gender
                ? String(gender).trim()
                : null,

            dateOfBirth: dateOfBirth || null,

            phone: phone
                ? String(phone).trim()
                : null,

            email: email
                ? String(email).trim()
                : null,

            address: address
                ? String(address).trim()
                : null,

            departmentId: departmentId || null,

            position: position
                ? String(position).trim()
                : null,

            employmentType: employmentType
                ? String(employmentType).trim()
                : null,

            employmentDate: employmentDate || null,

            qualification: qualification
                ? String(qualification).trim()
                : null,

            status: normalizedStatus
        });

        return res.status(201).json({
            success: true,
            message: "Staff member created successfully.",
            data: staff
        });
    } catch (error) {
        console.error("Create staff error:", error);
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ALL STAFF
|--------------------------------------------------------------------------
*/

async function getStaff(req, res, next) {
    try {
        const {
            departmentId,
            status
        } = req.query;

        const schoolId = resolveSchoolId(req, true);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        let normalizedStatus = null;

        if (status !== undefined && status !== null && String(status).trim() !== "") {
            normalizedStatus = normalizeStaffStatus(status, null);

            if (!normalizedStatus) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid staff status. Allowed values are Active, Inactive, Suspended, and Resigned."
                });
            }
        }

        const staff = await staffModel.findStaff({
            schoolId,
            departmentId: departmentId || null,
            status: normalizedStatus
        });

        return res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        console.error("Get staff error:", error);
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET STAFF BY ID
|--------------------------------------------------------------------------
*/

async function getStaffById(req, res, next) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Staff ID is required."
            });
        }

        const schoolId = resolveSchoolId(req, true);

        const staff = await staffModel.findStaffById(
            id,
            schoolId || null
        );

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error("Get staff by ID error:", error);
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET STAFF BY NUMBER
|--------------------------------------------------------------------------
*/

async function getStaffByNumber(req, res, next) {
    try {
        const { staffNumber } = req.params;

        if (!staffNumber) {
            return res.status(400).json({
                success: false,
                message: "Staff number is required."
            });
        }

        const schoolId = resolveSchoolId(req, true);

        const staff = await staffModel.findStaffByNumber(
            staffNumber,
            schoolId || null
        );

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error("Get staff by number error:", error);
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| SEARCH STAFF
|--------------------------------------------------------------------------
*/

async function searchStaff(req, res, next) {
    try {
        const searchTerm = String(
            req.query.q || ""
        ).trim();

        const schoolId = resolveSchoolId(req, true);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: "Search term is required."
            });
        }

        const staff = await staffModel.searchStaff(
            searchTerm,
            schoolId
        );

        return res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        console.error("Search staff error:", error);
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| UPDATE STAFF
|--------------------------------------------------------------------------
*/

async function updateStaff(req, res, next) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Staff ID is required."
            });
        }

        const schoolId = resolveSchoolId(req, false);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const existing = await staffModel.findStaffById(
            id,
            schoolId
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found."
            });
        }

        const staffNumber =
            req.body.staffNumber !== undefined
                ? String(req.body.staffNumber).trim()
                : existing.staff_number;

        if (
            staffNumber &&
            staffNumber !== existing.staff_number
        ) {
            const duplicate =
                await staffModel.staffNumberExists(
                    staffNumber,
                    schoolId
                );

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message:
                        "A staff member with this staff number already exists."
                });
            }
        }

        let normalizedStatus = existing.status || "Active";

        if (req.body.status !== undefined) {
            normalizedStatus = normalizeStaffStatus(
                req.body.status,
                null
            );

            if (!normalizedStatus) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid staff status. Allowed values are Active, Inactive, Suspended, and Resigned."
                });
            }
        }

        const data = {
            staffNumber:
                req.body.staffNumber !== undefined
                    ? staffNumber || null
                    : existing.staff_number,

            firstName:
                req.body.firstName !== undefined
                    ? String(req.body.firstName).trim()
                    : existing.first_name,

            lastName:
                req.body.lastName !== undefined
                    ? String(req.body.lastName).trim()
                    : existing.last_name,

            middleName:
                req.body.middleName !== undefined
                    ? (
                        req.body.middleName
                            ? String(req.body.middleName).trim()
                            : null
                    )
                    : existing.middle_name,

            gender:
                req.body.gender !== undefined
                    ? req.body.gender || null
                    : existing.gender,

            dateOfBirth:
                req.body.dateOfBirth !== undefined
                    ? req.body.dateOfBirth || null
                    : existing.date_of_birth,

            phone:
                req.body.phone !== undefined
                    ? req.body.phone || null
                    : existing.phone,

            email:
                req.body.email !== undefined
                    ? req.body.email || null
                    : existing.email,

            address:
                req.body.address !== undefined
                    ? req.body.address || null
                    : existing.address,

            departmentId:
                req.body.departmentId !== undefined
                    ? req.body.departmentId || null
                    : existing.department_id,

            position:
                req.body.position !== undefined
                    ? req.body.position || null
                    : existing.position,

            employmentType:
                req.body.employmentType !== undefined
                    ? req.body.employmentType || null
                    : existing.employment_type,

            employmentDate:
                req.body.employmentDate !== undefined
                    ? req.body.employmentDate || null
                    : existing.employment_date,

            qualification:
                req.body.qualification !== undefined
                    ? req.body.qualification || null
                    : existing.qualification,

            status: normalizedStatus
        };

        if (!data.firstName) {
            return res.status(400).json({
                success: false,
                message: "First name is required."
            });
        }

        if (!data.lastName) {
            return res.status(400).json({
                success: false,
                message: "Last name is required."
            });
        }

        const staff = await staffModel.updateStaff(
            id,
            schoolId,
            data
        );

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Staff member updated successfully.",
            data: staff
        });
    } catch (error) {
        console.error("Update staff error:", error);
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| DELETE STAFF
|--------------------------------------------------------------------------
*/

async function deleteStaff(req, res, next) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Staff ID is required."
            });
        }

        const schoolId = resolveSchoolId(req, true);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const staff = await staffModel.deleteStaff(
            id,
            schoolId
        );

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Staff member deleted successfully.",
            data: staff
        });
    } catch (error) {
        console.error("Delete staff error:", error);
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| COUNT STAFF
|--------------------------------------------------------------------------
*/

async function countStaff(req, res, next) {
    try {
        const {
            departmentId,
            status
        } = req.query;

        const schoolId = resolveSchoolId(req, true);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        let normalizedStatus = null;

        if (status !== undefined && status !== null && String(status).trim() !== "") {
            normalizedStatus = normalizeStaffStatus(status, null);

            if (!normalizedStatus) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid staff status. Allowed values are Active, Inactive, Suspended, and Resigned."
                });
            }
        }

        const count = await staffModel.countStaff(
            schoolId,
            {
                departmentId: departmentId || null,
                status: normalizedStatus
            }
        );

        const numericCount = Number(count) || 0;

        return res.status(200).json({
            success: true,
            count: numericCount,
            data: {
                count: numericCount
            }
        });
    } catch (error) {
        console.error("Count staff error:", error);
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| STAFF STATISTICS
|--------------------------------------------------------------------------
*/

async function getStaffStatistics(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req, true);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const statistics =
            await staffModel.getStaffStatistics(
                schoolId
            );

        return res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error("Get staff statistics error:", error);
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET STAFF BY DEPARTMENT
|--------------------------------------------------------------------------
*/

async function getStaffByDepartment(req, res, next) {
    try {
        const { departmentId } = req.params;

        if (!departmentId) {
            return res.status(400).json({
                success: false,
                message: "Department ID is required."
            });
        }

        const schoolId = resolveSchoolId(req, true);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const staff =
            await staffModel.getStaffByDepartment(
                departmentId,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (error) {
        console.error(
            "Get staff by department error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| CHECK STAFF NUMBER
|--------------------------------------------------------------------------
*/

async function checkStaffNumber(req, res, next) {
    try {
        const { staffNumber } = req.params;

        if (!staffNumber) {
            return res.status(400).json({
                success: false,
                message: "Staff number is required."
            });
        }

        const schoolId = resolveSchoolId(req, true);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const exists =
            await staffModel.staffNumberExists(
                staffNumber,
                schoolId
            );

        return res.status(200).json({
            success: true,
            exists: Boolean(exists)
        });
    } catch (error) {
        console.error(
            "Check staff number error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| EXPORT CONTROLLER
|--------------------------------------------------------------------------
*/

module.exports = {
    createStaff,
    getStaff,
    getStaffById,
    getStaffByNumber,
    searchStaff,
    updateStaff,
    deleteStaff,
    countStaff,
    getStaffStatistics,
    getStaffByDepartment,
    checkStaffNumber
};