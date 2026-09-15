"use strict";

(function () {
const TOKEN_KEY = "school_management_token";
const USER_KEY = "school_management_user";

```
function getStoredStudent() {
    try {
        const rawUser = localStorage.getItem(USER_KEY);

        if (!rawUser) {
            return null;
        }

        return JSON.parse(rawUser);
    } catch (error) {
        console.error("Unable to read stored student:", error);
        return null;
    }
}

function getStudentDisplayName(student) {
    if (!student) {
        return "Student";
    }

    const firstName = student.firstName || student.first_name || "";
    const middleName = student.middleName || student.middle_name || "";
    const lastName = student.lastName || student.last_name || "";

    const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (fullName) {
        return fullName;
    }

    return (
        student.name ||
        student.fullName ||
        student.full_name ||
        student.email ||
        "Student"
    );
}

function getStudentNumber(student) {
    if (!student) {
        return "Student number not available";
    }

    return (
        student.studentNumber ||
        student.student_number ||
        student.admissionNumber ||
        student.admission_number ||
        "Student number not available"
    );
}

function getStudentEmail(student) {
    if (!student) {
        return "Not available";
    }

    return (
        student.email ||
        student.emailAddress ||
        student.email_address ||
        "Not available"
    );
}

function getStudentClass(student) {
    if (!student) {
        return "-";
    }

    return (
        student.className ||
        student.class_name ||
        student.class ||
        student.academicLevel ||
        student.academic_level ||
        "-"
    );
}

function getAcademicSession(student) {
    if (!student) {
        return "-";
    }

    return (
        student.sessionName ||
        student.session_name ||
        student.academicSession ||
        student.academic_session ||
        "-"
    );
}

function getCurrentTerm(student) {
    if (!student) {
        return "-";
    }

    return (
        student.termName ||
        student.term_name ||
        student.currentTerm ||
        student.current_term ||
        "-"
    );
}

function getStudentStatus(student) {
    if (!student) {
        return "Active";
    }

    return student.status || "Active";
}

function updateElement(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function updateStudentInformation(student) {
    const displayName = getStudentDisplayName(student);
    const studentNumber = getStudentNumber(student);
    const email = getStudentEmail(student);
    const studentClass = getStudentClass(student);
    const academicSession = getAcademicSession(student);
    const currentTerm = getCurrentTerm(student);
    const status = getStudentStatus(student);

    updateElement(
        "studentWelcome",
        "Welcome, " + displayName
    );

    updateElement(
        "studentDisplayName",
        displayName
    );

    updateElement(
        "studentDisplayNumber",
        studentNumber
    );

    updateElement(
        "studentName",
        displayName
    );

    updateElement(
        "studentNumber",
        studentNumber
    );

    updateElement(
        "studentEmail",
        email
    );

    updateElement(
        "studentClass",
        studentClass
    );

    updateElement(
        "studentSession",
        academicSession
    );

    updateElement(
        "studentTerm",
        currentTerm
    );

    updateElement(
        "studentStatus",
        status
    );
}

function hasAuthenticationToken() {
    const token = localStorage.getItem(TOKEN_KEY);

    return Boolean(token);
}

function redirectToLogin() {
    window.location.href = "/pages/login.html";
}

function checkAuthentication() {
    if (!hasAuthenticationToken()) {
        redirectToLogin();
        return false;
    }

    return true;
}

function logoutStudent() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    window.location.href = "/pages/login.html";
}

function setupLogoutButton() {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", function () {
        if (typeof window.logout === "function") {
            try {
                window.logout();
                return;
            } catch (error) {
                console.error("Existing logout function failed:", error);
            }
        }

        logoutStudent();
    });
}

function initializeStudentDashboard() {
    if (!checkAuthentication()) {
        return;
    }

    const student = getStoredStudent();

    updateStudentInformation(student);
    setupLogoutButton();
}

window.StudentDashboard = {
    initialize: initializeStudentDashboard,
    getStoredStudent: getStoredStudent,
    getStudentDisplayName: getStudentDisplayName,
    getStudentNumber: getStudentNumber,
    updateStudentInformation: updateStudentInformation,
    logout: logoutStudent
};

document.addEventListener("DOMContentLoaded", function () {
    initializeStudentDashboard();
});
```

})();
