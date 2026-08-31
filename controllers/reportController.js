const reportModel = require("../models/reportModel");


/*
|--------------------------------------------------------------------------
| REPORT CONTROLLER
|--------------------------------------------------------------------------
|
| Handles school management system reports.
|
| Reports:
|
| - Dashboard report
| - Student report
| - Academic report
| - Attendance report
| - Fee report
| - Staff report
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Get Dashboard Report
|--------------------------------------------------------------------------
|
| GET /api/reports/dashboard
|
*/

async function getDashboardReport(req, res, next) {

    try {

        const schoolId =
            req.query.schoolId ||
            req.user?.schoolId ||
            req.user?.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const report =
            await reportModel.getDashboardReport(
                schoolId
            );


        return res.status(200).json({

            success: true,

            data:
                report

        });

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
*/

async function getStudentReport(req, res, next) {

    try {

        const schoolId =
            req.query.schoolId ||
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
            sessionId,
            classId,
            status
        } = req.query;


        const report =
            await reportModel.getStudentReport({

                schoolId,

                sessionId:
                    sessionId || null,

                classId:
                    classId || null,

                status:
                    status || null

            });


        return res.status(200).json({

            success: true,

            count:
                Array.isArray(report)
                    ? report.length
                    : undefined,

            data:
                report

        });

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
*/

async function getAcademicReport(req, res, next) {

    try {

        const schoolId =
            req.query.schoolId ||
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
            sessionId,
            termId,
            classId
        } = req.query;


        const report =
            await reportModel.getAcademicReport({

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
                Array.isArray(report)
                    ? report.length
                    : undefined,

            data:
                report

        });

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
*/

async function getAttendanceReport(req, res, next) {

    try {

        const schoolId =
            req.query.schoolId ||
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
            sessionId,
            termId,
            classId,
            startDate,
            endDate
        } = req.query;


        const report =
            await reportModel.getAttendanceReport({

                schoolId,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                classId:
                    classId || null,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null

            });


        return res.status(200).json({

            success: true,

            count:
                Array.isArray(report)
                    ? report.length
                    : undefined,

            data:
                report

        });

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
*/

async function getFeeReport(req, res, next) {

    try {

        const schoolId =
            req.query.schoolId ||
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
            sessionId,
            termId,
            classId,
            status,
            startDate,
            endDate
        } = req.query;


        const report =
            await reportModel.getFeeReport({

                schoolId,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                classId:
                    classId || null,

                status:
                    status || null,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null

            });


        return res.status(200).json({

            success: true,

            count:
                Array.isArray(report)
                    ? report.length
                    : undefined,

            data:
                report

        });

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
*/

async function getStaffReport(req, res, next) {

    try {

        const schoolId =
            req.query.schoolId ||
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
            departmentId,
            status
        } = req.query;


        const report =
            await reportModel.getStaffReport({

                schoolId,

                departmentId:
                    departmentId || null,

                status:
                    status || null

            });


        return res.status(200).json({

            success: true,

            count:
                Array.isArray(report)
                    ? report.length
                    : undefined,

            data:
                report

        });

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
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    getDashboardReport,

    getStudentReport,

    getAcademicReport,

    getAttendanceReport,

    getFeeReport,

    getStaffReport

};