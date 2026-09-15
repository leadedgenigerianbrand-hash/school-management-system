"use strict";

const {
    createClassArm,
    findClassArmById,
    findClassArms,
    updateClassArm,
    deleteClassArm,
    searchClassArms
} = require("../models/classArmModel");


/*
|--------------------------------------------------------------------------
| CLASS ARM CONTROLLER
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET SCHOOL ID
|--------------------------------------------------------------------------
*/

function getSchoolId(req) {

    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.school?.id ||
        req.schoolId ||
        null
    );

}


/*
|--------------------------------------------------------------------------
| CREATE CLASS ARM
|--------------------------------------------------------------------------
| POST /api/class-arms
|--------------------------------------------------------------------------
*/

async function create(req, res, next) {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(401).json({

                success: false,

                message:
                    "School information is missing from the authenticated user."

            });

        }


        const {
            classId,
            armName,
            armCode,
            description,
            isActive,
            status
        } = req.body;


        if (!classId) {

            return res.status(400).json({

                success: false,

                message:
                    "Class ID is required."

            });

        }


        if (
            !armName ||
            !String(armName).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Arm name is required."

            });

        }


        let activeValue = true;


        if (isActive !== undefined) {

            activeValue =
                isActive;

        } else if (status !== undefined) {

            if (
                typeof status === "boolean"
            ) {

                activeValue =
                    status;

            } else {

                const normalizedStatus =
                    String(status)
                        .trim()
                        .toLowerCase();

                activeValue =
                    normalizedStatus === "active" ||
                    normalizedStatus === "true" ||
                    normalizedStatus === "1";

            }

        }


        const classArm =
            await createClassArm({

                schoolId,

                classId,

                armName:
                    String(armName).trim(),

                armCode:
                    armCode !== undefined &&
                    armCode !== null &&
                    String(armCode).trim()
                        ? String(armCode).trim()
                        : null,

                description:
                    description !== undefined &&
                    description !== null &&
                    String(description).trim()
                        ? String(description).trim()
                        : null,

                isActive:
                    activeValue

            });


        return res.status(201).json({

            success: true,

            message:
                "Class arm created successfully.",

            data:
                classArm

        });

    } catch (error) {

        console.error(
            "Create class arm error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| GET CLASS ARM BY ID
|--------------------------------------------------------------------------
| GET /api/class-arms/:id
|--------------------------------------------------------------------------
*/

async function getById(req, res, next) {

    try {

        const schoolId =
            getSchoolId(req);

        const classArmId =
            req.params.id;


        if (!schoolId) {

            return res.status(401).json({

                success: false,

                message:
                    "School information is missing from the authenticated user."

            });

        }


        if (!classArmId) {

            return res.status(400).json({

                success: false,

                message:
                    "Class arm ID is required."

            });

        }


        const classArm =
            await findClassArmById(
                classArmId,
                schoolId
            );


        if (!classArm) {

            return res.status(404).json({

                success: false,

                message:
                    "Class arm not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                classArm

        });

    } catch (error) {

        console.error(
            "Get class arm error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| GET ALL CLASS ARMS
|--------------------------------------------------------------------------
| GET /api/class-arms
|--------------------------------------------------------------------------
*/

async function getAll(req, res, next) {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(401).json({

                success: false,

                message:
                    "School information is missing from the authenticated user."

            });

        }


        const classId =
            req.query.classId || null;

        const status =
            req.query.status || null;


        const requestedLimit =
            Number(req.query.limit);

        const requestedOffset =
            Number(req.query.offset);


        const safeLimit =
            Number.isFinite(requestedLimit)
                ? Math.min(
                    Math.max(
                        Math.floor(requestedLimit),
                        1
                    ),
                    500
                )
                : 100;


        const safeOffset =
            Number.isFinite(requestedOffset)
                ? Math.max(
                    Math.floor(requestedOffset),
                    0
                )
                : 0;


        const classArms =
            await findClassArms({

                schoolId,

                classId,

                status,

                limit:
                    safeLimit,

                offset:
                    safeOffset

            });


        return res.status(200).json({

            success: true,

            count:
                classArms.length,

            data:
                classArms

        });

    } catch (error) {

        console.error(
            "Get class arms error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| UPDATE CLASS ARM
|--------------------------------------------------------------------------
| PUT /api/class-arms/:id
|--------------------------------------------------------------------------
*/

async function update(req, res, next) {

    try {

        const schoolId =
            getSchoolId(req);

        const classArmId =
            req.params.id;


        if (!schoolId) {

            return res.status(401).json({

                success: false,

                message:
                    "School information is missing from the authenticated user."

            });

        }


        if (!classArmId) {

            return res.status(400).json({

                success: false,

                message:
                    "Class arm ID is required."

            });

        }


        const {
            classId,
            armName,
            armCode,
            description,
            isActive,
            status
        } = req.body;


        const data = {};


        if (classId !== undefined) {

            if (!classId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Class ID cannot be empty."

                });

            }


            data.classId =
                classId;

        }


        if (armName !== undefined) {

            if (
                !armName ||
                !String(armName).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Arm name cannot be empty."

                });

            }


            data.armName =
                String(armName).trim();

        }


        if (armCode !== undefined) {

            data.armCode =
                armCode !== null &&
                String(armCode).trim()
                    ? String(armCode).trim()
                    : null;

        }


        if (description !== undefined) {

            data.description =
                description !== null &&
                String(description).trim()
                    ? String(description).trim()
                    : null;

        }


        if (isActive !== undefined) {

            data.isActive =
                isActive;

        } else if (status !== undefined) {

            if (
                typeof status === "boolean"
            ) {

                data.isActive =
                    status;

            } else {

                const normalizedStatus =
                    String(status)
                        .trim()
                        .toLowerCase();

                if (
                    normalizedStatus === "active" ||
                    normalizedStatus === "true" ||
                    normalizedStatus === "1"
                ) {

                    data.isActive =
                        true;

                } else if (
                    normalizedStatus === "inactive" ||
                    normalizedStatus === "false" ||
                    normalizedStatus === "0"
                ) {

                    data.isActive =
                        false;

                } else {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid status value."

                    });

                }

            }

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


        const updatedClassArm =
            await updateClassArm(
                classArmId,
                schoolId,
                data
            );


        if (!updatedClassArm) {

            return res.status(404).json({

                success: false,

                message:
                    "Class arm not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Class arm updated successfully.",

            data:
                updatedClassArm

        });

    } catch (error) {

        console.error(
            "Update class arm error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| DELETE CLASS ARM
|--------------------------------------------------------------------------
| DELETE /api/class-arms/:id
|--------------------------------------------------------------------------
*/

async function remove(req, res, next) {

    try {

        const schoolId =
            getSchoolId(req);

        const classArmId =
            req.params.id;


        if (!schoolId) {

            return res.status(401).json({

                success: false,

                message:
                    "School information is missing from the authenticated user."

            });

        }


        if (!classArmId) {

            return res.status(400).json({

                success: false,

                message:
                    "Class arm ID is required."

            });

        }


        const deletedClassArm =
            await deleteClassArm(
                classArmId,
                schoolId
            );


        if (!deletedClassArm) {

            return res.status(404).json({

                success: false,

                message:
                    "Class arm not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Class arm deleted successfully.",

            data:
                deletedClassArm

        });

    } catch (error) {

        console.error(
            "Delete class arm error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| SEARCH CLASS ARMS
|--------------------------------------------------------------------------
| GET /api/class-arms/search?q=
|--------------------------------------------------------------------------
*/

async function search(req, res, next) {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(401).json({

                success: false,

                message:
                    "School information is missing from the authenticated user."

            });

        }


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


        const classArms =
            await searchClassArms(
                searchTerm,
                schoolId
            );


        return res.status(200).json({

            success: true,

            count:
                classArms.length,

            data:
                classArms

        });

    } catch (error) {

        console.error(
            "Search class arms error:",
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

    create,

    getById,

    getAll,

    update,

    remove,

    search

};