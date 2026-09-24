"use strict";

/* ==========================================================================
RESULT ENTRY PAGE
==========================================================================

Workflow:

Student
    ↓
Academic Session
    ↓
Student Enrollment
    ↓
Student Class
    ↓
Subjects Assigned To Class
    ↓
Existing Results For Student / Session / Term
    ↓
Enter All Subjects In One Table
    ↓
Save All Results
    ↓
Report Card

The database continues to store one result row per:
student / academic session / term / subject.

The user enters all subjects from one workspace.

========================================================================== */

(function () {
    const elements = {
        messageContainer:
            document.getElementById(
                "resultEntryMessageContainer"
            ),

        admissionNumber:
            document.getElementById(
                "admissionNumber"
            ),

        findStudentButton:
            document.getElementById(
                "findStudentButton"
            ),

        studentSearchMessage:
            document.getElementById(
                "studentSearchMessage"
            ),

        studentSummary:
            document.getElementById(
                "studentSummary"
            ),

        studentName:
            document.getElementById(
                "studentName"
            ),

        displayAdmissionNumber:
            document.getElementById(
                "displayAdmissionNumber"
            ),

        studentClass:
            document.getElementById(
                "studentClass"
            ),

        sessionId:
            document.getElementById(
                "sessionId"
            ),

        termId:
            document.getElementById(
                "termId"
            ),

        resultEntryForm:
            document.getElementById(
                "resultEntryForm"
            ),

        subjectResultsBody:
            document.getElementById(
                "subjectResultsBody"
            ),

        addSubjectButton:
            document.getElementById(
                "addSubjectButton"
            ),

        noSubjectMessage:
            document.getElementById(
                "noSubjectMessage"
            ),

        resultValidationMessage:
            document.getElementById(
                "resultValidationMessage"
            ),

        subjectCount:
            document.getElementById(
                "subjectCount"
            ),

        overallTotal:
            document.getElementById(
                "overallTotal"
            ),

        overallAverage:
            document.getElementById(
                "overallAverage"
            ),

        overallStatus:
            document.getElementById(
                "overallStatus"
            ),

        teacherComment:
            document.getElementById(
                "teacherComment"
            ),

        resetResultEntryButton:
            document.getElementById(
                "resetResultEntryButton"
            ),

        saveResultButton:
            document.getElementById(
                "saveResultButton"
            ),

        currentUser:
            document.getElementById(
                "currentUser"
            ),

        logoutButton:
            document.getElementById(
                "logoutButton"
            )
    };

    const state = {
        sessions: [],
        terms: [],

        selectedStudent: null,
        enrollment: null,

        subjects: [],
        subjectRows: [],
        existingResults: [],

        loadingStudent: false,
        loadingWorkspace: false,
        loadingResults: false,
        saving: false,

        initialized: false
    };

    /* ==========================================================================
    RESPONSE HELPERS
    ========================================================================== */

    function getResponseData(response) {
        if (!response) {
            return null;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                response,
                "data"
            )
        ) {
            return response.data;
        }

        return response;
    }

    function getResponseArray(
        response,
        possibleKeys = []
    ) {
        const data =
            getResponseData(response);

        if (Array.isArray(data)) {
            return data;
        }

        if (
            data &&
            typeof data === "object"
        ) {
            for (
                const key of possibleKeys
            ) {
                if (
                    Array.isArray(
                        data[key]
                    )
                ) {
                    return data[key];
                }
            }

            const commonKeys = [
                "rows",
                "results",
                "students",
                "subjects",
                "enrollments",
                "sessions",
                "terms",
                "academicSessions"
            ];

            for (
                const key of commonKeys
            ) {
                if (
                    Array.isArray(
                        data[key]
                    )
                ) {
                    return data[key];
                }
            }
        }

        return [];
    }

    function getResponseObject(response) {
        const data =
            getResponseData(response);

        if (!data) {
            return null;
        }

        if (Array.isArray(data)) {
            return data[0] || null;
        }

        const objectKeys = [
            "student",
            "enrollment",
            "result",
            "data"
        ];

        for (
            const key of objectKeys
        ) {
            if (
                data[key] &&
                typeof data[key] ===
                    "object" &&
                !Array.isArray(
                    data[key]
                )
            ) {
                return data[key];
            }
        }

        return data;
    }

    /* ==========================================================================
    HTML SAFETY
    ========================================================================== */

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    /* ==========================================================================
    MESSAGES
    ========================================================================== */

    function showMessage(
        message,
        type = "info"
    ) {
        if (
            !elements.messageContainer
        ) {
            return;
        }

        const safeType = [
            "success",
            "danger",
            "warning",
            "info"
        ].includes(type)
            ? type
            : "info";

        elements.messageContainer.innerHTML = `
            <div
                class="alert alert-${safeType}"
                role="alert"
            >
                ${escapeHtml(message)}
            </div>
        `;
    }

    function clearMessage() {
        if (
            elements.messageContainer
        ) {
            elements.messageContainer.innerHTML =
                "";
        }
    }

    function showStudentSearchMessage(
        message,
        type = "info"
    ) {
        if (
            !elements.studentSearchMessage
        ) {
            return;
        }

        if (!message) {
            elements.studentSearchMessage.innerHTML =
                "";
            return;
        }

        const safeType = [
            "success",
            "danger",
            "warning",
            "info"
        ].includes(type)
            ? type
            : "info";

        elements.studentSearchMessage.innerHTML = `
            <div class="alert alert-${safeType} py-2 mb-0">
                ${escapeHtml(message)}
            </div>
        `;
    }

    function showValidationMessage(
        message,
        type = "danger"
    ) {
        if (
            !elements.resultValidationMessage
        ) {
            return;
        }

        if (!message) {
            elements.resultValidationMessage.innerHTML =
                "";
            return;
        }

        const safeType = [
            "success",
            "danger",
            "warning",
            "info"
        ].includes(type)
            ? type
            : "danger";

        elements.resultValidationMessage.innerHTML = `
            <div class="alert alert-${safeType} py-2">
                ${escapeHtml(message)}
            </div>
        `;
    }

    /* ==========================================================================
    ID HELPERS
    ========================================================================== */

    function normalizeId(value) {
        if (
            value === undefined ||
            value === null
        ) {
            return "";
        }

        return String(value).trim();
    }

    function getStudentId(student) {
        return normalizeId(
            student?.id ||
                student?.student_id ||
                student?.studentId
        );
    }

    function getSubjectId(subject) {
    return normalizeId(
        subject?.subject_id ||
            subject?.subjectId ||
            subject?.id
    );
}

    function getSessionId(session) {
        return normalizeId(
            session?.id ||
                session?.academic_session_id ||
                session?.academicSessionId
        );
    }

    function getTermId(term) {
        return normalizeId(
            term?.id ||
                term?.term_id ||
                term?.termId
        );
    }

    function getResultId(result) {
        return normalizeId(
            result?.id ||
                result?.result_id ||
                result?.resultId
        );
    }

    function getEnrollmentClassId(
        enrollment
    ) {
        return normalizeId(
            enrollment?.class_id ||
                enrollment?.classId
        );
    }

    /* ==========================================================================
    DISPLAY HELPERS
    ========================================================================== */

    function getStudentAdmissionNumber(
        student
    ) {
        return (
            student?.admission_number ||
            student?.admissionNumber ||
            student?.student_number ||
            student?.studentNumber ||
            ""
        );
    }

    function getStudentName(student) {
        if (!student) {
            return "";
        }

        if (student.name) {
            return student.name;
        }

        const firstName =
            student.first_name ||
            student.firstName ||
            "";

        const middleName =
            student.middle_name ||
            student.middleName ||
            "";

        const lastName =
            student.last_name ||
            student.lastName ||
            "";

        return [
            firstName,
            middleName,
            lastName
        ]
            .filter(Boolean)
            .join(" ")
            .trim();
    }

    function getStudentClassName(
        student
    ) {
        return (
            student?.class_name ||
            student?.className ||
            student?.class ||
            student?.class_level ||
            student?.classLevel ||
            ""
        );
    }

    function getSubjectName(subject) {
        return (
            subject?.subject_name ||
            subject?.subjectName ||
            subject?.name ||
            subject?.title ||
            "Unnamed Subject"
        );
    }

    function getSubjectCode(subject) {
        return (
            subject?.subject_code ||
            subject?.subjectCode ||
            ""
        );
    }

    function getSessionName(session) {
        return (
            session?.session_name ||
            session?.sessionName ||
            session?.name ||
            session?.academic_session ||
            session?.academicSession ||
            ""
        );
    }

    function getTermName(term) {
        return (
            term?.term_name ||
            term?.termName ||
            term?.name ||
            ""
        );
    }

    function getEnrollmentClassName(
        enrollment
    ) {
        return (
            enrollment?.class_name ||
            enrollment?.className ||
            ""
        );
    }

    function getEnrollmentArmName(
        enrollment
    ) {
        return (
            enrollment?.arm_name ||
            enrollment?.armName ||
            enrollment?.class_arm_name ||
            enrollment?.classArmName ||
            ""
        );
    }

    function getEnrollmentDepartmentName(
        enrollment
    ) {
        return (
            enrollment?.department_name ||
            enrollment?.departmentName ||
            ""
        );
    }

    /* ==========================================================================
    SCORE / GRADE HELPERS
    ========================================================================== */

    function normalizeScore(value) {
        if (
            value === "" ||
            value === null ||
            value === undefined
        ) {
            return 0;
        }

        const number =
            Number(value);

        if (
            !Number.isFinite(number)
        ) {
            return 0;
        }

        return (
            Math.round(
                number * 100
            ) / 100
        );
    }

    function calculateTotal(
        caScore,
        examScore
    ) {
        return (
            Math.round(
                (
                    normalizeScore(
                        caScore
                    ) +
                    normalizeScore(
                        examScore
                    )
                ) * 100
            ) / 100
        );
    }

    function calculateGrade(
        totalScore
    ) {
        const score =
            normalizeScore(
                totalScore
            );

        if (score >= 75) {
            return "A";
        }

        if (score >= 65) {
            return "B";
        }

        if (score >= 55) {
            return "C";
        }

        if (score >= 45) {
            return "D";
        }

        if (score >= 40) {
            return "E";
        }

        return "F";
    }

    function calculateRemark(
        totalScore
    ) {
        const score =
            normalizeScore(
                totalScore
            );

        if (score >= 75) {
            return "Excellent";
        }

        if (score >= 65) {
            return "Very Good";
        }

        if (score >= 55) {
            return "Good";
        }

        if (score >= 45) {
            return "Fair";
        }

        if (score >= 40) {
            return "Pass";
        }

        return "Fail";
    }

    function calculateGradePoint(
        totalScore
    ) {
        const score =
            normalizeScore(
                totalScore
            );

        if (score >= 75) {
            return 4.0;
        }

        if (score >= 65) {
            return 3.0;
        }

        if (score >= 55) {
            return 2.0;
        }

        if (score >= 45) {
            return 1.0;
        }

        return 0.0;
    }

    /* ==========================================================================
    STUDENT SUMMARY
    ========================================================================== */

    function updateStudentSummary() {
        const student =
            state.selectedStudent;

        if (!student) {
            if (
                elements.studentSummary
            ) {
                elements.studentSummary.classList.add(
                    "d-none"
                );
            }

            if (
                elements.studentName
            ) {
                elements.studentName.textContent =
                    "";
            }

            if (
                elements.displayAdmissionNumber
            ) {
                elements.displayAdmissionNumber.textContent =
                    "";
            }

            if (
                elements.studentClass
            ) {
                elements.studentClass.textContent =
                    "";
            }

            return;
        }

        if (
            elements.studentSummary
        ) {
            elements.studentSummary.classList.remove(
                "d-none"
            );
        }

        if (
            elements.studentName
        ) {
            elements.studentName.textContent =
                getStudentName(
                    student
                ) ||
                "Unnamed Student";
        }

        if (
            elements.displayAdmissionNumber
        ) {
            elements.displayAdmissionNumber.textContent =
                getStudentAdmissionNumber(
                    student
                ) ||
                "N/A";
        }

        let classText =
            getEnrollmentClassName(
                state.enrollment
            ) ||
            getStudentClassName(
                student
            ) ||
            "Class not assigned";

        const armName =
            getEnrollmentArmName(
                state.enrollment
            );

        if (
            armName &&
            !classText
                .toLowerCase()
                .includes(
                    armName.toLowerCase()
                )
        ) {
            classText +=
                ` - ${armName}`;
        }

        const departmentName =
            getEnrollmentDepartmentName(
                state.enrollment
            );

        if (
            departmentName &&
            !classText
                .toLowerCase()
                .includes(
                    departmentName.toLowerCase()
                )
        ) {
            classText +=
                ` - ${departmentName}`;
        }

        if (
            elements.studentClass
        ) {
            elements.studentClass.textContent =
                classText;
        }
    }

    function clearWorkspace() {
        state.enrollment =
            null;

        state.subjects =
            [];

        state.subjectRows =
            [];

        state.existingResults =
            [];

        updateStudentSummary();
        renderSubjectRows();
        updateSummary();
    }

    function setStudent(student) {
        state.selectedStudent =
            student || null;

        clearWorkspace();

        if (state.selectedStudent) {
            showStudentSearchMessage(
                "Student found successfully. Select an academic session to load the student's class and subjects.",
                "success"
            );
        }
    }

    /* ==========================================================================
    FIND STUDENT
    ========================================================================== */

    async function findStudent() {
        clearMessage();
        showValidationMessage("");

        const admissionNumber =
            elements.admissionNumber
                ? elements.admissionNumber.value.trim()
                : "";

        if (!admissionNumber) {
            setStudent(null);

            showStudentSearchMessage(
                "Enter the student's admission number.",
                "warning"
            );

            return;
        }

        if (state.loadingStudent) {
            return;
        }

        state.loadingStudent =
            true;

        if (
            elements.findStudentButton
        ) {
            elements.findStudentButton.disabled =
                true;

            elements.findStudentButton.innerHTML = `
                <span class="spinner-border spinner-border-sm me-1"></span>
                Searching...
            `;
        }

        showStudentSearchMessage(
            "Searching for student...",
            "info"
        );

        try {
            const response =
                await apiRequest(
                    `/students/admission/${encodeURIComponent(
                        admissionNumber
                    )}`
                );

            const student =
                getResponseObject(
                    response
                );

            if (!student) {
                setStudent(null);

                showStudentSearchMessage(
                    "No student was found with that admission number.",
                    "danger"
                );

                return;
            }

            const studentId =
                getStudentId(
                    student
                );

            if (!studentId) {
                setStudent(null);

                showStudentSearchMessage(
                    "The student record was found, but it does not contain a valid student ID.",
                    "danger"
                );

                return;
            }

            setStudent(student);
        } catch (error) {
            console.error(
                "Find student error:",
                error
            );

            setStudent(null);

            showStudentSearchMessage(
                error.message ||
                    "Unable to search for the student.",
                "danger"
            );
        } finally {
            state.loadingStudent =
                false;

            if (
                elements.findStudentButton
            ) {
                elements.findStudentButton.disabled =
                    false;

                elements.findStudentButton.innerHTML = `
                    <i class="bi bi-search me-1"></i>
                    Find Student
                `;
            }
        }
    }

    /* ==========================================================================
    SESSION / TERM DROPDOWNS
    ========================================================================== */

    function populateSessions() {
        if (!elements.sessionId) {
            return;
        }

        elements.sessionId.innerHTML = `
            <option value="">
                Select Academic Session
            </option>
        `;

        state.sessions.forEach(
            (session) => {
                const id =
                    getSessionId(
                        session
                    );

                if (!id) {
                    return;
                }

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    id;

                option.textContent =
                    getSessionName(
                        session
                    ) || id;

                elements.sessionId.appendChild(
                    option
                );
            }
        );
    }

    function populateTerms() {
        if (!elements.termId) {
            return;
        }

        elements.termId.innerHTML = `
            <option value="">
                Select Term
            </option>
        `;

        state.terms.forEach(
            (term) => {
                const id =
                    getTermId(
                        term
                    );

                if (!id) {
                    return;
                }

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    id;

                option.textContent =
                    getTermName(
                        term
                    ) || id;

                elements.termId.appendChild(
                    option
                );
            }
        );
    }

    /* ==========================================================================
    STUDENT ENROLLMENT
    ========================================================================== */

    async function loadStudentEnrollment() {
        if (
            !state.selectedStudent
        ) {
            throw new Error(
                "Find a student before selecting an academic session."
            );
        }

        const studentId =
            getStudentId(
                state.selectedStudent
            );

        const academicSessionId =
            normalizeId(
                elements.sessionId?.value
            );

        if (!studentId) {
            throw new Error(
                "The selected student does not have a valid student ID."
            );
        }

        if (!academicSessionId) {
            throw new Error(
                "Select an academic session."
            );
        }

        const response =
            await apiRequest(
                `/enrollments/student/${encodeURIComponent(
                    studentId
                )}/session/${encodeURIComponent(
                    academicSessionId
                )}`
            );

        const enrollments =
            getResponseArray(
                response,
                [
                    "enrollments"
                ]
            );

        let enrollment =
            enrollments[0] ||
            null;

        if (!enrollment) {
            const object =
                getResponseObject(
                    response
                );

            if (
                object &&
                getEnrollmentClassId(
                    object
                )
            ) {
                enrollment =
                    object;
            }
        }

        if (!enrollment) {
            throw new Error(
                "This student does not have an enrollment for the selected academic session."
            );
        }

        const classId =
            getEnrollmentClassId(
                enrollment
            );

        if (!classId) {
            throw new Error(
                "The student's enrollment does not have a class assigned."
            );
        }

        state.enrollment =
            enrollment;

        updateStudentSummary();

        return enrollment;
    }

    /* ==========================================================================
    CLASS SUBJECTS
    ========================================================================== */

    async function loadClassSubjects() {
        if (
            !state.enrollment
        ) {
            throw new Error(
                "Student enrollment is required before loading subjects."
            );
        }

        const classId =
            getEnrollmentClassId(
                state.enrollment
            );

        if (!classId) {
            throw new Error(
                "No class was found for the student's selected academic session."
            );
        }

        const response =
            await apiRequest(
                `/subjects/class/${encodeURIComponent(
                    classId
                )}`
            );

        const subjects =
            getResponseArray(
                response,
                [
                    "subjects"
                ]
            );

        state.subjects =
            subjects
                .map(
                    (subject) => ({
                        ...subject,
                        id:
                            getSubjectId(
                                subject
                            )
                    })
                )
                .filter(
                    (subject) =>
                        Boolean(
                            getSubjectId(
                                subject
                            )
                        )
                );

        return state.subjects;
    }

    /* ==========================================================================
    EXISTING RESULTS
    ========================================================================== */

    async function loadExistingResults() {
        if (
            !state.selectedStudent
        ) {
            state.existingResults =
                [];

            return [];
        }

        const studentId =
            getStudentId(
                state.selectedStudent
            );

        const sessionId =
            normalizeId(
                elements.sessionId?.value
            );

        const termId =
            normalizeId(
                elements.termId?.value
            );

        if (
            !studentId ||
            !sessionId ||
            !termId
        ) {
            state.existingResults =
                [];

            return [];
        }

        state.loadingResults =
            true;

        try {
            const response =
                await apiRequest(
                    `/results/student/${encodeURIComponent(
                        studentId
                    )}?sessionId=${encodeURIComponent(
                        sessionId
                    )}&termId=${encodeURIComponent(
                        termId
                    )}`
                );

            state.existingResults =
                getResponseArray(
                    response,
                    [
                        "results"
                    ]
                );

            return state.existingResults;
        } finally {
            state.loadingResults =
                false;
        }
    }

    function getExistingResultForSubject(
        subjectId
    ) {
        const normalizedSubjectId =
            normalizeId(
                subjectId
            );

        return (
            state.existingResults.find(
                (result) =>
                    normalizeId(
                        result?.subject_id ||
                            result?.subjectId
                    ) ===
                    normalizedSubjectId
            ) || null
        );
    }

    /* ==========================================================================
    RESULT ROWS
    ========================================================================== */

    function createResultRow(
        subject,
        existingResult = null
    ) {
        const subjectId =
            getSubjectId(
                subject
            );

        const caScore =
            normalizeScore(
                existingResult?.ca_score ??
                    existingResult?.caScore ??
                    0
            );

        const examScore =
            normalizeScore(
                existingResult?.exam_score ??
                    existingResult?.examScore ??
                    0
            );

        const totalScore =
            calculateTotal(
                caScore,
                examScore
            );

        return {
            rowId:
                `result-row-${subjectId}`,

            resultId:
                getResultId(
                    existingResult
                ),

            subjectId,

            subjectName:
                getSubjectName(
                    subject
                ),

            subjectCode:
                getSubjectCode(
                    subject
                ),

            caScore,

            examScore,

            totalScore,

            grade:
                existingResult?.grade ||
                calculateGrade(
                    totalScore
                ),

            remark:
                calculateRemark(
                    totalScore
                ),

            gradePoint:
                normalizeScore(
                    existingResult?.grade_point ??
                        existingResult?.gradePoint ??
                        calculateGradePoint(
                            totalScore
                        )
                )
        };
    }

    function buildSubjectRows() {
        state.subjectRows =
            state.subjects.map(
                (subject) =>
                    createResultRow(
                        subject,
                        getExistingResultForSubject(
                            getSubjectId(
                                subject
                            )
                        )
                    )
            );

        renderSubjectRows();
        updateSummary();
    }

    /* ==========================================================================
    SUBJECT TABLE
    ========================================================================== */

    function renderSubjectRows() {
        if (
            !elements.subjectResultsBody
        ) {
            return;
        }

        if (
            !state.subjectRows.length
        ) {
            elements.subjectResultsBody.innerHTML =
                "";

            if (
                elements.noSubjectMessage
            ) {
                elements.noSubjectMessage.classList.remove(
                    "d-none"
                );

                elements.noSubjectMessage.textContent =
                    "Select a student and academic session to automatically load the subjects assigned to the student's class.";
            }

            return;
        }

        if (
            elements.noSubjectMessage
        ) {
            elements.noSubjectMessage.classList.add(
                "d-none"
            );
        }

        elements.subjectResultsBody.innerHTML =
            state.subjectRows
                .map(
                    (row) => `
                        <tr data-row-id="${escapeHtml(
                            row.rowId
                        )}">
                            <td>
                                <div class="fw-semibold">
                                    ${escapeHtml(
                                        row.subjectName
                                    )}
                                </div>

                                ${
                                    row.subjectCode
                                        ? `
                                            <div class="small text-muted">
                                                ${escapeHtml(
                                                    row.subjectCode
                                                )}
                                            </div>
                                        `
                                        : ""
                                }
                            </td>

                            <td>
                                <input
                                    type="number"
                                    class="form-control form-control-sm ca-score-input"
                                    data-row-id="${escapeHtml(
                                        row.rowId
                                    )}"
                                    min="0"
                                    max="40"
                                    step="0.01"
                                    value="${escapeHtml(
                                        row.caScore
                                    )}"
                                    aria-label="${escapeHtml(
                                        row.subjectName
                                    )} CA score"
                                >
                            </td>

                            <td>
                                <input
                                    type="number"
                                    class="form-control form-control-sm exam-score-input"
                                    data-row-id="${escapeHtml(
                                        row.rowId
                                    )}"
                                    min="0"
                                    max="60"
                                    step="0.01"
                                    value="${escapeHtml(
                                        row.examScore
                                    )}"
                                    aria-label="${escapeHtml(
                                        row.subjectName
                                    )} examination score"
                                >
                            </td>

                            <td class="text-center">
                                <span
                                    class="fw-semibold total-score"
                                    data-row-id="${escapeHtml(
                                        row.rowId
                                    )}"
                                >
                                    ${escapeHtml(
                                        row.totalScore.toFixed(
                                            2
                                        )
                                    )}
                                </span>
                            </td>

                            <td class="text-center">
                                <span
                                    class="badge text-bg-secondary grade-value"
                                    data-row-id="${escapeHtml(
                                        row.rowId
                                    )}"
                                >
                                    ${escapeHtml(
                                        row.grade
                                    )}
                                </span>
                            </td>

                            <td>
                                <span
                                    class="remark-value"
                                    data-row-id="${escapeHtml(
                                        row.rowId
                                    )}"
                                >
                                    ${escapeHtml(
                                        row.remark
                                    )}
                                </span>
                            </td>

                            <td class="text-center">
                                <i
                                    class="bi bi-check-circle text-success"
                                    title="Subject automatically included from the student's class"
                                    aria-label="Included"
                                ></i>
                            </td>
                        </tr>
                    `
                )
                .join("");

        bindSubjectRowEvents();
    }

    function bindSubjectRowEvents() {
        if (
            !elements.subjectResultsBody
        ) {
            return;
        }

        elements.subjectResultsBody
            .querySelectorAll(
                ".ca-score-input"
            )
            .forEach(
                (input) => {
                    input.addEventListener(
                        "input",
                        (event) => {
                            updateScore(
                                event
                                    .target
                                    .dataset
                                    .rowId,
                                "caScore",
                                event
                                    .target
                                    .value
                            );
                        }
                    );
                }
            );

        elements.subjectResultsBody
            .querySelectorAll(
                ".exam-score-input"
            )
            .forEach(
                (input) => {
                    input.addEventListener(
                        "input",
                        (event) => {
                            updateScore(
                                event
                                    .target
                                    .dataset
                                    .rowId,
                                "examScore",
                                event
                                    .target
                                    .value
                            );
                        }
                    );
                }
            );
    }

    function updateScore(
        rowId,
        field,
        value
    ) {
        const row =
            state.subjectRows.find(
                (item) =>
                    item.rowId ===
                    rowId
            );

        if (!row) {
            return;
        }

        let score =
            Number(value);

        if (
            !Number.isFinite(score)
        ) {
            score = 0;
        }

        if (
            field === "caScore"
        ) {
            score =
                Math.max(
                    0,
                    Math.min(
                        40,
                        score
                    )
                );

            row.caScore =
                normalizeScore(
                    score
                );
        }

        if (
            field === "examScore"
        ) {
            score =
                Math.max(
                    0,
                    Math.min(
                        60,
                        score
                    )
                );

            row.examScore =
                normalizeScore(
                    score
                );
        }

        row.totalScore =
            calculateTotal(
                row.caScore,
                row.examScore
            );

        row.grade =
            calculateGrade(
                row.totalScore
            );

        row.remark =
            calculateRemark(
                row.totalScore
            );

        row.gradePoint =
            calculateGradePoint(
                row.totalScore
            );

        updateRenderedRow(
            row
        );

        updateSummary();
    }

    function updateRenderedRow(
        row
    ) {
        if (
            !elements.subjectResultsBody
        ) {
            return;
        }

        const rowElement =
            Array.from(
                elements.subjectResultsBody
                    .querySelectorAll(
                        "tr"
                    )
            ).find(
                (element) =>
                    element.dataset
                        .rowId ===
                    row.rowId
            );

        if (!rowElement) {
            return;
        }

        const totalElement =
            rowElement.querySelector(
                ".total-score"
            );

        const gradeElement =
            rowElement.querySelector(
                ".grade-value"
            );

        const remarkElement =
            rowElement.querySelector(
                ".remark-value"
            );

        if (totalElement) {
            totalElement.textContent =
                row.totalScore.toFixed(
                    2
                );
        }

        if (gradeElement) {
            gradeElement.textContent =
                row.grade;
        }

        if (remarkElement) {
            remarkElement.textContent =
                row.remark;
        }
    }

    /* ==========================================================================
    SUMMARY
    ========================================================================== */

    function updateSummary() {
        const rows =
            state.subjectRows;

        const subjectCount =
            rows.length;

        const total =
            rows.reduce(
                (
                    sum,
                    row
                ) =>
                    sum +
                    normalizeScore(
                        row.totalScore
                    ),
                0
            );

        const average =
            subjectCount > 0
                ? total /
                  subjectCount
                : 0;

        const roundedAverage =
            Math.round(
                average * 100
            ) / 100;

        if (
            elements.subjectCount
        ) {
            elements.subjectCount.value =
                String(
                    subjectCount
                );
        }

        if (
            elements.overallTotal
        ) {
            elements.overallTotal.value =
                total.toFixed(
                    2
                );
        }

        if (
            elements.overallAverage
        ) {
            elements.overallAverage.value =
                roundedAverage.toFixed(
                    2
                );
        }

        if (
            elements.overallStatus
        ) {
            if (!subjectCount) {
                elements.overallStatus.value =
                    "-";
            } else if (
                rows.every(
                    (row) =>
                        normalizeScore(
                            row.totalScore
                        ) >= 40
                )
            ) {
                elements.overallStatus.value =
                    "Pass";
            } else {
                elements.overallStatus.value =
                    "Needs Attention";
            }
        }
    }

    /* ==========================================================================
    LOAD COMPLETE RESULT WORKSPACE
    ========================================================================== */

    async function loadResultsWorkspace() {
        showValidationMessage("");

        if (
            !state.selectedStudent
        ) {
            clearWorkspace();

            showValidationMessage(
                "Find a student before selecting an academic session.",
                "warning"
            );

            return;
        }

        const sessionId =
            normalizeId(
                elements.sessionId?.value
            );

        if (!sessionId) {
            clearWorkspace();

            showValidationMessage(
                "Select an academic session to load the student's class subjects.",
                "warning"
            );

            return;
        }

        if (
            state.loadingWorkspace
        ) {
            return;
        }

        state.loadingWorkspace =
            true;

        try {
            showStudentSearchMessage(
                "Loading the student's class and subjects...",
                "info"
            );

            state.enrollment =
                null;

            state.subjects =
                [];

            state.subjectRows =
                [];

            state.existingResults =
                [];

            updateStudentSummary();
            renderSubjectRows();
            updateSummary();

            await loadStudentEnrollment();

            await loadClassSubjects();

            if (
                !state.subjects.length
            ) {
                renderSubjectRows();
                updateSummary();

                showStudentSearchMessage(
                    "No subjects have been assigned to this student's class yet.",
                    "warning"
                );

                return;
            }

            const termId =
                normalizeId(
                    elements.termId?.value
                );

            if (termId) {
                await loadExistingResults();
            }

            buildSubjectRows();

            if (
                termId &&
                state.existingResults
                    .length
            ) {
                showStudentSearchMessage(
                    `${state.subjects.length} subject(s) loaded with existing results. You can edit the scores and save again.`,
                    "success"
                );
            } else {
                showStudentSearchMessage(
                    `${state.subjects.length} subject(s) loaded from the student's class. Enter all scores below.`,
                    "success"
                );
            }
        } catch (error) {
            console.error(
                "Load result workspace error:",
                error
            );

            clearWorkspace();

            showMessage(
                error.message ||
                    "Unable to load the student's result workspace.",
                "danger"
            );

            showStudentSearchMessage(
                error.message ||
                    "Unable to load the student's class subjects.",
                "danger"
            );
        } finally {
            state.loadingWorkspace =
                false;
        }
    }

    async function handleTermChange() {
        showValidationMessage("");

        if (
            !state.selectedStudent
        ) {
            showValidationMessage(
                "Find a student before selecting a term.",
                "warning"
            );

            return;
        }

        if (
            !elements.sessionId?.value
        ) {
            showValidationMessage(
                "Select an academic session first.",
                "warning"
            );

            return;
        }

        if (
            !elements.termId?.value
        ) {
            return;
        }

        if (
            !state.enrollment ||
            !state.subjects.length
        ) {
            await loadResultsWorkspace();

            return;
        }

        try {
            showStudentSearchMessage(
                "Loading existing results for the selected term...",
                "info"
            );

            await loadExistingResults();

            buildSubjectRows();

            if (
                state.existingResults
                    .length
            ) {
                showStudentSearchMessage(
                    `${state.subjects.length} subject(s) loaded with existing results for this term.`,
                    "success"
                );
            } else {
                showStudentSearchMessage(
                    `${state.subjects.length} subject(s) ready for result entry.`,
                    "success"
                );
            }
        } catch (error) {
            console.error(
                "Load term results error:",
                error
            );

            showMessage(
                error.message ||
                    "Unable to load existing results.",
                "danger"
            );

            showStudentSearchMessage(
                error.message ||
                    "Unable to load existing results.",
                "danger"
            );
        }
    }

    /* ==========================================================================
    VALIDATION
    ========================================================================== */

    function validateEntry() {
        if (
            !state.selectedStudent
        ) {
            return "Find a student before saving results.";
        }

        if (
            !elements.sessionId?.value
        ) {
            return "Select an academic session.";
        }

        if (
            !elements.termId?.value
        ) {
            return "Select a term.";
        }

        if (!state.enrollment) {
            return "The student's enrollment for the selected academic session could not be found.";
        }

        if (
            !getEnrollmentClassId(
                state.enrollment
            )
        ) {
            return "The student's enrollment does not have a class assigned.";
        }

        if (
            !state.subjectRows.length
        ) {
            return "No subjects are available for this student's class.";
        }

        const seenSubjects =
            new Set();

        for (
            let index = 0;
            index <
            state.subjectRows.length;
            index += 1
        ) {
            const row =
                state.subjectRows[
                    index
                ];

            const subjectId =
                normalizeId(
                    row.subjectId
                );

            if (!subjectId) {
                return `Subject ${
                    index + 1
                } is missing a subject ID.`;
            }

            if (
                seenSubjects.has(
                    subjectId
                )
            ) {
                return "The same subject cannot be entered more than once.";
            }

            seenSubjects.add(
                subjectId
            );

            const caScore =
                normalizeScore(
                    row.caScore
                );

            const examScore =
                normalizeScore(
                    row.examScore
                );

            if (
                caScore < 0 ||
                caScore > 40
            ) {
                return `CA score for ${row.subjectName} must be between 0 and 40.`;
            }

            if (
                examScore < 0 ||
                examScore > 60
            ) {
                return `Examination score for ${row.subjectName} must be between 0 and 60.`;
            }

            const totalScore =
                calculateTotal(
                    caScore,
                    examScore
                );

            if (
                totalScore < 0 ||
                totalScore > 100
            ) {
                return `Total score for ${row.subjectName} must be between 0 and 100.`;
            }
        }

        return "";
    }

    /* ==========================================================================
    BULK RESULT PAYLOAD
    ========================================================================== */

    function buildResultPayload(
        row
    ) {
        const studentId =
            getStudentId(
                state.selectedStudent
            );

        const sessionId =
            normalizeId(
                elements.sessionId?.value
            );

        const termId =
            normalizeId(
                elements.termId?.value
            );

        const classId =
            getEnrollmentClassId(
                state.enrollment
            );

        const caScore =
            normalizeScore(
                row.caScore
            );

        const examScore =
            normalizeScore(
                row.examScore
            );

        const totalScore =
            calculateTotal(
                caScore,
                examScore
            );

        return {
            studentId,

            academicSessionId:
                sessionId,

            termId,

            classId,

            subjectId:
                normalizeId(
                    row.subjectId
                ),

            caScore,

            examScore,

            totalScore,

            grade:
                calculateGrade(
                    totalScore
                ),

            gradePoint:
                calculateGradePoint(
                    totalScore
                ),

            teacherRemark:
                elements.teacherComment
                    ?.value
                    .trim() ||
                null
        };
    }

    /* ==========================================================================
    SAVE ALL RESULTS
    ========================================================================== */

    async function saveResults() {
        clearMessage();
        showValidationMessage("");

        const validationMessage =
            validateEntry();

        if (validationMessage) {
            showValidationMessage(
                validationMessage
            );

            return;
        }

        if (state.saving) {
            return;
        }

        state.saving =
            true;

        if (
            elements.saveResultButton
        ) {
            elements.saveResultButton.disabled =
                true;

            elements.saveResultButton.innerHTML = `
                <span class="spinner-border spinner-border-sm me-1"></span>
                Saving All Results...
            `;
        }

        try {
            const results =
                state.subjectRows.map(
                    (row) =>
                        buildResultPayload(
                            row
                        )
                );

            /*
            IMPORTANT:
            This uses the bulk route added to resultRoutes.js.

            POST /api/results/bulk
            */

            const response =
                await apiRequest(
                    "/results/bulk",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            {
                                results
                            }
                        )
                    }
                );

            const responseData =
                getResponseData(
                    response
                );

            const savedResults =
                getResponseArray(
                    response,
                    [
                        "results"
                    ]
                );

            let savedCount =
                savedResults.length;

            if (
                !savedCount &&
                responseData &&
                typeof responseData ===
                    "object" &&
                Number.isFinite(
                    Number(
                        responseData.count
                    )
                )
            ) {
                savedCount =
                    Number(
                        responseData.count
                    );
            }

            if (!savedCount) {
                savedCount =
                    results.length;
            }

            showValidationMessage(
                `${savedCount} result${
                    savedCount === 1
                        ? ""
                        : "s"
                } saved successfully.`,
                "success"
            );

            showMessage(
                `All ${savedCount} subject results for ${getStudentName(
                    state.selectedStudent
                )} have been saved successfully.`,
                "success"
            );

            /*
            Results have been successfully saved.

            Give the user a short confirmation, then move
            directly to the Results page.
            */

            showStudentSearchMessage(
                "All subject results have been saved successfully. Redirecting to the Results page...",
                "success"
            );

            /*
            Allow the success message to be visible briefly
            before navigating away from the entry form.
            */

            setTimeout(() => {
                window.location.href =
                    "/pages/results.html";
            }, 1000);
        } catch (error) {
            console.error(
                "Save all results error:",
                error
            );

            showMessage(
                error.message ||
                    "Unable to save the results.",
                "danger"
            );

            showValidationMessage(
                error.message ||
                    "The results could not be saved.",
                "danger"
            );
        } finally {
            state.saving =
                false;

            if (
                elements.saveResultButton
            ) {
                elements.saveResultButton.disabled =
                    false;

                elements.saveResultButton.innerHTML = `
                    <i class="bi bi-check-circle me-1"></i>
                    Save Results
                `;
            }
        }
    }

    /* ==========================================================================
    RESET
    ========================================================================== */

    function resetEntry() {
        state.selectedStudent =
            null;

        state.enrollment =
            null;

        state.subjects =
            [];

        state.subjectRows =
            [];

        state.existingResults =
            [];

        if (
            elements.admissionNumber
        ) {
            elements.admissionNumber.value =
                "";
        }

        if (
            elements.sessionId
        ) {
            elements.sessionId.value =
                "";
        }

        if (
            elements.termId
        ) {
            elements.termId.value =
                "";
        }

        if (
            elements.teacherComment
        ) {
            elements.teacherComment.value =
                "";
        }

        updateStudentSummary();
        renderSubjectRows();
        updateSummary();

        showStudentSearchMessage(
            ""
        );

        showValidationMessage(
            ""
        );

        clearMessage();
    }

    /* ==========================================================================
    INITIAL DATA
    ========================================================================== */

    async function loadSessions() {
        const response =
            await apiRequest(
                "/academic-sessions"
            );

        state.sessions =
            getResponseArray(
                response,
                [
                    "sessions",
                    "academicSessions"
                ]
            );

        return state.sessions;
    }

    async function loadTerms() {
        const response =
            await apiRequest(
                "/terms"
            );

        state.terms =
            getResponseArray(
                response,
                [
                    "terms"
                ]
            );

        return state.terms;
    }

    function getStoredUser() {
        if (
            typeof window.getStoredUser ===
            "function"
        ) {
            return window.getStoredUser();
        }

        const rawValue =
            localStorage.getItem(
                "school_management_user"
            ) ||
            sessionStorage.getItem(
                "school_management_user"
            );

        if (!rawValue) {
            return null;
        }

        try {
            return JSON.parse(
                rawValue
            );
        } catch (error) {
            return null;
        }
    }

    function displayCurrentUser() {
        if (
            !elements.currentUser
        ) {
            return;
        }

        const user =
            getStoredUser();

        if (!user) {
            elements.currentUser.textContent =
                "User";

            return;
        }

        const displayName =
            user.name ||
            user.full_name ||
            user.fullName ||
            user.username ||
            user.email ||
            "User";

        elements.currentUser.textContent =
            displayName;
    }

    /* ==========================================================================
    LOGOUT
    ========================================================================== */

    function logout() {
        if (
            typeof window.clearApiAuthentication ===
            "function"
        ) {
            window.clearApiAuthentication();
        } else {
            localStorage.removeItem(
                "school_management_token"
            );

            localStorage.removeItem(
                "school_management_user"
            );

            sessionStorage.removeItem(
                "school_management_token"
            );

            sessionStorage.removeItem(
                "school_management_user"
            );
        }

        window.location.href =
            "/pages/login.html";
    }

    /* ==========================================================================
    EVENT HANDLERS
    ========================================================================== */

    function bindPageEvents() {
        if (
            elements.findStudentButton
        ) {
            elements.findStudentButton.addEventListener(
                "click",
                findStudent
            );
        }

        if (
            elements.admissionNumber
        ) {
            elements.admissionNumber.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key ===
                        "Enter"
                    ) {
                        event.preventDefault();

                        findStudent();
                    }
                }
            );
        }

        if (
            elements.sessionId
        ) {
            elements.sessionId.addEventListener(
                "change",
                async () => {
                    showValidationMessage(
                        ""
                    );

                    if (
                        !state.selectedStudent
                    ) {
                        showValidationMessage(
                            "Find a student before selecting an academic session.",
                            "warning"
                        );

                        return;
                    }

                    await loadResultsWorkspace();
                }
            );
        }

        if (
            elements.termId
        ) {
            elements.termId.addEventListener(
                "change",
                handleTermChange
            );
        }

        /*
        The old manual Add Subject workflow is no longer
        required because subjects are automatically loaded
        from the student's class.
        */

        if (
            elements.addSubjectButton
        ) {
            elements.addSubjectButton.style.display =
                "none";
        }

        if (
            elements.saveResultButton
        ) {
            elements.saveResultButton.addEventListener(
                "click",
                saveResults
            );
        }

        if (
            elements.resetResultEntryButton
        ) {
            elements.resetResultEntryButton.addEventListener(
                "click",
                resetEntry
            );
        }

        if (
            elements.logoutButton
        ) {
            elements.logoutButton.addEventListener(
                "click",
                logout
            );
        }

        if (
            elements.resultEntryForm
        ) {
            elements.resultEntryForm.addEventListener(
                "submit",
                (event) => {
                    event.preventDefault();

                    saveResults();
                }
            );
        }
    }

    /* ==========================================================================
    PAGE INITIALIZATION
    ========================================================================== */

    async function loadPageData() {
        try {
            await Promise.all([
                loadSessions(),
                loadTerms()
            ]);

            populateSessions();
            populateTerms();

            renderSubjectRows();
            updateSummary();
        } catch (error) {
            console.error(
                "Result Entry initial data error:",
                error
            );

            showMessage(
                error.message ||
                    "Unable to load Result Entry data.",
                "danger"
            );
        }
    }

    async function initialize() {
        if (
            state.initialized
        ) {
            return;
        }

        state.initialized =
            true;

        displayCurrentUser();

        bindPageEvents();

        updateStudentSummary();
        renderSubjectRows();
        updateSummary();

        await loadPageData();
    }

    /* ==========================================================================
    PUBLIC API
    ========================================================================== */

    window.ResultEntryPage = {
        state,

        findStudent,

        loadResultsWorkspace,

        loadStudentEnrollment,

        loadClassSubjects,

        loadExistingResults,

        saveResults,

        resetEntry,

        loadPageData
    };

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );
})();