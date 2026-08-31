const {
    createDepartment,
    findDepartmentById,
    findDepartments,
    updateDepartment,
    deleteDepartment,
    searchDepartments
} = require("../models/departmentModel");


/*
|--------------------------------------------------------------------------
| Department Controller
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Department
|--------------------------------------------------------------------------
| POST /api/departments
|--------------------------------------------------------------------------
*/

async function create(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;

        const {
            departmentName,
            departmentCode,
            description,
            headOfDepartment,
            status
        } = req.body;


        if (
            !departmentName ||
            !departmentName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Department name is required."

            });

        }


        const department =
            await createDepartment({

                schoolId,

                departmentName:
                    departmentName.trim(),

                departmentCode:
                    departmentCode
                        ? departmentCode.trim()
                        : null,

                description:
                    description || null,

                headOfDepartment:
                    headOfDepartment || null,

                status:
                    status || "active"

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
|--------------------------------------------------------------------------
| Get Department By ID
|--------------------------------------------------------------------------
| GET /api/departments/:id
|--------------------------------------------------------------------------
*/

async function getById(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;

        const departmentId =
            req.params.id;


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
|--------------------------------------------------------------------------
| Get Departments
|--------------------------------------------------------------------------
| GET /api/departments
|--------------------------------------------------------------------------
*/

async function getAll(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;


        const {

            status = null,

            limit = 100,

            offset = 0

        } = req.query;


        const departments =
            await findDepartments({

                schoolId,

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
|--------------------------------------------------------------------------
| Update Department
|--------------------------------------------------------------------------
| PUT /api/departments/:id
|--------------------------------------------------------------------------
*/

async function update(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;

        const departmentId =
            req.params.id;


        const {

            departmentName,

            departmentCode,

            description,

            headOfDepartment,

            status

        } = req.body;


        const data = {};


        if (
            departmentName !== undefined
        ) {

            if (
                !departmentName ||
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


        if (
            departmentCode !== undefined
        ) {

            data.departmentCode =
                departmentCode
                    ? departmentCode.trim()
                    : null;

        }


        if (
            description !== undefined
        ) {

            data.description =
                description || null;

        }


        if (
            headOfDepartment !== undefined
        ) {

            data.headOfDepartment =
                headOfDepartment || null;

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
|--------------------------------------------------------------------------
| Delete Department
|--------------------------------------------------------------------------
| DELETE /api/departments/:id
|--------------------------------------------------------------------------
*/

async function remove(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;

        const departmentId =
            req.params.id;


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
|--------------------------------------------------------------------------
| Search Departments
|--------------------------------------------------------------------------
| GET /api/departments/search?q=...
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