const studentModel = require("../models/studentModel");

/*
|--------------------------------------------------------------------------
| Student Service
|--------------------------------------------------------------------------
|
| Business logic for student-related operations.
|
| The service layer sits between controllers and models.
|
| Controller
|     ↓
| Student Service
|     ↓
| Student Model
|     ↓
| PostgreSQL
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Student
|--------------------------------------------------------------------------
*/

async function createStudent(data) {

    if (!data) {
        throw new Error("Student data is required.");
    }

    if (!data.schoolId) {
        throw new Error("School ID is required.");
    }

    if (!data.firstName || !String(data.firstName).trim()) {
        throw new Error("Student first name is required.");
    }

    if (!data.lastName || !String(data.lastName).trim()) {
        throw new Error("Student last name is required.");
    }


    /*
    |----------------------------------------------------------------------
    | Check Student Number
    |----------------------------------------------------------------------
    */

    if (
        data.studentNumber &&
        typeof studentModel.studentNumberExists === "function"
    ) {

        const exists =
            await studentModel.studentNumberExists(
                data.studentNumber,
                data.schoolId
            );


        if (exists) {
            throw new Error(
                "A student with this student number already exists."
            );
        }
    }


    /*
    |----------------------------------------------------------------------
    | Create Student
    |----------------------------------------------------------------------
    */

    return await studentModel.createStudent(data);
}


/*
|--------------------------------------------------------------------------
| Get Student By ID
|--------------------------------------------------------------------------
*/

async function getStudentById(
    studentId,
    schoolId = null
) {

    if (!studentId) {
        throw new Error("Student ID is required.");
    }


    const student =
        await studentModel.findStudentById(
            studentId,
            schoolId
        );


    if (!student) {
        throw new Error("Student not found.");
    }


    return student;
}


/*
|--------------------------------------------------------------------------
| Get Student By Student Number
|--------------------------------------------------------------------------
*/

async function getStudentByNumber(
    studentNumber,
    schoolId
) {

    if (!studentNumber) {
        throw new Error("Student number is required.");
    }


    const student =
        await studentModel.findStudentByNumber(
            studentNumber,
            schoolId
        );


    if (!student) {
        throw new Error("Student not found.");
    }


    return student;
}


/*
|--------------------------------------------------------------------------
| Get Students
|--------------------------------------------------------------------------
*/

async function getStudents(options = {}) {

    if (!options.schoolId) {
        throw new Error("School ID is required.");
    }


    return await studentModel.findStudents(
        options
    );
}


/*
|--------------------------------------------------------------------------
| Search Students
|--------------------------------------------------------------------------
*/

async function searchStudents(
    searchTerm,
    schoolId
) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    if (
        !searchTerm ||
        !String(searchTerm).trim()
    ) {
        return [];
    }


    return await studentModel.searchStudents(
        String(searchTerm).trim(),
        schoolId
    );
}


/*
|--------------------------------------------------------------------------
| Update Student
|--------------------------------------------------------------------------
*/

async function updateStudent(
    studentId,
    schoolId,
    data
) {

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!data || Object.keys(data).length === 0) {
        throw new Error(
            "Student update data is required."
        );
    }


    /*
    |----------------------------------------------------------------------
    | Check Existing Student
    |----------------------------------------------------------------------
    */

    const existing =
        await studentModel.findStudentById(
            studentId,
            schoolId
        );


    if (!existing) {
        throw new Error("Student not found.");
    }


    /*
    |----------------------------------------------------------------------
    | Check Student Number
    |----------------------------------------------------------------------
    */

    if (
        data.studentNumber &&
        typeof studentModel.studentNumberExists === "function"
    ) {

        const numberExists =
            await studentModel.studentNumberExists(
                data.studentNumber,
                schoolId,
                studentId
            );


        if (
            numberExists &&
            String(existing.student_number) !==
            String(data.studentNumber)
        ) {
            throw new Error(
                "A student with this student number already exists."
            );
        }
    }


    return await studentModel.updateStudent(
        studentId,
        schoolId,
        data
    );
}


/*
|--------------------------------------------------------------------------
| Delete Student
|--------------------------------------------------------------------------
*/

async function deleteStudent(
    studentId,
    schoolId
) {

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    const existing =
        await studentModel.findStudentById(
            studentId,
            schoolId
        );


    if (!existing) {
        throw new Error("Student not found.");
    }


    return await studentModel.deleteStudent(
        studentId,
        schoolId
    );
}


/*
|--------------------------------------------------------------------------
| Count Students
|--------------------------------------------------------------------------
*/

async function countStudents(
    schoolId
) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    if (
        typeof studentModel.countStudents !==
        "function"
    ) {
        return 0;
    }


    return await studentModel.countStudents(
        schoolId
    );
}


/*
|--------------------------------------------------------------------------
| Get Student Statistics
|--------------------------------------------------------------------------
*/

async function getStudentStatistics(
    schoolId
) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    if (
        typeof studentModel.getStudentStatistics !==
        "function"
    ) {
        return {};
    }


    return await studentModel.getStudentStatistics(
        schoolId
    );
}


/*
|--------------------------------------------------------------------------
| Get Students By Class
|--------------------------------------------------------------------------
*/

async function getStudentsByClass(
    classId,
    schoolId
) {

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    if (
        typeof studentModel.findStudentsByClass !==
        "function"
    ) {
        return [];
    }


    return await studentModel.findStudentsByClass(
        classId,
        schoolId
    );
}


/*
|--------------------------------------------------------------------------
| Get Students By Class Arm
|--------------------------------------------------------------------------
*/

async function getStudentsByClassArm(
    classArmId,
    schoolId
) {

    if (!classArmId) {
        throw new Error("Class arm ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    if (
        typeof studentModel.findStudentsByClassArm !==
        "function"
    ) {
        return [];
    }


    return await studentModel.findStudentsByClassArm(
        classArmId,
        schoolId
    );
}


/*
|--------------------------------------------------------------------------
| Get Students By Session
|--------------------------------------------------------------------------
*/

async function getStudentsBySession(
    sessionId,
    schoolId
) {

    if (!sessionId) {
        throw new Error(
            "Academic session ID is required."
        );
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    if (
        typeof studentModel.findStudentsBySession !==
        "function"
    ) {
        return [];
    }


    return await studentModel.findStudentsBySession(
        sessionId,
        schoolId
    );
}


/*
|--------------------------------------------------------------------------
| Get Student Profile
|--------------------------------------------------------------------------
*/

async function getStudentProfile(
    studentId,
    schoolId
) {

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    const student =
        await studentModel.findStudentById(
            studentId,
            schoolId
        );


    if (!student) {
        throw new Error("Student not found.");
    }


    return student;
}


/*
|--------------------------------------------------------------------------
| Transfer Student
|--------------------------------------------------------------------------
|
| Moves a student from one class/class arm to another.
|
|--------------------------------------------------------------------------
*/

async function transferStudent(
    studentId,
    schoolId,
    data
) {

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    if (!data) {
        throw new Error(
            "Transfer information is required."
        );
    }


    const existing =
        await studentModel.findStudentById(
            studentId,
            schoolId
        );


    if (!existing) {
        throw new Error("Student not found.");
    }


    if (
        typeof studentModel.transferStudent !==
        "function"
    ) {
        throw new Error(
            "Student transfer operation is not available in the student model."
        );
    }


    return await studentModel.transferStudent(
        studentId,
        schoolId,
        data
    );
}


/*
|--------------------------------------------------------------------------
| Update Student Status
|--------------------------------------------------------------------------
*/

async function updateStudentStatus(
    studentId,
    schoolId,
    status
) {

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!status) {
        throw new Error("Student status is required.");
    }


    const existing =
        await studentModel.findStudentById(
            studentId,
            schoolId
        );


    if (!existing) {
        throw new Error("Student not found.");
    }


    if (
        typeof studentModel.updateStudentStatus !==
        "function"
    ) {
        throw new Error(
            "Student status operation is not available in the student model."
        );
    }


    return await studentModel.updateStudentStatus(
        studentId,
        schoolId,
        status
    );
}


/*
|--------------------------------------------------------------------------
| Get Active Students
|--------------------------------------------------------------------------
*/

async function getActiveStudents(
    schoolId
) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    if (
        typeof studentModel.findStudents !==
        "function"
    ) {
        return [];
    }


    return await studentModel.findStudents({

        schoolId,

        status: "active"

    });
}


/*
|--------------------------------------------------------------------------
| Get Graduated Students
|--------------------------------------------------------------------------
*/

async function getGraduatedStudents(
    schoolId
) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    if (
        typeof studentModel.findStudents !==
        "function"
    ) {
        return [];
    }


    return await studentModel.findStudents({

        schoolId,

        status: "graduated"

    });
}


/*
|--------------------------------------------------------------------------
| Validate Student
|--------------------------------------------------------------------------
*/

async function validateStudent(
    studentId,
    schoolId
) {

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }


    const student =
        await studentModel.findStudentById(
            studentId,
            schoolId
        );


    return {

        valid: Boolean(student),

        student: student || null

    };
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    createStudent,

    getStudentById,

    getStudentByNumber,

    getStudents,

    searchStudents,

    updateStudent,

    deleteStudent,

    countStudents,

    getStudentStatistics,

    getStudentsByClass,

    getStudentsByClassArm,

    getStudentsBySession,

    getStudentProfile,

    transferStudent,

    updateStudentStatus,

    getActiveStudents,

    getGraduatedStudents,

    validateStudent

};