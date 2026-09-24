"use strict";

const API_BASE = "/api";
const STUDENTS_API = `${API_BASE}/students`;
const FEES_API = `${API_BASE}/fees`;

const LOGIN_PAGE = "/pages/login.html";
const STUDENTS_PAGE = "/pages/students.html";

let studentId = null;
let currentStudent = null;
let feeRecords = [];

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

return (
    params.get("id") ||
    params.get("studentId") ||
    params.get("student_id") ||
    params.get("student") ||
    null
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

function normalizeObject(payload) {
if (!payload || typeof payload !== "object") {
return null;
}

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

}

function normalizeArray(payload) {
if (Array.isArray(payload)) {
return payload;
}

if (!payload || typeof payload !== "object") {
    return [];
}

if (Array.isArray(payload.fees)) {
    return payload.fees;
}

if (Array.isArray(payload.records)) {
    return payload.records;
}

if (Array.isArray(payload.rows)) {
    return payload.rows;
}

if (Array.isArray(payload.data)) {
    return payload.data;
}

if (payload.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data.fees)) {
        return payload.data.fees;
    }

    if (Array.isArray(payload.data.records)) {
        return payload.data.records;
    }

    if (Array.isArray(payload.data.rows)) {
        return payload.data.rows;
    }
}

return [];

}

async function apiRequest(url, options = {}) {
if (
typeof window.apiRequest === "function" &&
options.useGlobalApi !== false
) {
return window.apiRequest(url, options);
}

const token = getToken();

const headers = {
    Accept: "application/json",
    ...(options.headers || {})
};

if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
}

if (token) {
    headers.Authorization = `Bearer ${token}`;
}

const requestOptions = {
    ...options,
    headers
};

delete requestOptions.useGlobalApi;

const response = await fetch(url, requestOptions);

const contentType =
    response.headers.get("content-type") || "";

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

}

function showMessage(message, type = "danger") {
const element = document.getElementById("pageMessage");

if (!element) {
    return;
}

if (!message) {
    element.textContent = "";
    element.className = "alert alert-danger mb-4";
    return;
}

const allowedTypes = [
    "success",
    "warning",
    "info",
    "danger"
];

const alertType = allowedTypes.includes(type)
    ? type
    : "danger";

element.textContent = message;
element.className = `alert alert-${alertType} mb-4`;

}

function formatMoney(value) {
const amount = Number(value);
const safeAmount = Number.isFinite(amount)
? amount
: 0;

return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
}).format(safeAmount);

}

function formatDate(value) {
if (!value) {
return "—";
}

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
}

return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric"
}).format(date);

}

function getStudentName(student) {
if (!student) {
return "Student";
}

if (student.name) {
    return String(student.name);
}

if (student.full_name) {
    return String(student.full_name);
}

if (student.fullName) {
    return String(student.fullName);
}

return [
    student.first_name || student.firstName || "",
    student.middle_name || student.middleName || "",
    student.last_name || student.lastName || ""
]
    .filter(Boolean)
    .join(" ")
    .trim() || "Student";

}

function getStudentNumber(student) {
if (!student) {
return "";
}

return (
    student.student_number ||
    student.studentNumber ||
    student.admission_number ||
    student.admissionNumber ||
    ""
);

}

function renderStudentHeader(student) {
const subtitle = document.getElementById("studentSubtitle");

if (!subtitle) {
    return;
}

const name = getStudentName(student);
const number = getStudentNumber(student);

subtitle.textContent = number
    ? `Fee records for ${name} (${number})`
    : `Fee records for ${name}`;

document.title = `${name} - Student Fees`;

}

function getFeeAmount(record) {
if (!record) {
return 0;
}

const value =
    record.amount_due ??
    record.amountDue ??
    record.fee_amount ??
    record.feeAmount ??
    record.amount ??
    record.total_amount ??
    record.totalAmount ??
    0;

const amount = Number(value);

return Number.isFinite(amount)
    ? amount
    : 0;

}

function getAmountPaid(record) {
if (!record) {
return 0;
}

const value =
    record.amount_paid ??
    record.amountPaid ??
    record.paid_amount ??
    record.paidAmount ??
    record.paid ??
    0;

const amount = Number(value);

return Number.isFinite(amount)
    ? amount
    : 0;

}

function getFeeBalance(record) {
if (!record) {
return 0;
}

const explicitBalance =
    record.balance ??
    record.outstanding_balance ??
    record.outstandingBalance ??
    record.amount_balance ??
    record.amountBalance;

if (
    explicitBalance !== null &&
    explicitBalance !== undefined &&
    explicitBalance !== ""
) {
    const balance = Number(explicitBalance);

    if (Number.isFinite(balance)) {
        return balance;
    }
}

return getFeeAmount(record) - getAmountPaid(record);

}

function getSessionName(record) {
if (!record) {
return "—";
}

return (
    record.session_name ||
    record.sessionName ||
    record.academic_session_name ||
    record.academicSessionName ||
    record.session ||
    record.academic_session ||
    record.academicSession ||
    "—"
);

}

function getTermName(record) {
if (!record) {
return "—";
}

return (
    record.term_name ||
    record.termName ||
    record.term ||
    "—"
);

}

function getFeeType(record) {
if (!record) {
return "School Fees";
}

return (
    record.fee_name ||
    record.feeName ||
    record.fee_type ||
    record.feeType ||
    record.type ||
    "School Fees"
);

}

function getFeeDate(record) {
if (!record) {
return null;
}

return (
    record.created_at ||
    record.createdAt ||
    record.payment_date ||
    record.paymentDate ||
    record.paid_at ||
    record.paidAt ||
    record.transaction_date ||
    record.transactionDate ||
    record.date ||
    null
);

}

function getFeeStatus(record) {
if (!record) {
return "Unpaid";
}

const rawStatus =
    record.payment_status ??
    record.paymentStatus ??
    record.status;

if (
    rawStatus !== null &&
    rawStatus !== undefined &&
    String(rawStatus).trim()
) {
    const normalized = String(rawStatus).trim();

    if (normalized.toLowerCase() === "partially paid") {
        return "Partially Paid";
    }

    if (normalized.toLowerCase() === "unpaid") {
        return "Unpaid";
    }

    if (normalized.toLowerCase() === "paid") {
        return "Paid";
    }

    if (normalized.toLowerCase() === "overpaid") {
        return "Overpaid";
    }

    return normalized;
}

const balance = getFeeBalance(record);
const paid = getAmountPaid(record);

if (balance <= 0 && paid > getFeeAmount(record)) {
    return "Overpaid";
}

if (balance <= 0) {
    return "Paid";
}

if (paid > 0) {
    return "Partially Paid";
}

return "Unpaid";

}

function getStatusClass(status) {
const normalized = String(status || "")
.trim()
.toLowerCase();

if (normalized === "paid") {
    return "status-badge status-paid";
}

if (normalized === "partially paid") {
    return "status-badge status-partial";
}

if (normalized === "overpaid") {
    return "status-badge status-overpaid";
}

return "status-badge status-unpaid";

}

function getStatusIcon(status) {
const normalized = String(status || "")
.trim()
.toLowerCase();

if (normalized === "paid") {
    return "bi-check-circle-fill";
}

if (normalized === "overpaid") {
    return "bi-check2-circle";
}

if (normalized === "partially paid") {
    return "bi-clock-fill";
}

return "bi-exclamation-circle-fill";

}

function calculateTotals(records) {
let totalFees = 0;
let amountPaid = 0;
let balance = 0;

records.forEach(record => {
    totalFees += getFeeAmount(record);
    amountPaid += getAmountPaid(record);
    balance += getFeeBalance(record);
});

return {
    totalFees,
    amountPaid,
    balance
};

}

function getOverallPaymentStatus(records, totals) {
if (!records.length) {
return "—";
}

const hasOverpaid = records.some(
    record =>
        getFeeStatus(record).toLowerCase() === "overpaid"
);

if (hasOverpaid) {
    return "Overpaid";
}

if (totals.balance <= 0) {
    return "Paid";
}

if (totals.amountPaid > 0) {
    return "Partially Paid";
}

return "Unpaid";

}

function renderStatistics(records) {
const totals = calculateTotals(records);

const totalFeesElement =
    document.getElementById("totalFees");

const amountPaidElement =
    document.getElementById("amountPaid");

const balanceElement =
    document.getElementById("balance");

const paymentStatusElement =
    document.getElementById("paymentStatus");

if (totalFeesElement) {
    totalFeesElement.textContent =
        formatMoney(totals.totalFees);
}

if (amountPaidElement) {
    amountPaidElement.textContent =
        formatMoney(totals.amountPaid);
}

if (balanceElement) {
    balanceElement.textContent =
        formatMoney(totals.balance);
}

if (balanceElement) {
    balanceElement.classList.remove(
        "text-danger",
        "text-success",
        "text-primary"
    );

    if (totals.balance > 0) {
        balanceElement.classList.add("text-danger");
    } else {
        balanceElement.classList.add("text-success");
    }
}

if (paymentStatusElement) {
    const status =
        getOverallPaymentStatus(records, totals);

    paymentStatusElement.textContent = status;

    paymentStatusElement.className =
        "fs-4 fw-bold";

    const normalized =
        status.toLowerCase();

    if (normalized === "paid") {
        paymentStatusElement.classList.add(
            "text-success"
        );
    } else if (normalized === "overpaid") {
        paymentStatusElement.classList.add(
            "text-primary"
        );
    } else if (normalized === "partially paid") {
        paymentStatusElement.classList.add(
            "text-warning"
        );
    } else if (normalized === "unpaid") {
        paymentStatusElement.classList.add(
            "text-danger"
        );
    } else {
        paymentStatusElement.classList.add(
            "text-muted"
        );
    }
}

}

function renderFees(records) {
const tableBody =
document.getElementById("feesTableBody");

if (!tableBody) {
    return;
}

feeRecords = Array.isArray(records)
    ? records
    : [];

renderStatistics(feeRecords);

if (!feeRecords.length) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-5 text-muted">
                <i class="bi bi-receipt fs-4 d-block mb-2"></i>
                No fee records found for this student.
            </td>
        </tr>
    `;
    return;
}

const sortedRecords = [...feeRecords].sort(
    (first, second) => {
        const firstDate =
            new Date(
                getFeeDate(first) || 0
            ).getTime();

        const secondDate =
            new Date(
                getFeeDate(second) || 0
            ).getTime();

        return secondDate - firstDate;
    }
);

tableBody.innerHTML = sortedRecords
    .map((record, index) => {
        const amount = getFeeAmount(record);
        const paid = getAmountPaid(record);
        const balance = getFeeBalance(record);
        const status = getFeeStatus(record);
        const statusIcon = getStatusIcon(status);

        const balanceClass =
            balance > 0
                ? "text-danger fw-semibold"
                : "text-success fw-semibold";

        return `
            <tr>
                <td class="fw-semibold">
                    ${index + 1}
                </td>

                <td>
                    ${escapeHtml(
                        getSessionName(record)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        getTermName(record)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        getFeeType(record)
                    )}
                </td>

                <td class="fw-semibold">
                    ${formatMoney(amount)}
                </td>

                <td class="text-success fw-semibold">
                    ${formatMoney(paid)}
                </td>

                <td class="${balanceClass}">
                    ${formatMoney(balance)}
                </td>

                <td>
                    <span class="${getStatusClass(status)}">
                        <i class="bi ${statusIcon}"></i>
                        ${escapeHtml(status)}
                    </span>
                </td>

                <td>
                    ${formatDate(
                        getFeeDate(record)
                    )}
                </td>
            </tr>
        `;
    })
    .join("");

}

async function loadStudent() {
if (!studentId) {
const subtitle =
document.getElementById("studentSubtitle");

    if (subtitle) {
        subtitle.textContent =
            "Student ID was not provided.";
    }

    return null;
}

const payload = await apiRequest(
    `${STUDENTS_API}/${encodeURIComponent(studentId)}`
);

const student = normalizeObject(payload);

if (!student) {
    throw new Error(
        "Unable to load student information."
    );
}

currentStudent = student;

renderStudentHeader(student);

return student;

}

async function loadFees() {
const tableBody =
document.getElementById("feesTableBody");

if (!studentId) {
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5 text-muted">
                    Student ID was not provided.
                </td>
            </tr>
        `;
    }

    renderStatistics([]);

    return [];
}

if (tableBody) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-5 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                Loading fee records...
            </td>
        </tr>
    `;
}

const payload = await apiRequest(
    `${FEES_API}/student/${encodeURIComponent(studentId)}`
);

const records = normalizeArray(payload);

renderFees(records);

return records;

}

async function refreshFees() {
const refreshButton =
document.getElementById("refreshButton");

if (refreshButton) {
    refreshButton.disabled = true;

    refreshButton.dataset.originalText =
        refreshButton.dataset.originalText ||
        refreshButton.innerHTML;

    refreshButton.innerHTML = `
        <span
            class="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true"
        ></span>
        Refreshing...
    `;
}

showMessage("");

try {
    await loadFees();

    showMessage(
        "Fee information refreshed successfully.",
        "success"
    );

    window.setTimeout(() => {
        showMessage("");
    }, 2500);
} catch (error) {
    console.error(
        "Student fees refresh error:",
        error
    );

    showMessage(
        error.message ||
        "Unable to refresh fee records.",
        "danger"
    );
} finally {
    if (refreshButton) {
        refreshButton.disabled = false;

        refreshButton.innerHTML =
            refreshButton.dataset.originalText ||
            `
                <i class="bi bi-arrow-clockwise me-1"></i>
                Refresh
            `;
    }
}

}

function goBackToProfile() {
if (!studentId) {
window.location.href = STUDENTS_PAGE;
return;
}

window.location.href =
    `/pages/student-profile.html?id=${encodeURIComponent(studentId)}`;

}

function setupSidebar() {
const sidebarToggle =
document.getElementById("sidebarToggle");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

if (
    !sidebarToggle ||
    !sidebar ||
    !sidebarOverlay
) {
    return;
}

sidebarToggle.addEventListener(
    "click",
    function () {
        sidebar.classList.toggle("show");
        sidebarOverlay.classList.toggle("show");
    }
);

sidebarOverlay.addEventListener(
    "click",
    function () {
        sidebar.classList.remove("show");
        sidebarOverlay.classList.remove("show");
    }
);

sidebar
    .querySelectorAll("a")
    .forEach(link => {
        link.addEventListener(
            "click",
            function () {
                sidebar.classList.remove("show");
                sidebarOverlay.classList.remove("show");
            }
        );
    });

}

function setupEventListeners() {
const refreshButton =
document.getElementById("refreshButton");

if (refreshButton) {
    refreshButton.addEventListener(
        "click",
        refreshFees
    );
}

const backButton =
    document.getElementById(
        "backToProfileButton"
    );

if (backButton) {
    backButton.addEventListener(
        "click",
        goBackToProfile
    );
}

}

function checkAuthentication() {
const token = getToken();

if (!token) {
    window.location.href = LOGIN_PAGE;
    return false;
}

return true;

}

async function initializePage() {
if (!checkAuthentication()) {
return;
}

studentId = getStudentId();

setupSidebar();
setupEventListeners();

if (!studentId) {
    showMessage(
        "No student ID was provided. Please open Student Fees from a student profile.",
        "danger"
    );

    return;
}

try {
    await loadStudent();
    await loadFees();
} catch (error) {
    console.error(
        "Student fees page error:",
        error
    );

    if (
        error.status === 401 ||
        error.status === 403
    ) {
        showMessage(
            "Your session has expired or you are not authorized to view this page.",
            "danger"
        );

        return;
    }

    if (error.status === 404) {
        showMessage(
            error.message ||
            "Student fee records were not found.",
            "danger"
        );

        return;
    }

    showMessage(
        error.message ||
        "Unable to load the student's fee information.",
        "danger"
    );
}

}

window.StudentFeesPage = {
loadStudent,
loadFees,
refreshFees,
renderFees,
renderStatistics,
calculateTotals,
goBackToProfile
};
