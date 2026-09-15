"use strict";

const guardianModel = require("../models/guardianModel");

/*
|--------------------------------------------------------------------------
| GUARDIAN CONTROLLER
|--------------------------------------------------------------------------
|
| Handles HTTP/API operations for guardians and their relationships
| with students.
|
| The controller is responsible for:
|
| - Request validation
| - School context resolution
| - Calling guardianModel database functions
| - Returning API responses
| - Passing unexpected errors to Express
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| RESOLVE SCHOOL ID
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. Authenticated user's school ID
| 2. Explicit schoolId supplied by request body/query
|
|--------------------------------------------------------------------------
*/

function resolveSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.body?.schoolId ||
        req.query?.schoolId ||
        null
    );
}

/*
|--------------------------------------------------------------------------
| CREATE GUARDIAN
|--------------------------------------------------------------------------
| POST /api/guardians
|--------------------------------------------------------------------------
*/

async function createGuardian(req, res, next) {
    try {
        const {
            firstName,
            middleName,
            lastName,
            relationship,
            phone,
            alternativePhone,
            alternatePhone,
            email,
            address,
            occupation,
            employer,
            emergencyContact
        } = req.body || {};

        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (
            !firstName ||
            typeof firstName !== "string" ||
            !firstName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "First name is required."
            });
        }

        if (
            !lastName ||
            typeof lastName !== "string" ||
            !lastName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Last name is required."
            });
        }

        const guardian = await guardianModel.createGuardian({
            schoolId,

            firstName: firstName.trim(),

            middleName:
                typeof middleName === "string" &&
                middleName.trim()
                    ? middleName.trim()
                    : null,

            lastName: lastName.trim(),

            relationship:
                relationship || null,

            phone:
                phone || null,

            alternativePhone:
                alternativePhone ||
                alternatePhone ||
                null,

            email:
                email || null,

            address:
                address || null,

            occupation:
                occupation || null,

            employer:
                employer || null,

            emergencyContact:
                Boolean(emergencyContact)
        });

        return res.status(201).json({
            success: true,
            message: "Guardian created successfully.",
            data: guardian
        });
    } catch (error) {
        console.error(
            "Create guardian error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ALL GUARDIANS
|--------------------------------------------------------------------------
| GET /api/guardians
|--------------------------------------------------------------------------
*/

async function getGuardians(req, res, next) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const searchTerm = String(
            req.query?.search ||
            req.query?.q ||
            ""
        ).trim();

        let guardians;

        if (searchTerm) {
            guardians =
                await guardianModel.searchGuardians(
                    searchTerm,
                    schoolId
                );
        } else {
            guardians =
                await guardianModel.findGuardians({
                    schoolId,
                    limit:
                        req.query?.limit || 100,
                    offset:
                        req.query?.offset || 0
                });
        }

        return res.status(200).json({
            success: true,
            count: guardians.length,
            data: guardians
        });
    } catch (error) {
        console.error(
            "Get guardians error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET GUARDIAN BY ID
|--------------------------------------------------------------------------
| GET /api/guardians/:id
|--------------------------------------------------------------------------
*/

async function getGuardianById(req, res, next) {
    try {
        const {
            id
        } = req.params;

        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Guardian ID is required."
            });
        }

        const guardian =
            await guardianModel.findGuardianById(
                id,
                schoolId
            );

        if (!guardian) {
            return res.status(404).json({
                success: false,
                message: "Guardian not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: guardian
        });
    } catch (error) {
        console.error(
            "Get guardian by ID error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET GUARDIANS BY STUDENT
|--------------------------------------------------------------------------
| GET /api/guardians/student/:studentId
|--------------------------------------------------------------------------
*/

async function getGuardiansByStudent(
    req,
    res,
    next
) {
    try {
        const {
            studentId
        } = req.params;

        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        const guardians =
            await guardianModel.getStudentGuardians(
                studentId,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: guardians.length,
            data: guardians
        });
    } catch (error) {
        console.error(
            "Get guardians by student error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| SEARCH GUARDIANS
|--------------------------------------------------------------------------
| GET /api/guardians/search?q=
|--------------------------------------------------------------------------
*/

async function searchGuardians(
    req,
    res,
    next
) {
    try {
        const searchTerm = String(
            req.query?.q ||
            req.query?.search ||
            ""
        ).trim();

        const schoolId = resolveSchoolId(req);

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

        const guardians =
            await guardianModel.searchGuardians(
                searchTerm,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: guardians.length,
            data: guardians
        });
    } catch (error) {
        console.error(
            "Search guardians error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| UPDATE GUARDIAN
|--------------------------------------------------------------------------
| PUT /api/guardians/:id
|--------------------------------------------------------------------------
*/

async function updateGuardian(req, res, next) {
    try {
        const {
            id
        } = req.params;

        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Guardian ID is required."
            });
        }

        const data = {
            firstName: req.body?.firstName,
            middleName: req.body?.middleName,
            lastName: req.body?.lastName,
            relationship: req.body?.relationship,
            phone: req.body?.phone,
            alternativePhone:
                req.body?.alternativePhone ??
                req.body?.alternatePhone,
            email: req.body?.email,
            address: req.body?.address,
            occupation: req.body?.occupation,
            employer: req.body?.employer,
            emergencyContact:
                req.body?.emergencyContact
        };

        const guardian =
            await guardianModel.updateGuardian(
                id,
                schoolId,
                data
            );

        if (!guardian) {
            return res.status(404).json({
                success: false,
                message: "Guardian not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Guardian updated successfully.",
            data: guardian
        });
    } catch (error) {
        console.error(
            "Update guardian error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| DELETE GUARDIAN
|--------------------------------------------------------------------------
| DELETE /api/guardians/:id
|--------------------------------------------------------------------------
*/

async function deleteGuardian(req, res, next) {
    try {
        const {
            id
        } = req.params;

        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Guardian ID is required."
            });
        }

        const guardian =
            await guardianModel.deleteGuardian(
                id,
                schoolId
            );

        if (!guardian) {
            return res.status(404).json({
                success: false,
                message: "Guardian not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Guardian deleted successfully.",
            data: guardian
        });
    } catch (error) {
        console.error(
            "Delete guardian error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| LINK GUARDIAN TO STUDENT
|--------------------------------------------------------------------------
|
| This controller function is available for future dedicated relationship
| routes. It is intentionally not required by the current guardianRoutes.js.
|
|--------------------------------------------------------------------------
*/

async function linkGuardianToStudent(
    req,
    res,
    next
) {
    try {
        const {
            studentId,
            guardianId,
            isPrimary
        } = req.body || {};

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        if (!guardianId) {
            return res.status(400).json({
                success: false,
                message: "Guardian ID is required."
            });
        }

        const relationship =
            await guardianModel.linkGuardianToStudent({
                studentId,
                guardianId,
                isPrimary: Boolean(isPrimary)
            });

        return res.status(201).json({
            success: true,
            message:
                "Guardian linked to student successfully.",
            data: relationship
        });
    } catch (error) {
        console.error(
            "Link guardian to student error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| UNLINK GUARDIAN FROM STUDENT
|--------------------------------------------------------------------------
|
| Available for future dedicated relationship routes.
|
|--------------------------------------------------------------------------
*/

async function unlinkGuardianFromStudent(
    req,
    res,
    next
) {
    try {
        const {
            studentId,
            guardianId
        } = req.body || {};

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        if (!guardianId) {
            return res.status(400).json({
                success: false,
                message: "Guardian ID is required."
            });
        }

        const relationship =
            await guardianModel.unlinkGuardianFromStudent(
                studentId,
                guardianId
            );

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message:
                    "Guardian-student relationship not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Guardian unlinked from student successfully.",
            data: relationship
        });
    } catch (error) {
        console.error(
            "Unlink guardian from student error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET GUARDIAN'S STUDENTS
|--------------------------------------------------------------------------
|
| Available for future dedicated relationship routes.
|
|--------------------------------------------------------------------------
*/

async function getGuardianStudents(
    req,
    res,
    next
) {
    try {
        const {
            guardianId
        } = req.params;

        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!guardianId) {
            return res.status(400).json({
                success: false,
                message: "Guardian ID is required."
            });
        }

        const students =
            await guardianModel.getGuardianStudents(
                guardianId,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error(
            "Get guardian students error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| SET PRIMARY GUARDIAN
|--------------------------------------------------------------------------
|
| Available for future dedicated relationship routes.
|
|--------------------------------------------------------------------------
*/

async function setPrimaryGuardian(
    req,
    res,
    next
) {
    try {
        const {
            studentId,
            guardianId
        } = req.body || {};

        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }

        if (!guardianId) {
            return res.status(400).json({
                success: false,
                message: "Guardian ID is required."
            });
        }

        const relationship =
            await guardianModel.setPrimaryGuardian(
                studentId,
                guardianId,
                schoolId
            );

        if (!relationship) {
            return res.status(404).json({
                success: false,
                message:
                    "Guardian-student relationship not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Primary guardian updated successfully.",
            data: relationship
        });
    } catch (error) {
        console.error(
            "Set primary guardian error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| COUNT GUARDIANS
|--------------------------------------------------------------------------
|
| Available for dashboard/statistics use.
|
|--------------------------------------------------------------------------
*/

async function countGuardians(
    req,
    res,
    next
) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });
        }

        const count =
            await guardianModel.countGuardians(
                schoolId
            );

        return res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error(
            "Count guardians error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
    createGuardian,
    getGuardians,
    getGuardianById,
    getGuardiansByStudent,
    searchGuardians,
    updateGuardian,
    deleteGuardian,
    linkGuardianToStudent,
    unlinkGuardianFromStudent,
    getGuardianStudents,
    setPrimaryGuardian,
    countGuardians
};