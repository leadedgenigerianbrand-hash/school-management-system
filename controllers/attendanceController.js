const attendanceModel = require("../models/attendanceModel");

/*
|--------------------------------------------------------------------------
| Attendance Controller
|--------------------------------------------------------------------------
|
| Handles:
|
| - Record attendance
| - Get attendance by ID
| - Get student attendance
| - Get class attendance
| - Get attendance by date
| - Update attendance
| - Delete attendance
| - Attendance summaries
| - Attendance statistics
| - Search attendance
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
        req.body?.schoolId ||
        req.query?.schoolId
    );

}


/*
|--------------------------------------------------------------------------
| Get User ID
|--------------------------------------------------------------------------
*/

function getUserId(req) {

    return (
        req.user?.id ||
        req.user?.userId ||
        null
    );

}


/*
|--------------------------------------------------------------------------
| Create Attendance
|--------------------------------------------------------------------------
*/

async function createAttendance(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const userId = getUserId(req);

        const {
            studentId,
            attendanceDate,
            status,
            remarks,
            classId,
            sessionId,
            termId
        } = req.body;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!studentId) {

            return res.status(400).json({

                success: false,

                message: "Student ID is required."

            });

        }


        if (!attendanceDate) {

            return res.status(400).json({

                success: false,

                message: "Attendance date is required."

            });

        }


        if (!status) {

            return res.status(400).json({

                success: false,

                message: "Attendance status is required."

            });

        }


        const attendance =
            await attendanceModel.createAttendance({

                schoolId,

                studentId,

                attendanceDate,

                status,

                remarks:
                    remarks || null,

                classId:
                    classId || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                recordedBy:
                    userId

            });


        return res.status(201).json({

            success: true,

            message:
                "Attendance recorded successfully.",

            data: attendance

        });


    } catch (error) {

        console.error(
            "Create attendance error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Create Bulk Attendance
|--------------------------------------------------------------------------
*/

async function createBulkAttendance(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const userId = getUserId(req);

        const {
            attendanceDate,
            records,
            classId,
            sessionId,
            termId
        } = req.body;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!attendanceDate) {

            return res.status(400).json({

                success: false,

                message: "Attendance date is required."

            });

        }


        if (
            !Array.isArray(records) ||
            records.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Attendance records are required."

            });

        }


        const attendance =
            await attendanceModel.createBulkAttendance({

                schoolId,

                attendanceDate,

                records,

                classId:
                    classId || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                recordedBy:
                    userId

            });


        return res.status(201).json({

            success: true,

            message:
                "Bulk attendance recorded successfully.",

            count: attendance.length,

            data: attendance

        });


    } catch (error) {

        console.error(
            "Create bulk attendance error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Attendance By ID
|--------------------------------------------------------------------------
*/

async function getAttendanceById(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Attendance ID is required."

            });

        }


        const attendance =
            await attendanceModel.findAttendanceById(

                id,

                schoolId

            );


        if (!attendance) {

            return res.status(404).json({

                success: false,

                message:
                    "Attendance record not found."

            });

        }


        return res.status(200).json({

            success: true,

            data: attendance

        });


    } catch (error) {

        console.error(
            "Get attendance by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Student Attendance
|--------------------------------------------------------------------------
*/

async function getStudentAttendance(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            studentId
        } = req.params;


        const {
            startDate,
            endDate,
            sessionId,
            termId,
            status,
            limit = 100,
            offset = 0
        } = req.query;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!studentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID is required."

            });

        }


        const attendance =
            await attendanceModel.findStudentAttendance({

                schoolId,

                studentId,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                status:
                    status || null,

                limit:
                    Number(limit),

                offset:
                    Number(offset)

            });


        return res.status(200).json({

            success: true,

            count: attendance.length,

            data: attendance

        });


    } catch (error) {

        console.error(
            "Get student attendance error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Class Attendance
|--------------------------------------------------------------------------
*/

async function getClassAttendance(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            classId
        } = req.params;


        const {
            attendanceDate,
            startDate,
            endDate,
            sessionId,
            termId,
            status
        } = req.query;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!classId) {

            return res.status(400).json({

                success: false,

                message:
                    "Class ID is required."

            });

        }


        const attendance =
            await attendanceModel.findClassAttendance({

                schoolId,

                classId,

                attendanceDate:
                    attendanceDate || null,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                status:
                    status || null

            });


        return res.status(200).json({

            success: true,

            count: attendance.length,

            data: attendance

        });


    } catch (error) {

        console.error(
            "Get class attendance error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Attendance By Date
|--------------------------------------------------------------------------
*/

async function getAttendanceByDate(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            date,
            classId,
            sessionId,
            termId,
            status
        } = req.query;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!date) {

            return res.status(400).json({

                success: false,

                message:
                    "Attendance date is required."

            });

        }


        const attendance =
            await attendanceModel.findAttendanceByDate({

                schoolId,

                attendanceDate:
                    date,

                classId:
                    classId || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                status:
                    status || null

            });


        return res.status(200).json({

            success: true,

            count: attendance.length,

            data: attendance

        });


    } catch (error) {

        console.error(
            "Get attendance by date error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get All Attendance
|--------------------------------------------------------------------------
*/

async function getAttendance(req, res, next) {

    try {

        const schoolId = getSchoolId(req);


        const {
            studentId,
            classId,
            attendanceDate,
            startDate,
            endDate,
            sessionId,
            termId,
            status,
            limit = 100,
            offset = 0
        } = req.query;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        const attendance =
            await attendanceModel.findAttendance({

                schoolId,

                studentId:
                    studentId || null,

                classId:
                    classId || null,

                attendanceDate:
                    attendanceDate || null,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                status:
                    status || null,

                limit:
                    Number(limit),

                offset:
                    Number(offset)

            });


        return res.status(200).json({

            success: true,

            count: attendance.length,

            data: attendance

        });


    } catch (error) {

        console.error(
            "Get attendance error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Update Attendance
|--------------------------------------------------------------------------
*/

async function updateAttendance(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Attendance ID is required."

            });

        }


        const {

            attendanceDate,

            status,

            remarks,

            classId,

            sessionId,

            termId

        } = req.body;


        const data = {};


        if (
            attendanceDate !== undefined
        ) {

            data.attendanceDate =
                attendanceDate;

        }


        if (
            status !== undefined
        ) {

            data.status =
                status;

        }


        if (
            remarks !== undefined
        ) {

            data.remarks =
                remarks;

        }


        if (
            classId !== undefined
        ) {

            data.classId =
                classId;

        }


        if (
            sessionId !== undefined
        ) {

            data.sessionId =
                sessionId;

        }


        if (
            termId !== undefined
        ) {

            data.termId =
                termId;

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


        const attendance =
            await attendanceModel.updateAttendance(

                id,

                schoolId,

                data

            );


        if (!attendance) {

            return res.status(404).json({

                success: false,

                message:
                    "Attendance record not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Attendance updated successfully.",

            data: attendance

        });


    } catch (error) {

        console.error(
            "Update attendance error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Delete Attendance
|--------------------------------------------------------------------------
*/

async function deleteAttendance(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Attendance ID is required."

            });

        }


        const attendance =
            await attendanceModel.deleteAttendance(

                id,

                schoolId

            );


        if (!attendance) {

            return res.status(404).json({

                success: false,

                message:
                    "Attendance record not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Attendance record deleted successfully.",

            data: attendance

        });


    } catch (error) {

        console.error(
            "Delete attendance error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Student Attendance Summary
|--------------------------------------------------------------------------
*/

async function getStudentAttendanceSummary(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            studentId
        } = req.params;


        const {
            startDate,
            endDate,
            sessionId,
            termId
        } = req.query;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!studentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID is required."

            });

        }


        const summary =
            await attendanceModel.getStudentAttendanceSummary({

                schoolId,

                studentId,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null

            });


        return res.status(200).json({

            success: true,

            data: summary

        });


    } catch (error) {

        console.error(
            "Get student attendance summary error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Class Attendance Summary
|--------------------------------------------------------------------------
*/

async function getClassAttendanceSummary(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            classId
        } = req.params;


        const {
            startDate,
            endDate,
            sessionId,
            termId
        } = req.query;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!classId) {

            return res.status(400).json({

                success: false,

                message:
                    "Class ID is required."

            });

        }


        const summary =
            await attendanceModel.getClassAttendanceSummary({

                schoolId,

                classId,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null

            });


        return res.status(200).json({

            success: true,

            data: summary

        });


    } catch (error) {

        console.error(
            "Get class attendance summary error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get School Attendance Summary
|--------------------------------------------------------------------------
*/

async function getSchoolAttendanceSummary(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);


        const {
            startDate,
            endDate,
            sessionId,
            termId,
            classId
        } = req.query;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        const summary =
            await attendanceModel.getSchoolAttendanceSummary({

                schoolId,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                classId:
                    classId || null

            });


        return res.status(200).json({

            success: true,

            data: summary

        });


    } catch (error) {

        console.error(
            "Get school attendance summary error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Search Attendance
|--------------------------------------------------------------------------
*/

async function searchAttendance(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            q,
            search
        } = req.query;


        const searchTerm =
            (q || search || "").trim();


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        if (!searchTerm) {

            return res.status(400).json({

                success: false,

                message:
                    "Search term is required."

            });

        }


        const attendance =
            await attendanceModel.searchAttendance(

                searchTerm,

                schoolId

            );


        return res.status(200).json({

            success: true,

            count: attendance.length,

            data: attendance

        });


    } catch (error) {

        console.error(
            "Search attendance error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Attendance Statistics
|--------------------------------------------------------------------------
*/

async function getAttendanceStatistics(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);


        const {
            startDate,
            endDate,
            sessionId,
            termId,
            classId
        } = req.query;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message: "School ID is required."

            });

        }


        const statistics =
            await attendanceModel.getAttendanceStatistics({

                schoolId,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null,

                classId:
                    classId || null

            });


        return res.status(200).json({

            success: true,

            data: statistics

        });


    } catch (error) {

        console.error(
            "Get attendance statistics error:",
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

    createAttendance,

    createBulkAttendance,

    getAttendance,

    getAttendanceById,

    getStudentAttendance,

    getClassAttendance,

    getAttendanceByDate,

    updateAttendance,

    deleteAttendance,

    getStudentAttendanceSummary,

    getClassAttendanceSummary,

    getSchoolAttendanceSummary,

    searchAttendance,

    getAttendanceStatistics

};