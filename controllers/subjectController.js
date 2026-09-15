"use strict";

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
*/

function getSchoolId(req) {
    const schoolId =
        req.user?.schoolId ||
        req.user?.school_id ||
        req.school?.id ||
        req.schoolId ||
        null;

    if (!schoolId) {
        throw new Error(
            "Authenticated user's school ID is missing."
        );
    }

    return schoolId;
}

/*
|--------------------------------------------------------------------------
| Normalize Boolean
|--------------------------------------------------------------------------
*/

function normalizeBoolean(
    value,
    defaultValue = true
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    const normalized =
        String(value)
            .trim()
            .toLowerCase();

    if (
        normalized === "true" ||
        normalized === "1" ||
        normalized === "yes" ||
        normalized === "active" ||
        normalized === "compulsory"
    ) {
        return true;
    }

    if (
        normalized === "false" ||
        normalized === "0" ||
        normalized === "no" ||
        normalized === "inactive" ||
        normalized === "optional" ||
        normalized === "non-compulsory"
    ) {
        return false;
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| Create Subject
|--------------------------------------------------------------------------
| POST /api/subjects
|--------------------------------------------------------------------------
*/

async function createSubject(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            subjectName,
            subjectCode,
            description,
            isCompulsory,
            isActive,
            status
        } = req.body || {};

        if (
            typeof subjectName !== "string" ||
            !subjectName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Subject name is required."
            });
        }

        let activeValue;

        if (isActive !== undefined) {
            activeValue =
                normalizeBoolean(
                    isActive,
                    true
                );
        } else {
            activeValue =
                normalizeBoolean(
                    status,
                    true
                );
        }

        if (activeValue === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be active or inactive."
            });
        }

        const compulsoryValue =
            normalizeBoolean(
                isCompulsory,
                false
            );

        if (compulsoryValue === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Compulsory status must be true or false."
            });
        }

        if (
            typeof subjectCode === "string" &&
            subjectCode.trim()
        ) {
            const codeExists =
                await subjectModel.subjectCodeExists(
                    subjectCode.trim(),
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
                    subjectName.trim(),

                subjectCode:
                    typeof subjectCode === "string" &&
                    subjectCode.trim()
                        ? subjectCode.trim()
                        : null,

                description:
                    typeof description === "string" &&
                    description.trim()
                        ? description.trim()
                        : null,

                isCompulsory:
                    compulsoryValue,

                isActive:
                    activeValue
            });

        return res.status(201).json({
            success: true,
            message:
                "Subject created successfully.",
            data: subject
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
| GET /api/subjects
|--------------------------------------------------------------------------
*/

async function getSubjects(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            isActive,
            isCompulsory,
            status
        } = req.query;

        let activeFilter = null;

        if (
            isActive !== undefined &&
            isActive !== null &&
            isActive !== ""
        ) {
            activeFilter =
                normalizeBoolean(
                    isActive,
                    null
                );
        } else if (
            status !== undefined &&
            status !== null &&
            status !== ""
        ) {
            activeFilter =
                normalizeBoolean(
                    status,
                    null
                );
        }

        if (
            activeFilter === null &&
            (
                (
                    isActive !== undefined &&
                    isActive !== null &&
                    isActive !== ""
                ) ||
                (
                    status !== undefined &&
                    status !== null &&
                    status !== ""
                )
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be active or inactive."
            });
        }

        let compulsoryFilter = null;

        if (
            isCompulsory !== undefined &&
            isCompulsory !== null &&
            isCompulsory !== ""
        ) {
            compulsoryFilter =
                normalizeBoolean(
                    isCompulsory,
                    null
                );
        }

        if (
            compulsoryFilter === null &&
            isCompulsory !== undefined &&
            isCompulsory !== null &&
            isCompulsory !== ""
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Compulsory status must be true or false."
            });
        }

        const subjects =
            await subjectModel.findSubjects({
                schoolId,

                isActive:
                    activeFilter,

                isCompulsory:
                    compulsoryFilter
            });

        return res.status(200).json({
            success: true,
            count: subjects.length,
            data: subjects
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
| GET /api/subjects/:id
|--------------------------------------------------------------------------
*/

async function getSubjectById(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const subjectId =
            req.params.id;

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

        return res.status(200).json({
            success: true,
            data: subject
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
| GET /api/subjects/code/:code
|--------------------------------------------------------------------------
*/

async function getSubjectByCode(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const subjectCode =
            req.params.code;

        if (!subjectCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Subject code is required."
            });
        }

        const subject =
            await subjectModel.findSubjectByCode(
                subjectCode,
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
            data: subject
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
| GET /api/subjects/search?q=...
|--------------------------------------------------------------------------
*/

async function searchSubjects(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

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
            count: subjects.length,
            data: subjects
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
| PUT /api/subjects/:id
|--------------------------------------------------------------------------
*/

async function updateSubject(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const subjectId =
            req.params.id;

        if (!subjectId) {
            return res.status(400).json({
                success: false,
                message:
                    "Subject ID is required."
            });
        }

        const existing =
            await subjectModel.findSubjectById(
                subjectId,
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
            isCompulsory,
            isActive,
            status
        } = req.body || {};

        const updateData = {};

        /*
        |--------------------------------------------------------------------------
        | Subject Name
        |--------------------------------------------------------------------------
        */

        if (
            subjectName !== undefined
        ) {
            if (
                typeof subjectName !== "string" ||
                !subjectName.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Subject name cannot be empty."
                });
            }

            updateData.subjectName =
                subjectName.trim();
        }

        /*
        |--------------------------------------------------------------------------
        | Subject Code
        |--------------------------------------------------------------------------
        */

        if (
            subjectCode !== undefined
        ) {
            let trimmedCode = null;

            if (
                subjectCode !== null &&
                subjectCode !== ""
            ) {
                if (
                    typeof subjectCode !== "string"
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Subject code must be text."
                    });
                }

                trimmedCode =
                    subjectCode.trim() ||
                    null;
            }

            if (trimmedCode) {
                const codeExists =
                    await subjectModel.subjectCodeExists(
                        trimmedCode,
                        schoolId
                    );

                const currentCode =
                    existing.subject_code ||
                    existing.subjectCode ||
                    null;

                if (
                    codeExists &&
                    String(currentCode || "")
                        .trim()
                        .toLowerCase() !==
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

        /*
        |--------------------------------------------------------------------------
        | Description
        |--------------------------------------------------------------------------
        */

        if (
            description !== undefined
        ) {
            if (
                description === null ||
                description === ""
            ) {
                updateData.description =
                    null;
            } else if (
                typeof description === "string"
            ) {
                updateData.description =
                    description.trim() ||
                    null;
            } else {
                return res.status(400).json({
                    success: false,
                    message:
                        "Description must be text."
                });
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Compulsory Status
        |--------------------------------------------------------------------------
        */

        if (
            isCompulsory !== undefined
        ) {
            const compulsoryValue =
                normalizeBoolean(
                    isCompulsory,
                    null
                );

            if (
                compulsoryValue === null
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Compulsory status must be true or false."
                });
            }

            updateData.isCompulsory =
                compulsoryValue;
        }

        /*
        |--------------------------------------------------------------------------
        | Active Status
        |--------------------------------------------------------------------------
        */

        if (
            isActive !== undefined
        ) {
            const activeValue =
                normalizeBoolean(
                    isActive,
                    null
                );

            if (
                activeValue === null
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Status must be active or inactive."
                });
            }

            updateData.isActive =
                activeValue;
        } else if (
            status !== undefined
        ) {
            const activeValue =
                normalizeBoolean(
                    status,
                    null
                );

            if (
                activeValue === null
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Status must be active or inactive."
                });
            }

            updateData.isActive =
                activeValue;
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
                subjectId,
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
            data: subject
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
| DELETE /api/subjects/:id
|--------------------------------------------------------------------------
*/

async function deleteSubject(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const subjectId =
            req.params.id;

        if (!subjectId) {
            return res.status(400).json({
                success: false,
                message:
                    "Subject ID is required."
            });
        }

        const subject =
            await subjectModel.deleteSubject(
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

        return res.status(200).json({
            success: true,
            message:
                "Subject deleted successfully.",
            data: subject
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
| POST /api/subjects/class/:classId
|--------------------------------------------------------------------------
*/

async function assignSubjectToClass(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const classId =
            req.params.classId;

        const {
            subjectId,
            isCompulsory
        } = req.body || {};

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

        const compulsoryValue =
            normalizeBoolean(
                isCompulsory,
                false
            );

        if (
            compulsoryValue === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Compulsory status must be true or false."
            });
        }

        const classSubject =
            await subjectModel.assignSubjectToClass({
                classId,
                subjectId,
                isCompulsory:
                    compulsoryValue
            });

        return res.status(201).json({
            success: true,
            message:
                "Subject assigned to class successfully.",
            data: classSubject
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
| GET /api/subjects/class/:classId
|--------------------------------------------------------------------------
*/

async function getSubjectsForClass(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const classId =
            req.params.classId;

        if (!classId) {
            return res.status(400).json({
                success: false,
                message:
                    "Class ID is required."
            });
        }

        const subjects =
            await subjectModel.getSubjectsForClass(
                classId,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: subjects.length,
            data: subjects
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
| DELETE /api/subjects/class/:classSubjectId
|--------------------------------------------------------------------------
*/

async function removeSubjectFromClass(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const classSubjectId =
            req.params.classSubjectId;

        if (!classSubjectId) {
            return res.status(400).json({
                success: false,
                message:
                    "Class subject ID is required."
            });
        }

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
            data: classSubject
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
| GET /api/subjects/statistics
|--------------------------------------------------------------------------
*/

async function getSubjectStatistics(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const statistics =
            await subjectModel.getSubjectStatistics(
                schoolId
            );

        return res.status(200).json({
            success: true,
            data: statistics
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