"use strict";

const RESULTS_API_BASE = "/api/results";
const STUDENTS_API_BASE = "/api/students";
const ACADEMIC_SESSIONS_API = "/api/academic-sessions";
const TERMS_API = "/api/terms";

let currentStudentId = null;
let currentStudent = null;
let currentResult = null;
let currentResults = [];
let currentAcademicSessionId = null;
let currentTermId = null;
let currentReportCardId = null;

function getToken() {
return (
localStorage.getItem("token") ||
localStorage.getItem("authToken") ||
sessionStorage.getItem("token") ||
sessionStorage.getItem("authToken") ||
""
);
}

function getStudentIdFromUrl() {
const params = new URLSearchParams(window.location.search);

```
return (
    params.get("studentId") ||
    params.get("student_id") ||
    params.get("id") ||
    ""
);
```

}

function getAdmissionNumberFromUrl() {
const params = new URLSearchParams(window.location.search);

```
return (
    params.get("admissionNumber") ||
    params.get("admission_number") ||
    params.get("studentNumber") ||
    params.get("student_number") ||
    ""
);
```

}

function escapeHtml(value) {
if (value === null || value === undefined) {
return "";
}

```
return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
```

}

function toNumber(value, fallback = 0) {
const number = Number(value);

```
return Number.isFinite(number) ? number : fallback;
```

}

function formatNumber(value, decimals = 2) {
const number = toNumber(value);

```
if (Number.isInteger(number)) {
    return String(number);
}

return number.toFixed(decimals);
```

}

function getResponseData(payload) {
if (!payload) {
return null;
}

```
if (payload.data !== undefined) {
    return payload.data;
}

if (payload.result !== undefined) {
    return payload.result;
}

if (payload.results !== undefined) {
    return payload.results;
}

return payload;
```

}

function getArrayFromResponse(payload, possibleKeys = []) {
const data = getResponseData(payload);

```
if (Array.isArray(data)) {
    return data;
}

if (!data || typeof data !== "object") {
    return [];
}

for (const key of possibleKeys) {
    if (Array.isArray(data[key])) {
        return data[key];
    }
}

return [];
```

}

function showMessage(message, type = "danger") {
const element =
document.getElementById("pageMessage") ||
document.getElementById("resultsMessageContainer");

```
if (!element) {
    return;
}

element.className = `alert alert-${type} mb-4`;
element.textContent = message;
element.style.display = "block";
```

}

function hideMessage() {
const element =
document.getElementById("pageMessage") ||
document.getElementById("resultsMessageContainer");

```
if (!element) {
    return;
}

element.textContent = "";
element.style.display = "none";
```

}

function setLoading(isLoading) {
const loading = document.getElementById("resultLoading");

```
if (loading) {
    loading.style.display = isLoading ? "block" : "none";
}

const button = document.getElementById("searchStudentButton");

if (button) {
    button.disabled = isLoading;
}
```

}

function getHeaders(includeJson = true) {
const headers = {};
const token = getToken();

```
if (token) {
    headers.Authorization = `Bearer ${token}`;
}

if (includeJson) {
    headers["Content-Type"] = "application/json";
}

return headers;
```

}

async function apiRequest(url, options = {}) {
if (typeof window.apiRequest === "function") {
return window.apiRequest(url, options);
}

```
const response = await fetch(url, {
    ...options,
    headers: {
        ...getHeaders(options.body !== undefined),
        ...(options.headers || {})
    }
});

let payload = null;

try {
    payload = await response.json();
} catch (error) {
    payload = null;
}

if (!response.ok) {
    const message =
        payload?.message ||
        payload?.error ||
        `Request failed with status ${response.status}.`;

    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.payload = payload;

    throw requestError;
}

return payload;
```

}

function setElementText(id, value) {
const element = document.getElementById(id);

```
if (!element) {
    return;
}

element.textContent =
    value === null ||
    value === undefined ||
    value === ""
        ? "—"
        : value;
```

}

function setButtonDisabled(id, disabled) {
const button = document.getElementById(id);

```
if (button) {
    button.disabled = disabled;
}
```

}

function getStudentName(student) {
if (!student) {
return "Student";
}

```
return (
    student.full_name ||
    student.fullName ||
    student.name ||
    [
        student.first_name,
        student.middle_name,
        student.last_name
    ]
        .filter(Boolean)
        .join(" ") ||
    "Student"
);
```

}

function getStudentAdmissionNumber(student) {
if (!student) {
return "";
}

```
return (
    student.admission_number ||
    student.admissionNumber ||
    student.student_number ||
    student.studentNumber ||
    ""
);
```

}

function getStudentClass(student) {
if (!student) {
return "";
}

```
return (
    student.class_name ||
    student.className ||
    student.class ||
    student.current_class ||
    ""
);
```

}

function getStudentArm(student) {
if (!student) {
return "";
}

```
return (
    student.class_arm_name ||
    student.classArmName ||
    student.class_arm ||
    student.classArm ||
    student.arm_name ||
    ""
);
```

}

function getStudentLevel(student) {
if (!student) {
return "";
}

```
return (
    student.academic_level_name ||
    student.academicLevelName ||
    student.level_name ||
    student.levelName ||
    student.academic_level ||
    ""
);
```

}

function setStudentSubtitle() {
const subtitle =
document.getElementById("studentSubtitle");

```
if (!subtitle) {
    return;
}

if (!currentStudent) {
    subtitle.textContent =
        "Search or load a student result.";
    return;
}

const name = getStudentName(currentStudent);
const admissionNumber =
    getStudentAdmissionNumber(currentStudent);

subtitle.textContent = admissionNumber
    ? `${name} • ${admissionNumber}`
    : name;
```

}

function renderStudentSummary() {
setElementText(
"studentName",
getStudentName(currentStudent)
);

```
setElementText(
    "studentNumber",
    getStudentAdmissionNumber(currentStudent)
);

setElementText(
    "studentClass",
    getStudentClass(currentStudent)
);

setElementText(
    "studentArm",
    getStudentArm(currentStudent)
);

setElementText(
    "studentLevel",
    getStudentLevel(currentStudent)
);

setStudentSubtitle();
```

}

function normalizeResultRow(row) {
const subjectName =
row.subject_name ||
row.subjectName ||
row.subject ||
row.name ||
"Unknown Subject";

```
const ca = toNumber(
    row.ca_score ??
    row.caScore ??
    row.ca ??
    row.continuous_assessment ??
    row.continuousAssessment ??
    0
);

const exam = toNumber(
    row.exam_score ??
    row.examScore ??
    row.exam ??
    row.examination ??
    0
);

const suppliedTotal =
    row.total_score ??
    row.totalScore ??
    row.total;

const total =
    suppliedTotal !== undefined &&
    suppliedTotal !== null &&
    suppliedTotal !== ""
        ? toNumber(suppliedTotal)
        : ca + exam;

const grade =
    row.grade ||
    row.grade_name ||
    row.gradeName ||
    "";

const remark =
    row.remark ||
    row.remarks ||
    row.teacher_remark ||
    row.teacherRemark ||
    "";

return {
    id:
        row.id ||
        row.result_id ||
        row.resultId ||
        null,

    subjectId:
        row.subject_id ||
        row.subjectId ||
        null,

    subjectName,
    ca,
    exam,
    total,
    grade,
    remark
};
```

}

function extractResultRows(payload) {
const data = getResponseData(payload);

```
let rows = [];

if (Array.isArray(data)) {
    rows = data;
} else if (data && typeof data === "object") {
    rows =
        data.results ||
        data.subjects ||
        data.resultItems ||
        data.items ||
        data.records ||
        [];
}

if (!Array.isArray(rows)) {
    return [];
}

return rows.map(normalizeResultRow);
```

}

function getOverallTotal(resultRows) {
if (!resultRows.length) {
return 0;
}

```
return resultRows.reduce(
    (sum, row) => sum + toNumber(row.total),
    0
);
```

}

function getOverallPercentage(resultRows, result) {
const suppliedPercentage =
result?.percentage ??
result?.overall_percentage ??
result?.overallPercentage;

```
if (
    suppliedPercentage !== undefined &&
    suppliedPercentage !== null &&
    suppliedPercentage !== ""
) {
    return toNumber(suppliedPercentage);
}

if (!resultRows.length) {
    return 0;
}

const possibleTotal =
    resultRows.length * 100;

if (!possibleTotal) {
    return 0;
}

return (
    getOverallTotal(resultRows) /
    possibleTotal *
    100
);
```

}

function getPosition(result) {
return (
result?.position ||
result?.student_position ||
result?.studentPosition ||
result?.rank ||
result?.ranking ||
"—"
);
}

function getResultStatus(result) {
if (!result) {
return "Draft";
}

```
const status =
    result.status ||
    result.result_status ||
    result.resultStatus ||
    "";

if (
    result.finalized === true ||
    result.is_finalized === true ||
    result.isFinalized === true ||
    String(status).toLowerCase() === "finalized"
) {
    return "Finalized";
}

if (
    String(status).toLowerCase() === "published" ||
    result.is_published === true ||
    result.isPublished === true
) {
    return "Published";
}

return "Draft";
```

}

function renderGrade(grade, total) {
const safeGrade = grade || "—";

```
const passing =
    String(safeGrade).toUpperCase() !== "F" &&
    toNumber(total) >= 40;

const className = passing
    ? "grade-pass"
    : "grade-fail";

return `
    <span class="grade-badge ${className}">
        ${escapeHtml(safeGrade)}
    </span>
`;
```

}

function renderResultsTable() {
const tableBody =
document.getElementById("resultsTableBody");

```
if (!tableBody) {
    return;
}

if (!currentResults.length) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-5 text-muted">
                <i class="bi bi-journal-x fs-3 d-block mb-2"></i>
                No result subjects were found for the selected student, session and term.
            </td>
        </tr>
    `;
    return;
}

tableBody.innerHTML = currentResults
    .map((row, index) => {
        return `
            <tr>
                <td class="ps-4">
                    ${index + 1}
                </td>

                <td>
                    <strong>
                        ${escapeHtml(row.subjectName)}
                    </strong>
                </td>

                <td>
                    ${formatNumber(row.ca)}
                </td>

                <td>
                    ${formatNumber(row.exam)}
                </td>

                <td>
                    <strong>
                        ${formatNumber(row.total)}
                    </strong>
                </td>

                <td>
                    ${renderGrade(
                        row.grade,
                        row.total
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        row.remark || "—"
                    )}
                </td>
            </tr>
        `;
    })
    .join("");
```

}

function renderStatistics() {
const subjectCount =
currentResults.length;

```
const overallTotal =
    getOverallTotal(currentResults);

const percentage =
    getOverallPercentage(
        currentResults,
        currentResult
    );

const highest =
    currentResults.length
        ? Math.max(
            ...currentResults.map(row =>
                toNumber(row.total)
            )
        )
        : 0;

const lowest =
    currentResults.length
        ? Math.min(
            ...currentResults.map(row =>
                toNumber(row.total)
            )
        )
        : 0;

const position =
    getPosition(currentResult);

setElementText(
    "subjectCount",
    subjectCount
);

setElementText(
    "overallTotal",
    formatNumber(overallTotal)
);

setElementText(
    "overallPercentage",
    `${formatNumber(percentage)}%`
);

setElementText(
    "studentPosition",
    position
);

setElementText(
    "summaryTotalScore",
    formatNumber(overallTotal)
);

setElementText(
    "summaryPercentage",
    `${formatNumber(percentage)}%`
);

setElementText(
    "summaryPosition",
    position
);

setElementText(
    "highestScore",
    formatNumber(highest)
);

setElementText(
    "lowestScore",
    formatNumber(lowest)
);

setElementText(
    "summaryStatus",
    getResultStatus(currentResult)
);
```

}

function renderResultStatus() {
const status =
getResultStatus(currentResult);

```
const finalized =
    status === "Finalized";

const published =
    status === "Published";

const statusElements = [
    document.getElementById(
        "resultStatusContainer"
    ),
    document.getElementById(
        "tableResultStatus"
    )
];

statusElements.forEach(element => {
    if (!element) {
        return;
    }

    let label = "Draft";
    let icon = "bi-pencil-square";

    if (finalized) {
        label = "Finalized";
        icon = "bi-check-circle";
    } else if (published) {
        label = "Published";
        icon = "bi-megaphone";
    }

    element.innerHTML = `
        <span class="result-status">
            <i class="bi ${icon} me-1"></i>
            ${label}
        </span>
    `;
});

setElementText(
    "summaryStatus",
    finalized
        ? "Finalized"
        : published
            ? "Published"
            : "Draft"
);
```

}

function resetResultDisplay() {
currentResult = null;
currentResults = [];
currentReportCardId = null;

```
setElementText("subjectCount", "0");
setElementText("overallTotal", "0");
setElementText("overallPercentage", "0%");
setElementText("studentPosition", "—");
setElementText("highestScore", "0");
setElementText("lowestScore", "0");
setElementText("summaryTotalScore", "0");
setElementText("summaryPercentage", "0%");
setElementText("summaryPosition", "—");
setElementText("summaryStatus", "Draft");

setButtonDisabled(
    "viewReportCardButton",
    true
);

setButtonDisabled(
    "viewReportCardActionButton",
    true
);

setButtonDisabled(
    "openReportCardButton",
    true
);

renderResultsTable();
```

}

async function findStudent(identifier) {
const value =
String(identifier || "").trim();

```
if (!value) {
    throw new Error(
        "Enter the student's admission number."
    );
}

const encoded =
    encodeURIComponent(value);

const urls = [
    `${STUDENTS_API_BASE}/admission/${encoded}`,
    `${STUDENTS_API_BASE}?admissionNumber=${encoded}`,
    `${STUDENTS_API_BASE}?admission_number=${encoded}`,
    `${STUDENTS_API_BASE}?studentNumber=${encoded}`,
    `${STUDENTS_API_BASE}?student_number=${encoded}`,
    `${STUDENTS_API_BASE}?search=${encoded}`
];

let lastError = null;

for (const url of urls) {
    try {
        const payload =
            await apiRequest(url);

        const data =
            getResponseData(payload);

        if (Array.isArray(data)) {
            const found =
                data.find(student => {
                    return (
                        String(
                            getStudentAdmissionNumber(
                                student
                            )
                        ).toLowerCase() ===
                        value.toLowerCase()
                    );
                });

            if (found) {
                return found;
            }
        }

        if (
            data &&
            typeof data === "object"
        ) {
            if (
                data.id ||
                data.student_id ||
                data.studentId
            ) {
                return data;
            }

            if (
                Array.isArray(
                    data.students
                )
            ) {
                const found =
                    data.students.find(
                        student => {
                            return (
                                String(
                                    getStudentAdmissionNumber(
                                        student
                                    )
                                ).toLowerCase() ===
                                value.toLowerCase()
                            );
                        }
                    );

                if (found) {
                    return found;
                }
            }
        }
    } catch (error) {
        lastError = error;

        if (
            error.status !== 404 &&
            error.status !== 400
        ) {
            break;
        }
    }
}

throw new Error(
    lastError?.message ||
    "Student could not be found using that admission number."
);
```

}

async function loadStudentById(studentId) {
const payload =
await apiRequest(
`${STUDENTS_API_BASE}/${encodeURIComponent(studentId)}`
);

```
const data =
    getResponseData(payload);

if (
    !data ||
    typeof data !== "object"
) {
    throw new Error(
        "Student information could not be loaded."
    );
}

return data;
```

}

async function loadAcademicSessions() {
const select =
document.getElementById(
"academicSessionId"
);

```
if (!select) {
    return;
}

try {
    const payload =
        await apiRequest(
            ACADEMIC_SESSIONS_API
        );

    const sessions =
        getArrayFromResponse(
            payload,
            [
                "sessions",
                "academicSessions",
                "items",
                "records"
            ]
        );

    select.innerHTML = `
        <option value="">
            Select academic session
        </option>
    `;

    sessions.forEach(session => {
        const id =
            session.id ||
            session.academic_session_id ||
            session.academicSessionId;

        const name =
            session.name ||
            session.session_name ||
            session.sessionName ||
            session.title ||
            (
                session.start_year &&
                session.end_year
                    ? `${session.start_year}/${session.end_year}`
                    : ""
            );

        if (!id) {
            return;
        }

        const option =
            document.createElement(
                "option"
            );

        option.value = id;
        option.textContent =
            name || "Academic Session";

        select.appendChild(option);
    });

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const requestedSession =
        urlParams.get(
            "academicSessionId"
        ) ||
        urlParams.get(
            "academic_session_id"
        ) ||
        urlParams.get("sessionId") ||
        "";

    if (requestedSession) {
        select.value =
            requestedSession;

        currentAcademicSessionId =
            requestedSession;
    }
} catch (error) {
    console.warn(
        "Academic sessions could not be loaded:",
        error.message
    );
}
```

}

async function loadTerms() {
const select =
document.getElementById("termId");

```
if (!select) {
    return;
}

try {
    const payload =
        await apiRequest(TERMS_API);

    const terms =
        getArrayFromResponse(
            payload,
            [
                "terms",
                "items",
                "records"
            ]
        );

    select.innerHTML = `
        <option value="">
            Select term
        </option>
    `;

    terms.forEach(term => {
        const id =
            term.id ||
            term.term_id ||
            term.termId;

        const name =
            term.name ||
            term.term_name ||
            term.termName ||
            term.title;

        if (!id) {
            return;
        }

        const option =
            document.createElement(
                "option"
            );

        option.value = id;
        option.textContent =
            name || `Term ${id}`;

        select.appendChild(option);
    });

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const requestedTerm =
        urlParams.get("termId") ||
        urlParams.get("term_id") ||
        "";

    if (requestedTerm) {
        select.value =
            requestedTerm;

        currentTermId =
            requestedTerm;
    }
} catch (error) {
    console.warn(
        "Terms could not be loaded:",
        error.message
    );
}
```

}

async function loadStudentResult() {
if (!currentStudentId) {
resetResultDisplay();

```
    showMessage(
        "Select a student before loading a result.",
        "warning"
    );

    return;
}

setLoading(true);
hideMessage();

try {
    const query =
        new URLSearchParams();

    if (currentAcademicSessionId) {
        query.set(
            "sessionId",
            currentAcademicSessionId
        );

        query.set(
            "academicSessionId",
            currentAcademicSessionId
        );
    }

    if (currentTermId) {
        query.set(
            "termId",
            currentTermId
        );
    }

    const queryString =
        query.toString();

    const url =
        `${RESULTS_API_BASE}/student/${encodeURIComponent(currentStudentId)}` +
        (
            queryString
                ? `?${queryString}`
                : ""
        );

    const payload =
        await apiRequest(url);

    const data =
        getResponseData(payload);

    if (Array.isArray(data)) {
        currentResult = {};
    } else {
        currentResult = data || {};
    }

    currentResults =
        extractResultRows(payload);

    currentReportCardId =
        currentResult.report_card_id ||
        currentResult.reportCardId ||
        currentResult.report_card?.id ||
        currentResult.reportCard?.id ||
        null;

    renderResultsTable();
    renderStatistics();
    renderResultStatus();

    const reportAvailable =
        Boolean(currentReportCardId);

    setButtonDisabled(
        "viewReportCardButton",
        !reportAvailable
    );

    setButtonDisabled(
        "viewReportCardActionButton",
        !reportAvailable
    );

    setButtonDisabled(
        "openReportCardButton",
        !reportAvailable
    );

    if (!currentResults.length) {
        showMessage(
            "The student was found, but no results are available for the selected session and term.",
            "warning"
        );
    }
} catch (error) {
    resetResultDisplay();

    showMessage(
        error.message ||
        "Unable to load the student's result."
    );
} finally {
    setLoading(false);
}
```

}

async function searchStudentAndLoadResult() {
const input =
document.getElementById(
"studentIdentifier"
);

```
const identifier =
    input?.value?.trim() || "";

if (!identifier) {
    showMessage(
        "Enter the student's admission number, for example LMC001.",
        "warning"
    );

    input?.focus();

    return;
}

setLoading(true);
hideMessage();

try {
    const student =
        await findStudent(identifier);

    currentStudent =
        student;

    currentStudentId =
        student.id ||
        student.student_id ||
        student.studentId ||
        null;

    if (!currentStudentId) {
        throw new Error(
            "The student record does not contain a valid student ID."
        );
    }

    const admissionNumber =
        getStudentAdmissionNumber(
            student
        );

    if (
        input &&
        admissionNumber
    ) {
        input.value =
            admissionNumber;
    }

    renderStudentSummary();

    await loadStudentResult();
} catch (error) {
    currentStudent = null;
    currentStudentId = null;

    resetResultDisplay();

    setElementText(
        "studentName",
        "Not selected"
    );

    setElementText(
        "studentNumber",
        "—"
    );

    setElementText(
        "studentClass",
        "—"
    );

    setElementText(
        "studentArm",
        "—"
    );

    setElementText(
        "studentLevel",
        "—"
    );

    setStudentSubtitle();

    showMessage(
        error.message ||
        "Unable to find the student."
    );
} finally {
    setLoading(false);
}
```

}

function getReportCardUrl() {
const params =
new URLSearchParams();

```
if (currentStudentId) {
    params.set(
        "studentId",
        currentStudentId
    );
}

if (currentReportCardId) {
    params.set(
        "reportCardId",
        currentReportCardId
    );
}

if (currentAcademicSessionId) {
    params.set(
        "academicSessionId",
        currentAcademicSessionId
    );
}

if (currentTermId) {
    params.set(
        "termId",
        currentTermId
    );
}

const query =
    params.toString();

return (
    `/pages/report-card.html` +
    (
        query
            ? `?${query}`
            : ""
    )
);
```

}

function openReportCard() {
if (!currentStudentId) {
showMessage(
"Select a student before opening the report card.",
"warning"
);

```
    return;
}

if (!currentReportCardId) {
    showMessage(
        "A report card record is not available for this result yet.",
        "warning"
    );

    return;
}

window.location.href =
    getReportCardUrl();
```

}

function printReportCard() {
if (!currentStudentId) {
showMessage(
"Select a student before printing the report card.",
"warning"
);

```
    return;
}

if (!currentResults.length) {
    showMessage(
        "There is no result available to print.",
        "warning"
    );

    return;
}

printCurrentResult();
```

}

function printCurrentResult() {
if (
!currentStudentId ||
!currentResults.length
) {
showMessage(
"There is no student result available to print.",
"warning"
);

```
    return;
}

const printWindow =
    window.open(
        "",
        "_blank",
        "width=1100,height=800"
    );

if (!printWindow) {
    showMessage(
        "The print window could not be opened. Please allow pop-ups for this site.",
        "warning"
    );

    return;
}

const studentName =
    getStudentName(currentStudent);

const admissionNumber =
    getStudentAdmissionNumber(
        currentStudent
    );

const className =
    getStudentClass(currentStudent);

const arm =
    getStudentArm(currentStudent);

const level =
    getStudentLevel(currentStudent);

const sessionText =
    document.getElementById(
        "academicSessionId"
    )?.selectedOptions?.[0]
        ?.textContent ||
    "—";

const termText =
    document.getElementById(
        "termId"
    )?.selectedOptions?.[0]
        ?.textContent ||
    "—";

const total =
    getOverallTotal(
        currentResults
    );

const percentage =
    getOverallPercentage(
        currentResults,
        currentResult
    );

const position =
    getPosition(currentResult);

const rows =
    currentResults
        .map((row, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(row.subjectName)}</td>
                    <td>${formatNumber(row.ca)}</td>
                    <td>${formatNumber(row.exam)}</td>
                    <td>${formatNumber(row.total)}</td>
                    <td>${escapeHtml(row.grade || "—")}</td>
                    <td>${escapeHtml(row.remark || "—")}</td>
                </tr>
            `;
        })
        .join("");

printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Student Result - ${escapeHtml(studentName)}</title>

        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 30px;
                color: #111;
            }

            h1 {
                margin-bottom: 5px;
            }

            .muted {
                color: #666;
            }

            .student-info {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin: 25px 0;
            }

            .info-box {
                border: 1px solid #ddd;
                padding: 10px;
            }

            .label {
                font-size: 11px;
                color: #666;
                text-transform: uppercase;
            }

            .value {
                font-weight: bold;
                margin-top: 4px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            th,
            td {
                border: 1px solid #ccc;
                padding: 9px;
                text-align: left;
            }

            th {
                background: #f2f2f2;
            }

            .summary {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-top: 25px;
            }

            .summary-box {
                border: 1px solid #ddd;
                padding: 15px;
            }

            .summary-box strong {
                display: block;
                font-size: 20px;
                margin-top: 5px;
            }

            @media print {
                body {
                    padding: 10px;
                }
            }
        </style>
    </head>

    <body>
        <h1>Student Academic Result</h1>

        <div class="muted">
            School Management System
        </div>

        <div class="student-info">
            <div class="info-box">
                <div class="label">Student</div>
                <div class="value">
                    ${escapeHtml(studentName)}
                </div>
            </div>

            <div class="info-box">
                <div class="label">Admission Number</div>
                <div class="value">
                    ${escapeHtml(admissionNumber || "—")}
                </div>
            </div>

            <div class="info-box">
                <div class="label">Class</div>
                <div class="value">
                    ${escapeHtml(className || "—")}
                </div>
            </div>

            <div class="info-box">
                <div class="label">Class Arm</div>
                <div class="value">
                    ${escapeHtml(arm || "—")}
                </div>
            </div>

            <div class="info-box">
                <div class="label">Academic Level</div>
                <div class="value">
                    ${escapeHtml(level || "—")}
                </div>
            </div>

            <div class="info-box">
                <div class="label">Academic Session</div>
                <div class="value">
                    ${escapeHtml(sessionText)}
                </div>
            </div>

            <div class="info-box">
                <div class="label">Term</div>
                <div class="value">
                    ${escapeHtml(termText)}
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Subject</th>
                    <th>CA</th>
                    <th>Exam</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Remark</th>
                </tr>
            </thead>

            <tbody>
                ${rows}
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-box">
                Total Score
                <strong>
                    ${formatNumber(total)}
                </strong>
            </div>

            <div class="summary-box">
                Percentage
                <strong>
                    ${formatNumber(percentage)}%
                </strong>
            </div>

            <div class="summary-box">
                Position
                <strong>
                    ${escapeHtml(position)}
                </strong>
            </div>
        </div>

        <script>
            window.onload = function () {
                window.print();
            };
        <\/script>
    </body>
    </html>
`);

printWindow.document.close();
```

}

function setupSidebar() {
const sidebar =
document.getElementById("sidebar");

```
const toggle =
    document.getElementById(
        "sidebarToggle"
    );

const overlay =
    document.getElementById(
        "sidebarOverlay"
    );

if (
    !sidebar ||
    !toggle ||
    !overlay
) {
    return;
}

toggle.addEventListener(
    "click",
    () => {
        sidebar.classList.toggle(
            "show"
        );

        overlay.classList.toggle(
            "show"
        );
    }
);

overlay.addEventListener(
    "click",
    () => {
        sidebar.classList.remove(
            "show"
        );

        overlay.classList.remove(
            "show"
        );
    }
);

sidebar
    .querySelectorAll("a")
    .forEach(link => {
        link.addEventListener(
            "click",
            () => {
                sidebar.classList.remove(
                    "show"
                );

                overlay.classList.remove(
                    "show"
                );
            }
        );
    });
```

}

function setupLogout() {
const button =
document.getElementById(
"logoutButton"
);

```
if (!button) {
    return;
}

button.addEventListener(
    "click",
    () => {
        try {
            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "authToken"
            );

            localStorage.removeItem(
                "user"
            );

            sessionStorage.removeItem(
                "token"
            );

            sessionStorage.removeItem(
                "authToken"
            );

            sessionStorage.removeItem(
                "user"
            );
        } catch (error) {
            console.warn(
                "Unable to clear authentication storage:",
                error
            );
        }

        window.location.href =
            "/pages/login.html";
    }
);
```

}

function setupSearch() {
const button =
document.getElementById(
"searchStudentButton"
);

```
const input =
    document.getElementById(
        "studentIdentifier"
    );

if (button) {
    button.addEventListener(
        "click",
        searchStudentAndLoadResult
    );
}

if (input) {
    input.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                event.preventDefault();
                searchStudentAndLoadResult();
            }
        }
    );
}
```

}

function setupFilters() {
const sessionSelect =
document.getElementById(
"academicSessionId"
);

```
const termSelect =
    document.getElementById(
        "termId"
    );

if (sessionSelect) {
    sessionSelect.addEventListener(
        "change",
        async () => {
            currentAcademicSessionId =
                sessionSelect.value || null;

            if (currentStudentId) {
                await loadStudentResult();
            }
        }
    );
}

if (termSelect) {
    termSelect.addEventListener(
        "change",
        async () => {
            currentTermId =
                termSelect.value || null;

            if (currentStudentId) {
                await loadStudentResult();
            }
        }
    );
}
```

}

function setupActions() {
const refreshButton =
document.getElementById(
"refreshButton"
);

```
if (refreshButton) {
    refreshButton.addEventListener(
        "click",
        async () => {
            if (currentStudentId) {
                await loadStudentResult();
            } else {
                await searchStudentAndLoadResult();
            }
        }
    );
}

const viewButton =
    document.getElementById(
        "viewReportCardButton"
    );

if (viewButton) {
    viewButton.addEventListener(
        "click",
        openReportCard
    );
}

const viewActionButton =
    document.getElementById(
        "viewReportCardActionButton"
    );

if (viewActionButton) {
    viewActionButton.addEventListener(
        "click",
        openReportCard
    );
}

const openReportCardButton =
    document.getElementById(
        "openReportCardButton"
    );

if (openReportCardButton) {
    openReportCardButton.addEventListener(
        "click",
        openReportCard
    );
}

const printReportButton =
    document.getElementById(
        "printReportCardButton"
    );

if (printReportButton) {
    printReportButton.addEventListener(
        "click",
        printReportCard
    );
}

const printResultButton =
    document.getElementById(
        "printResultButton"
    );

if (printResultButton) {
    printResultButton.addEventListener(
        "click",
        printCurrentResult
    );
}
```

}

function setupBackNavigation() {
const button =
document.getElementById(
"backToProfileButton"
);

```
if (!button) {
    return;
}

button.addEventListener(
    "click",
    event => {
        event.preventDefault();

        if (currentStudentId) {
            window.location.href =
                `/pages/student-profile.html?studentId=${encodeURIComponent(currentStudentId)}`;

            return;
        }

        window.location.href =
            "/pages/students.html";
    }
);
```

}

async function initialisePage() {
setupSidebar();
setupLogout();
setupSearch();
setupFilters();
setupActions();
setupBackNavigation();

```
try {
    await Promise.all([
        loadAcademicSessions(),
        loadTerms()
    ]);
} catch (error) {
    console.warn(
        "Initial result filters could not be loaded:",
        error.message
    );
}

const urlStudentId =
    getStudentIdFromUrl();

const urlAdmissionNumber =
    getAdmissionNumberFromUrl();

if (urlAdmissionNumber) {
    const input =
        document.getElementById(
            "studentIdentifier"
        );

    if (input) {
        input.value =
            urlAdmissionNumber;
    }

    await searchStudentAndLoadResult();

    return;
}

if (urlStudentId) {
    try {
        currentStudent =
            await loadStudentById(
                urlStudentId
            );

        currentStudentId =
            currentStudent.id ||
            currentStudent.student_id ||
            currentStudent.studentId ||
            null;

        if (!currentStudentId) {
            throw new Error(
                "The student record does not contain a valid ID."
            );
        }

        const input =
            document.getElementById(
                "studentIdentifier"
            );

        if (input) {
            input.value =
                getStudentAdmissionNumber(
                    currentStudent
                );
        }

        renderStudentSummary();

        await loadStudentResult();
    } catch (error) {
        showMessage(
            error.message ||
            "Unable to load the selected student."
        );
    }

    return;
}

resetResultDisplay();
```

}

window.StudentResultsPage = {
loadStudentResult,
searchStudentAndLoadResult,
printCurrentResult,
openReportCard
};

document.addEventListener(
"DOMContentLoaded",
initialisePage
);
