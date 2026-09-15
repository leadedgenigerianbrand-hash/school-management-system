"use strict";

const reportService = require("../services/reportService");

/*
|--------------------------------------------------------------------------
| REPORT CONTROLLER
|--------------------------------------------------------------------------
|
| HTTP/API controller for the school management reporting system.
|
| Responsibilities:
| - Resolve the school ID
| - Read request parameters
| - Call reportService
| - Return consistent JSON responses
| - Pass unexpected errors to error middleware
|
| Architecture:
|
| Route
| ↓
| Controller
| ↓
| Service
| ↓
| Model
| ↓
| PostgreSQL
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function resolveSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.query?.schoolId ||
        req.body?.schoolId ||
        null
    );
}

function getOptionalQuery(req, name) {
    const value = req.query?.[name];

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    return String(value).trim();
}

function sendSuccess(
    res,
    data,
    statusCode = 200
) {
    return res.status(statusCode).json({
        success: true,
        data
    });
}

function sendBadRequest(
    res,
    message
) {
    return res.status(400).json({
        success: false,
        message
    });
}

/*
|--------------------------------------------------------------------------
| Get Dashboard Report
|--------------------------------------------------------------------------
|
| GET /api/reports/dashboard
|
|--------------------------------------------------------------------------
*/

async function getDashboardReport(
    req,
    res,
    next
) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required."
            );
        }

        const report =
            await reportService.getDashboardReport(
                schoolId
            );

        return sendSuccess(
            res,
            report
        );

    } catch (error) {
        console.error(
            "Get dashboard report error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get Student Report
|--------------------------------------------------------------------------
|
| GET /api/reports/students
|
| Optional query parameters:
| - sessionId
| - classId
|
|--------------------------------------------------------------------------
*/

async function getStudentReport(
    req,
    res,
    next
) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required."
            );
        }

        const sessionId =
            getOptionalQuery(
                req,
                "sessionId"
            );

        const classId =
            getOptionalQuery(
                req,
                "classId"
            );

        if (classId) {
            const report =
                await reportService.getClassReport(
                    schoolId,
                    classId,
                    sessionId
                );

            return sendSuccess(
                res,
                report
            );
        }

        const [
            statistics,
            studentsByClass
        ] = await Promise.all([
            reportService.getStudentStatistics(
                schoolId
            ),

            reportService.getStudentsByClass(
                schoolId,
                sessionId
            )
        ]);

        return sendSuccess(
            res,
            {
                statistics,
                studentsByClass
            }
        );

    } catch (error) {
        console.error(
            "Get student report error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get Academic Report
|--------------------------------------------------------------------------
|
| GET /api/reports/academic
|
| Optional query parameters:
| - sessionId
| - termId
| - classId
|
|--------------------------------------------------------------------------
*/

async function getAcademicReport(
    req,
    res,
    next
) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required."
            );
        }

        const sessionId =
            getOptionalQuery(
                req,
                "sessionId"
            );

        const termId =
            getOptionalQuery(
                req,
                "termId"
            );

        const classId =
            getOptionalQuery(
                req,
                "classId"
            );

        if (sessionId && classId) {
            const [
                sessionReport,
                classReport,
                resultStatistics
            ] = await Promise.all([
                reportService.getAcademicSessionReport(
                    schoolId,
                    sessionId
                ),

                reportService.getClassReport(
                    schoolId,
                    classId,
                    sessionId
                ),

                reportService.getResultStatistics(
                    schoolId,
                    sessionId,
                    termId
                )
            ]);

            return sendSuccess(
                res,
                {
                    session: sessionReport,
                    class: classReport,
                    results: resultStatistics
                }
            );
        }

        if (sessionId) {
            const [
                sessionReport,
                resultStatistics
            ] = await Promise.all([
                reportService.getAcademicSessionReport(
                    schoolId,
                    sessionId
                ),

                reportService.getResultStatistics(
                    schoolId,
                    sessionId,
                    termId
                )
            ]);

            return sendSuccess(
                res,
                {
                    session: sessionReport,
                    results: resultStatistics
                }
            );
        }

        if (classId) {
            const classReport =
                await reportService.getClassReport(
                    schoolId,
                    classId
                );

            return sendSuccess(
                res,
                {
                    class: classReport
                }
            );
        }

        const resultStatistics =
            await reportService.getResultStatistics(
                schoolId,
                null,
                termId
            );

        return sendSuccess(
            res,
            {
                results: resultStatistics
            }
        );

    } catch (error) {
        console.error(
            "Get academic report error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get Attendance Report
|--------------------------------------------------------------------------
|
| GET /api/reports/attendance
|
| Optional query parameters:
| - sessionId
| - startDate
| - endDate
|
|--------------------------------------------------------------------------
*/

async function getAttendanceReport(
    req,
    res,
    next
) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required."
            );
        }

        const sessionId =
            getOptionalQuery(
                req,
                "sessionId"
            );

        const startDate =
            getOptionalQuery(
                req,
                "startDate"
            );

        const endDate =
            getOptionalQuery(
                req,
                "endDate"
            );

        const report =
            await reportService.getAttendanceStatistics(
                schoolId,
                startDate,
                endDate,
                sessionId
            );

        return sendSuccess(
            res,
            report
        );

    } catch (error) {
        console.error(
            "Get attendance report error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get Fee Report
|--------------------------------------------------------------------------
|
| GET /api/reports/fees
|
|--------------------------------------------------------------------------
*/

async function getFeeReport(
    req,
    res,
    next
) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required."
            );
        }

        const report =
            await reportService.getFeeStatistics(
                schoolId
            );

        return sendSuccess(
            res,
            report
        );

    } catch (error) {
        console.error(
            "Get fee report error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get Staff Report
|--------------------------------------------------------------------------
|
| GET /api/reports/staff
|
| Optional query parameter:
| - departmentId
|
|--------------------------------------------------------------------------
*/

async function getStaffReport(
    req,
    res,
    next
) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required."
            );
        }

        const departmentId =
            getOptionalQuery(
                req,
                "departmentId"
            );

        const [
            statistics,
            departments
        ] = await Promise.all([
            reportService.getStaffStatistics(
                schoolId
            ),

            reportService.getStaffByDepartment(
                schoolId
            )
        ]);

        let filteredDepartments =
            departments;

        if (departmentId) {
            filteredDepartments =
                departments.filter(
                    department =>
                        String(
                            department.departmentId
                        ) === String(
                            departmentId
                        )
                );
        }

        return sendSuccess(
            res,
            {
                statistics,
                departments:
                    filteredDepartments,
                selectedDepartmentId:
                    departmentId
            }
        );

    } catch (error) {
        console.error(
            "Get staff report error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get Complete School Report
|--------------------------------------------------------------------------
|
| GET /api/reports/complete
|
| Optional query parameters:
| - sessionId
| - termId
| - startDate
| - endDate
|
|--------------------------------------------------------------------------
*/

async function getCompleteSchoolReport(
    req,
    res,
    next
) {
    try {
        const schoolId = resolveSchoolId(req);

        if (!schoolId) {
            return sendBadRequest(
                res,
                "School ID is required."
            );
        }

        const options = {
            sessionId:
                getOptionalQuery(
                    req,
                    "sessionId"
                ),

            termId:
                getOptionalQuery(
                    req,
                    "termId"
                ),

            startDate:
                getOptionalQuery(
                    req,
                    "startDate"
                ),

            endDate:
                getOptionalQuery(
                    req,
                    "endDate"
                )
        };

        const report =
            await reportService.getCompleteSchoolReport(
                schoolId,
                options
            );

        return sendSuccess(
            res,
            report
        );

    } catch (error) {
        console.error(
            "Get complete school report error:",
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
    getDashboardReport,
    getStudentReport,
    getAcademicReport,
    getAttendanceReport,
    getFeeReport,
    getStaffReport,
    getCompleteSchoolReport
};