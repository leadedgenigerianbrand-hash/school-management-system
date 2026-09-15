"use strict";

const API_BASE = "/api";
const STUDENTS_API = `${API_BASE}/students`;
const LOGIN_PAGE = "/pages/login.html";
const STUDENTS_PAGE = "/pages/students.html";

let currentStudentId = null;
let currentStudent = null;
let currentHistory = [];

function getToken() {
return (
localStorage.getItem("token") ||
localStorage.getItem("authToken") ||
localStorage.getItem("accessToken") ||
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

function normalizeId(value) {
const id = Number(value);

```
if (!Number.isInteger(id) || id <= 0) {
    return null;
}

return id;
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

function normalizeObject(payload) {
if (!payload) {
return null;
}

```
if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
}

if (
    payload.student &&
    typeof payload.student === "object" &&
    !Array.isArray(payload.student)
) {
    return payload.student;
}

if (
    payload.result &&
    typeof payload.result === "object" &&
    !Array.isArray(payload.result)
) {
    return payload.result;
}

return payload;
```

}

function normalizeArray(payload) {
if (!payload) {
return [];
}

```
if (Array.isArray(payload)) {
    return payload;
}

if (Array.isArray(payload.data)) {
    return payload.data;
}

if (Array.isArray(payload.students)) {
    return payload.students;
}

if (Array.isArray(payload.enrollments)) {
    return payload.enrollments;
}

if (Array.isArray(payload.history)) {
    return payload.history;
}

if (Array.isArray(payload.results)) {
    return payload.results;
}

return [];
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

let payload = null;

const contentType = response.headers.get("content-type") || "";

if (contentType.includes("application/json")) {
    payload = await response.json();
} else {
    const text = await response.text();

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch (error) {
            payload = {
                message: text
            };
        }
    }
}

if (!response.ok) {
    const message =
        payload?.message ||
        payload?.error ||
        `Request failed with status ${response.status}.`;

    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;

    throw error;
}

return payload;
```

}

function showMessage(message, type = "info") {
const element = document.getElementById("historyMessage");

```
if (!element) {
    return;
}

element.className = `alert alert-${type}`;
element.textContent = message;
element.classList.remove("d-none");
```

}

function hideMessage() {
const element = document.getElementById("historyMessage");

```
if (!element) {
    return;
}

element.classList.add("d-none");
element.textContent = "";
```

}

function setLoading(isLoading) {
const loading = document.getElementById("historyLoading");
const content = document.getElementById("historyContent");
const error = document.getElementById("historyError");

```
if (loading) {
    loading.classList.toggle("d-none", !isLoading);
}

if (isLoading) {
    if (content) {
        content.classList.add("d-none");
    }

    if (error) {
        error.classList.add("d-none");
    }
}
```

}

function showContent() {
const loading = document.getElementById("historyLoading");
const content = document.getElementById("historyContent");
const error = document.getElementById("historyError");

```
if (loading) {
    loading.classList.add("d-none");
}

if (content) {
    content.classList.remove("d-none");
}

if (error) {
    error.classList.add("d-none");
}
```

}

function showError(message) {
const loading = document.getElementById("historyLoading");
const content = document.getElementById("historyContent");
const error = document.getElementById("historyError");
const errorMessage = document.getElementById("historyErrorMessage");

```
if (loading) {
    loading.classList.add("d-none");
}

if (content) {
    content.classList.add("d-none");
}

if (errorMessage) {
    errorMessage.textContent = message;
}

if (error) {
    error.classList.remove("d-none");
}
```

}

function getStudentName(student) {
if (!student) {
return "—";
}

```
if (student.name) {
    return student.name;
}

const fullName = [
    student.first_name,
    student.middle_name,
    student.last_name
]
    .filter(Boolean)
    .join(" ")
    .trim();

if (fullName) {
    return fullName;
}

return [
    student.firstName,
    student.middleName,
    student.lastName
]
    .filter(Boolean)
    .join(" ")
    .trim() || "—";
```

}

function getStudentNumber(student) {
if (!student) {
return "—";
}

```
return (
    student.student_number ||
    student.studentNumber ||
    student.admission_number ||
    student.admissionNumber ||
    "—"
);
```

}

function getCurrentClass(student) {
if (!student) {
return "—";
}

```
return (
    student.class_name ||
    student.className ||
    student.class ||
    "—"
);
```

}

function getCurrentSession(student) {
if (!student) {
return "—";
}

```
return (
    student.academic_session_name ||
    student.academicSessionName ||
    student.session_name ||
    student.sessionName ||
    student.academic_session ||
    student.academicSession ||
    "—"
);
```

}

function formatDate(value) {
if (!value) {
return "—";
}

```
const date = new Date(value);

if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
}

return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric"
});
```

}

function getHistorySession(item) {
return (
item.academic_session_name ||
item.academicSessionName ||
item.session_name ||
item.sessionName ||
item.academic_session ||
item.academicSession ||
item.session ||
item.session_id ||
item.academic_session_id ||
"—"
);
}

function getHistoryLevel(item) {
return (
item.academic_level_name ||
item.academicLevelName ||
item.level_name ||
item.levelName ||
item.academic_level ||
item.academicLevel ||
item.level ||
"—"
);
}

function getHistoryClass(item) {
return (
item.class_name ||
item.className ||
item.class ||
item.class_id ||
"—"
);
}

function getHistoryArm(item) {
return (
item.class_arm_name ||
item.classArmName ||
item.arm_name ||
item.armName ||
item.class_arm ||
item.classArm ||
"—"
);
}

function getHistoryDepartment(item) {
return (
item.department_name ||
item.departmentName ||
item.department ||
item.department_id ||
"—"
);
}

function getHistoryEnrollmentDate(item) {
return (
item.enrollment_date ||
item.enrollmentDate ||
item.admission_date ||
item.admissionDate ||
null
);
}

function getHistoryExitDate(item) {
return (
item.exit_date ||
item.exitDate ||
null
);
}

function getHistoryStatus(item) {
return (
item.admission_status ||
item.admissionStatus ||
item.status ||
"Enrolled"
);
}

function getStatusClass(status) {
const normalized = String(status || "")
.toLowerCase()
.trim();

```
if (
    normalized === "active" ||
    normalized === "enrolled" ||
    normalized === "current"
) {
    return "success";
}

if (
    normalized === "completed" ||
    normalized === "graduated"
) {
    return "primary";
}

if (
    normalized === "withdrawn" ||
    normalized === "left" ||
    normalized === "exited"
) {
    return "warning";
}

if (
    normalized === "suspended" ||
    normalized === "inactive"
) {
    return "danger";
}

return "secondary";
```

}

function renderStudentSummary(student) {
const nameElement = document.getElementById("studentName");
const numberElement = document.getElementById("studentNumber");
const classElement = document.getElementById("studentClass");
const sessionElement = document.getElementById("studentSession");

```
if (nameElement) {
    nameElement.textContent = getStudentName(student);
}

if (numberElement) {
    numberElement.textContent = getStudentNumber(student);
}

if (classElement) {
    classElement.textContent = getCurrentClass(student);
}

if (sessionElement) {
    sessionElement.textContent = getCurrentSession(student);
}
```

}

function sortHistory(history) {
return [...history].sort((a, b) => {
const aDate =
getHistoryEnrollmentDate(a) ||
getHistoryExitDate(a) ||
"";

```
    const bDate =
        getHistoryEnrollmentDate(b) ||
        getHistoryExitDate(b) ||
        "";

    const aTime = new Date(aDate).getTime();
    const bTime = new Date(bDate).getTime();

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
        return 0;
    }

    if (Number.isNaN(aTime)) {
        return 1;
    }

    if (Number.isNaN(bTime)) {
        return -1;
    }

    return bTime - aTime;
});
```

}

function renderHistory(history) {
const tableBody = document.getElementById("historyTableBody");
const emptyState = document.getElementById("historyEmpty");
const countElement = document.getElementById("historyCount");

```
if (!tableBody) {
    return;
}

const sortedHistory = sortHistory(history);

currentHistory = sortedHistory;

tableBody.innerHTML = "";

if (countElement) {
    countElement.textContent =
        `${sortedHistory.length} ${sortedHistory.length === 1 ? "record" : "records"}`;
}

if (sortedHistory.length === 0) {
    if (emptyState) {
        emptyState.classList.remove("d-none");
    }

    return;
}

if (emptyState) {
    emptyState.classList.add("d-none");
}

sortedHistory.forEach((item, index) => {
    const status = getHistoryStatus(item);
    const statusClass = getStatusClass(status);

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHtml(getHistorySession(item))}</td>
        <td>${escapeHtml(getHistoryLevel(item))}</td>
        <td>${escapeHtml(getHistoryClass(item))}</td>
        <td>${escapeHtml(getHistoryArm(item))}</td>
        <td>${escapeHtml(getHistoryDepartment(item))}</td>
        <td>${formatDate(getHistoryEnrollmentDate(item))}</td>
        <td>${formatDate(getHistoryExitDate(item))}</td>
        <td class="history-status">
            <span class="badge bg-${statusClass}">
                ${escapeHtml(status)}
            </span>
        </td>
    `;

    tableBody.appendChild(row);
});
```

}

async function loadStudent() {
if (!currentStudentId) {
throw new Error("A valid student ID is required.");
}

```
const response = await apiRequest(
    `${STUDENTS_API}/${encodeURIComponent(currentStudentId)}`
);

const student = normalizeObject(response);

if (!student) {
    throw new Error("Student record could not be found.");
}

return student;
```

}

async function loadStudentHistory() {
if (!currentStudentId) {
throw new Error("A valid student ID is required.");
}

```
const historyUrl =
    `${STUDENTS_API}/${encodeURIComponent(currentStudentId)}/history`;

try {
    const response = await apiRequest(historyUrl);
    return normalizeArray(response);
} catch (error) {
    if (error.status !== 404) {
        throw error;
    }
}

const enrollmentUrl =
    `${STUDENTS_API}/${encodeURIComponent(currentStudentId)}/enrollment`;

try {
    const response = await apiRequest(enrollmentUrl);
    const enrollment = normalizeObject(response);

    if (!enrollment) {
        return [];
    }

    return [enrollment];
} catch (error) {
    if (error.status === 404) {
        return [];
    }

    throw error;
}
```

}

function setupNavigation() {
const backButton = document.getElementById("backToProfileButton");
const printButton = document.getElementById("printHistoryButton");
const retryButton = document.getElementById("retryHistoryButton");

```
if (backButton) {
    backButton.addEventListener("click", () => {
        if (currentStudentId) {
            window.location.href =
                `/pages/student-profile.html?id=${encodeURIComponent(currentStudentId)}`;
        } else {
            window.location.href = STUDENTS_PAGE;
        }
    });
}

if (printButton) {
    printButton.addEventListener("click", () => {
        window.print();
    });
}

if (retryButton) {
    retryButton.addEventListener("click", () => {
        initialisePage();
    });
}
```

}

function protectPage() {
const token = getToken();

```
if (!token) {
    window.location.href = LOGIN_PAGE;
    return false;
}

return true;
```

}

async function initialisePage() {
hideMessage();

```
currentStudentId = normalizeId(getStudentId());

if (!currentStudentId) {
    showError("No valid student ID was supplied.");
    return;
}

if (!protectPage()) {
    return;
}

setLoading(true);

try {
    const student = await loadStudent();

    currentStudent = student;

    renderStudentSummary(student);

    const history = await loadStudentHistory();

    renderHistory(history);

    showContent();
} catch (error) {
    console.error("Student history error:", error);

    showError(
        error.message ||
        "Unable to load the student's history."
    );
}
```

}

document.addEventListener("DOMContentLoaded", () => {
setupNavigation();
initialisePage();
});

window.StudentHistoryPage = {
initialisePage,
loadStudent,
loadStudentHistory,
renderStudentSummary,
renderHistory,
getStudentId
};
