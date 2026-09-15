"use strict";

const API_BASE = "/api";
const STUDENTS_API = `${API_BASE}/students`;
const ATTENDANCE_API = `${API_BASE}/attendance`;

const LOGIN_PAGE = "/pages/login.html";
const STUDENTS_PAGE = "/pages/students.html";

let studentId = null;
let currentStudent = null;
let attendanceRecords = [];

document.addEventListener("DOMContentLoaded", initializePage);

function getToken() {
return (
localStorage.getItem("school_management_token") ||
localStorage.getItem("token") ||
localStorage.getItem("authToken") ||
localStorage.getItem("accessToken") ||
sessionStorage.getItem("school_management_token") ||
sessionStorage.getItem("token") ||
sessionStorage.getItem("authToken") ||
sessionStorage.getItem("accessToken") ||
null
);
}

function getStudentId() {
const params = new URLSearchParams(window.location.search);

```
return (
    params.get("id") ||
    params.get("studentId") ||
    params.get("student_id") ||
    params.get("student") ||
    null
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

function normalizeArray(payload) {
if (Array.isArray(payload)) {
return payload;
}

```
if (!payload || typeof payload !== "object") {
    return [];
}

if (Array.isArray(payload.data)) {
    return payload.data;
}

if (Array.isArray(payload.rows)) {
    return payload.rows;
}

if (Array.isArray(payload.records)) {
    return payload.records;
}

if (Array.isArray(payload.attendance)) {
    return payload.attendance;
}

if (Array.isArray(payload.results)) {
    return payload.results;
}

if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
) {
    if (Array.isArray(payload.data.rows)) {
        return payload.data.rows;
    }

    if (Array.isArray(payload.data.records)) {
        return payload.data.records;
    }

    if (Array.isArray(payload.data.attendance)) {
        return payload.data.attendance;
    }

    if (Array.isArray(payload.data.results)) {
        return payload.data.results;
    }
}

return [];
```

}

function normalizeObject(payload) {
if (!payload || typeof payload !== "object") {
return null;
}

```
if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
) {
    return payload.data;
}

if (
    payload.student &&
    typeof payload.student === "object" &&
    !Array.isArray(payload.student)
) {
    return payload.student;
}

return payload;
```

}

async function apiRequest(url, options = {}) {
const token = getToken();

```
const headers = {
    Accept: "application/json",
    ...(options.headers || {})
};

if (token) {
    headers.Authorization = `Bearer ${token}`;
}

const response = await fetch(url, {
    ...options,
    headers
});

const contentType = response.headers.get("content-type") || "";

let payload;

if (contentType.includes("application/json")) {
    payload = await response.json();
} else {
    const text = await response.text();

    try {
        payload = text ? JSON.parse(text) : null;
    } catch (error) {
        payload = text;
    }
}

if (!response.ok) {
    const message =
        payload?.message ||
        payload?.error ||
        (typeof payload === "string" && payload) ||
        `Request failed with status ${response.status}.`;

    const requestError = new Error(message);

    requestError.status = response.status;
    requestError.payload = payload;

    throw requestError;
}

return payload;
```

}

function showMessage(message, type = "info") {
const element = document.getElementById("pageMessage");

```
if (!element) {
    return;
}

if (!message) {
    element.innerHTML = "";
    element.className = "alert d-none";
    return;
}

let alertClass = "alert-info";

if (type === "success") {
    alertClass = "alert-success";
} else if (type === "danger" || type === "error") {
    alertClass = "alert-danger";
} else if (type === "warning") {
    alertClass = "alert-warning";
}

element.className = `alert ${alertClass}`;
element.textContent = message;
```

}

function setLoading(isLoading) {
const refreshButton = document.getElementById("refreshButton");

```
if (!refreshButton) {
    return;
}

refreshButton.disabled = isLoading;

if (isLoading) {
    if (!refreshButton.dataset.originalText) {
        refreshButton.dataset.originalText = refreshButton.innerHTML;
    }

    refreshButton.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Refreshing...';

    return;
}

refreshButton.innerHTML =
    refreshButton.dataset.originalText || "Refresh";
```

}

function formatDate(value) {
if (!value) {
return "—";
}

```
const date = new Date(value);

if (Number.isNaN(date.getTime())) {
    return String(value);
}

return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric"
});
```

}

function formatPercentage(value) {
const number = Number(value);

```
if (!Number.isFinite(number)) {
    return "0%";
}

return `${number.toFixed(1)}%`;
```

}

function getStudentName(student) {
if (!student) {
return "Student";
}

```
if (student.full_name) {
    return student.full_name;
}

if (student.fullName) {
    return student.fullName;
}

return [
    student.first_name || student.firstName || "",
    student.middle_name || student.middleName || "",
    student.last_name || student.lastName || ""
]
    .filter(Boolean)
    .join(" ")
    .trim() || "Student";
```

}

function getStudentNumber(student) {
if (!student) {
return "";
}

```
return (
    student.student_number ||
    student.studentNumber ||
    student.admission_number ||
    student.admissionNumber ||
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
    student.class_level ||
    student.classLevel ||
    ""
);
```

}

function getStudentSession(student) {
if (!student) {
return "";
}

```
return (
    student.academic_session_name ||
    student.academicSessionName ||
    student.session_name ||
    student.sessionName ||
    student.academic_session ||
    student.academicSession ||
    ""
);
```

}

function renderStudentHeader(student) {
const subtitleElement = document.getElementById("studentSubtitle");

```
const name = getStudentName(student);
const number = getStudentNumber(student);
const className = getStudentClass(student);
const session = getStudentSession(student);

let subtitle = `Attendance record for ${name}`;

if (number) {
    subtitle += ` (${number})`;
}

const details = [];

if (className) {
    details.push(className);
}

if (session) {
    details.push(session);
}

if (details.length) {
    subtitle += ` • ${details.join(" • ")}`;
}

if (subtitleElement) {
    subtitleElement.textContent = subtitle;
}

document.title = `${name} - Attendance`;
```

}

function getAttendanceDate(record) {
if (!record) {
return null;
}

```
return (
    record.attendance_date ||
    record.attendanceDate ||
    record.date ||
    record.record_date ||
    record.recordDate ||
    null
);
```

}

function getAttendanceSession(record) {
if (!record) {
return "";
}

```
return (
    record.academic_session_name ||
    record.academicSessionName ||
    record.session_name ||
    record.sessionName ||
    record.academic_session ||
    record.academicSession ||
    record.session ||
    ""
);
```

}

function getAttendanceTerm(record) {
if (!record) {
return "";
}

```
return (
    record.term_name ||
    record.termName ||
    record.term ||
    record.term_title ||
    record.termTitle ||
    ""
);
```

}

function getAttendanceStatus(record) {
if (!record) {
return "—";
}

```
const rawStatus =
    record.status ??
    record.attendance_status ??
    record.attendanceStatus ??
    null;

if (rawStatus === null || rawStatus === undefined) {
    return "—";
}

const status = String(rawStatus).trim().toLowerCase();

if (status === "present" || status === "p") {
    return "Present";
}

if (status === "absent" || status === "a") {
    return "Absent";
}

if (status === "late" || status === "l") {
    return "Late";
}

if (status === "excused" || status === "e") {
    return "Excused";
}

return String(rawStatus);
```

}

function getAttendanceRemark(record) {
if (!record) {
return "";
}

```
return (
    record.remark ||
    record.remarks ||
    record.note ||
    record.notes ||
    ""
);
```

}

function getStatusClass(status) {
const normalized = String(status || "").trim().toLowerCase();

```
if (normalized === "present") {
    return "status-present";
}

if (normalized === "absent") {
    return "status-absent";
}

if (normalized === "late") {
    return "status-late";
}

if (normalized === "excused") {
    return "status-excused";
}

return "status-unknown";
```

}

function getStatusIcon(status) {
const normalized = String(status || "").trim().toLowerCase();

```
if (normalized === "present") {
    return "bi-check-circle-fill";
}

if (normalized === "absent") {
    return "bi-x-circle-fill";
}

if (normalized === "late") {
    return "bi-clock-fill";
}

if (normalized === "excused") {
    return "bi-info-circle-fill";
}

return "bi-question-circle-fill";
```

}

function calculateAttendance(records) {
let present = 0;
let absent = 0;
let late = 0;
let excused = 0;

```
records.forEach(record => {
    const status = getAttendanceStatus(record)
        .trim()
        .toLowerCase();

    if (status === "present") {
        present += 1;
    } else if (status === "absent") {
        absent += 1;
    } else if (status === "late") {
        late += 1;
    } else if (status === "excused") {
        excused += 1;
    }
});

const total = records.length;

const attendanceRate =
    total > 0
        ? (present / total) * 100
        : 0;

return {
    total,
    present,
    absent,
    late,
    excused,
    attendanceRate
};
```

}

function renderStatistics(records) {
const statistics = calculateAttendance(records);

```
const totalElement = document.getElementById("totalDays");
const presentElement = document.getElementById("presentDays");
const absentElement = document.getElementById("absentDays");
const rateElement = document.getElementById("attendanceRate");

if (totalElement) {
    totalElement.textContent = statistics.total;
}

if (presentElement) {
    presentElement.textContent = statistics.present;
}

if (absentElement) {
    absentElement.textContent = statistics.absent;
}

if (rateElement) {
    rateElement.textContent =
        formatPercentage(statistics.attendanceRate);
}
```

}

function renderEmptyState(tableBody) {
tableBody.innerHTML = `         <tr>             <td colspan="6" class="text-center py-5">                 <div class="empty-state">                     <div class="empty-state-icon">                         <i class="bi bi-calendar-x"></i>                     </div>                     <div class="fw-semibold mb-1">
                        No attendance records found                     </div>                     <div class="small">
                        There is no attendance history recorded for this student.                     </div>                 </div>             </td>         </tr>
    `;
}

function renderAttendance(records) {
const tableBody = document.getElementById("attendanceTableBody");

```
if (!tableBody) {
    return;
}

renderStatistics(records);

if (!records.length) {
    renderEmptyState(tableBody);
    return;
}

const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(getAttendanceDate(a) || 0).getTime();
    const dateB = new Date(getAttendanceDate(b) || 0).getTime();

    return dateB - dateA;
});

tableBody.innerHTML = sortedRecords
    .map((record, index) => {
        const date = getAttendanceDate(record);
        const session = getAttendanceSession(record);
        const term = getAttendanceTerm(record);
        const status = getAttendanceStatus(record);
        const remark = getAttendanceRemark(record);

        const statusClass = getStatusClass(status);
        const statusIcon = getStatusIcon(status);

        return `
            <tr>
                <td>${index + 1}</td>

                <td>
                    ${escapeHtml(formatDate(date))}
                </td>

                <td>
                    ${escapeHtml(session || "—")}
                </td>

                <td>
                    ${escapeHtml(term || "—")}
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        <i class="bi ${statusIcon}"></i>
                        ${escapeHtml(status)}
                    </span>
                </td>

                <td>
                    ${escapeHtml(remark || "—")}
                </td>
            </tr>
        `;
    })
    .join("");
```

}

async function loadStudent() {
const payload = await apiRequest(
`${STUDENTS_API}/${encodeURIComponent(studentId)}`
);

```
const student = normalizeObject(payload);

if (!student) {
    throw new Error("Student information could not be loaded.");
}

currentStudent = student;

renderStudentHeader(student);

return student;
```

}

async function loadAttendance() {
const payload = await apiRequest(
`${ATTENDANCE_API}/student/${encodeURIComponent(studentId)}`
);

```
attendanceRecords = normalizeArray(payload);

renderAttendance(attendanceRecords);

return attendanceRecords;
```

}

async function loadPage() {
if (!studentId) {
showMessage(
"No student ID was provided. Please open the attendance page from a student profile.",
"danger"
);

```
    return;
}

showMessage("");

try {
    await loadStudent();
    await loadAttendance();
} catch (error) {
    console.error(
        "Student attendance loading error:",
        error
    );

    if (error.status === 401) {
        window.location.href = LOGIN_PAGE;
        return;
    }

    if (error.status === 403) {
        showMessage(
            "You are not authorized to view this student's attendance.",
            "danger"
        );
        return;
    }

    if (error.status === 404) {
        showMessage(
            error.message ||
            "Student or attendance records were not found.",
            "danger"
        );
        return;
    }

    showMessage(
        error.message ||
        "Unable to load the student's attendance information.",
        "danger"
    );
}
```

}

async function refreshAttendance() {
if (!studentId) {
return;
}

```
setLoading(true);
showMessage("");

try {
    await loadAttendance();

    showMessage(
        "Attendance information refreshed successfully.",
        "success"
    );
} catch (error) {
    console.error(
        "Attendance refresh error:",
        error
    );

    if (error.status === 401) {
        window.location.href = LOGIN_PAGE;
        return;
    }

    showMessage(
        error.message ||
        "Unable to refresh attendance information.",
        "danger"
    );
} finally {
    setLoading(false);
}
```

}

function goBackToProfile() {
if (!studentId) {
window.location.href = STUDENTS_PAGE;
return;
}

```
window.location.href =
    `/pages/student-profile.html?id=${encodeURIComponent(studentId)}`;
```

}

function setupSidebar() {
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

```
if (!sidebar || !sidebarToggle || !sidebarOverlay) {
    return;
}

sidebarToggle.addEventListener("click", () => {
    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
});

sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("show");
});
```

}

function setupEventListeners() {
const refreshButton =
document.getElementById("refreshButton");

```
if (refreshButton) {
    refreshButton.addEventListener(
        "click",
        refreshAttendance
    );
}

const backButton =
    document.getElementById("backToProfileButton");

if (backButton) {
    backButton.addEventListener(
        "click",
        goBackToProfile
    );
}
```

}

function checkAuthentication() {
const token = getToken();

```
if (!token) {
    window.location.href = LOGIN_PAGE;
    return false;
}

return true;
```

}

async function initializePage() {
if (!checkAuthentication()) {
return;
}

```
studentId = getStudentId();

setupSidebar();
setupEventListeners();

await loadPage();
```

}

window.StudentAttendancePage = {
loadStudent,
loadAttendance,
loadPage,
refreshAttendance,
renderAttendance,
renderStatistics,
goBackToProfile
};
