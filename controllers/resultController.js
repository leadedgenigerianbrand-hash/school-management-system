const resultModel = require("../models/resultModel");


/*
|--------------------------------------------------------------------------
| Result Controller
|--------------------------------------------------------------------------
|
| Handles:
|
| - Create result
| - Get result by ID
| - Get student results
| - Get class results
| - Get results by subject
| - Update result
| - Delete result
| - Approve result
| - Search results
| - Result statistics
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Get School ID
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
| Create Result
|--------------------------------------------------------------------------
|
| POST /api/results
|
|--------------------------------------------------------------------------
*/

async function createResult(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            studentId,
            sessionId,
            termId,
            subjectId,
            classId,
            caScore,
            examScore,
            totalScore,
            grade,
            remark
        } = req.body;


        if (!studentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID is required."

            });

        }


        if (!sessionId) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        if (!termId) {

            return res.status(400).json({

                success: false,

                message:
                    "Term ID is required."

            });

        }


        if (!subjectId) {

            return res.status(400).json({

                success: false,

                message:
                    "Subject ID is required."

            });

        }


        const result =
            await resultModel.createResult({

                schoolId,

                studentId,

                sessionId,

                termId,

                subjectId,

                classId:
                    classId || null,

                caScore:
                    caScore ?? 0,

                examScore:
                    examScore ?? 0,

                totalScore:
                    totalScore ?? null,

                grade:
                    grade || null,

                remark:
                    remark || null

            });


        return res.status(201).json({

            success: true,

            message:
                "Result created successfully.",

            data:
                result

        });

    } catch (error) {

        console.error(
            "Create result error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Result By ID
|--------------------------------------------------------------------------
|
| GET /api/results/:id
|
|--------------------------------------------------------------------------
*/

async function getResultById(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            id
        } = req.params;


        const result =
            await resultModel.findResultById(
                id,
                schoolId
            );


        if (!result) {

            return res.status(404).json({

                success: false,

                message:
                    "Result not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                result

        });

    } catch (error) {

        console.error(
            "Get result by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Student Results
|--------------------------------------------------------------------------
|
| GET /api/results/student/:studentId
|
|--------------------------------------------------------------------------
*/

async function getStudentResults(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            studentId
        } = req.params;


        const {
            sessionId,
            termId,
            subjectId
        } = req.query;


        const results =
            await resultModel.findStudentResults({

                studentId,

                schoolId,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                subjectId:
                    subjectId || null

            });


        return res.status(200).json({

            success: true,

            count:
                results.length,

            data:
                results

        });

    } catch (error) {

        console.error(
            "Get student results error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Class Results
|--------------------------------------------------------------------------
|
| GET /api/results/class/:classId
|
|--------------------------------------------------------------------------
*/

async function getClassResults(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            classId
        } = req.params;


        const {
            sessionId,
            termId,
            subjectId
        } = req.query;


        const results =
            await resultModel.findClassResults({

                classId,

                schoolId,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                subjectId:
                    subjectId || null

            });


        return res.status(200).json({

            success: true,

            count:
                results.length,

            data:
                results

        });

    } catch (error) {

        console.error(
            "Get class results error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Subject Results
|--------------------------------------------------------------------------
|
| GET /api/results/subject/:subjectId
|
|--------------------------------------------------------------------------
*/

async function getSubjectResults(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            subjectId
        } = req.params;


        const {
            sessionId,
            termId,
            classId
        } = req.query;


        const results =
            await resultModel.findSubjectResults({

                subjectId,

                schoolId,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                classId:
                    classId || null

            });


        return res.status(200).json({

            success: true,

            count:
                results.length,

            data:
                results

        });

    } catch (error) {

        console.error(
            "Get subject results error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Update Result
|--------------------------------------------------------------------------
|
| PUT /api/results/:id
|
|--------------------------------------------------------------------------
*/

async function updateResult(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            id
        } = req.params;


        const existing =
            await resultModel.findResultById(
                id,
                schoolId
            );


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Result not found."

            });

        }


        const allowedFields = [

            "studentId",

            "sessionId",

            "termId",

            "subjectId",

            "classId",

            "caScore",

            "examScore",

            "totalScore",

            "grade",

            "remark",

            "status"

        ];


        const updateData = {};


        for (
            const field of allowedFields
        ) {

            if (
                req.body[field] !== undefined
            ) {

                updateData[field] =
                    req.body[field];

            }

        }


        if (
            Object.keys(updateData).length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "No valid fields supplied for update."

            });

        }


        const result =
            await resultModel.updateResult(

                id,

                schoolId,

                updateData

            );


        if (!result) {

            return res.status(404).json({

                success: false,

                message:
                    "Result not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Result updated successfully.",

            data:
                result

        });

    } catch (error) {

        console.error(
            "Update result error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Delete Result
|--------------------------------------------------------------------------
|
| DELETE /api/results/:id
|
|--------------------------------------------------------------------------
*/

async function deleteResult(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            id
        } = req.params;


        const result =
            await resultModel.deleteResult(
                id,
                schoolId
            );


        if (!result) {

            return res.status(404).json({

                success: false,

                message:
                    "Result not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Result deleted successfully.",

            data:
                result

        });

    } catch (error) {

        console.error(
            "Delete result error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Approve Result
|--------------------------------------------------------------------------
|
| PATCH /api/results/:id/approve
|
|--------------------------------------------------------------------------
*/

async function approveResult(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            id
        } = req.params;


        const result =
            await resultModel.approveResult(
                id,
                schoolId
            );


        if (!result) {

            return res.status(404).json({

                success: false,

                message:
                    "Result not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Result approved successfully.",

            data:
                result

        });

    } catch (error) {

        console.error(
            "Approve result error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Search Results
|--------------------------------------------------------------------------
|
| GET /api/results/search?q=
|
|--------------------------------------------------------------------------
*/

async function searchResults(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

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


        const results =
            await resultModel.searchResults(

                searchTerm,

                schoolId

            );


        return res.status(200).json({

            success: true,

            count:
                results.length,

            data:
                results

        });

    } catch (error) {

        console.error(
            "Search results error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Result Statistics
|--------------------------------------------------------------------------
|
| GET /api/results/statistics
|
|--------------------------------------------------------------------------
*/

async function getResultStatistics(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            sessionId,
            termId,
            classId
        } = req.query;


        const statistics =
            await resultModel.getResultStatistics({

                schoolId,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                classId:
                    classId || null

            });


        return res.status(200).json({

            success: true,

            data:
                statistics

        });

    } catch (error) {

        console.error(
            "Get result statistics error:",
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

    createResult,

    getResultById,

    getStudentResults,

    getClassResults,

    getSubjectResults,

    updateResult,

    deleteResult,

    approveResult,

    searchResults,

    getResultStatistics

};