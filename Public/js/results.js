"use strict";

(function () {
let results = [];
let resultSets = [];
let sessions = [];
let terms = [];


const PASS_MARK = 40;

async function request(endpoint, options = {}) {
    if (typeof window.apiRequest === "function") {
        return window.apiRequest(endpoint, options);
    }

    const token =
        localStorage.getItem("school_management_token") ||
        sessionStorage.getItem("school_management_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        "";

    let url = endpoint;

    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {
        if (!url.startsWith("/")) {
            url = "/" + url;
        }

        if (!url.startsWith("/api/")) {
            url = "/api" + url;
        }
    }

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers["Content-Type"] &&
        !headers["content-type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers
        });
    } catch (error) {
        console.error("Results API error:", error);
        throw new Error(
            "Unable to connect to the server."
        );
    }

    if (response.status === 401) {
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

        if (
            !window.location.pathname.endsWith(
                "/login.html"
            )
        ) {
            window.location.href =
                "/pages/login.html";
        }

        throw new Error(
            "Authentication required."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "You do not have permission to perform this action."
        );
    }

    const contentType =
        response.headers.get("content-type") || "";

    const data =
        contentType.includes("application/json")
            ? await response.json()
            : await response.text();

    if (!response.ok) {
        throw new Error(
            typeof data === "object"
                ? data.message ||
                  data.error ||
                  "Request failed."
                : data ||
                  "Request failed."
        );
    }

    return data;
}

async function initialize() {
    setupEvents();

    try {
        await Promise.all([
            loadSessions(),
            loadTerms()
        ]);

        await loadResults();
    } catch (error) {
        console.error(
            "Results initialization error:",
            error
        );
    }
}

function setupEvents() {
    const searchInput =
        document.querySelector(
            "#searchInput"
        );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderResults
        );
    }

    const sessionFilter =
        document.querySelector(
            "#sessionFilter"
        );

    if (sessionFilter) {
        sessionFilter.addEventListener(
            "change",
            loadResults
        );
    }

    const termFilter =
        document.querySelector(
            "#termFilter"
        );

    if (termFilter) {
        termFilter.addEventListener(
            "change",
            loadResults
        );
    }

    const refreshButton =
        document.querySelector(
            "#refreshButton"
        );

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            async function () {
                await loadResults();
            }
        );
    }

    document.addEventListener(
        "click",
        handleActionClick
    );
}

async function loadSessions() {
    try {
        const data =
            await request(
                "/academic-sessions"
            );

        sessions =
            normalizeArray(data);

        populateSessionFilter();
    } catch (error) {
        console.error(
            "Unable to load academic sessions:",
            error
        );

        sessions = [];

        notify(
            "Unable to load academic sessions.",
            "error"
        );
    }
}

async function loadTerms() {
    try {
        const data =
            await request(
                "/terms"
            );

        terms =
            normalizeArray(data);

        populateTermFilter();
    } catch (error) {
        console.error(
            "Unable to load terms:",
            error
        );

        terms = [];

        notify(
            "Unable to load terms.",
            "error"
        );
    }
}

async function loadResults() {
    showLoading();

    try {
        const sessionId =
            getValue(
                "#sessionFilter"
            );

        const termId =
            getValue(
                "#termFilter"
            );

        const query =
            new URLSearchParams();

        if (sessionId) {
            query.set(
                "sessionId",
                sessionId
            );
        }

        if (termId) {
            query.set(
                "termId",
                termId
            );
        }

        const endpoint =
            query.toString()
                ? `/results?${query.toString()}`
                : "/results";

        const data =
            await request(
                endpoint
            );

        results =
            normalizeArray(data);

        resultSets =
            buildResultSets(
                results
            );

        renderResults();
        updateSummary();
    } catch (error) {
        console.error(
            "Unable to load results:",
            error
        );

        results = [];
        resultSets = [];

        showError(
            error.message ||
            "Unable to load results."
        );

        updateSummary();
    }
}

function buildResultSets(records) {
    const groups =
        new Map();

    records.forEach(
        function (result) {
            const studentId =
                getStudentId(
                    result
                );

            const admissionNumber =
                getAdmissionNumber(
                    result
                );

            const sessionId =
                getSessionId(
                    result
                );

            const termId =
                getTermId(
                    result
                );

            const studentKey =
                studentId ||
                admissionNumber ||
                getStudentName(
                    result
                );

            const sessionKey =
                sessionId ||
                getSessionName(
                    result
                );

            const termKey =
                termId ||
                getTermName(
                    result
                );

            const key =
                [
                    studentKey,
                    sessionKey,
                    termKey
                ].join("|");

            if (!groups.has(key)) {
                groups.set(
                    key,
                    {
                        key,
                        studentId:
                            studentId,
                        admissionNumber:
                            admissionNumber,
                        studentName:
                            getStudentName(
                                result
                            ),
                        classId:
                            getClassId(
                                result
                            ),
                        className:
                            getClassName(
                                result
                            ),
                        sessionId:
                            sessionId,
                        sessionName:
                            getSessionName(
                                result
                            ),
                        termId:
                            termId,
                        termName:
                            getTermName(
                                result
                            ),
                        records: []
                    }
                );
            }

            groups
                .get(key)
                .records.push(
                    result
                );
        }
    );

    return Array.from(
        groups.values()
    ).map(
        function (group) {
            return calculateResultSet(
                group
            );
        }
    );
}

function calculateResultSet(group) {
    let total =
        0;

    let subjectCount =
        group.records.length;

    group.records.forEach(
        function (result) {
            total +=
                getResultTotal(
                    result
                );
        }
    );

    const average =
        subjectCount > 0
            ? total / subjectCount
            : 0;

    return {
        ...group,
        subjectCount,
        total,
        average,
        status:
            average >= PASS_MARK
                ? "Passed"
                : "Failed"
    };
}

function populateSessionFilter() {
    const select =
        document.querySelector(
            "#sessionFilter"
        );

    if (!select) {
        return;
    }

    const currentValue =
        select.value;

    select.innerHTML = `
        <option value="">
            All sessions
        </option>
    `;

    sessions.forEach(
        function (session) {
            const id =
                session.id ||
                session.session_id ||
                "";

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
                );

            select.appendChild(
                option
            );
        }
    );

    if (currentValue) {
        select.value =
            currentValue;
    }
}

function populateTermFilter() {
    const select =
        document.querySelector(
            "#termFilter"
        );

    if (!select) {
        return;
    }

    const currentValue =
        select.value;

    select.innerHTML = `
        <option value="">
            All terms
        </option>
    `;

    const sortedTerms =
        [...terms].sort(
            function (a, b) {
                return (
                    Number(
                        a.term_order ??
                        a.order ??
                        999
                    ) -
                    Number(
                        b.term_order ??
                        b.order ??
                        999
                    )
                );
            }
        );

    sortedTerms.forEach(
        function (term) {
            const id =
                term.id ||
                term.term_id ||
                "";

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
                );

            select.appendChild(
                option
            );
        }
    );

    if (currentValue) {
        select.value =
            currentValue;
    }
}

function renderResults() {
    const container =
        document.querySelector(
            "#resultsTableBody"
        );

    if (!container) {
        return;
    }

    const search =
        getValue(
            "#searchInput"
        )
            .trim()
            .toLowerCase();

    let records =
        resultSets;

    if (search) {
        records =
            resultSets.filter(
                function (resultSet) {
                    return (
                        resultSet.studentName
                            .toLowerCase()
                            .includes(search) ||
                        resultSet.admissionNumber
                            .toLowerCase()
                            .includes(search) ||
                        resultSet.className
                            .toLowerCase()
                            .includes(search) ||
                        resultSet.sessionName
                            .toLowerCase()
                            .includes(search) ||
                        resultSet.termName
                            .toLowerCase()
                            .includes(search)
                    );
                }
            );
    }

    if (!records.length) {
        showEmpty(
            "No academic result records are available."
        );

        return;
    }

    container.innerHTML =
        records
            .map(
                renderResultRow
            )
            .join("");
}

function renderResultRow(resultSet) {
    const studentId =
        resultSet.studentId;

    const admissionNumber =
        resultSet.admissionNumber ||
        "-";

    const studentName =
        resultSet.studentName ||
        "Unknown Student";

    const className =
        resultSet.className ||
        "-";

    const sessionName =
        resultSet.sessionName ||
        "-";

    const termName =
        resultSet.termName ||
        "-";

    const status =
        resultSet.status;

    const statusClass =
        status === "Passed"
            ? "bg-success"
            : "bg-danger";

    const viewUrl =
        buildStudentResultsUrl(
            resultSet
        );

    return `
        <tr>
            <td>
                <strong>
                    ${escapeHtml(
                        admissionNumber
                    )}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    studentName
                )}
            </td>

            <td>
                ${escapeHtml(
                    className
                )}
            </td>

            <td>
                ${escapeHtml(
                    sessionName
                )}
            </td>

            <td>
                ${escapeHtml(
                    termName
                )}
            </td>

            <td>
                <span class="badge bg-primary">
                    ${resultSet.subjectCount}
                </span>
            </td>

            <td>
                <strong>
                    ${resultSet.average.toFixed(2)}
                </strong>
            </td>

            <td>
                <span
                    class="badge ${statusClass}"
                >
                    ${status}
                </span>
            </td>

            <td>
                <a
                    href="${escapeAttribute(
                        viewUrl
                    )}"
                    class="btn btn-sm btn-outline-primary"
                >
                    <i class="bi bi-eye me-1"></i>
                    View Result
                </a>
            </td>
        </tr>
    `;
}

function buildStudentResultsUrl(resultSet) {
    const params =
        new URLSearchParams();

    if (resultSet.studentId) {
        params.set(
            "studentId",
            resultSet.studentId
        );
    }

    if (resultSet.sessionId) {
        params.set(
            "academicSessionId",
            resultSet.sessionId
        );
    }

    if (resultSet.termId) {
        params.set(
            "termId",
            resultSet.termId
        );
    }

    const query =
        params.toString();

    return query
        ? `/pages/student-results.html?${query}`
        : "/pages/student-results.html";
}

function handleActionClick(event) {
    const button =
        event.target.closest(
            "[data-action]"
        );

    if (!button) {
        return;
    }
}

function updateSummary() {
    const count =
        resultSets.length;

    let passed =
        0;

    let failed =
        0;

    let totalAverage =
        0;

    resultSets.forEach(
        function (resultSet) {
            totalAverage +=
                resultSet.average;

            if (
                resultSet.average >=
                PASS_MARK
            ) {
                passed++;
            } else {
                failed++;
            }
        }
    );

    const average =
        count > 0
            ? totalAverage / count
            : 0;

    setSummary(
        "#totalResults",
        count
    );

    setSummary(
        "#passedResults",
        passed
    );

    setSummary(
        "#failedResults",
        failed
    );

    setSummary(
        "#averageScore",
        average.toFixed(2)
    );
}

function getResultTotal(result) {
    const ca =
        Number(
            result?.ca_score ??
            result?.caScore ??
            result?.ca ??
            0
        );

    const exam =
        Number(
            result?.exam_score ??
            result?.examScore ??
            result?.exam ??
            0
        );

    const storedTotal =
        result?.total_score ??
        result?.totalScore ??
        result?.total;

    if (
        storedTotal !== null &&
        storedTotal !== undefined &&
        storedTotal !== ""
    ) {
        const parsed =
            Number(
                storedTotal
            );

        if (
            Number.isFinite(
                parsed
            )
        ) {
            return parsed;
        }
    }

    return ca + exam;
}

function calculateGrade(score) {
    const value =
        Number(score) || 0;

    if (value >= 75) {
        return "A";
    }

    if (value >= 65) {
        return "B";
    }

    if (value >= 55) {
        return "C";
    }

    if (value >= 45) {
        return "D";
    }

    if (value >= 40) {
        return "E";
    }

    return "F";
}

function getRemark(score) {
    const value =
        Number(score) || 0;

    if (value >= 75) {
        return "Excellent";
    }

    if (value >= 65) {
        return "Very Good";
    }

    if (value >= 55) {
        return "Good";
    }

    if (value >= 45) {
        return "Fair";
    }

    if (value >= 40) {
        return "Pass";
    }

    return "Fail";
}

function getStudentId(student) {
    return String(
        student?.student_id ||
        student?.studentId ||
        student?.studentID ||
        student?.id ||
        ""
    );
}

function getSessionId(result) {
    return String(
        result?.academic_session_id ||
        result?.academicSessionId ||
        result?.session_id ||
        result?.sessionId ||
        ""
    );
}

function getTermId(result) {
    return String(
        result?.term_id ||
        result?.termId ||
        ""
    );
}

function getClassId(result) {
    return String(
        result?.class_id ||
        result?.classId ||
        ""
    );
}

function getClassName(result) {
    return String(
        result?.class_name ||
        result?.className ||
        result?.class ||
        "-"
    );
}

function getStudentName(student) {
    if (!student) {
        return "Unknown Student";
    }

    return (
        student.student_name ||
        student.studentName ||
        [
            student.first_name ||
            student.firstName ||
            "",

            student.middle_name ||
            student.middleName ||
            "",

            student.last_name ||
            student.lastName ||
            ""
        ]
            .filter(Boolean)
            .join(" ")
    ) || "Unknown Student";
}

function getAdmissionNumber(student) {
    return String(
        student?.admission_number ||
        student?.admissionNumber ||
        student?.admission_no ||
        student?.admissionNo ||
        student?.student_number ||
        student?.studentNumber ||
        ""
    );
}

function getSessionName(session) {
    return String(
        session?.session_name ||
        session?.sessionName ||
        session?.name ||
        session?.session ||
        session?.title ||
        "-"
    );
}

function getTermName(term) {
    return String(
        term?.term_name ||
        term?.termName ||
        term?.name ||
        term?.term ||
        term?.title ||
        "-"
    );
}

function setSummary(
    selector,
    value
) {
    const element =
        document.querySelector(
            selector
        );

    if (element) {
        element.textContent =
            value;
    }
}

function getValue(selector) {
    const element =
        document.querySelector(
            selector
        );

    return element
        ? element.value || ""
        : "";
}

function normalizeArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (
        Array.isArray(
            data?.data
        )
    ) {
        return data.data;
    }

    if (
        Array.isArray(
            data?.results
        )
    ) {
        return data.results;
    }

    if (
        Array.isArray(
            data?.sessions
        )
    ) {
        return data.sessions;
    }

    if (
        Array.isArray(
            data?.terms
        )
    ) {
        return data.terms;
    }

    if (
        Array.isArray(
            data?.records
        )
    ) {
        return data.records;
    }

    return [];
}

function showLoading() {
    const container =
        document.querySelector(
            "#resultsTableBody"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <tr>
            <td colspan="9">
                <div class="text-center p-4">
                    Loading results...
                </div>
            </td>
        </tr>
    `;
}

function showEmpty(message) {
    const container =
        document.querySelector(
            "#resultsTableBody"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <tr>
            <td colspan="9">
                <div class="empty-result-message">
                    <h5>No results found</h5>
                    <p class="mb-0">
                        ${escapeHtml(
                            message
                        )}
                    </p>
                </div>
            </td>
        </tr>
    `;
}

function showError(message) {
    const container =
        document.querySelector(
            "#resultsTableBody"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <tr>
            <td colspan="9">
                <div class="alert alert-danger m-3">
                    ${escapeHtml(
                        message
                    )}
                </div>
            </td>
        </tr>
    `;
}

function notify(
    message,
    type = "success"
) {
    if (
        typeof window.showNotification ===
        "function"
    ) {
        window.showNotification(
            message,
            type
        );

        return;
    }

    let container =
        document.querySelector(
            "#notification-container"
        );

    if (!container) {
        container =
            document.createElement(
                "div"
            );

        container.id =
            "notification-container";

        container.style.position =
            "fixed";

        container.style.top =
            "20px";

        container.style.right =
            "20px";

        container.style.zIndex =
            "9999";

        document.body.appendChild(
            container
        );
    }

    const notification =
        document.createElement(
            "div"
        );

    notification.className =
        `alert alert-${type}`;

    notification.textContent =
        message;

    container.appendChild(
        notification
    );

    setTimeout(
        function () {
            notification.remove();
        },
        4000
    );
}

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
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

function escapeAttribute(value) {
    return escapeHtml(value);
}

window.ResultsPage = {
    initialize,
    loadResults,
    loadSessions,
    loadTerms,
    calculateGrade,
    getRemark
};

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        {
            once: true
        }
    );
} else {
    initialize();
}


})();
