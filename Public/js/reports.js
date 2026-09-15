"use strict";

const REPORTS_API = "/api/reports";

let currentReportType = null;
let currentReportData = null;

function getAuthToken() {
return (
localStorage.getItem("school_management_token") ||
sessionStorage.getItem("school_management_token") ||
localStorage.getItem("token") ||
sessionStorage.getItem("token") ||
localStorage.getItem("authToken") ||
sessionStorage.getItem("authToken") ||
localStorage.getItem("accessToken") ||
sessionStorage.getItem("accessToken") ||
""
);
}

async function requestReport(url) {
const token = getAuthToken();

```
const headers = {
    Accept: "application/json"
};

if (token) {
    headers.Authorization = `Bearer ${token}`;
}

const response = await fetch(url, {
    method: "GET",
    headers
});

let data = null;

try {
    data = await response.json();
} catch {
    data = null;
}

if (!response.ok) {
    throw new Error(
        data?.message ||
        data?.error ||
        `Report request failed with status ${response.status}.`
    );
}

return data;
```

}

function getFilterValue(id) {
const element = document.getElementById(id);

```
if (!element) {
    return "";
}

return String(element.value || "").trim();
```

}

function buildQueryString() {
const params = new URLSearchParams();

```
const sessionId = getFilterValue("sessionId");
const termId = getFilterValue("termId");
const classId = getFilterValue("classId");
const startDate = getFilterValue("startDate");
const endDate = getFilterValue("endDate");

if (sessionId) {
    params.set("sessionId", sessionId);
}

if (termId) {
    params.set("termId", termId);
}

if (classId) {
    params.set("classId", classId);
}

if (startDate) {
    params.set("startDate", startDate);
}

if (endDate) {
    params.set("endDate", endDate);
}

const query = params.toString();

return query ? `?${query}` : "";
```

}

function getReportEndpoint(reportType) {
const endpoints = {
dashboard: "/dashboard",
students: "/students",
academic: "/academic",
attendance: "/attendance",
fees: "/fees",
staff: "/staff",
complete: "/complete"
};

```
return endpoints[reportType] || "/dashboard";
```

}

function getReportTitle(reportType) {
const titles = {
dashboard: "School Dashboard Report",
students: "Student Report",
academic: "Academic Report",
attendance: "Attendance Report",
fees: "Fees Report",
staff: "Staff Report",
complete: "Complete School Report"
};

```
return titles[reportType] || "School Report";
```

}

function getReportIcon(reportType) {
const icons = {
dashboard: "bi-speedometer2",
students: "bi-mortarboard-fill",
academic: "bi-journal-check",
attendance: "bi-calendar-check-fill",
fees: "bi-cash-stack",
staff: "bi-person-badge-fill",
complete: "bi-file-earmark-bar-graph"
};

```
return icons[reportType] || "bi-file-earmark-bar-graph";
```

}

async function generateReport(reportType) {
currentReportType = reportType;

```
const resultsBody =
    document.getElementById("resultsBody");

if (!resultsBody) {
    return;
}

const title =
    getReportTitle(reportType);

const endpoint =
    getReportEndpoint(reportType);

const query =
    buildQueryString();

resultsBody.innerHTML = `
    <div class="loading">
        <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>

        <div class="fw-semibold">
            Generating ${escapeHtml(title)}...
        </div>

        <div class="small text-muted mt-1">
            Please wait.
        </div>
    </div>
`;

showAlert(
    `Generating ${title}...`,
    "info"
);

try {
    const response =
        await requestReport(
            `${REPORTS_API}${endpoint}${query}`
        );

    currentReportData =
        response?.data ??
        response?.report ??
        response;

    renderReport(
        reportType,
        currentReportData
    );

    showAlert(
        `${title} generated successfully.`,
        "success"
    );

} catch (error) {
    console.error(
        "Generate report error:",
        error
    );

    resultsBody.innerHTML = `
        <div class="empty-state">

            <div class="empty-state-icon bg-danger-subtle text-danger">
                <i class="bi bi-exclamation-triangle-fill"></i>
            </div>

            <h3 class="h5 fw-bold text-dark">
                Unable to generate report
            </h3>

            <p class="mb-0">
                ${escapeHtml(error.message)}
            </p>

        </div>
    `;

    showAlert(
        error.message,
        "danger"
    );
}
```

}

function generateSelectedReport() {
const reportType =
getFilterValue("reportType");

```
generateReport(
    reportType || "dashboard"
);
```

}

function renderReport(reportType, data) {
const resultsTitle =
document.getElementById("resultsTitle");

```
const resultsDate =
    document.getElementById("resultsDate");

const reportTypeBadge =
    document.getElementById("reportTypeBadge");

const resultsBody =
    document.getElementById("resultsBody");

if (resultsTitle) {
    resultsTitle.textContent =
        getReportTitle(reportType);
}

if (resultsDate) {
    resultsDate.textContent =
        `Generated ${new Date().toLocaleString("en-NG")}`;
}

if (reportTypeBadge) {
    reportTypeBadge.classList.remove("d-none");

    reportTypeBadge.innerHTML = `
        <i class="bi ${getReportIcon(reportType)}"></i>
        ${escapeHtml(getReportTitle(reportType))}
    `;
}

if (!resultsBody) {
    return;
}

if (
    data === null ||
    data === undefined
) {
    renderEmptyState(
        resultsBody,
        "No data available",
        "No information was returned for this report."
    );

    return;
}

if (Array.isArray(data)) {
    renderArrayReport(
        resultsBody,
        data
    );

    return;
}

if (typeof data === "object") {
    renderObjectReport(
        resultsBody,
        data
    );

    return;
}

resultsBody.innerHTML = `
    <div class="report-message">
        ${escapeHtml(String(data))}
    </div>
`;
```

}

function renderObjectReport(container, data) {
const entries =
Object.entries(data);

```
if (!entries.length) {
    renderEmptyState(
        container,
        "No data available",
        "The report returned no information."
    );

    return;
}

const simpleEntries =
    entries.filter(
        ([, value]) =>
            isSimpleValue(value)
    );

const complexEntries =
    entries.filter(
        ([, value]) =>
            !isSimpleValue(value)
    );

let html = "";

if (simpleEntries.length) {

    html += `
        <div class="row g-3">
    `;

    simpleEntries.forEach(
        ([key, value]) => {

            html += `
                <div class="col-12 col-sm-6 col-xl-3">

                    <div class="summary-item">

                        <span>
                            ${escapeHtml(
                                formatLabel(key)
                            )}
                        </span>

                        <strong>
                            ${escapeHtml(
                                formatValue(value)
                            )}
                        </strong>

                    </div>

                </div>
            `;
        }
    );

    html += `
        </div>
    `;
}

complexEntries.forEach(
    ([key, value]) => {

        html += `
            <div class="mt-4">

                <h3 class="h6 fw-bold mb-3">
                    ${escapeHtml(
                        formatLabel(key)
                    )}
                </h3>
        `;

        if (Array.isArray(value)) {
            html +=
                renderDynamicTable(value);
        } else {
            html += `
                <div class="report-message">

                    <pre class="mb-0" style="white-space: pre-wrap;">${escapeHtml(
                        JSON.stringify(
                            value,
                            null,
                            2
                        )
                    )}</pre>

                </div>
            `;
        }

        html += `
            </div>
        `;
    }
);

container.innerHTML =
    html;
```

}

function renderArrayReport(container, data) {
if (!data.length) {
renderEmptyState(
container,
"No records found",
"No records are available for the selected report."
);

```
    return;
}

container.innerHTML =
    renderDynamicTable(data);
```

}

function renderDynamicTable(rows) {
if (
!Array.isArray(rows) ||
!rows.length
) {
return `             <div class="empty-state py-4">
                No records found.             </div>
        `;
}

```
const columns = [
    ...new Set(
        rows.flatMap(
            row => {

                if (
                    typeof row !== "object" ||
                    row === null
                ) {
                    return [];
                }

                return Object.keys(row);
            }
        )
    )
];

if (!columns.length) {

    return `
        <div class="report-message">
            ${rows
                .map(
                    row =>
                        escapeHtml(
                            String(row)
                        )
                )
                .join("<br>")}
        </div>
    `;
}

let html = `
    <div class="table-responsive">

        <table class="table table-hover dynamic-table align-middle">

            <thead>

                <tr>
`;

columns.forEach(
    column => {

        html += `
            <th>
                ${escapeHtml(
                    formatLabel(column)
                )}
            </th>
        `;
    }
);

html += `
                </tr>

            </thead>

            <tbody>
`;

rows.forEach(
    row => {

        html += `
            <tr>
        `;

        columns.forEach(
            column => {

                html += `
                    <td>
                        ${formatTableValue(
                            row?.[column]
                        )}
                    </td>
                `;
            }
        );

        html += `
            </tr>
        `;
    }
);

html += `
            </tbody>

        </table>

    </div>
`;

return html;
```

}

function renderEmptyState(
container,
title,
message
) {
container.innerHTML = ` <div class="empty-state">

```
        <div class="empty-state-icon">
            <i class="bi bi-database-x"></i>
        </div>

        <h3 class="h5 fw-bold text-dark">
            ${escapeHtml(title)}
        </h3>

        <p class="mb-0">
            ${escapeHtml(message)}
        </p>

    </div>
`;
```

}

function clearFilters() {
const reportType =
document.getElementById("reportType");

```
const sessionId =
    document.getElementById("sessionId");

const termId =
    document.getElementById("termId");

const classId =
    document.getElementById("classId");

const startDate =
    document.getElementById("startDate");

const endDate =
    document.getElementById("endDate");

if (reportType) {
    reportType.value =
        "dashboard";
}

if (sessionId) {
    sessionId.value =
        "";
}

if (termId) {
    termId.value =
        "";
}

if (classId) {
    classId.value =
        "";
}

if (startDate) {
    startDate.value =
        "";
}

if (endDate) {
    endDate.value =
        "";
}

currentReportType =
    null;

currentReportData =
    null;

const resultsTitle =
    document.getElementById("resultsTitle");

const resultsDate =
    document.getElementById("resultsDate");

const reportTypeBadge =
    document.getElementById("reportTypeBadge");

const resultsBody =
    document.getElementById("resultsBody");

if (resultsTitle) {
    resultsTitle.textContent =
        "Report Results";
}

if (resultsDate) {
    resultsDate.textContent =
        "No report generated";
}

if (reportTypeBadge) {
    reportTypeBadge.classList.add(
        "d-none"
    );
}

if (resultsBody) {
    renderEmptyState(
        resultsBody,
        "No report generated yet",
        "Select a report above or choose a report type and generate it."
    );
}

showAlert(
    "Report filters cleared.",
    "success"
);
```

}

function refreshReports() {
if (currentReportType) {
generateReport(
currentReportType
);

```
    return;
}

generateSelectedReport();
```

}

function printResults() {
if (!currentReportData) {
showAlert(
"Generate a report before printing.",
"warning"
);

```
    return;
}

window.print();
```

}

function formatLabel(value) {
return String(value || "")
.replace(/_/g, " ")
.replace(/([a-z])([A-Z])/g, "$1 $2")
.replace(/\b\w/g, letter =>
letter.toUpperCase()
);
}

function formatValue(value) {
if (
value === null ||
value === undefined
) {
return "-";
}

```
if (typeof value === "boolean") {
    return value ? "Yes" : "No";
}

if (typeof value === "number") {
    return value.toLocaleString("en-NG");
}

return String(value);
```

}

function formatTableValue(value) {
if (
value === null ||
value === undefined
) {
return "-";
}

```
if (typeof value === "object") {
    return escapeHtml(
        JSON.stringify(value)
    );
}

return escapeHtml(
    formatValue(value)
);
```

}

function isSimpleValue(value) {
return (
value === null ||
value === undefined ||
typeof value === "string" ||
typeof value === "number" ||
typeof value === "boolean"
);
}

function showAlert(
message,
type = "success"
) {
const alert =
document.getElementById("alert");

```
if (!alert) {
    return;
}

alert.textContent =
    message;

alert.className =
    `alert show alert-${type}`;

window.clearTimeout(
    showAlert.timeout
);

showAlert.timeout =
    window.setTimeout(
        () => {
            alert.classList.remove(
                "show"
            );
        },
        5000
    );
```

}

function initializeSidebar() {
const sidebar =
document.getElementById("sidebar");

```
const sidebarToggle =
    document.getElementById("sidebarToggle");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

function closeSidebar() {
    if (sidebar) {
        sidebar.classList.remove(
            "show"
        );
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove(
            "show"
        );
    }
}

if (sidebarToggle) {
    sidebarToggle.addEventListener(
        "click",
        () => {

            if (!sidebar) {
                return;
            }

            sidebar.classList.toggle(
                "show"
            );

            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle(
                    "show"
                );
            }
        }
    );
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );
}

document
    .querySelectorAll(
        ".sidebar .nav-link"
    )
    .forEach(
        link => {
            link.addEventListener(
                "click",
                closeSidebar
            );
        }
    );
```

}

function initializeLogout() {
const logoutButton =
document.getElementById(
"logoutButton"
);

```
if (!logoutButton) {
    return;
}

logoutButton.addEventListener(
    "click",
    () => {

        const keys = [
            "school_management_token",
            "school_management_user",
            "token",
            "authToken",
            "accessToken"
        ];

        keys.forEach(
            key => {
                localStorage.removeItem(
                    key
                );

                sessionStorage.removeItem(
                    key
                );
            }
        );

        window.location.href =
            "login.html";
    }
);
```

}

function loadStoredUser() {
const userName =
document.getElementById(
"userName"
);

```
if (!userName) {
    return;
}

try {

    const storedUser =
        JSON.parse(
            localStorage.getItem(
                "school_management_user"
            ) ||
            sessionStorage.getItem(
                "school_management_user"
            ) ||
            "{}"
        );

    if (storedUser?.name) {
        userName.textContent =
            storedUser.name;

    } else if (storedUser?.username) {
        userName.textContent =
            storedUser.username;
    }

} catch (error) {
    console.warn(
        "Unable to read stored user information.",
        error
    );
}
```

}

function initializeReportButtons() {
document
.querySelectorAll(
".report-action"
)
.forEach(
button => {

```
            button.addEventListener(
                "click",
                () => {

                    const reportType =
                        button.dataset.reportType;

                    if (!reportType) {
                        return;
                    }

                    const reportTypeSelect =
                        document.getElementById(
                            "reportType"
                        );

                    if (reportTypeSelect) {
                        reportTypeSelect.value =
                            reportType;
                    }

                    generateReport(
                        reportType
                    );
                }
            );
        }
    );
```

}

function initializePage() {
initializeSidebar();
initializeLogout();
loadStoredUser();
initializeReportButtons();

```
document
    .getElementById(
        "generateReportButton"
    )
    ?.addEventListener(
        "click",
        generateSelectedReport
    );

document
    .getElementById(
        "refreshReportsButton"
    )
    ?.addEventListener(
        "click",
        refreshReports
    );

document
    .getElementById(
        "clearFiltersButton"
    )
    ?.addEventListener(
        "click",
        clearFilters
    );

document
    .getElementById(
        "printReportButton"
    )
    ?.addEventListener(
        "click",
        printResults
    );

document
    .getElementById(
        "printResultsButton"
    )
    ?.addEventListener(
        "click",
        printResults
    );
```

}

document.addEventListener(
"DOMContentLoaded",
initializePage
);

window.generateReport =
generateReport;

window.generateSelectedReport =
generateSelectedReport;

window.refreshReports =
refreshReports;

window.clearReportFilters =
clearFilters;

window.printReportResults =
printResults;

window.ReportsPage = {
generateReport,
generateSelectedReport,
refreshReports,
clearFilters,
printResults
};
