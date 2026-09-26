"use strict";

const REPORTS_API = "/api/reports";

let currentReportType = null;
let currentReportData = null;

let reportAcademicSessions = [];
let reportTerms = [];
let reportClasses = [];

/* ==========================================================================
   AUTHENTICATION
   ========================================================================== */

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

/* ==========================================================================
   API REQUEST
   ========================================================================== */

async function requestReport(url) {
    const token = getAuthToken();

    const headers = {
        Accept: "application/json"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(url, {
            method: "GET",
            headers
        });
    } catch (error) {
        throw new Error(
            "Unable to connect to the school management server."
        );
    }

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (response.status === 401) {
        throw new Error(
            "Your session has expired. Please log in again."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "You do not have permission to view this report."
        );
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            `Report request failed with status ${response.status}.`
        );
    }

    return data;
}

/* ==========================================================================
   GENERAL API LIST HELPERS
   ========================================================================== */

function getApiList(data, possibleKeys = []) {
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

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (
        data.data &&
        typeof data.data === "object"
    ) {
        for (const key of possibleKeys) {
            if (Array.isArray(data.data[key])) {
                return data.data[key];
            }
        }
    }

    if (Array.isArray(data.rows)) {
        return data.rows;
    }

    if (Array.isArray(data.results)) {
        return data.results;
    }

    return [];
}

function getRecordId(record, idKeys = []) {
    if (!record || typeof record !== "object") {
        return "";
    }

    for (const key of idKeys) {
        if (
            record[key] !== undefined &&
            record[key] !== null &&
            String(record[key]).trim() !== ""
        ) {
            return String(record[key]).trim();
        }
    }

    return "";
}

function getFirstValue(record, keys = []) {
    if (!record || typeof record !== "object") {
        return "";
    }

    for (const key of keys) {
        if (
            record[key] !== undefined &&
            record[key] !== null &&
            String(record[key]).trim() !== ""
        ) {
            return record[key];
        }
    }

    return "";
}

/* ==========================================================================
   REPORT FILTER API
   ========================================================================== */

async function requestFilterData(url) {
    const token = getAuthToken();

    const headers = {
        Accept: "application/json"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(url, {
            method: "GET",
            headers
        });
    } catch (error) {
        throw new Error(
            "Unable to connect to the school management server."
        );
    }

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (response.status === 401) {
        throw new Error(
            "Your session has expired. Please log in again."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "You do not have permission to load report filters."
        );
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            `Filter request failed with status ${response.status}.`
        );
    }

    return data;
}

/* ==========================================================================
   FILTER LABEL HELPERS
   ========================================================================== */

function getSessionId(session) {
    return getRecordId(session, [
        "id",
        "session_id",
        "sessionId",
        "academic_session_id",
        "academicSessionId"
    ]);
}

function getSessionLabel(session) {
    return String(
        getFirstValue(session, [
            "session_name",
            "sessionName",
            "academic_session",
            "academicSession",
            "name"
        ]) || ""
    ).trim();
}

function getSessionStartDate(session) {
    return getFirstValue(session, [
        "start_date",
        "startDate"
    ]);
}

function getTermId(term) {
    return getRecordId(term, [
        "id",
        "term_id",
        "termId"
    ]);
}

function getTermLabel(term) {
    return String(
        getFirstValue(term, [
            "term_name",
            "termName",
            "name",
            "term"
        ]) || ""
    ).trim();
}

function getTermOrder(term) {
    const value = getFirstValue(term, [
        "term_order",
        "termOrder",
        "order"
    ]);

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 999;
}

function getTermSessionId(term) {
    return getRecordId(term, [
        "academic_session_id",
        "academicSessionId",
        "session_id",
        "sessionId"
    ]);
}

function getClassId(classRecord) {
    return getRecordId(classRecord, [
        "id",
        "class_id",
        "classId"
    ]);
}

function getClassLabel(classRecord) {
    const directName = String(
        getFirstValue(classRecord, [
            "class_name",
            "className",
            "name"
        ]) || ""
    ).trim();

    if (directName) {
        return directName;
    }

    const levelName = String(
        getFirstValue(classRecord, [
            "level_name",
            "levelName"
        ]) || ""
    ).trim();

    return levelName;
}

function getClassLevelOrder(classRecord) {
    const value = getFirstValue(classRecord, [
        "level_order",
        "levelOrder"
    ]);

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 999;
}

function getClassOrder(classRecord) {
    const value = getFirstValue(classRecord, [
        "class_order",
        "classOrder",
        "order"
    ]);

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 999;
}

/* ==========================================================================
   FILTER LOADING
   ========================================================================== */

async function loadAcademicSessions() {
    const select = document.getElementById("sessionId");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">Loading academic sessions...</option>
    `;

    try {
        const response = await requestFilterData(
            "/api/academic-sessions"
        );

        reportAcademicSessions = getApiList(
            response,
            [
                "academicSessions",
                "academic_sessions",
                "sessions"
            ]
        );

        reportAcademicSessions = reportAcademicSessions
            .filter(session => {
                return (
                    getSessionId(session) &&
                    getSessionLabel(session)
                );
            })
            .sort((a, b) => {
                const dateA = new Date(
                    getSessionStartDate(a) || 0
                ).getTime();

                const dateB = new Date(
                    getSessionStartDate(b) || 0
                ).getTime();

                if (
                    Number.isFinite(dateA) &&
                    Number.isFinite(dateB) &&
                    dateA !== dateB
                ) {
                    return dateB - dateA;
                }

                return getSessionLabel(b)
                    .localeCompare(
                        getSessionLabel(a),
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );
            });

        populateSessionSelect();

        console.log(
            "Reports academic sessions loaded:",
            reportAcademicSessions
        );

    } catch (error) {
        console.error(
            "Unable to load academic sessions:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load academic sessions
            </option>
        `;

        showAlert(
            error?.message ||
            "Unable to load academic sessions.",
            "danger"
        );

        if (
            error?.message ===
            "Your session has expired. Please log in again."
        ) {
            redirectToLogin();
        }
    }
}

function populateSessionSelect() {
    const select = document.getElementById("sessionId");

    if (!select) {
        return;
    }

    const previousValue = select.value;

    select.innerHTML = `
        <option value="">All Academic Sessions</option>
    `;

    reportAcademicSessions.forEach(session => {
        const id = getSessionId(session);
        const label = getSessionLabel(session);

        if (!id || !label) {
            return;
        }

        const option = document.createElement("option");

        option.value = id;
        option.textContent = label;

        select.appendChild(option);
    });

    if (
        previousValue &&
        reportAcademicSessions.some(
            session =>
                getSessionId(session) === previousValue
        )
    ) {
        select.value = previousValue;
    }
}

async function loadTerms() {
    const select = document.getElementById("termId");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">Loading terms...</option>
    `;

    try {
        const response = await requestFilterData(
            "/api/terms"
        );

        reportTerms = getApiList(
            response,
            [
                "terms",
                "academicTerms"
            ]
        );

        reportTerms = reportTerms.filter(term => {
            return (
                getTermId(term) &&
                getTermLabel(term)
            );
        });

        sortTerms();

        populateTermSelect();

        console.log(
            "Reports terms loaded:",
            reportTerms
        );

    } catch (error) {
        console.error(
            "Unable to load terms:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load terms
            </option>
        `;

        showAlert(
            error?.message ||
            "Unable to load terms.",
            "danger"
        );

        if (
            error?.message ===
            "Your session has expired. Please log in again."
        ) {
            redirectToLogin();
        }
    }
}

function sortTerms() {
    reportTerms.sort((a, b) => {
        const orderA = getTermOrder(a);
        const orderB = getTermOrder(b);

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        return getTermLabel(a).localeCompare(
            getTermLabel(b),
            undefined,
            {
                numeric: true,
                sensitivity: "base"
            }
        );
    });
}

function populateTermSelect() {
    const select = document.getElementById("termId");

    if (!select) {
        return;
    }

    const selectedSessionId =
        getFilterValue("sessionId");

    const previousValue = select.value;

    let termsToDisplay = reportTerms;

    if (selectedSessionId) {
        const termsWithSession =
            reportTerms.filter(term => {
                return Boolean(
                    getTermSessionId(term)
                );
            });

        if (termsWithSession.length) {
            termsToDisplay =
                termsWithSession.filter(term => {
                    return (
                        getTermSessionId(term) ===
                        selectedSessionId
                    );
                });
        }
    }

    select.innerHTML = `
        <option value="">All Terms</option>
    `;

    termsToDisplay.forEach(term => {
        const id = getTermId(term);
        const label = getTermLabel(term);

        if (!id || !label) {
            return;
        }

        const option = document.createElement("option");

        option.value = id;
        option.textContent = label;

        select.appendChild(option);
    });

    if (
        previousValue &&
        termsToDisplay.some(
            term =>
                getTermId(term) === previousValue
        )
    ) {
        select.value = previousValue;
    }
}

async function loadClasses() {
    const select = document.getElementById("classId");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">Loading classes...</option>
    `;

    try {
        const response = await requestFilterData(
            "/api/classes"
        );

        reportClasses = getApiList(
            response,
            [
                "classes",
                "classList"
            ]
        );

        reportClasses = reportClasses.filter(classRecord => {
            return (
                getClassId(classRecord) &&
                getClassLabel(classRecord)
            );
        });

        reportClasses.sort((a, b) => {
            const levelA =
                getClassLevelOrder(a);

            const levelB =
                getClassLevelOrder(b);

            if (levelA !== levelB) {
                return levelA - levelB;
            }

            const classOrderA =
                getClassOrder(a);

            const classOrderB =
                getClassOrder(b);

            if (
                classOrderA !==
                classOrderB
            ) {
                return classOrderA - classOrderB;
            }

            return getClassLabel(a).localeCompare(
                getClassLabel(b),
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            );
        });

        populateClassSelect();

        console.log(
            "Reports classes loaded:",
            reportClasses
        );

    } catch (error) {
        console.error(
            "Unable to load classes:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load classes
            </option>
        `;

        showAlert(
            error?.message ||
            "Unable to load classes.",
            "danger"
        );

        if (
            error?.message ===
            "Your session has expired. Please log in again."
        ) {
            redirectToLogin();
        }
    }
}

function populateClassSelect() {
    const select = document.getElementById("classId");

    if (!select) {
        return;
    }

    const previousValue = select.value;

    select.innerHTML = `
        <option value="">All Classes</option>
    `;

    reportClasses.forEach(classRecord => {
        const id = getClassId(classRecord);
        const label = getClassLabel(classRecord);

        if (!id || !label) {
            return;
        }

        const option = document.createElement("option");

        option.value = id;
        option.textContent = label;

        select.appendChild(option);
    });

    if (
        previousValue &&
        reportClasses.some(
            classRecord =>
                getClassId(classRecord) ===
                previousValue
        )
    ) {
        select.value = previousValue;
    }
}

async function loadReportFilters() {
    const results = await Promise.allSettled([
        loadAcademicSessions(),
        loadTerms(),
        loadClasses()
    ]);

    const rejected = results.filter(
        result => result.status === "rejected"
    );

    if (rejected.length) {
        console.warn(
            "Some Reports filters could not be loaded.",
            rejected
        );
    }
}

/* ==========================================================================
   FILTER EVENTS
   ========================================================================== */

function initializeFilterEvents() {
    const sessionSelect =
        document.getElementById("sessionId");

    if (sessionSelect) {
        sessionSelect.addEventListener(
            "change",
            () => {
                populateTermSelect();

                const termSelect =
                    document.getElementById("termId");

                if (termSelect) {
                    termSelect.value = "";
                }
            }
        );
    }
}

/* ==========================================================================
   FILTER HELPERS
   ========================================================================== */

function getFilterValue(id) {
    const element = document.getElementById(id);

    if (!element) {
        return "";
    }

    return String(element.value || "").trim();
}

function buildQueryString() {
    const params = new URLSearchParams();

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
}

/* ==========================================================================
   REPORT DEFINITIONS
   ========================================================================== */

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

    return endpoints[reportType] || "/dashboard";
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

    return titles[reportType] || "School Report";
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

    return icons[reportType] || "bi-file-earmark-bar-graph";
}

/* ==========================================================================
   GENERATE REPORT
   ========================================================================== */

async function generateReport(reportType) {
    currentReportType = reportType || "dashboard";

    const resultsBody =
        document.getElementById("resultsBody");

    if (!resultsBody) {
        return;
    }

    const title =
        getReportTitle(currentReportType);

    const endpoint =
        getReportEndpoint(currentReportType);

    const query =
        buildQueryString();

    resultsBody.innerHTML = `
        <div class="loading">

            <div
                class="spinner-border text-primary mb-3"
                role="status"
            >
                <span class="visually-hidden">
                    Loading...
                </span>
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
            currentReportType,
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
                    ${escapeHtml(
                        error?.message ||
                        "An unexpected error occurred while generating the report."
                    )}
                </p>

            </div>
        `;

        showAlert(
            error?.message ||
            "Unable to generate report.",
            "danger"
        );

        if (
            error?.message ===
            "Your session has expired. Please log in again."
        ) {
            redirectToLogin();
        }
    }
}

function generateSelectedReport() {
    const reportType =
        getFilterValue("reportType");

    generateReport(
        reportType || "dashboard"
    );
}

/* ==========================================================================
   REPORT RENDERING
   ========================================================================== */

function renderReport(reportType, data) {
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
            ${escapeHtml(
                getReportTitle(reportType)
            )}
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
}

function renderObjectReport(container, data) {
    const entries =
        Object.entries(data);

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

                        <pre
                            class="mb-0"
                            style="white-space: pre-wrap;"
                        >${escapeHtml(
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
}

function renderArrayReport(container, data) {
    if (!data.length) {
        renderEmptyState(
            container,
            "No records found",
            "No records are available for the selected report."
        );

        return;
    }

    container.innerHTML =
        renderDynamicTable(data);
}

function renderDynamicTable(rows) {
    if (
        !Array.isArray(rows) ||
        !rows.length
    ) {
        return `
            <div class="empty-state py-4">
                No records found.
            </div>
        `;
    }

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
}

function renderEmptyState(
    container,
    title,
    message
) {
    container.innerHTML = `
        <div class="empty-state">

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
}

/* ==========================================================================
   FILTER MANAGEMENT
   ========================================================================== */

function clearFilters() {
    const reportType =
        document.getElementById("reportType");

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

    populateTermSelect();

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
}

function refreshReports() {
    if (currentReportType) {
        generateReport(
            currentReportType
        );

        return;
    }

    generateSelectedReport();
}

/* ==========================================================================
   PRINTING
   ========================================================================== */

function printResults() {
    if (!currentReportData) {
        showAlert(
            "Generate a report before printing.",
            "warning"
        );

        return;
    }

    window.print();
}

/* ==========================================================================
   FORMATTING
   ========================================================================== */

function formatLabel(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(
            /\b\w/g,
            letter =>
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

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    if (typeof value === "number") {
        return value.toLocaleString("en-NG");
    }

    return String(value);
}

function formatTableValue(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "-";
    }

    if (typeof value === "object") {
        return escapeHtml(
            JSON.stringify(value)
        );
    }

    return escapeHtml(
        formatValue(value)
    );
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

/* ==========================================================================
   HTML SAFETY
   ========================================================================== */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================================================
   LOGIN REDIRECT
   ========================================================================== */

function redirectToLogin() {
    window.setTimeout(() => {
        window.location.href =
            "/pages/login.html";
    }, 1200);
}

/* ==========================================================================
   ALERTS
   ========================================================================== */

function showAlert(
    message,
    type = "success"
) {
    const alert =
        document.getElementById("alert");

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
}

/* ==========================================================================
   SIDEBAR
   ========================================================================== */

function initializeSidebar() {
    const sidebar =
        document.getElementById("sidebar");

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
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

function initializeLogout() {
    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

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
                "/pages/login.html";
        }
    );
}

/* ==========================================================================
   STORED USER
   ========================================================================== */

function loadStoredUser() {
    const userName =
        document.getElementById(
            "userName"
        );

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
}

/* ==========================================================================
   REPORT BUTTONS
   ========================================================================== */

function initializeReportButtons() {
    document
        .querySelectorAll(
            ".report-action"
        )
        .forEach(
            button => {
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
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

async function initializePage() {
    initializeSidebar();
    initializeLogout();
    loadStoredUser();
    initializeReportButtons();
    initializeFilterEvents();

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

    await loadReportFilters();
}

/* ==========================================================================
   PAGE START
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);

/* ==========================================================================
   GLOBAL ACCESS
   ========================================================================== */

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
    printResults,
    loadReportFilters
};