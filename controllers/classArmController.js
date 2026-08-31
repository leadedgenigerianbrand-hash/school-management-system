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
| Class Arm Controller
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Class Arm
|--------------------------------------------------------------------------
| POST /api/class-arms
|--------------------------------------------------------------------------
*/

async function create(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;

        const {
            classId,
            armName,
            armCode,
            capacity,
            classTeacherId,
            status
        } = req.body;


        if (!classId) {

            return res.status(400).json({

                success: false,

                message:
                    "Class ID is required."

            });

        }


        if (!armName || !armName.trim()) {

            return res.status(400).json({

                success: false,

                message:
                    "Arm name is required."

            });

        }


        const classArm =
            await createClassArm({

                schoolId,

                classId,

                armName:
                    armName.trim(),

                armCode:
                    armCode
                        ? armCode.trim()
                        : null,

                capacity:
                    capacity !== undefined &&
                    capacity !== null &&
                    capacity !== ""
                        ? Number(capacity)
                        : null,

                classTeacherId:
                    classTeacherId || null,

                status:
                    status || "active"

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
| Get Class Arm By ID
|--------------------------------------------------------------------------
| GET /api/class-arms/:id
|--------------------------------------------------------------------------
*/

async function getById(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;

        const classArmId =
            req.params.id;


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
| Get Class Arms
|--------------------------------------------------------------------------
| GET /api/class-arms
|--------------------------------------------------------------------------
*/

async function getAll(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;


        const {

            classId = null,

            status = null,

            limit = 100,

            offset = 0

        } = req.query;


        const classArms =
            await findClassArms({

                schoolId,

                classId,

                status,

                limit:
                    Math.min(
                        Number(limit) || 100,
                        500
                    ),

                offset:
                    Math.max(
                        Number(offset) || 0,
                        0
                    )

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
| Update Class Arm
|--------------------------------------------------------------------------
| PUT /api/class-arms/:id
|--------------------------------------------------------------------------
*/

async function update(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;

        const classArmId =
            req.params.id;


        const {

            classId,

            armName,

            armCode,

            capacity,

            classTeacherId,

            status

        } = req.body;


        const data = {};


        if (classId !== undefined) {

            data.classId =
                classId || null;

        }


        if (armName !== undefined) {

            if (
                !armName ||
                !armName.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Arm name cannot be empty."

                });

            }


            data.armName =
                armName.trim();

        }


        if (armCode !== undefined) {

            data.armCode =
                armCode
                    ? armCode.trim()
                    : null;

        }


        if (capacity !== undefined) {

            data.capacity =
                capacity === null ||
                capacity === ""
                    ? null
                    : Number(capacity);

        }


        if (classTeacherId !== undefined) {

            data.classTeacherId =
                classTeacherId || null;

        }


        if (status !== undefined) {

            data.status =
                status;

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
| Delete Class Arm
|--------------------------------------------------------------------------
| DELETE /api/class-arms/:id
|--------------------------------------------------------------------------
*/

async function remove(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;

        const classArmId =
            req.params.id;


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
| Search Class Arms
|--------------------------------------------------------------------------
| GET /api/class-arms/search?q=...
|--------------------------------------------------------------------------
*/

async function search(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;

        const searchTerm =
            (req.query.q || "").trim();


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
| Export
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