"use strict";

| /*                                                                         |
| -------------------------------------------------------------------------- |
| RESULT ENTRY PAGE                                                          |
| -------------------------------------------------------------------------- |
|                                                                            |
| This file controls the dedicated Result Entry workspace.                   |
|                                                                            |
| Responsibilities:                                                          |
| - Load students                                                            |
| - Find a student by admission number                                       |
| - Load academic sessions                                                   |
| - Load terms                                                               |
| - Load subjects                                                            |
| - Add subject result rows                                                  |
| - Validate CA and examination scores                                       |
| - Calculate total, grade and remark                                        |
| - Save results through the Results API                                     |
| - Prevent duplicate subjects during one entry                              |
| - Reset the entry workspace                                                |
|                                                                            |
| This file is designed specifically for:                                    |
|                                                                            |
| Public/pages/result-entry.html                                             |
|                                                                            |
| -------------------------------------------------------------------------- |
| */                                                                         |

(function () {
const API_BASE = "/api";

```
const elements = {
    messageContainer: document.getElementById("resultEntryMessageContainer"),

    admissionNumber: document.getElementById("admissionNumber"),
    findStudentButton: document.getElementById("findStudentButton"),
    studentSearchMessage: document.getElementById("studentSearchMessage"),

    studentSummary: document.getElementById("studentSummary"),
    studentName: document.getElementById("studentName"),
    displayAdmissionNumber: document.getElementById("displayAdmissionNumber"),
    studentClass: document.getElementById("studentClass"),

    sessionId: document.getElementById("sessionId"),
    termId: document.getElementById("termId"),

    resultEntryForm: document.getElementById("resultEntryForm"),

    subjectResultsBody: document.getElementById("subjectResultsBody"),
    addSubjectButton: document.getElementById("addSubjectButton"),
    noSubjectMessage: document.getElementById("noSubjectMessage"),

    resultValidationMessage: document.getElementById("resultValidationMessage"),

    subjectCount: document.getElementById("subjectCount"),
    overallTotal: document.getElementById("overallTotal"),
    overallAverage: document.getElementById("overallAverage"),
    overallStatus: document.getElementById("overallStatus"),

    teacherComment: document.getElementById("teacherComment"),

    resetResultEntryButton: document.getElementById("resetResultEntryButton"),
    saveResultButton: document.getElementById("saveResultButton"),

    currentUser: document.getElementById("currentUser"),
    logoutButton: document.getElementById("logoutButton")
};

const state = {
    students: [],
    subjects: [],
    sessions: [],
    terms: [],

    selectedStudent: null,
    subjectRows: [],

    loading: false,
    saving: false
};

function getToken() {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        ""
    );
}

async function apiRequest(url, options = {}) {
    if (typeof window.apiRequest === "function") {
        return window.apiRequest(url, options);
    }

    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        url.startsWith("http") ? url : `${API_BASE}${url}`,
        {
            ...options,
            headers
        }
    );

    const contentType = response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const message =
            typeof data === "object" && data
                ? data.message || data.error || "Request failed."
                : data || "Request failed.";

        throw new Error(message);
    }

    return data;
}

function getResponseData(response) {
    if (!response) {
        return null;
    }

    if (response.data !== undefined) {
        return response.data;
    }

    return response;
}

function getResponseArray(response, possibleKeys = []) {
    const data = getResponseData(response);

    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === "object") {
        for (const key of possibleKeys) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }

        if (Array.isArray(data.rows)) {
            return data.rows;
        }

        if (Array.isArray(data.results)) {
            return data.results;
        }

        if (Array.isArray(data.students)) {
            return data.students;
        }

        if (Array.isArray(data.subjects)) {
            return data.subjects;
        }

        if (Array.isArray(data.sessions)) {
            return data.sessions;
        }

        if (Array.isArray(data.terms)) {
            return data.terms;
        }
    }

    return [];
}

function getResponseObject(response) {
    const data = getResponseData(response);

    if (!data) {
        return null;
    }

    if (Array.isArray(data)) {
        return data[0] || null;
    }

    if (data.student && typeof data.student === "object") {
        return data.student;
    }

    if (data.result && typeof data.result === "object") {
        return data.result;
    }

    if (data.data && typeof data.data === "object") {
        return data.data;
    }

    return data;
}

function showMessage(message, type = "info") {
    if (!elements.messageContainer) {
        return;
    }

    const safeType = ["success", "danger", "warning", "info"].includes(type)
        ? type
        : "info";

    elements.messageContainer.innerHTML = `
        <div class="alert alert-${safeType}" role="alert">
            ${escapeHtml(message)}
        </div>
    `;
}

function clearMessage() {
    if (elements.messageContainer) {
        elements.messageContainer.innerHTML = "";
    }
}

function showStudentSearchMessage(message, type = "info") {
    if (!elements.studentSearchMessage) {
        return;
    }

    if (!message) {
        elements.studentSearchMessage.innerHTML = "";
        return;
    }

    const safeType = ["success", "danger", "warning", "info"].includes(type)
        ? type
        : "info";

    elements.studentSearchMessage.innerHTML = `
        <div class="alert alert-${safeType} py-2 mb-0">
            ${escapeHtml(message)}
        </div>
    `;
}

function showValidationMessage(message, type = "danger") {
    if (!elements.resultValidationMessage) {
        return;
    }

    if (!message) {
        elements.resultValidationMessage.innerHTML = "";
        return;
    }

    const safeType = ["success", "danger", "warning", "info"].includes(type)
        ? type
        : "danger";

    elements.resultValidationMessage.innerHTML = `
        <div class="alert alert-${safeType} py-2">
            ${escapeHtml(message)}
        </div>
    `;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeId(value) {
    if (value === undefined || value === null) {
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
        subject?.id ||
        subject?.subject_id ||
        subject?.subjectId
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

function getStudentAdmissionNumber(student) {
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

    return [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
}

function getStudentClassName(student) {
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

function normalizeScore(value) {
    if (value === "" || value === null || value === undefined) {
        return 0;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.round(number * 100) / 100;
}

function calculateTotal(caScore, examScore) {
    return Math.round(
        (normalizeScore(caScore) + normalizeScore(examScore)) * 100
    ) / 100;
}

function calculateGrade(totalScore) {
    const score = normalizeScore(totalScore);

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

function calculateRemark(totalScore) {
    const score = normalizeScore(totalScore);

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

function calculateGradePoint(totalScore) {
    const score = normalizeScore(totalScore);

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

    if (score >= 40) {
        return 0.0;
    }

    return 0.0;
}

function populateSessions() {
    if (!elements.sessionId) {
        return;
    }

    elements.sessionId.innerHTML = `
        <option value="">Select Academic Session</option>
    `;

    state.sessions.forEach((session) => {
        const id = getSessionId(session);

        if (!id) {
            return;
        }

        const option = document.createElement("option");
        option.value = id;
        option.textContent = getSessionName(session) || id;

        elements.sessionId.appendChild(option);
    });
}

function populateTerms() {
    if (!elements.termId) {
        return;
    }

    elements.termId.innerHTML = `
        <option value="">Select Term</option>
    `;

    state.terms.forEach((term) => {
        const id = getTermId(term);

        if (!id) {
            return;
        }

        const option = document.createElement("option");
        option.value = id;
        option.textContent = getTermName(term) || id;

        elements.termId.appendChild(option);
    });
}

function updateStudentSummary() {
    const student = state.selectedStudent;

    if (!student) {
        if (elements.studentSummary) {
            elements.studentSummary.classList.add("d-none");
        }

        if (elements.studentName) {
            elements.studentName.textContent = "";
        }

        if (elements.displayAdmissionNumber) {
            elements.displayAdmissionNumber.textContent = "";
        }

        if (elements.studentClass) {
            elements.studentClass.textContent = "";
        }

        return;
    }

    if (elements.studentSummary) {
        elements.studentSummary.classList.remove("d-none");
    }

    if (elements.studentName) {
        elements.studentName.textContent = getStudentName(student) || "Unnamed Student";
    }

    if (elements.displayAdmissionNumber) {
        elements.displayAdmissionNumber.textContent =
            getStudentAdmissionNumber(student) || "N/A";
    }

    if (elements.studentClass) {
        elements.studentClass.textContent =
            getStudentClassName(student) || "Class not assigned";
    }
}

function setStudent(student) {
    state.selectedStudent = student || null;
    updateStudentSummary();

    if (state.selectedStudent) {
        showStudentSearchMessage("Student found successfully.", "success");
    }
}

function findStudentLocally(admissionNumber) {
    const searchValue = String(admissionNumber || "")
        .trim()
        .toLowerCase();

    if (!searchValue) {
        return null;
    }

    return (
        state.students.find((student) => {
            const studentAdmission = String(
                getStudentAdmissionNumber(student)
            )
                .trim()
                .toLowerCase();

            return studentAdmission === searchValue;
        }) || null
    );
}

async function findStudent() {
    clearMessage();

    const admissionNumber = elements.admissionNumber
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

    showStudentSearchMessage("Searching for student...", "info");

    const localStudent = findStudentLocally(admissionNumber);

    if (localStudent) {
        setStudent(localStudent);
        return;
    }

    try {
        const response = await apiRequest(
            `/students/search?q=${encodeURIComponent(admissionNumber)}`
        );

        const students = getResponseArray(response, [
            "students",
            "data"
        ]);

        const foundStudent =
            students.find((student) => {
                const studentAdmission = String(
                    getStudentAdmissionNumber(student)
                )
                    .trim()
                    .toLowerCase();

                return studentAdmission === admissionNumber.toLowerCase();
            }) || students[0] || null;

        if (!foundStudent) {
            setStudent(null);
            showStudentSearchMessage(
                "No student was found with that admission number.",
                "danger"
            );
            return;
        }

        setStudent(foundStudent);
    } catch (error) {
        setStudent(null);
        showStudentSearchMessage(
            error.message || "Unable to search for the student.",
            "danger"
        );
    }
}

function getSelectedSubjectIds() {
    return state.subjectRows
        .map((row) => normalizeId(row.subjectId))
        .filter(Boolean);
}

function subjectAlreadyAdded(subjectId) {
    const id = normalizeId(subjectId);

    return getSelectedSubjectIds().includes(id);
}

function createSubjectOptions(selectedId = "") {
    const selectedIds = getSelectedSubjectIds();

    const availableSubjects = state.subjects.filter((subject) => {
        const subjectId = getSubjectId(subject);

        if (!subjectId) {
            return false;
        }

        if (subjectId === normalizeId(selectedId)) {
            return true;
        }

        return !selectedIds.includes(subjectId);
    });

    let options = `
        <option value="">Select Subject</option>
    `;

    availableSubjects.forEach((subject) => {
        const id = getSubjectId(subject);

        options += `
            <option value="${escapeHtml(id)}">
                ${escapeHtml(getSubjectName(subject))}
            </option>
        `;
    });

    return options;
}

function addSubjectRow() {
    showValidationMessage("");

    if (!state.selectedStudent) {
        showValidationMessage(
            "Find and select a student before adding subjects."
        );
        return;
    }

    if (!elements.sessionId?.value) {
        showValidationMessage(
            "Select an academic session before adding subjects."
        );
        return;
    }

    if (!elements.termId?.value) {
        showValidationMessage(
            "Select a term before adding subjects."
        );
        return;
    }

    if (!state.subjects.length) {
        showValidationMessage(
            "No subjects are available. Please configure subjects first."
        );
        return;
    }

    const availableSubjectCount = state.subjects.filter((subject) => {
        const id = getSubjectId(subject);
        return id && !subjectAlreadyAdded(id);
    }).length;

    if (availableSubjectCount === 0) {
        showValidationMessage(
            "All available subjects have already been added."
        );
        return;
    }

    const row = {
        rowId: `result-row-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        subjectId: "",
        caScore: 0,
        examScore: 0,
        totalScore: 0,
        grade: "",
        remark: "",
        gradePoint: 0
    };

    state.subjectRows.push(row);

    renderSubjectRows();
    updateSummary();
}

function removeSubjectRow(rowId) {
    state.subjectRows = state.subjectRows.filter(
        (row) => row.rowId !== rowId
    );

    renderSubjectRows();
    updateSummary();
    showValidationMessage("");
}

function updateRow(rowId, field, value) {
    const row = state.subjectRows.find(
        (item) => item.rowId === rowId
    );

    if (!row) {
        return;
    }

    if (field === "subjectId") {
        const subjectId = normalizeId(value);

        const duplicate = state.subjectRows.some(
            (item) =>
                item.rowId !== rowId &&
                normalizeId(item.subjectId) === subjectId &&
                subjectId !== ""
        );

        if (duplicate) {
            showValidationMessage(
                "The same subject cannot be added more than once."
            );

            renderSubjectRows();
            return;
        }

        row.subjectId = subjectId;
    }

    if (field === "caScore") {
        let score = Number(value);

        if (!Number.isFinite(score)) {
            score = 0;
        }

        if (score < 0) {
            score = 0;
        }

        if (score > 40) {
            score = 40;
        }

        row.caScore = Math.round(score * 100) / 100;
    }

    if (field === "examScore") {
        let score = Number(value);

        if (!Number.isFinite(score)) {
            score = 0;
        }

        if (score < 0) {
            score = 0;
        }

        if (score > 60) {
            score = 60;
        }

        row.examScore = Math.round(score * 100) / 100;
    }

    row.totalScore = calculateTotal(
        row.caScore,
        row.examScore
    );

    row.grade = calculateGrade(row.totalScore);
    row.remark = calculateRemark(row.totalScore);
    row.gradePoint = calculateGradePoint(row.totalScore);

    renderSubjectRows();
    updateSummary();
}

function renderSubjectRows() {
    if (!elements.subjectResultsBody) {
        return;
    }

    if (!state.subjectRows.length) {
        elements.subjectResultsBody.innerHTML = "";

        if (elements.noSubjectMessage) {
            elements.noSubjectMessage.classList.remove("d-none");
        }

        return;
    }

    if (elements.noSubjectMessage) {
        elements.noSubjectMessage.classList.add("d-none");
    }

    elements.subjectResultsBody.innerHTML = state.subjectRows
        .map((row, index) => {
            const subjectOptions = createSubjectOptions(row.subjectId);

            return `
                <tr data-row-id="${escapeHtml(row.rowId)}">
                    <td class="text-center">
                        ${index + 1}
                    </td>

                    <td>
                        <select
                            class="form-select form-select-sm subject-select"
                            data-row-id="${escapeHtml(row.rowId)}"
                        >
                            ${subjectOptions}
                        </select>
                    </td>

                    <td>
                        <input
                            type="number"
                            class="form-control form-control-sm ca-score-input"
                            data-row-id="${escapeHtml(row.rowId)}"
                            min="0"
                            max="40"
                            step="0.01"
                            value="${escapeHtml(row.caScore)}"
                        >
                    </td>

                    <td>
                        <input
                            type="number"
                            class="form-control form-control-sm exam-score-input"
                            data-row-id="${escapeHtml(row.rowId)}"
                            min="0"
                            max="60"
                            step="0.01"
                            value="${escapeHtml(row.examScore)}"
                        >
                    </td>

                    <td class="text-center">
                        <span class="fw-semibold total-score">
                            ${escapeHtml(row.totalScore)}
                        </span>
                    </td>

                    <td class="text-center">
                        <span class="fw-semibold grade-value">
                            ${escapeHtml(row.grade)}
                        </span>
                    </td>

                    <td>
                        <span class="remark-value">
                            ${escapeHtml(row.remark)}
                        </span>
                    </td>

                    <td class="text-center">
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger remove-subject-button"
                            data-row-id="${escapeHtml(row.rowId)}"
                            title="Remove subject"
                        >
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        })
        .join("");

    state.subjectRows.forEach((row) => {
        const select = elements.subjectResultsBody.querySelector(
            `.subject-select[data-row-id="${CSS.escape(row.rowId)}"]`
        );

        if (select) {
            select.value = row.subjectId || "";
        }
    });

    bindSubjectRowEvents();
}

function bindSubjectRowEvents() {
    if (!elements.subjectResultsBody) {
        return;
    }

    elements.subjectResultsBody
        .querySelectorAll(".subject-select")
        .forEach((select) => {
            select.addEventListener("change", (event) => {
                updateRow(
                    event.target.dataset.rowId,
                    "subjectId",
                    event.target.value
                );
            });
        });

    elements.subjectResultsBody
        .querySelectorAll(".ca-score-input")
        .forEach((input) => {
            input.addEventListener("input", (event) => {
                updateRow(
                    event.target.dataset.rowId,
                    "caScore",
                    event.target.value
                );
            });
        });

    elements.subjectResultsBody
        .querySelectorAll(".exam-score-input")
        .forEach((input) => {
            input.addEventListener("input", (event) => {
                updateRow(
                    event.target.dataset.rowId,
                    "examScore",
                    event.target.value
                );
            });
        });

    elements.subjectResultsBody
        .querySelectorAll(".remove-subject-button")
        .forEach((button) => {
            button.addEventListener("click", () => {
                removeSubjectRow(button.dataset.rowId);
            });
        });
}

function updateSummary() {
    const rowsWithSubjects = state.subjectRows.filter(
        (row) => normalizeId(row.subjectId)
    );

    const subjectCount = rowsWithSubjects.length;

    const total = rowsWithSubjects.reduce(
        (sum, row) => sum + normalizeScore(row.totalScore),
        0
    );

    const average =
        subjectCount > 0
            ? total / subjectCount
            : 0;

    const roundedAverage =
        Math.round(average * 100) / 100;

    if (elements.subjectCount) {
        elements.subjectCount.textContent = String(subjectCount);
    }

    if (elements.overallTotal) {
        elements.overallTotal.textContent = total
            .toFixed(2)
            .replace(/\.00$/, "");
    }

    if (elements.overallAverage) {
        elements.overallAverage.textContent = roundedAverage
            .toFixed(2)
            .replace(/\.00$/, "");
    }

    if (elements.overallStatus) {
        if (!subjectCount) {
            elements.overallStatus.textContent = "Not Ready";
        } else if (rowsWithSubjects.every((row) => row.totalScore >= 40)) {
            elements.overallStatus.textContent = "Pass";
        } else {
            elements.overallStatus.textContent = "Needs Attention";
        }
    }
}

function validateEntry() {
    if (!state.selectedStudent) {
        return "Find a student before saving results.";
    }

    if (!elements.sessionId?.value) {
        return "Select an academic session.";
    }

    if (!elements.termId?.value) {
        return "Select a term.";
    }

    if (!state.subjectRows.length) {
        return "Add at least one subject.";
    }

    const seenSubjects = new Set();

    for (let index = 0; index < state.subjectRows.length; index += 1) {
        const row = state.subjectRows[index];

        if (!normalizeId(row.subjectId)) {
            return `Select a subject for row ${index + 1}.`;
        }

        if (seenSubjects.has(normalizeId(row.subjectId))) {
            return "The same subject cannot be entered more than once.";
        }

        seenSubjects.add(normalizeId(row.subjectId));

        const caScore = normalizeScore(row.caScore);
        const examScore = normalizeScore(row.examScore);

        if (caScore < 0 || caScore > 40) {
            return `CA score for row ${index + 1} must be between 0 and 40.`;
        }

        if (examScore < 0 || examScore > 60) {
            return `Examination score for row ${index + 1} must be between 0 and 60.`;
        }

        const totalScore = calculateTotal(caScore, examScore);

        if (totalScore < 0 || totalScore > 100) {
            return `Total score for row ${index + 1} must be between 0 and 100.`;
        }
    }

    return "";
}

function buildResultPayload(row) {
    const studentId = getStudentId(state.selectedStudent);

    const sessionId = normalizeId(elements.sessionId?.value);
    const termId = normalizeId(elements.termId?.value);

    const caScore = normalizeScore(row.caScore);
    const examScore = normalizeScore(row.examScore);
    const totalScore = calculateTotal(caScore, examScore);

    const payload = {
        studentId,
        academicSessionId: sessionId,
        termId,
        classId:
            state.selectedStudent?.class_id ||
            state.selectedStudent?.classId ||
            null,
        subjectId: normalizeId(row.subjectId),
        caScore,
        examScore,
        totalScore,
        teacherRemark:
            elements.teacherComment?.value.trim() || null
    };

    return payload;
}

async function saveResults() {
    clearMessage();

    const validationMessage = validateEntry();

    if (validationMessage) {
        showValidationMessage(validationMessage);
        return;
    }

    if (state.saving) {
        return;
    }

    state.saving = true;

    if (elements.saveResultButton) {
        elements.saveResultButton.disabled = true;
        elements.saveResultButton.innerHTML = `
            <span class="spinner-border spinner-border-sm me-1"></span>
            Saving Results...
        `;
    }

    try {
        const rowsToSave = state.subjectRows.map((row) => ({
            ...row
        }));

        let savedCount = 0;

        for (const row of rowsToSave) {
            const payload = buildResultPayload(row);

            await apiRequest("/results", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            savedCount += 1;
        }

        showValidationMessage(
            `${savedCount} result${savedCount === 1 ? "" : "s"} saved successfully.`,
            "success"
        );

        showMessage(
            `Result entry completed successfully for ${getStudentName(
                state.selectedStudent
            )}.`,
            "success"
        );

        state.subjectRows = [];

        renderSubjectRows();
        updateSummary();

        if (elements.teacherComment) {
            elements.teacherComment.value = "";
        }
    } catch (error) {
        showMessage(
            error.message || "Unable to save the result.",
            "danger"
        );

        showValidationMessage(
            error.message ||
                "One or more results could not be saved.",
            "danger"
        );
    } finally {
        state.saving = false;

        if (elements.saveResultButton) {
            elements.saveResultButton.disabled = false;
            elements.saveResultButton.innerHTML = `
                <i class="bi bi-check-circle me-1"></i>
                Save Results
            `;
        }
    }
}

function resetEntry() {
    state.selectedStudent = null;
    state.subjectRows = [];

    if (elements.admissionNumber) {
        elements.admissionNumber.value = "";
    }

    if (elements.sessionId) {
        elements.sessionId.value = "";
    }

    if (elements.termId) {
        elements.termId.value = "";
    }

    if (elements.teacherComment) {
        elements.teacherComment.value = "";
    }

    updateStudentSummary();
    renderSubjectRows();
    updateSummary();

    showStudentSearchMessage("");
    showValidationMessage("");
    clearMessage();
}

async function loadStudents() {
    const response = await apiRequest("/students");

    state.students = getResponseArray(response, [
        "students",
        "data"
    ]);

    return state.students;
}

async function loadSubjects() {
    const response = await apiRequest("/subjects");

    state.subjects = getResponseArray(response, [
        "subjects",
        "data"
    ]);

    return state.subjects;
}

async function loadSessions() {
    const response = await apiRequest("/academic-sessions");

    state.sessions = getResponseArray(response, [
        "sessions",
        "academicSessions",
        "data"
    ]);

    return state.sessions;
}

async function loadTerms() {
    const response = await apiRequest("/terms");

    state.terms = getResponseArray(response, [
        "terms",
        "data"
    ]);

    return state.terms;
}

function getStoredUser() {
    const possibleKeys = [
        "user",
        "currentUser",
        "schoolUser",
        "school_management_user"
    ];

    for (const key of possibleKeys) {
        const rawValue =
            localStorage.getItem(key) ||
            sessionStorage.getItem(key);

        if (!rawValue) {
            continue;
        }

        try {
            const parsed = JSON.parse(rawValue);

            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        } catch (error) {
            return {
                name: rawValue
            };
        }
    }

    return null;
}

function displayCurrentUser() {
    if (!elements.currentUser) {
        return;
    }

    const user = getStoredUser();

    if (!user) {
        elements.currentUser.textContent = "User";
        return;
    }

    const displayName =
        user.name ||
        user.full_name ||
        user.fullName ||
        user.username ||
        user.email ||
        "User";

    elements.currentUser.textContent = displayName;
}

function logout() {
    const keys = [
        "token",
        "accessToken",
        "refreshToken",
        "user",
        "currentUser",
        "schoolUser",
        "school_management_user"
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    window.location.href = "/pages/login.html";
}

async function loadPageData() {
    state.loading = true;

    try {
        await Promise.all([
            loadStudents(),
            loadSubjects(),
            loadSessions(),
            loadTerms()
        ]);

        populateSessions();
        populateTerms();
        renderSubjectRows();
        updateSummary();
    } catch (error) {
        showMessage(
            error.message ||
                "Unable to load the Result Entry data.",
            "danger"
        );
    } finally {
        state.loading = false;
    }
}

function bindPageEvents() {
    if (elements.findStudentButton) {
        elements.findStudentButton.addEventListener(
            "click",
            findStudent
        );
    }

    if (elements.admissionNumber) {
        elements.admissionNumber.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    findStudent();
                }
            }
        );
    }

    if (elements.addSubjectButton) {
        elements.addSubjectButton.addEventListener(
            "click",
            addSubjectRow
        );
    }

    if (elements.saveResultButton) {
        elements.saveResultButton.addEventListener(
            "click",
            saveResults
        );
    }

    if (elements.resetResultEntryButton) {
        elements.resetResultEntryButton.addEventListener(
            "click",
            resetEntry
        );
    }

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener(
            "click",
            logout
        );
    }

    if (elements.resultEntryForm) {
        elements.resultEntryForm.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();
                saveResults();
            }
        );
    }
}

async function initialize() {
    displayCurrentUser();
    bindPageEvents();
    updateStudentSummary();
    renderSubjectRows();
    updateSummary();

    await loadPageData();
}

window.ResultEntryPage = {
    state,
    findStudent,
    addSubjectRow,
    removeSubjectRow,
    saveResults,
    resetEntry,
    loadPageData
};

document.addEventListener("DOMContentLoaded", initialize);
```

})();
