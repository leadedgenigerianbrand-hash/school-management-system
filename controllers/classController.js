const {
    createClass,
    findClassById,
    findClasses,
    updateClass,
    deleteClass,
    searchClasses
} = require("../models/classModel");


/*
|--------------------------------------------------------------------------
| CLASS CONTROLLER
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CREATE CLASS
|--------------------------------------------------------------------------
| POST /api/classes
|--------------------------------------------------------------------------
*/

async function create(req, res, next) {

    try {

        const schoolId =
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            className,
            classCode,
            levelId,
            description,
            status
        } = req.body;


        if (
            !className ||
            !String(className).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Class name is required."

            });

        }


        const newClass =
            await createClass({

                schoolId,

                className:
                    String(className).trim(),

                classCode:
                    classCode
                        ? String(classCode).trim()
                        : null,

                levelId:
                    levelId || null,

                description:
                    description || null,

                status:
                    status || "active"

            });


        return res.status(201).json({

            success: true,

            message:
                "Class created successfully.",

            data:
                newClass

        });

    } catch (error) {

        console.error(
            "Create class error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| GET CLASS BY ID
|--------------------------------------------------------------------------
| GET /api/classes/:id
|--------------------------------------------------------------------------
*/

async function getById(req, res, next) {

    try {

        const schoolId =
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const classId =
            req.params.id;


        const schoolClass =
            await findClassById(
                classId,
                schoolId
            );


        if (!schoolClass) {

            return res.status(404).json({

                success: false,

                message:
                    "Class not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                schoolClass

        });

    } catch (error) {

        console.error(
            "Get class by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| GET ALL CLASSES
|--------------------------------------------------------------------------
| GET /api/classes
|--------------------------------------------------------------------------
*/

async function getAll(req, res, next) {

    try {

        const schoolId =
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const levelId =
            req.query.levelId || null;


        const status =
            req.query.status || null;


        const limit =
            Math.min(
                Math.max(
                    Number(req.query.limit) || 100,
                    1
                ),
                500
            );


        const offset =
            Math.max(
                Number(req.query.offset) || 0,
                0
            );


        const classes =
            await findClasses({

                schoolId,

                levelId,

                status,

                limit,

                offset

            });


        return res.status(200).json({

            success: true,

            count:
                classes.length,

            data:
                classes

        });

    } catch (error) {

        console.error(
            "Get classes error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| UPDATE CLASS
|--------------------------------------------------------------------------
| PUT /api/classes/:id
|--------------------------------------------------------------------------
*/

async function update(req, res, next) {

    try {

        const schoolId =
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const classId =
            req.params.id;


        const {
            className,
            classCode,
            levelId,
            description,
            status
        } = req.body;


        const data = {};


        if (className !== undefined) {

            if (
                !className ||
                !String(className).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Class name cannot be empty."

                });

            }


            data.className =
                String(className).trim();

        }


        if (classCode !== undefined) {

            data.classCode =
                classCode
                    ? String(classCode).trim()
                    : null;

        }


        if (levelId !== undefined) {

            data.levelId =
                levelId || null;

        }


        if (description !== undefined) {

            data.description =
                description || null;

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


        const updatedClass =
            await updateClass(

                classId,

                schoolId,

                data

            );


        if (!updatedClass) {

            return res.status(404).json({

                success: false,

                message:
                    "Class not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Class updated successfully.",

            data:
                updatedClass

        });

    } catch (error) {

        console.error(
            "Update class error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| DELETE CLASS
|--------------------------------------------------------------------------
| DELETE /api/classes/:id
|--------------------------------------------------------------------------
*/

async function remove(req, res, next) {

    try {

        const schoolId =
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const classId =
            req.params.id;


        const deletedClass =
            await deleteClass(

                classId,

                schoolId

            );


        if (!deletedClass) {

            return res.status(404).json({

                success: false,

                message:
                    "Class not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Class deleted successfully.",

            data:
                deletedClass

        });

    } catch (error) {

        console.error(
            "Delete class error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| SEARCH CLASSES
|--------------------------------------------------------------------------
| GET /api/classes/search?q=
|--------------------------------------------------------------------------
*/

async function search(req, res, next) {

    try {

        const schoolId =
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

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


        const classes =
            await searchClasses(

                searchTerm,

                schoolId

            );


        return res.status(200).json({

            success: true,

            count:
                classes.length,

            data:
                classes

        });

    } catch (error) {

        console.error(
            "Search classes error:",
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