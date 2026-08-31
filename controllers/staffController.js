const staffModel = require("../models/staffModel");

// CREATE STAFF
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

        if (staffNumber) {
            const exists = await staffModel.staffNumberExists(
                staffNumber,
                finalSchoolId
            );

            if (exists) {
                return res.status(409).json({
                    success: false,
                    message: "A staff member with this staff number already exists."
                });
            }
        }

        const staff = await staffModel.createStaff({
            schoolId: finalSchoolId,
            staffNumber: staffNumber || null,
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            middleName: middleName ? String(middleName).trim() : null,
            gender: gender || null,
            dateOfBirth: dateOfBirth || null,
            phone: phone || null,
            email: email || null,
            address: address || null,
            departmentId: departmentId || null,
            position: position || null,
            employmentType: employmentType || null,
            employmentDate: employmentDate || null,
            qualification: qualification || null,
            status: status || "active"
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


// GET ALL STAFF
async function getStaff(req, res, next) {
    try {
        const {
            departmentId,
            status
        } = req.query;

        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const staff = await staffModel.findStaff({
            schoolId,
            departmentId: departmentId || null,
            status: status || null
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


// GET STAFF BY ID
async function getStaffById(req, res, next) {
    try {
        const { id } = req.params;

        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

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


// GET STAFF BY NUMBER
async function getStaffByNumber(req, res, next) {
    try {
        const { staffNumber } = req.params;

        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

        if (!staffNumber) {
            return res.status(400).json({
                success: false,
                message: "Staff number is required."
            });
        }

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


// SEARCH STAFF
async function searchStaff(req, res, next) {
    try {
        const searchTerm = String(
            req.query.q || ""
        ).trim();

        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

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


// UPDATE STAFF
async function updateStaff(req, res, next) {
    try {
        const { id } = req.params;

        const schoolId =
            req.body.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

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

        if (
            req.body.staffNumber &&
            req.body.staffNumber !== existing.staff_number
        ) {
            const duplicate =
                await staffModel.staffNumberExists(
                    req.body.staffNumber,
                    schoolId
                );

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "A staff member with this staff number already exists."
                });
            }
        }

        const data = {
            staffNumber: req.body.staffNumber,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            middleName: req.body.middleName,
            gender: req.body.gender,
            dateOfBirth: req.body.dateOfBirth,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            departmentId: req.body.departmentId,
            position: req.body.position,
            employmentType: req.body.employmentType,
            employmentDate: req.body.employmentDate,
            qualification: req.body.qualification,
            status: req.body.status
        };

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


// DELETE STAFF
async function deleteStaff(req, res, next) {
    try {
        const { id } = req.params;

        const schoolId =
            req.query.schoolId ||
            req.body.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

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


// COUNT STAFF
async function countStaff(req, res, next) {
    try {
        const {
            departmentId,
            status
        } = req.query;

        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const count = await staffModel.countStaff(
            schoolId,
            {
                departmentId: departmentId || null,
                status: status || null
            }
        );

        return res.status(200).json({
            success: true,
            count: Number(count),
            data: {
                count: Number(count)
            }
        });
    } catch (error) {
        console.error("Count staff error:", error);
        next(error);
    }
}


// STAFF STATISTICS
async function getStaffStatistics(req, res, next) {
    try {
        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

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


// GET STAFF BY DEPARTMENT
async function getStaffByDepartment(req, res, next) {
    try {
        const { departmentId } = req.params;

        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!departmentId) {
            return res.status(400).json({
                success: false,
                message: "Department ID is required."
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


// CHECK STAFF NUMBER
async function checkStaffNumber(req, res, next) {
    try {
        const { staffNumber } = req.params;

        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!staffNumber) {
            return res.status(400).json({
                success: false,
                message: "Staff number is required."
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


// EXPORT CONTROLLER
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