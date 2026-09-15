"use strict";

const schoolModel = require("../models/schoolModel");

function getSchoolId(req) {
    const schoolId =
        req.params?.id;

    if (
        schoolId === undefined ||
        schoolId === null ||
        schoolId === ""
    ) {
        const error = new Error(
            "School ID is required."
        );

        error.statusCode = 400;

        throw error;
    }

    if (
        !Number.isInteger(
            Number(schoolId)
        ) ||
        Number(schoolId) <= 0
    ) {
        const error = new Error(
            "Invalid school ID."
        );

        error.statusCode = 400;

        throw error;
    }

    return Number(schoolId);
}

function handleDatabaseError(
    error,
    next,
    fallbackMessage
) {
    console.error(
        fallbackMessage,
        error
    );

    if (
        error?.code === "23505"
    ) {
        return next(
            Object.assign(
                new Error(
                    "School code already exists."
                ),
                {
                    statusCode: 409
                }
            )
        );
    }

    if (
        error?.code === "23503"
    ) {
        return next(
            Object.assign(
                new Error(
                    "This school cannot be changed or deleted because related records exist."
                ),
                {
                    statusCode: 409
                }
            )
        );
    }

    return next(error);
}

async function getAllSchools(
    req,
    res,
    next
) {
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
                        status
                            ? String(status).trim()
                            : null,
                    state:
                        state
                            ? String(state).trim()
                            : null,
                    schoolType:
                        schoolType
                            ? String(schoolType).trim()
                            : null,
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
            count: schools.length,
            data: schools
        });
    } catch (error) {
        return handleDatabaseError(
            error,
            next,
            "Get all schools error:"
        );
    }
}

async function getSchoolById(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const school =
            await schoolModel.findSchoolById(
                schoolId
            );

        if (!school) {
            const error = new Error(
                "School not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            data: school
        });
    } catch (error) {
        return handleDatabaseError(
            error,
            next,
            "Get school by ID error:"
        );
    }
}

async function createSchool(
    req,
    res,
    next
) {
    try {
        const body =
            req.body || {};

        const schoolCode =
            body.schoolCode ??
            body.school_code;

        const schoolName =
            body.schoolName ??
            body.school_name;

        if (
            !schoolCode ||
            !String(schoolCode).trim()
        ) {
            const error = new Error(
                "School code is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (
            !schoolName ||
            !String(schoolName).trim()
        ) {
            const error = new Error(
                "School name is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const school =
            await schoolModel.createSchool({
                schoolCode:
                    String(schoolCode).trim(),
                schoolName:
                    String(schoolName).trim(),
                registrationNumber:
                    body.registrationNumber ??
                    body.registration_number ??
                    null,
                address:
                    body.address ?? null,
                city:
                    body.city ?? null,
                state:
                    body.state ?? null,
                country:
                    body.country ??
                    "Nigeria",
                phone:
                    body.phone ?? null,
                email:
                    body.email ?? null,
                website:
                    body.website ?? null,
                logoUrl:
                    body.logoUrl ??
                    body.logo_url ??
                    null,
                motto:
                    body.motto ?? null,
                principalName:
                    body.principalName ??
                    body.principal_name ??
                    null,
                schoolType:
                    body.schoolType ??
                    body.school_type ??
                    "Secondary School",
                status:
                    body.status ??
                    "Active"
            });

        return res.status(201).json({
            success: true,
            message:
                "School created successfully.",
            data: school
        });
    } catch (error) {
        return handleDatabaseError(
            error,
            next,
            "Create school error:"
        );
    }
}

async function updateSchool(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const body =
            req.body || {};

        const data = {};

        const fieldMap = {
            schoolCode: "schoolCode",
            school_code: "schoolCode",
            schoolName: "schoolName",
            school_name: "schoolName",
            registrationNumber:
                "registrationNumber",
            registration_number:
                "registrationNumber",
            address: "address",
            city: "city",
            state: "state",
            country: "country",
            phone: "phone",
            email: "email",
            website: "website",
            logoUrl: "logoUrl",
            logo_url: "logoUrl",
            motto: "motto",
            principalName:
                "principalName",
            principal_name:
                "principalName",
            schoolType:
                "schoolType",
            school_type:
                "schoolType",
            status: "status"
        };

        for (
            const [inputKey, modelKey]
            of Object.entries(fieldMap)
        ) {
            if (
                body[inputKey] !== undefined &&
                data[modelKey] === undefined
            ) {
                data[modelKey] =
                    body[inputKey];
            }
        }

        if (
            Object.keys(data).length === 0
        ) {
            const error = new Error(
                "No school information supplied for update."
            );

            error.statusCode = 400;

            return next(error);
        }

        const school =
            await schoolModel.updateSchool(
                schoolId,
                data
            );

        if (!school) {
            const error = new Error(
                "School not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            message:
                "School updated successfully.",
            data: school
        });
    } catch (error) {
        return handleDatabaseError(
            error,
            next,
            "Update school error:"
        );
    }
}

async function deleteSchool(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const school =
            await schoolModel.deleteSchool(
                schoolId
            );

        if (!school) {
            const error = new Error(
                "School not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            message:
                "School deleted successfully.",
            data: school
        });
    } catch (error) {
        return handleDatabaseError(
            error,
            next,
            "Delete school error:"
        );
    }
}

async function getSchoolStatistics(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const school =
            await schoolModel.findSchoolById(
                schoolId
            );

        if (!school) {
            const error = new Error(
                "School not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        const statistics =
            await schoolModel.getSchoolStatistics(
                schoolId
            );

        return res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        return handleDatabaseError(
            error,
            next,
            "Get school statistics error:"
        );
    }
}

async function getSchoolDashboard(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const school =
            await schoolModel.findSchoolById(
                schoolId
            );

        if (!school) {
            const error = new Error(
                "School not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        const dashboard =
            await schoolModel.getSchoolDashboard(
                schoolId
            );

        return res.status(200).json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        return handleDatabaseError(
            error,
            next,
            "Get school dashboard error:"
        );
    }
}

async function checkSchoolCode(
    req,
    res,
    next
) {
    try {
        const schoolCode =
            req.query?.schoolCode ??
            req.query?.school_code;

        if (
            !schoolCode ||
            !String(schoolCode).trim()
        ) {
            const error = new Error(
                "School code is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const excludeSchoolId =
            req.query?.excludeSchoolId ??
            req.query?.exclude_school_id ??
            null;

        const exists =
            await schoolModel.schoolCodeExists(
                String(schoolCode).trim(),
                excludeSchoolId
            );

        return res.status(200).json({
            success: true,
            exists
        });
    } catch (error) {
        return handleDatabaseError(
            error,
            next,
            "Check school code error:"
        );
    }
}

async function getSchoolCount(
    req,
    res,
    next
) {
    try {
        const status =
            req.query?.status
                ? String(
                    req.query.status
                ).trim()
                : null;

        const count =
            await schoolModel.countSchools(
                status
            );

        return res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        return handleDatabaseError(
            error,
            next,
            "Get school count error:"
        );
    }
}

module.exports = {
    getAllSchools,
    getSchoolById,
    createSchool,
    updateSchool,
    deleteSchool,
    getSchoolStatistics,
    getSchoolDashboard,
    checkSchoolCode,
    getSchoolCount
};