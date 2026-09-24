"use strict";

const studentModel = require("../models/studentModel");

function getSchoolId(req) {
return (
req.user?.schoolId ||
req.user?.school_id ||
req.school?.id ||
req.schoolId ||
req.session?.user?.schoolId ||
req.session?.user?.school_id ||
null
);
}

function normalizeId(value) {
if (value === null || value === undefined) {
return null;
}

const stringValue = String(value).trim();

if (!stringValue) {
    return null;
}

const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (uuidPattern.test(stringValue)) {
    return stringValue;
}

const numericId = Number(stringValue);

if (Number.isInteger(numericId) && numericId > 0) {
    return numericId;
}

return null;

}

function getStudentId(req) {
return (
req.params?.studentId ||
req.params?.student_id ||
req.params?.id ||
req.body?.studentId ||
req.body?.student_id ||
req.query?.studentId ||
req.query?.student_id ||
req.query?.id ||
null
);
}

function getErrorMessage(error) {
if (!error) {
return "An unexpected error occurred.";
}

if (error.message) {
    return error.message;
}

return "An unexpected error occurred.";

}

function sendError(res, error, defaultStatus = 500) {
const message = getErrorMessage(error);
const normalizedMessage = message.toLowerCase();

let status = defaultStatus;

if (
    normalizedMessage.includes("required") ||
    normalizedMessage.includes("must be") ||
    normalizedMessage.includes("invalid")
) {
    status = 400;
}

if (
    normalizedMessage.includes("not found") ||
    normalizedMessage.includes("does not exist")
) {
    status = 404;
}

if (
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("duplicate") ||
    normalizedMessage.includes("already enrolled")
) {
    status = 409;
}

return res.status(status).json({
    success: false,
    message
});

}

function sendSuccess(
res,
data,
message = "Operation successful",
status = 200
) {
return res.status(status).json({
success: true,
message,
data
});
}

async function getStudentEnrollment(req, res) {
try {

const schoolId = normalizeId(getSchoolId(req));
const studentId = normalizeId(getStudentId(req));

    if (!schoolId) {
        return res.status(403).json({
            success: false,
            message: "School context is required."
        });
    }

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: "A valid student ID is required."
        });
    }

    const academicSessionId = normalizeId(
        req.query?.academicSessionId ||
        req.query?.academic_session_id ||
        req.query?.sessionId ||
        req.query?.session_id ||
        null
    );

    const enrollment =
        await studentModel.getStudentEnrollment(
            studentId,
            schoolId,
            academicSessionId
        );

    if (!enrollment) {
        return res.status(404).json({
            success: false,
            message: "Student enrollment not found."
        });
    }

    return sendSuccess(
        res,
        enrollment,
        "Student enrollment retrieved successfully."
    );
} catch (error) {
    return sendError(res, error);
}

}

async function enrollStudent(req, res) {
try {
const schoolId = normalizeId(getSchoolId(req));
const studentId = normalizeId(getStudentId(req));

    if (!schoolId) {
        return res.status(403).json({
            success: false,
            message: "School context is required."
        });
    }

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: "A valid student ID is required."
        });
    }

    const body = req.body || {};

    const classId = normalizeId(
        body.classId ??
        body.class_id
    );

    const classArmId = normalizeId(
        body.classArmId ??
        body.class_arm_id ??
        null
    );

    const departmentId = normalizeId(
        body.departmentId ??
        body.department_id ??
        null
    );

    const academicSessionId = normalizeId(
        body.academicSessionId ??
        body.academic_session_id ??
        body.sessionId ??
        body.session_id
    );

    if (!academicSessionId) {
        return res.status(400).json({
            success: false,
            message: "Academic session is required."
        });
    }

    if (!classId) {
        return res.status(400).json({
            success: false,
            message: "Class is required."
        });
    }

    const enrollmentDate =
        body.enrollmentDate ??
        body.enrollment_date ??
        null;

    const exitDate =
        body.exitDate ??
        body.exit_date ??
        null;

    const admissionStatus =
        body.admissionStatus ??
        body.admission_status ??
        body.status ??
        "Enrolled";

    const enrollment =
        await studentModel.enrollStudent({
            schoolId,
            studentId,
            academicSessionId,
            sessionId: academicSessionId,
            classId,
            classArmId,
            departmentId,
            admissionStatus,
            status: admissionStatus,
            enrollmentDate,
            exitDate
        });

    return sendSuccess(
        res,
        enrollment,
        "Student enrolled successfully.",
        201
    );
} catch (error) {
    return sendError(res, error);
}

}

module.exports = {
getStudentEnrollment,
enrollStudent
};
