const studentModel = require("../models/studentModel");

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
| GET ALL STUDENTS
|--------------------------------------------------------------------------
*/

async function getStudents(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        const {
            status,
            gender,
            limit = 100,
            offset = 0
        } = req.query;

        const students = await studentModel.findStudents({
            schoolId,
            status,
            gender,
            limit: Number(limit),
            offset: Number(offset)
        });

        return res.json({
            success: true,
            data: students
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| GET STUDENT BY ID
|--------------------------------------------------------------------------
*/

async function getStudentById(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        const student =
            await studentModel.findStudentById(
                id,
                schoolId
            );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        return res.json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| GET STUDENT BY ADMISSION NUMBER
|--------------------------------------------------------------------------
*/

async function getStudentByAdmissionNumber(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            admissionNumber
        } = req.params;

        const student =
            await studentModel.findStudentByAdmissionNumber(
                admissionNumber,
                schoolId
            );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        return res.json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| CREATE STUDENT
|--------------------------------------------------------------------------
*/

async function createStudent(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        const {
            admissionNumber,
            firstName,
            middleName,
            lastName,
            gender,
            dateOfBirth,
            phone,
            email,
            address,
            stateOfOrigin,
            lga,
            nationality,
            religion,
            bloodGroup,
            genotype,
            admissionDate,
            status
        } = req.body;

        const photoUrl =
            req.file
                ? `/uploads/students/${req.file.filename}`
                : null;

        const student =
            await studentModel.createStudent({
                schoolId,
                admissionNumber,
                firstName,
                middleName,
                lastName,
                gender,
                dateOfBirth,
                phone,
                email,
                address,
                stateOfOrigin,
                lga,
                nationality,
                religion,
                bloodGroup,
                genotype,
                photoUrl,
                admissionDate,
                status
            });

        return res.status(201).json({
            success: true,
            message: "Student created successfully.",
            data: student
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| UPDATE STUDENT
|--------------------------------------------------------------------------
*/

async function updateStudent(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        const {
            admissionNumber,
            firstName,
            middleName,
            lastName,
            gender,
            dateOfBirth,
            phone,
            email,
            address,
            stateOfOrigin,
            lga,
            nationality,
            religion,
            bloodGroup,
            genotype,
            admissionDate,
            status
        } = req.body;

        const updateData = {
            firstName,
            middleName,
            lastName,
            gender,
            dateOfBirth,
            phone,
            email,
            address,
            stateOfOrigin,
            lga,
            nationality,
            religion,
            bloodGroup,
            genotype,
            admissionDate,
            status
        };

        /*
        |----------------------------------------------------------------------
        | Admission number is intentionally not updated through the
        | generic update model because the model protects its allowed fields.
        |----------------------------------------------------------------------
        */

        if (req.file) {
            updateData.photoUrl =
                `/uploads/students/${req.file.filename}`;
        }

        const student =
            await studentModel.updateStudent(
                id,
                schoolId,
                updateData
            );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        return res.json({
            success: true,
            message: "Student updated successfully.",
            data: student
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| DELETE STUDENT
|--------------------------------------------------------------------------
*/

async function deleteStudent(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        const deleted =
            await studentModel.deleteStudent(
                id,
                schoolId
            );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        return res.json({
            success: true,
            message: "Student deleted successfully."
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| SEARCH STUDENTS
|--------------------------------------------------------------------------
*/

async function searchStudents(req, res, next) {
    try {
        const schoolId = getSchoolId(req);

        const searchTerm =
            req.query.q ||
            req.query.search ||
            "";

        if (!searchTerm.trim()) {
            return res.json({
                success: true,
                data: []
            });
        }

        const students =
            await studentModel.searchStudents(
                searchTerm.trim(),
                schoolId
            );

        return res.json({
            success: true,
            data: students
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| SEARCH STUDENT BY NAME
|--------------------------------------------------------------------------
*/

async function searchStudentByName(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const name =
            req.query.name ||
            req.query.q ||
            req.query.search ||
            "";

        if (!name.trim()) {
            return res.json({
                success: true,
                data: []
            });
        }

        const students =
            await studentModel.searchStudentByName(
                name.trim(),
                schoolId
            );

        return res.json({
            success: true,
            data: students
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| GET STUDENT STATISTICS
|--------------------------------------------------------------------------
*/

async function getStudentStatistics(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const statistics =
            await studentModel.getStudentStatistics(
                schoolId
            );

        return res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| GET FULL STUDENT PROFILE
|--------------------------------------------------------------------------
*/

async function getStudentProfile(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        const student =
            await studentModel.getStudentProfile(
                id,
                schoolId
            );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const enrollment =
            await studentModel.getStudentEnrollment(
                id,
                schoolId
            );

        return res.json({
            success: true,
            data: {
                student,
                enrollment
            }
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| GET STUDENT ENROLLMENT
|--------------------------------------------------------------------------
|
| Optional:
|
| /students/:id/enrollment?academicSessionId=SESSION_ID
|
*/

async function getStudentEnrollment(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        const academicSessionId =
            req.query.academicSessionId ||
            req.query.sessionId ||
            null;

        const enrollment =
            await studentModel.getStudentEnrollment(
                id,
                schoolId,
                academicSessionId
            );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Student enrollment not found."
            });
        }

        return res.json({
            success: true,
            data: enrollment
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| ENROLL STUDENT
|--------------------------------------------------------------------------
|
| Student
|    ↓
| Academic Session
|    ↓
| Class
|    ↓
| Class Arm
|    ↓
| Department
|
| Term is NOT part of enrollment.
|
*/

async function enrollStudent(req, res, next) {
    try {
        const schoolId = getSchoolId(req);
        const { id } = req.params;

        const {
            classId,
            classArmId,
            departmentId,
            sessionId,
            academicSessionId,
            enrollmentDate,
            status,
            admissionStatus,
            exitDate
        } = req.body;

        const enrollment =
            await studentModel.enrollStudent({
                schoolId,
                studentId: id,
                classId,
                classArmId,
                departmentId,
                sessionId,
                academicSessionId,
                enrollmentDate,
                status,
                admissionStatus,
                exitDate
            });

        return res.status(201).json({
            success: true,
            message: "Student enrolled successfully.",
            data: enrollment
        });
    } catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| EXPORT CONTROLLER
|--------------------------------------------------------------------------
*/

module.exports = {
    getStudents,
    getStudentById,
    getStudentByAdmissionNumber,
    createStudent,
    updateStudent,
    deleteStudent,
    searchStudents,
    searchStudentByName,
    getStudentStatistics,
    getStudentProfile,
    getStudentEnrollment,
    enrollStudent
};