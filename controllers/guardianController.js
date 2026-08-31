const guardianModel = require("../models/guardianModel");


/*
|--------------------------------------------------------------------------
| GUARDIAN CONTROLLER
|--------------------------------------------------------------------------
|
| Handles:
|
| - Create guardian
| - Get all guardians
| - Get guardian by ID
| - Get guardians by student
| - Search guardians
| - Update guardian
| - Delete guardian
|
|--------------------------------------------------------------------------
*/


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
            schoolId,
            firstName,
            lastName,
            middleName,
            relationship,
            phone,
            alternatePhone,
            email,
            address,
            occupation,
            employer,
            studentId
        } = req.body;


        const finalSchoolId =
            schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;


        if (!finalSchoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (
            !firstName ||
            !String(firstName).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "First name is required."

            });

        }


        if (
            !lastName ||
            !String(lastName).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Last name is required."

            });

        }


        const guardian =
            await guardianModel.createGuardian({

                schoolId:
                    finalSchoolId,

                firstName:
                    String(firstName).trim(),

                lastName:
                    String(lastName).trim(),

                middleName:
                    middleName
                        ? String(middleName).trim()
                        : null,

                relationship:
                    relationship || null,

                phone:
                    phone || null,

                alternatePhone:
                    alternatePhone || null,

                email:
                    email || null,

                address:
                    address || null,

                occupation:
                    occupation || null,

                employer:
                    employer || null,

                studentId:
                    studentId || null

            });


        return res.status(201).json({

            success: true,

            message:
                "Guardian created successfully.",

            data:
                guardian

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

        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const guardians =
            await guardianModel.findGuardians({

                schoolId,

                search:
                    req.query.search ||
                    req.query.q ||
                    null

            });


        return res.status(200).json({

            success: true,

            count:
                guardians.length,

            data:
                guardians

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


        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;


        const guardian =
            await guardianModel.findGuardianById(

                id,

                schoolId || null

            );


        if (!guardian) {

            return res.status(404).json({

                success: false,

                message:
                    "Guardian not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                guardian

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

async function getGuardiansByStudent(req, res, next) {

    try {

        const {
            studentId
        } = req.params;


        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;


        if (!studentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID is required."

            });

        }


        const guardians =
            await guardianModel.findGuardiansByStudent(

                studentId,

                schoolId || null

            );


        return res.status(200).json({

            success: true,

            count:
                guardians.length,

            data:
                guardians

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

async function searchGuardians(req, res, next) {

    try {

        const searchTerm =
            String(
                req.query.q ||
                req.query.search ||
                ""
            ).trim();


        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!searchTerm) {

            return res.status(400).json({

                success: false,

                message:
                    "Search term is required."

            });

        }


        const guardians =
            await guardianModel.searchGuardians(

                searchTerm,

                schoolId

            );


        return res.status(200).json({

            success: true,

            count:
                guardians.length,

            data:
                guardians

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


        const schoolId =
            req.body.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const existing =
            await guardianModel.findGuardianById(

                id,

                schoolId

            );


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Guardian not found."

            });

        }


        const data = {

            firstName:
                req.body.firstName,

            lastName:
                req.body.lastName,

            middleName:
                req.body.middleName,

            relationship:
                req.body.relationship,

            phone:
                req.body.phone,

            alternatePhone:
                req.body.alternatePhone,

            email:
                req.body.email,

            address:
                req.body.address,

            occupation:
                req.body.occupation,

            employer:
                req.body.employer,

            studentId:
                req.body.studentId

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

                message:
                    "Guardian not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Guardian updated successfully.",

            data:
                guardian

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


        const schoolId =
            req.query.schoolId ||
            req.body.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

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

                message:
                    "Guardian not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Guardian deleted successfully.",

            data:
                guardian

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
| EXPORT CONTROLLER FUNCTIONS
|--------------------------------------------------------------------------
*/

module.exports = {

    createGuardian,

    getGuardians,

    getGuardianById,

    getGuardiansByStudent,

    searchGuardians,

    updateGuardian,

    deleteGuardian

};