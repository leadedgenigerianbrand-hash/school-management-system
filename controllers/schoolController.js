"use strict";

const schoolModel = require("../models/schoolModel");


/*
|--------------------------------------------------------------------------
| SCHOOL CONTROLLER
|--------------------------------------------------------------------------
|
| Handles:
|
| - Get all schools
| - Get school by ID
| - Create school
| - Update school
| - Delete school
| - School statistics
| - School dashboard
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET ALL SCHOOLS
|--------------------------------------------------------------------------
|
| GET /api/schools
|
| Optional:
|
| ?status=Active
| ?state=Lagos
| ?schoolType=Secondary School
| ?search=Leadedge
| ?limit=100
| ?offset=0
|
|--------------------------------------------------------------------------
*/

async function getAllSchools(req, res, next) {

    try {

        const {
            status,
            state,
            schoolType,
            limit,
            offset,
            search
        } = req.query;


        let schools;


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if (
            search &&
            String(search).trim()
        ) {

            schools =
                await schoolModel.searchSchools(
                    String(search).trim()
                );

        } else {

            schools =
                await schoolModel.findSchools({

                    status:
                        status || null,

                    state:
                        state || null,

                    schoolType:
                        schoolType || null,

                    limit:
                        limit !== undefined
                            ? Number(limit)
                            : 100,

                    offset:
                        offset !== undefined
                            ? Number(offset)
                            : 0

                });

        }


        return res.status(200).json({

            success: true,

            count:
                schools.length,

            data:
                schools

        });

    } catch (error) {

        console.error(
            "Get all schools error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| GET SCHOOL BY ID
|--------------------------------------------------------------------------
*/

async function getSchoolById(req, res, next) {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const school =
            await schoolModel.findSchoolById(
                id
            );


        if (!school) {

            return res.status(404).json({

                success: false,

                message:
                    "School not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                school

        });

    } catch (error) {

        console.error(
            "Get school by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| CREATE SCHOOL
|--------------------------------------------------------------------------
*/

async function createSchool(req, res, next) {

    try {

        const school =
            await schoolModel.createSchool(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "School created successfully.",

            data:
                school

        });

    } catch (error) {

        console.error(
            "Create school error:",
            error
        );


        /*
        |--------------------------------------------------------------------------
        | DUPLICATE SCHOOL CODE
        |--------------------------------------------------------------------------
        */

        if (error.code === "23505") {

            return res.status(409).json({

                success: false,

                message:
                    "School code already exists."

            });

        }


        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| UPDATE SCHOOL
|--------------------------------------------------------------------------
*/

async function updateSchool(req, res, next) {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const school =
            await schoolModel.updateSchool(

                id,

                req.body

            );


        if (!school) {

            return res.status(404).json({

                success: false,

                message:
                    "School not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "School updated successfully.",

            data:
                school

        });

    } catch (error) {

        console.error(
            "Update school error:",
            error
        );


        if (error.code === "23505") {

            return res.status(409).json({

                success: false,

                message:
                    "School code already exists."

            });

        }


        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| DELETE SCHOOL
|--------------------------------------------------------------------------
*/

async function deleteSchool(req, res, next) {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const school =
            await schoolModel.deleteSchool(
                id
            );


        if (!school) {

            return res.status(404).json({

                success: false,

                message:
                    "School not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "School deleted successfully.",

            data:
                school

        });

    } catch (error) {

        console.error(
            "Delete school error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| SCHOOL STATISTICS
|--------------------------------------------------------------------------
*/

async function getSchoolStatistics(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const school =
            await schoolModel.findSchoolById(
                id
            );


        if (!school) {

            return res.status(404).json({

                success: false,

                message:
                    "School not found."

            });

        }


        const statistics =
            await schoolModel.getSchoolStatistics(
                id
            );


        return res.status(200).json({

            success: true,

            data:
                statistics

        });

    } catch (error) {

        console.error(
            "Get school statistics error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| SCHOOL DASHBOARD
|--------------------------------------------------------------------------
*/

async function getSchoolDashboard(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const school =
            await schoolModel.findSchoolById(
                id
            );


        if (!school) {

            return res.status(404).json({

                success: false,

                message:
                    "School not found."

            });

        }


        const dashboard =
            await schoolModel.getSchoolDashboard(
                id
            );


        return res.status(200).json({

            success: true,

            data:
                dashboard

        });

    } catch (error) {

        console.error(
            "Get school dashboard error:",
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

    getAllSchools,

    getSchoolById,

    createSchool,

    updateSchool,

    deleteSchool,

    getSchoolStatistics,

    getSchoolDashboard

};