const subjectModel = require("../models/subjectModel");


/*
|--------------------------------------------------------------------------
| Subject Controller
|--------------------------------------------------------------------------
|
| Handles:
|
| - Create subject
| - Get all subjects
| - Get subject by ID
| - Get subject by code
| - Search subjects
| - Update subject
| - Delete subject
| - Assign subject to class
| - Get subjects for class
| - Remove subject from class
| - Get subject statistics
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Get School ID
|--------------------------------------------------------------------------
|
| The authenticated user should contain school information.
|
| This helper supports the common properties used by the project.
|
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
| Create Subject
|--------------------------------------------------------------------------
|
| POST /api/subjects
|
|--------------------------------------------------------------------------
*/

async function createSubject(req, res, next) {

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
            subjectName,
            subjectCode,
            description,
            departmentId,
            status
        } = req.body;


        if (
            !subjectName ||
            !String(subjectName).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Subject name is required."

            });

        }


        if (subjectCode) {

            const codeExists =
                await subjectModel.subjectCodeExists(
                    String(subjectCode).trim(),
                    schoolId
                );


            if (codeExists) {

                return res.status(409).json({

                    success: false,

                    message:
                        "A subject with this code already exists."

                });

            }

        }


        const subject =
            await subjectModel.createSubject({

                schoolId,

                subjectName:
                    String(subjectName).trim(),

                subjectCode:
                    subjectCode
                        ? String(subjectCode).trim()
                        : null,

                description:
                    description || null,

                departmentId:
                    departmentId || null,

                status:
                    status || "active"

            });


        return res.status(201).json({

            success: true,

            message:
                "Subject created successfully.",

            data:
                subject

        });

    } catch (error) {

        console.error(
            "Create subject error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get All Subjects
|--------------------------------------------------------------------------
|
| GET /api/subjects
|
|--------------------------------------------------------------------------
*/

async function getSubjects(req, res, next) {

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
            departmentId,
            status
        } = req.query;


        const subjects =
            await subjectModel.findSubjects({

                schoolId,

                departmentId:
                    departmentId || null,

                status:
                    status || null

            });


        return res.status(200).json({

            success: true,

            count:
                subjects.length,

            data:
                subjects

        });

    } catch (error) {

        console.error(
            "Get subjects error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Subject By ID
|--------------------------------------------------------------------------
|
| GET /api/subjects/:id
|
|--------------------------------------------------------------------------
*/

async function getSubjectById(req, res, next) {

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


        const subject =
            await subjectModel.findSubjectById(
                id,
                schoolId
            );


        if (!subject) {

            return res.status(404).json({

                success: false,

                message:
                    "Subject not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                subject

        });

    } catch (error) {

        console.error(
            "Get subject by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Subject By Code
|--------------------------------------------------------------------------
|
| GET /api/subjects/code/:code
|
|--------------------------------------------------------------------------
*/

async function getSubjectByCode(req, res, next) {

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
            code
        } = req.params;


        if (!code) {

            return res.status(400).json({

                success: false,

                message:
                    "Subject code is required."

            });

        }


        const subject =
            await subjectModel.findSubjectByCode(
                code,
                schoolId
            );


        if (!subject) {

            return res.status(404).json({

                success: false,

                message:
                    "Subject not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                subject

        });

    } catch (error) {

        console.error(
            "Get subject by code error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Search Subjects
|--------------------------------------------------------------------------
|
| GET /api/subjects/search?q=
|
|--------------------------------------------------------------------------
*/

async function searchSubjects(req, res, next) {

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


        const subjects =
            await subjectModel.searchSubjects(
                searchTerm,
                schoolId
            );


        return res.status(200).json({

            success: true,

            count:
                subjects.length,

            data:
                subjects

        });

    } catch (error) {

        console.error(
            "Search subjects error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Update Subject
|--------------------------------------------------------------------------
|
| PUT /api/subjects/:id
|
|--------------------------------------------------------------------------
*/

async function updateSubject(req, res, next) {

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
            await subjectModel.findSubjectById(
                id,
                schoolId
            );


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Subject not found."

            });

        }


        const {
            subjectName,
            subjectCode,
            description,
            departmentId,
            status
        } = req.body;


        const updateData = {};


        if (subjectName !== undefined) {

            if (
                !String(subjectName).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Subject name cannot be empty."

                });

            }


            updateData.subjectName =
                String(subjectName).trim();

        }


        if (subjectCode !== undefined) {

            const trimmedCode =
                subjectCode
                    ? String(subjectCode).trim()
                    : null;


            if (trimmedCode) {

                const codeExists =
                    await subjectModel.subjectCodeExists(
                        trimmedCode,
                        schoolId
                    );


                const currentCode =
                    existing.subject_code;


                if (
                    codeExists &&
                    String(currentCode || "").toLowerCase() !==
                    trimmedCode.toLowerCase()
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "A subject with this code already exists."

                    });

                }

            }


            updateData.subjectCode =
                trimmedCode;

        }


        if (description !== undefined) {

            updateData.description =
                description || null;

        }


        if (departmentId !== undefined) {

            updateData.departmentId =
                departmentId || null;

        }


        if (status !== undefined) {

            updateData.status =
                status;

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


        const subject =
            await subjectModel.updateSubject(

                id,

                schoolId,

                updateData

            );


        if (!subject) {

            return res.status(404).json({

                success: false,

                message:
                    "Subject not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Subject updated successfully.",

            data:
                subject

        });

    } catch (error) {

        console.error(
            "Update subject error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Delete Subject
|--------------------------------------------------------------------------
|
| DELETE /api/subjects/:id
|
|--------------------------------------------------------------------------
*/

async function deleteSubject(req, res, next) {

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


        const subject =
            await subjectModel.deleteSubject(
                id,
                schoolId
            );


        if (!subject) {

            return res.status(404).json({

                success: false,

                message:
                    "Subject not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Subject deleted successfully.",

            data:
                subject

        });

    } catch (error) {

        console.error(
            "Delete subject error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Assign Subject To Class
|--------------------------------------------------------------------------
|
| POST /api/subjects/class/:classId
|
|--------------------------------------------------------------------------
*/

async function assignSubjectToClass(req, res, next) {

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
            subjectId,
            teacherId,
            periodsPerWeek,
            status
        } = req.body;


        if (!classId) {

            return res.status(400).json({

                success: false,

                message:
                    "Class ID is required."

            });

        }


        if (!subjectId) {

            return res.status(400).json({

                success: false,

                message:
                    "Subject ID is required."

            });

        }


        const subject =
            await subjectModel.findSubjectById(
                subjectId,
                schoolId
            );


        if (!subject) {

            return res.status(404).json({

                success: false,

                message:
                    "Subject not found."

            });

        }


        const classSubject =
            await subjectModel.assignSubjectToClass({

                schoolId,

                classId,

                subjectId,

                teacherId:
                    teacherId || null,

                periodsPerWeek:
                    periodsPerWeek || null,

                status:
                    status || "active"

            });


        return res.status(201).json({

            success: true,

            message:
                "Subject assigned to class successfully.",

            data:
                classSubject

        });

    } catch (error) {

        console.error(
            "Assign subject to class error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Subjects For Class
|--------------------------------------------------------------------------
|
| GET /api/subjects/class/:classId
|
|--------------------------------------------------------------------------
*/

async function getSubjectsForClass(req, res, next) {

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


        const subjects =
            await subjectModel.getSubjectsForClass(
                classId,
                schoolId
            );


        return res.status(200).json({

            success: true,

            count:
                subjects.length,

            data:
                subjects

        });

    } catch (error) {

        console.error(
            "Get subjects for class error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Remove Subject From Class
|--------------------------------------------------------------------------
|
| DELETE /api/subjects/class/:classSubjectId
|
|--------------------------------------------------------------------------
*/

async function removeSubjectFromClass(req, res, next) {

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
            classSubjectId
        } = req.params;


        const classSubject =
            await subjectModel.removeSubjectFromClass(
                classSubjectId,
                schoolId
            );


        if (!classSubject) {

            return res.status(404).json({

                success: false,

                message:
                    "Class subject assignment not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Subject removed from class successfully.",

            data:
                classSubject

        });

    } catch (error) {

        console.error(
            "Remove subject from class error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Subject Statistics
|--------------------------------------------------------------------------
|
| GET /api/subjects/statistics
|
|--------------------------------------------------------------------------
*/

async function getSubjectStatistics(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const statistics =
            await subjectModel.getSubjectStatistics(
                schoolId
            );


        return res.status(200).json({

            success: true,

            data:
                statistics

        });

    } catch (error) {

        console.error(
            "Get subject statistics error:",
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

    createSubject,

    getSubjects,

    getSubjectById,

    getSubjectByCode,

    searchSubjects,

    updateSubject,

    deleteSubject,

    assignSubjectToClass,

    getSubjectsForClass,

    removeSubjectFromClass,

    getSubjectStatistics

};