"use strict";

const reportModel = require("../models/reportModel");

/*
|--------------------------------------------------------------------------
| REPORT SERVICE
|--------------------------------------------------------------------------
|
| Business/service layer for the school management reporting system.
|
| Responsibilities:
| - Validate report input
| - Coordinate report model functions
| - Provide a clean interface for controllers
| - Keep business logic out of routes
| - Keep SQL/database logic inside reportModel
|
| This service does not contain SQL.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Validation Helpers
|--------------------------------------------------------------------------
*/

function validateRequired(value, fieldName) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        throw new Error(`${fieldName} is required`);
    }

    return value;
}

function validateSchoolId(schoolId) {
    return validateRequired(
        schoolId,
        "School ID"
    );
}

function validateId(value, fieldName) {
    return validateRequired(
        value,
        fieldName
    );
}

function normalizeOptional(value) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    return String(value).trim();
}

/*
|--------------------------------------------------------------------------
| School Overview
|--------------------------------------------------------------------------
*/

async function getSchoolOverview(schoolId) {
    const validSchoolId =
        validateSchoolId(schoolId);

    return reportModel.getSchoolOverview(
        validSchoolId
    );
}

/*
|--------------------------------------------------------------------------
| Student Statistics
|--------------------------------------------------------------------------
*/

async function getStudentStatistics(schoolId) {
    const validSchoolId =
        validateSchoolId(schoolId);

    return reportModel.getStudentStatistics(
        validSchoolId
    );
}

/*
|--------------------------------------------------------------------------
| Students By Class
|--------------------------------------------------------------------------
*/

async function getStudentsByClass(
    schoolId,
    sessionId = null
) {
    const validSchoolId =
        validateSchoolId(schoolId);

    const validSessionId =
        normalizeOptional(sessionId);

    return reportModel.getStudentsByClass(
        validSchoolId,
        validSessionId
    );
}

/*
|--------------------------------------------------------------------------
| Staff Statistics
|--------------------------------------------------------------------------
*/

async function getStaffStatistics(schoolId) {
    const validSchoolId =
        validateSchoolId(schoolId);

    return reportModel.getStaffStatistics(
        validSchoolId
    );
}

/*
|--------------------------------------------------------------------------
| Staff By Department
|--------------------------------------------------------------------------
*/

async function getStaffByDepartment(schoolId) {
    const validSchoolId =
        validateSchoolId(schoolId);

    return reportModel.getStaffByDepartment(
        validSchoolId
    );
}

/*
|--------------------------------------------------------------------------
| Fee Statistics
|--------------------------------------------------------------------------
*/

async function getFeeStatistics(schoolId) {
    const validSchoolId =
        validateSchoolId(schoolId);

    return reportModel.getFeeStatistics(
        validSchoolId
    );
}

/*
|--------------------------------------------------------------------------
| Attendance Statistics
|--------------------------------------------------------------------------
*/

async function getAttendanceStatistics(
    schoolId,
    startDate = null,
    endDate = null,
    sessionId = null
) {
    const validSchoolId =
        validateSchoolId(schoolId);

    const validStartDate =
        normalizeOptional(startDate);

    const validEndDate =
        normalizeOptional(endDate);

    const validSessionId =
        normalizeOptional(sessionId);

    if (
        validStartDate &&
        validEndDate &&
        validStartDate > validEndDate
    ) {
        throw new Error(
            "Start date cannot be later than end date"
        );
    }

    return reportModel.getAttendanceStatistics(
        validSchoolId,
        validStartDate,
        validEndDate,
        validSessionId
    );
}

/*
|--------------------------------------------------------------------------
| Result Statistics
|--------------------------------------------------------------------------
*/

async function getResultStatistics(
    schoolId,
    sessionId = null,
    termId = null
) {
    const validSchoolId =
        validateSchoolId(schoolId);

    const validSessionId =
        normalizeOptional(sessionId);

    const validTermId =
        normalizeOptional(termId);

    return reportModel.getResultStatistics(
        validSchoolId,
        validSessionId,
        validTermId
    );
}

/*
|--------------------------------------------------------------------------
| Academic Session Report
|--------------------------------------------------------------------------
*/

async function getAcademicSessionReport(
    schoolId,
    sessionId
) {
    const validSchoolId =
        validateSchoolId(schoolId);

    const validSessionId =
        validateId(
            sessionId,
            "Academic Session ID"
        );

    return reportModel.getAcademicSessionReport(
        validSchoolId,
        validSessionId
    );
}

/*
|--------------------------------------------------------------------------
| Class Report
|--------------------------------------------------------------------------
*/

async function getClassReport(
    schoolId,
    classId,
    sessionId = null
) {
    const validSchoolId =
        validateSchoolId(schoolId);

    const validClassId =
        validateId(
            classId,
            "Class ID"
        );

    const validSessionId =
        normalizeOptional(sessionId);

    return reportModel.getClassReport(
        validSchoolId,
        validClassId,
        validSessionId
    );
}

/*
|--------------------------------------------------------------------------
| Dashboard Report
|--------------------------------------------------------------------------
*/

async function getDashboardReport(schoolId) {
    const validSchoolId =
        validateSchoolId(schoolId);

    return reportModel.getDashboardReport(
        validSchoolId
    );
}

/*
|--------------------------------------------------------------------------
| Complete School Report
|--------------------------------------------------------------------------
|
| Provides the major school-level report sections in one service call.
|
|--------------------------------------------------------------------------
*/

async function getCompleteSchoolReport(
    schoolId,
    options = {}
) {
    const validSchoolId =
        validateSchoolId(schoolId);

    const sessionId =
        normalizeOptional(
            options.sessionId
        );

    const termId =
        normalizeOptional(
            options.termId
        );

    const startDate =
        normalizeOptional(
            options.startDate
        );

    const endDate =
        normalizeOptional(
            options.endDate
        );

    if (
        startDate &&
        endDate &&
        startDate > endDate
    ) {
        throw new Error(
            "Start date cannot be later than end date"
        );
    }

    const [
        overview,
        students,
        studentsByClass,
        staff,
        staffByDepartment,
        fees,
        attendance,
        results
    ] = await Promise.all([
        reportModel.getSchoolOverview(
            validSchoolId
        ),

        reportModel.getStudentStatistics(
            validSchoolId
        ),

        reportModel.getStudentsByClass(
            validSchoolId,
            sessionId
        ),

        reportModel.getStaffStatistics(
            validSchoolId
        ),

        reportModel.getStaffByDepartment(
            validSchoolId
        ),

        reportModel.getFeeStatistics(
            validSchoolId
        ),

        reportModel.getAttendanceStatistics(
            validSchoolId,
            startDate,
            endDate,
            sessionId
        ),

        reportModel.getResultStatistics(
            validSchoolId,
            sessionId,
            termId
        )
    ]);

    return {
        overview,
        students,
        studentsByClass,
        staff,
        staffByDepartment,
        fees,
        attendance,
        results
    };
}

/*
|--------------------------------------------------------------------------
| Compatibility Aliases
|--------------------------------------------------------------------------
|
| These aliases provide stable naming options for future controllers
| without changing the underlying report implementation.
|
|--------------------------------------------------------------------------
*/

const getOverview =
    getSchoolOverview;

const getStudentsReport =
    getStudentStatistics;

const getStaffReport =
    getStaffStatistics;

const getFeesReport =
    getFeeStatistics;

const getAttendanceReport =
    getAttendanceStatistics;

const getResultsReport =
    getResultStatistics;

const getSessionReport =
    getAcademicSessionReport;

const getClassReportById =
    getClassReport;

const getDashboard =
    getDashboardReport;

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    getSchoolOverview,
    getStudentStatistics,
    getStudentsByClass,
    getStaffStatistics,
    getStaffByDepartment,
    getFeeStatistics,
    getAttendanceStatistics,
    getResultStatistics,
    getAcademicSessionReport,
    getClassReport,
    getDashboardReport,
    getCompleteSchoolReport,

    getOverview,
    getStudentsReport,
    getStaffReport,
    getFeesReport,
    getAttendanceReport,
    getResultsReport,
    getSessionReport,
    getClassReportById,
    getDashboard
};