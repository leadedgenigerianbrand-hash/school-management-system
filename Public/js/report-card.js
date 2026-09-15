"use strict";

| /*                                                                         |
| -------------------------------------------------------------------------- |
| REPORT CARD PAGE                                                           |
| -------------------------------------------------------------------------- |
|                                                                            |
| This file controls:                                                        |
| - Student identification from the URL                                      |
| - Student information loading                                              |
| - Academic session and term information                                    |
| - Student result loading                                                   |
| - Result table rendering                                                   |
| - Result summary calculation                                               |
| - Result status                                                            |
| - Teacher and principal remarks                                            |
| - Printing                                                                 |
| - Navigation back to Student Results                                       |
|                                                                            |
| This page uses the existing Results API.                                   |
| No separate report-card database table is required.                        |
|                                                                            |
| -------------------------------------------------------------------------- |
| */                                                                         |

(function () {

```
const RESULTS_API_BASE = "/api/results";
const STUDENTS_API_BASE = "/api/students";
const ACADEMIC_SESSIONS_API = "/api/academic-sessions";
const TERMS_API = "/api/terms";

let currentStudentId = null;
let currentStudent = null;
let currentResults = [];
let currentSession = null;
let currentTerm = null;

function getToken() {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken") ||
        ""
    );
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function toNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
}

function formatNumber(value, decimals = 2) {
    const number = toNumber(value, 0);

    if (Number.isInteger(number)) {
        return String(number);
    }

    return number.toFixed(decimals);
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);

    return {
        studentId:
            params.get("studentId") ||
            params.get("student_id") ||
            params.get("id") ||
            "",

        admissionNumber:
            params.get("admissionNumber") ||
            params.get("admission_number") ||
            params.get("studentNumber") ||
            params.get("student_number") ||
            "",

        sessionId:
            params.get("sessionId") ||
            params.get("session_id") ||
            params.get("academicSessionId") ||
            params.get("academic_session_id") ||
            "",

        termId:
            params.get("termId") ||
            params.get("term_id") ||
            ""
    };
}

function showLoading() {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const emptyState = document.getElementById("emptyState");
    const reportContent = document.getElementById("reportContent");

    if (loadingState) {
        loadingState.style.display = "flex";
    }

    if (errorState) {
        errorState.style.display = "none";
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (reportContent) {
        reportContent.style.display = "none";
    }
}

function showReport() {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const emptyState = document.getElementById("emptyState");
    const reportContent = document.getElementById("reportContent");

    if (loadingState) {
        loadingState.style.display = "none";
    }

    if (errorState) {
        errorState.style.display = "none";
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (reportContent) {
        reportContent.style.display = "block";
    }
}

function showEmptyState() {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const emptyState = document.getElementById("emptyState");
    const reportContent = document.getElementById("reportContent");

    if (loadingState) {
        loadingState.style.display = "none";
    }

    if (errorState) {
        errorState.style.display = "none";
    }

    if (emptyState) {
        emptyState.style.display = "block";
    }

    if (reportContent) {
        reportContent.style.display = "none";
    }
}

function showError(message) {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const emptyState = document.getElementById("emptyState");
    const reportContent = document.getElementById("reportContent");
    const errorMessage = document.getElementById("errorMessage");

    if (loadingState) {
        loadingState.style.display = "none";
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (reportContent) {
        reportContent.style.display = "none";
    }

    if (errorMessage) {
        errorMessage.textContent =
            message || "The report card could not be loaded.";
    }

    if (errorState) {
        errorState.style.display = "block";
    }
}

async function apiRequest(url, options = {}) {
    if (
        typeof window.apiRequest === "function" &&
        window.apiRequest !== apiRequest
    ) {
        return window.apiRequest(url, options);
    }

    const headers = {
        ...(options.headers || {})
    };

    if (!headers["Content-Type"] && options.body) {
        headers["Content-Type"] = "application/json";
    }

    const token = getToken();

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}.`;

        throw new Error(message);
    }

    return data;
}

function getDataObject(response) {
    if (!response) {
        return null;
    }

    if (response.data && !Array.isArray(response.data)) {
        return response.data;
    }

    if (response.student) {
        return response.student;
    }

    if (response.result) {
        return response.result;
    }

    return response;
}

function getArrayFromResponse(response) {
    if (!response) {
        return [];
    }

    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response.data)) {
        return response.data;
    }

    if (Array.isArray(response.results)) {
        return response.results;
    }

    if (Array.isArray(response.subjects)) {
        return response.subjects;
    }

    if (Array.isArray(response.items)) {
        return response.items;
    }

    if (Array.isArray(response.records)) {
        return response.records;
    }

    if (
        response.data &&
        typeof response.data === "object"
    ) {
        if (Array.isArray(response.data.results)) {
            return response.data.results;
        }

        if (Array.isArray(response.data.items)) {
            return response.data.items;
        }

        if (Array.isArray(response.data.records)) {
            return response.data.records;
        }
    }

    return [];
}

function getStudentField(student, names, fallback = "") {
    if (!student) {
        return fallback;
    }

    for (const name of names) {
        if (
            student[name] !== undefined &&
            student[name] !== null &&
            student[name] !== ""
        ) {
            return student[name];
        }
    }

    return fallback;
}

function getResultField(result, names, fallback = "") {
    if (!result) {
        return fallback;
    }

    for (const name of names) {
        if (
            result[name] !== undefined &&
            result[name] !== null &&
            result[name] !== ""
        ) {
            return result[name];
        }
    }

    return fallback;
}

function getSubjectName(result) {
    const directName = getResultField(result, [
        "subject_name",
        "subjectName",
        "subject"
    ]);

    if (
        directName &&
        typeof directName === "string"
    ) {
        return directName;
    }

    if (result?.subject) {
        if (typeof result.subject === "string") {
            return result.subject;
        }

        return (
            result.subject.name ||
            result.subject.subject_name ||
            result.subject.subjectName ||
            "Unknown Subject"
        );
    }

    return "Unknown Subject";
}

function normalizeResult(result) {
    const caScore = toNumber(
        getResultField(result, [
            "ca_score",
            "caScore",
            "ca",
            "continuous_assessment"
        ])
    );

    const examScore = toNumber(
        getResultField(result, [
            "exam_score",
            "examScore",
            "exam"
        ])
    );

    let totalScore = getResultField(result, [
        "total_score",
        "totalScore",
        "total"
    ], null);

    if (
        totalScore === null ||
        totalScore === ""
    ) {
        totalScore = caScore + examScore;
    } else {
        totalScore = toNumber(totalScore);
    }

    return {
        id: getResultField(result, [
            "id",
            "result_id",
            "resultId"
        ]),

        studentId: getResultField(result, [
            "student_id",
            "studentId"
        ]),

        subjectId: getResultField(result, [
            "subject_id",
            "subjectId"
        ]),

        subjectName: getSubjectName(result),

        caScore,
        examScore,
        totalScore,

        grade: getResultField(result, [
            "grade"
        ], ""),

        gradePoint: getResultField(result, [
            "grade_point",
            "gradePoint"
        ], ""),

        remark: getResultField(result, [
            "teacher_remark",
            "teacherRemark",
            "remark"
        ], ""),

        principalRemark: getResultField(result, [
            "principal_remark",
            "principalRemark"
        ], ""),

        position: getResultField(result, [
            "position"
        ], ""),

        isPublished:
            Boolean(result?.is_published) ||
            Boolean(result?.isPublished),

        finalized:
            Boolean(result?.finalized) ||
            Boolean(result?.is_finalized) ||
            Boolean(result?.isFinalized),

        status: getResultField(result, [
            "status"
        ], "")
    };
}

function normalizeResults(response) {
    return getArrayFromResponse(response).map(normalizeResult);
}

function getResultStatus(results) {
    if (!Array.isArray(results) || results.length === 0) {
        return "No Result";
    }

    const hasPublished = results.some(
        result => result.isPublished
    );

    const hasFinalized = results.some(
        result => result.finalized
    );

    const hasExplicitStatus = results.some(
        result => result.status
    );

    if (hasFinalized) {
        return "Finalized";
    }

    if (hasPublished) {
        return "Published";
    }

    if (hasExplicitStatus) {
        const status = results.find(
            result => result.status
        )?.status;

        return status || "Draft";
    }

    return "Draft";
}

function calculateTotal(results) {
    return results.reduce(
        (sum, result) => sum + toNumber(result.totalScore),
        0
    );
}

function calculatePercentage(results) {
    if (!results.length) {
        return 0;
    }

    const total = calculateTotal(results);
    const maximum = results.length * 100;

    if (maximum <= 0) {
        return 0;
    }

    return (total / maximum) * 100;
}

function getPosition(results, response) {
    const responseObject = getDataObject(response);

    const responsePosition =
        responseObject?.position ||
        responseObject?.student_position ||
        responseObject?.studentPosition ||
        responseObject?.rank ||
        "";

    if (responsePosition !== "") {
        return responsePosition;
    }

    for (const result of results) {
        if (
            result.position !== undefined &&
            result.position !== null &&
            result.position !== ""
        ) {
            return result.position;
        }
    }

    return "—";
}

function getClassName(student) {
    return getStudentField(student, [
        "class_name",
        "className",
        "class",
        "class_name_display"
    ], "—");
}

function getClassArm(student) {
    return getStudentField(student, [
        "class_arm_name",
        "classArmName",
        "class_arm",
        "classArm",
        "arm_name",
        "armName"
    ], "—");
}

function getAcademicLevel(student) {
    return getStudentField(student, [
        "academic_level_name",
        "academicLevelName",
        "academic_level",
        "academicLevel",
        "level_name",
        "levelName"
    ], "—");
}

function getStudentName(student) {
    const fullName = getStudentField(student, [
        "full_name",
        "fullName",
        "name"
    ]);

    if (fullName) {
        return fullName;
    }

    const firstName = getStudentField(student, [
        "first_name",
        "firstName"
    ]);

    const middleName = getStudentField(student, [
        "middle_name",
        "middleName"
    ]);

    const lastName = getStudentField(student, [
        "last_name",
        "lastName"
    ]);

    return [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || "—";
}

function renderSchoolInformation(student) {
    const schoolNameElement =
        document.getElementById("schoolName");

    const schoolAddressElement =
        document.getElementById("schoolAddress");

    const schoolLogo =
        document.getElementById("schoolLogo");

    const school =
        student?.school ||
        student?.school_info ||
        student?.schoolInfo ||
        {};

    const schoolName =
        school.name ||
        school.school_name ||
        school.schoolName ||
        getStudentField(student, [
            "school_name",
            "schoolName"
        ], "School Management System");

    const schoolAddress =
        school.address ||
        school.school_address ||
        school.schoolAddress ||
        getStudentField(student, [
            "school_address",
            "schoolAddress"
        ], "");

    const logo =
        school.logo ||
        school.logo_url ||
        school.logoUrl ||
        getStudentField(student, [
            "school_logo",
            "schoolLogo",
            "school_logo_url",
            "schoolLogoUrl"
        ], "");

    if (schoolNameElement) {
        schoolNameElement.textContent = schoolName;
    }

    if (schoolAddressElement) {
        schoolAddressElement.textContent =
            schoolAddress || "";
    }

    if (schoolLogo && logo) {
        schoolLogo.src = logo;
        schoolLogo.style.display = "block";
    }
}

function renderStudentInformation() {
    const studentName =
        document.getElementById("studentName");

    const studentNumber =
        document.getElementById("studentNumber");

    const studentClass =
        document.getElementById("studentClass");

    const studentArm =
        document.getElementById("studentArm");

    const studentLevel =
        document.getElementById("studentLevel");

    if (studentName) {
        studentName.textContent =
            getStudentName(currentStudent);
    }

    if (studentNumber) {
        studentNumber.textContent =
            getStudentField(currentStudent, [
                "student_number",
                "studentNumber",
                "admission_number",
                "admissionNumber"
            ], "—");
    }

    if (studentClass) {
        studentClass.textContent =
            getClassName(currentStudent);
    }

    if (studentArm) {
        studentArm.textContent =
            getClassArm(currentStudent);
    }

    if (studentLevel) {
        studentLevel.textContent =
            getAcademicLevel(currentStudent);
    }
}

function renderAcademicPeriod() {
    const reportPeriod =
        document.getElementById("reportPeriod");

    if (!reportPeriod) {
        return;
    }

    const sessionName =
        currentSession?.name ||
        currentSession?.session_name ||
        currentSession?.sessionName ||
        currentSession?.academic_session_name ||
        currentSession?.academicSessionName ||
        "Academic Session";

    const termName =
        currentTerm?.name ||
        currentTerm?.term_name ||
        currentTerm?.termName ||
        "Term";

    reportPeriod.textContent =
        `${sessionName} - ${termName}`;
}

function renderStatus() {
    const reportStatus =
        document.getElementById("reportStatus");

    if (!reportStatus) {
        return;
    }

    reportStatus.textContent =
        getResultStatus(currentResults);
}

function renderResultsTable() {
    const tableBody =
        document.getElementById("resultsTableBody");

    if (!tableBody) {
        return;
    }

    if (!currentResults.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    No results available.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = currentResults
        .map((result, index) => {

            const grade =
                result.grade || "—";

            const gradeClass =
                grade.toUpperCase() === "F"
                    ? "grade-fail"
                    : "grade-pass";

            return `
                <tr>
                    <td class="text-center">
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(result.subjectName)}
                    </td>

                    <td class="text-center">
                        ${formatNumber(result.caScore)}
                    </td>

                    <td class="text-center">
                        ${formatNumber(result.examScore)}
                    </td>

                    <td class="text-center">
                        ${formatNumber(result.totalScore)}
                    </td>

                    <td class="text-center ${gradeClass}">
                        ${escapeHtml(grade)}
                    </td>

                    <td>
                        ${escapeHtml(result.remark || "—")}
                    </td>
                </tr>
            `;
        })
        .join("");
}

function renderSummary(response) {
    const total =
        calculateTotal(currentResults);

    const percentage =
        calculatePercentage(currentResults);

    const position =
        getPosition(currentResults, response);

    const subjectCount =
        document.getElementById("subjectCount");

    const summaryTotalScore =
        document.getElementById("summaryTotalScore");

    const summaryPercentage =
        document.getElementById("summaryPercentage");

    const summaryPosition =
        document.getElementById("summaryPosition");

    if (subjectCount) {
        subjectCount.textContent =
            currentResults.length;
    }

    if (summaryTotalScore) {
        summaryTotalScore.textContent =
            formatNumber(total);
    }

    if (summaryPercentage) {
        summaryPercentage.textContent =
            `${percentage.toFixed(2)}%`;
    }

    if (summaryPosition) {
        summaryPosition.textContent =
            position || "—";
    }
}

function renderRemarks(response) {
    const teacherRemark =
        document.getElementById("teacherRemark");

    const principalRemark =
        document.getElementById("principalRemark");

    const responseObject =
        getDataObject(response);

    const teacherFromResponse =
        responseObject?.teacher_remark ||
        responseObject?.teacherRemark ||
        "";

    const principalFromResponse =
        responseObject?.principal_remark ||
        responseObject?.principalRemark ||
        "";

    const teacherFromResults =
        currentResults.find(
            result => result.remark
        )?.remark || "";

    const principalFromResults =
        currentResults.find(
            result => result.principalRemark
        )?.principalRemark || "";

    const teacher =
        teacherFromResponse ||
        teacherFromResults ||
        "No teacher remark provided.";

    const principal =
        principalFromResponse ||
        principalFromResults ||
        "No principal remark provided.";

    if (teacherRemark) {
        teacherRemark.textContent = teacher;
    }

    if (principalRemark) {
        principalRemark.textContent = principal;
    }
}

function renderGeneratedDate() {
    const generatedDate =
        document.getElementById("generatedDate");

    if (!generatedDate) {
        return;
    }

    const now = new Date();

    generatedDate.textContent =
        `Generated on ${now.toLocaleDateString(
            "en-NG",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        )}`;
}

async function findStudentById(studentId) {
    const response =
        await apiRequest(
            `${STUDENTS_API_BASE}/${encodeURIComponent(studentId)}`
        );

    const student =
        response?.student ||
        response?.data ||
        response;

    if (!student || typeof student !== "object") {
        throw new Error("Student record was not found.");
    }

    return student;
}

async function findStudentByAdmissionNumber(admissionNumber) {
    const encoded =
        encodeURIComponent(admissionNumber);

    const possibleUrls = [
        `${STUDENTS_API_BASE}/admission/${encoded}`,
        `${STUDENTS_API_BASE}/search?admissionNumber=${encoded}`,
        `${STUDENTS_API_BASE}/search?admission_number=${encoded}`,
        `${STUDENTS_API_BASE}?admissionNumber=${encoded}`,
        `${STUDENTS_API_BASE}?studentNumber=${encoded}`
    ];

    let lastError = null;

    for (const url of possibleUrls) {
        try {
            const response =
                await apiRequest(url);

            const students =
                getArrayFromResponse(response);

            if (students.length > 0) {
                return students[0];
            }

            const directStudent =
                response?.student ||
                (
                    response?.data &&
                    !Array.isArray(response.data)
                        ? response.data
                        : null
                );

            if (
                directStudent &&
                typeof directStudent === "object"
            ) {
                return directStudent;
            }
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError) {
        throw lastError;
    }

    throw new Error(
        "No student was found with that admission number."
    );
}

async function loadSessions() {
    try {
        const response =
            await apiRequest(
                ACADEMIC_SESSIONS_API
            );

        const sessions =
            getArrayFromResponse(response);

        return sessions;
    } catch (error) {
        return [];
    }
}

async function loadTerms() {
    try {
        const response =
            await apiRequest(
                TERMS_API
            );

        const terms =
            getArrayFromResponse(response);

        return terms;
    } catch (error) {
        return [];
    }
}

function selectSession(sessions, sessionId) {
    if (!sessionId) {
        return null;
    }

    return sessions.find(session =>
        String(
            session.id ||
            session.session_id ||
            session.sessionId
        ) === String(sessionId)
    ) || null;
}

function selectTerm(terms, termId) {
    if (!termId) {
        return null;
    }

    return terms.find(term =>
        String(
            term.id ||
            term.term_id ||
            term.termId
        ) === String(termId)
    ) || null;
}

async function resolveAcademicPeriod(params) {
    const [sessions, terms] =
        await Promise.all([
            loadSessions(),
            loadTerms()
        ]);

    currentSession =
        selectSession(
            sessions,
            params.sessionId
        );

    currentTerm =
        selectTerm(
            terms,
            params.termId
        );

    renderAcademicPeriod();
}

async function loadStudentResults() {
    if (!currentStudentId) {
        throw new Error(
            "Student ID is required to load the report card."
        );
    }

    const params =
        getUrlParams();

    const query = new URLSearchParams();

    if (params.sessionId) {
        query.set(
            "sessionId",
            params.sessionId
        );

        query.set(
            "academicSessionId",
            params.sessionId
        );
    }

    if (params.termId) {
        query.set(
            "termId",
            params.termId
        );
    }

    const queryString =
        query.toString();

    const url =
        `${RESULTS_API_BASE}/student/${encodeURIComponent(currentStudentId)}` +
        (queryString ? `?${queryString}` : "");

    const response =
        await apiRequest(url);

    currentResults =
        normalizeResults(response);

    return response;
}

async function loadReportCard() {
    showLoading();

    try {
        const params =
            getUrlParams();

        if (params.studentId) {
            currentStudentId =
                params.studentId;

            currentStudent =
                await findStudentById(
                    params.studentId
                );
        } else if (params.admissionNumber) {
            currentStudent =
                await findStudentByAdmissionNumber(
                    params.admissionNumber
                );

            currentStudentId =
                getStudentField(
                    currentStudent,
                    [
                        "id",
                        "student_id",
                        "studentId"
                    ]
                );
        } else {
            throw new Error(
                "No student was specified for this report card."
            );
        }

        if (!currentStudentId) {
            throw new Error(
                "The student record does not contain a valid student ID."
            );
        }

        renderSchoolInformation(
            currentStudent
        );

        renderStudentInformation();

        await resolveAcademicPeriod(
            params
        );

        const response =
            await loadStudentResults();

        if (!currentResults.length) {
            showEmptyState();
            return;
        }

        renderResultsTable();
        renderSummary(response);
        renderRemarks(response);
        renderStatus();
        renderGeneratedDate();

        showReport();

    } catch (error) {
        console.error(
            "Report card loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load the report card."
        );
    }
}

function getStudentResultsUrl() {
    if (!currentStudentId) {
        return "/pages/student-results.html";
    }

    const params =
        new URLSearchParams();

    params.set(
        "studentId",
        currentStudentId
    );

    const urlParams =
        getUrlParams();

    if (urlParams.sessionId) {
        params.set(
            "sessionId",
            urlParams.sessionId
        );
    }

    if (urlParams.termId) {
        params.set(
            "termId",
            urlParams.termId
        );
    }

    return `/pages/student-results.html?${params.toString()}`;
}

function goBack() {
    window.location.href =
        getStudentResultsUrl();
}

function printReportCard() {
    window.print();
}

function setupEvents() {
    const backButton =
        document.getElementById("backButton");

    const printButton =
        document.getElementById("printButton");

    const retryButton =
        document.getElementById("retryButton");

    if (backButton) {
        backButton.addEventListener(
            "click",
            goBack
        );
    }

    if (printButton) {
        printButton.addEventListener(
            "click",
            printReportCard
        );
    }

    if (retryButton) {
        retryButton.addEventListener(
            "click",
            loadReportCard
        );
    }
}

function setupAuthentication() {
    const token =
        getToken();

    if (token) {
        return true;
    }

    const currentPath =
        window.location.pathname +
        window.location.search;

    window.location.href =
        `/pages/login.html?returnUrl=${encodeURIComponent(currentPath)}`;

    return false;
}

async function initialize() {
    setupEvents();

    if (!setupAuthentication()) {
        return;
    }

    await loadReportCard();
}

window.ReportCardPage = {
    loadReportCard,
    printReportCard,
    goBack
};

document.addEventListener(
    "DOMContentLoaded",
    initialize
);
```

})();
