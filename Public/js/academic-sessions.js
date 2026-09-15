"use strict";

const sessionsTableBody =
    document.getElementById("sessionsTableBody");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const sessionForm =
    document.getElementById("sessionForm");

const sessionModal =
    document.getElementById("sessionModal");

const alertMessage =
    document.getElementById("alertMessage");

const addSessionBtn =
    document.getElementById("addSessionBtn");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelModalBtn =
    document.getElementById("cancelModalBtn");

const saveSessionBtn =
    document.getElementById("saveSessionBtn");

const totalSessions =
    document.getElementById("totalSessions");

const activeSessions =
    document.getElementById("activeSessions");

const upcomingSessions =
    document.getElementById("upcomingSessions");

const completedSessions =
    document.getElementById("completedSessions");

const sessionsTable =
    document.getElementById("sessionsTable");

const tableContainer =
    document.getElementById("tableContainer");

const loadingState =
    document.getElementById("loadingState");

const emptyState =
    document.getElementById("emptyState");

const isActiveField =
    document.getElementById("isActive");

let sessions = [];

let editingSessionId = null;

let bootstrapModal = null;

let originalEmptyStateHtml = "";

if (emptyState) {
    originalEmptyStateHtml =
        emptyState.innerHTML;
}

function getApiRequest() {
    if (
        typeof window.apiRequest ===
        "function"
    ) {
        return window.apiRequest;
    }

    throw new Error(
        "Central API service is not available."
    );
}

function showMessage(
    message,
    type = "success"
) {
    if (!alertMessage) {
        return;
    }

    alertMessage.textContent =
        message || "";

    alertMessage.className =
        "alert mb-4 alert-" +
        (
            type === "error"
                ? "danger"
                : type
        );

    alertMessage.classList.remove(
        "d-none"
    );

    window.clearTimeout(
        showMessage.timeoutId
    );

    showMessage.timeoutId =
        window.setTimeout(
            function () {
                alertMessage.textContent =
                    "";

                alertMessage.classList.add(
                    "d-none"
                );
            },
            4000
        );
}

function showLoading() {
    if (loadingState) {
        loadingState.style.display =
            "block";
    }

    if (tableContainer) {
        tableContainer.classList.add(
            "d-none"
        );
    }

    if (emptyState) {
        emptyState.classList.add(
            "d-none"
        );
    }
}

function showEmptyState(
    message
) {
    if (loadingState) {
        loadingState.style.display =
            "none";
    }

    if (tableContainer) {
        tableContainer.classList.add(
            "d-none"
        );
    }

    if (emptyState) {
        emptyState.innerHTML =
            originalEmptyStateHtml;

        const paragraph =
            emptyState.querySelector(
                "p"
            );

        if (paragraph && message) {
            paragraph.textContent =
                message;
        }

        emptyState.classList.remove(
            "d-none"
        );
    }
}

function showErrorState(
    message
) {
    if (loadingState) {
        loadingState.style.display =
            "none";
    }

    if (tableContainer) {
        tableContainer.classList.add(
            "d-none"
        );
    }

    if (emptyState) {
        emptyState.innerHTML = `
            <div class="display-5 text-danger mb-3">
                <i class="bi bi-exclamation-triangle"></i>
            </div>
            <h2 class="h5 fw-bold">
                Unable to Load Sessions
            </h2>
            <p class="text-muted mb-3"></p>
            <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                id="retrySessionsBtn">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Try Again
            </button>
        `;

        const paragraph =
            emptyState.querySelector(
                "p"
            );

        if (paragraph) {
            paragraph.textContent =
                message ||
                "Unable to load academic sessions.";
        }

        const retryButton =
            document.getElementById(
                "retrySessionsBtn"
            );

        if (retryButton) {
            retryButton.addEventListener(
                "click",
                loadSessions
            );
        }

        emptyState.classList.remove(
            "d-none"
        );
    }
}

function getSessionStatus(
    session
) {
    const isActive =
        Boolean(session.is_active);

    const isCurrent =
        Boolean(session.is_current);

    if (!isActive) {
        return "inactive";
    }

    if (isCurrent) {
        return "active";
    }

    const startDate =
        parseDateOnly(
            session.start_date
        );

    const endDate =
        parseDateOnly(
            session.end_date
        );

    const today =
        getTodayDate();

    if (
        startDate &&
        startDate > today
    ) {
        return "upcoming";
    }

    if (
        endDate &&
        endDate < today
    ) {
        return "completed";
    }

    return "active";
}

function getTodayDate() {
    const now =
        new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
}

function parseDateOnly(
    value
) {
    if (!value) {
        return null;
    }

    const text =
        String(value)
            .substring(0, 10);

    const parts =
        text.split("-");

    if (
        parts.length !== 3
    ) {
        return null;
    }

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {
        return null;
    }

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function updateStatistics() {
    const total =
        sessions.length;

    const active =
        sessions.filter(
            function (session) {
                return (
                    getSessionStatus(
                        session
                    ) === "active"
                );
            }
        ).length;

    const upcoming =
        sessions.filter(
            function (session) {
                return (
                    getSessionStatus(
                        session
                    ) === "upcoming"
                );
            }
        ).length;

    const completed =
        sessions.filter(
            function (session) {
                return (
                    getSessionStatus(
                        session
                    ) === "completed"
                );
            }
        ).length;

    if (totalSessions) {
        totalSessions.textContent =
            total;
    }

    if (activeSessions) {
        activeSessions.textContent =
            active;
    }

    if (upcomingSessions) {
        upcomingSessions.textContent =
            upcoming;
    }

    if (completedSessions) {
        completedSessions.textContent =
            completed;
    }
}

async function loadSessions() {
    showLoading();

    try {
        const apiRequest =
            getApiRequest();

        const result =
            await apiRequest(
                "/academic-sessions"
            );

        sessions =
            Array.isArray(
                result?.data
            )
                ? result.data
                : Array.isArray(
                    result?.sessions
                )
                    ? result.sessions
                    : Array.isArray(
                        result
                    )
                        ? result
                        : [];

        updateStatistics();

        renderSessions();
    } catch (error) {
        console.error(
            "Load academic sessions error:",
            error
        );

        sessions = [];

        updateStatistics();

        showErrorState(
            error.message ||
            "Unable to load academic sessions."
        );

        showMessage(
            error.message ||
            "Unable to load academic sessions.",
            "error"
        );
    }
}

function renderSessions() {
    if (!sessionsTableBody) {
        return;
    }

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toLowerCase()
            : "";

    const filteredSessions =
        sessions.filter(
            function (session) {
                const sessionName =
                    String(
                        session.session_name ||
                        ""
                    ).toLowerCase();

                const status =
                    getSessionStatus(
                        session
                    );

                const matchesSearch =
                    !searchTerm ||
                    sessionName.includes(
                        searchTerm
                    );

                const matchesStatus =
                    !selectedStatus ||
                    status ===
                    selectedStatus;

                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );

    if (
        filteredSessions.length ===
        0
    ) {
        showEmptyState(
            sessions.length === 0
                ? "Create your first academic session to get started."
                : "No sessions match your current search or filter."
        );

        return;
    }

    if (loadingState) {
        loadingState.style.display =
            "none";
    }

    if (emptyState) {
        emptyState.classList.add(
            "d-none"
        );
    }

    if (tableContainer) {
        tableContainer.classList.remove(
            "d-none"
        );
    }

    if (sessionsTable) {
        sessionsTable.style.display =
            "table";
    }

    sessionsTableBody.innerHTML =
        filteredSessions
            .map(
                createSessionRow
            )
            .join("");
}

function createSessionRow(
    session
) {
    const id =
        session.id;

    const name =
        escapeHtml(
            session.session_name ||
            "-"
        );

    const startDate =
        formatDate(
            session.start_date
        );

    const endDate =
        formatDate(
            session.end_date
        );

    const status =
        getSessionStatus(
            session
        );

    const statusLabel =
        formatStatus(
            status
        );

    const currentBadge =
        session.is_current
            ? `
                <span class="badge text-bg-primary">
                    Current
                </span>
            `
            : `
                <span class="text-muted">
                    No
                </span>
            `;

    const currentButton =
        session.is_current
            ? ""
            : `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    onclick="setCurrentSession('${escapeJs(id)}')">
                    <i class="bi bi-check-circle me-1"></i>
                    Set Current
                </button>
            `;

    return `
        <tr>
            <td>
                <div class="fw-bold">
                    ${name}
                </div>
            </td>

            <td>
                ${startDate}
            </td>

            <td>
                ${endDate}
            </td>

            <td>
                ${currentBadge}
            </td>

            <td>
                <span class="badge ${getStatusBadgeClass(status)}">
                    ${escapeHtml(statusLabel)}
                </span>
            </td>

            <td>
                <div class="d-flex flex-wrap gap-2">
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        onclick="editSession('${escapeJs(id)}')">
                        <i class="bi bi-pencil me-1"></i>
                        Edit
                    </button>

                    ${currentButton}

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        onclick="deleteSession('${escapeJs(id)}')">
                        <i class="bi bi-trash me-1"></i>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function getStatusBadgeClass(
    status
) {
    const classes = {
        active:
            "text-bg-success",
        upcoming:
            "text-bg-info",
        completed:
            "text-bg-secondary",
        inactive:
            "text-bg-danger"
    };

    return (
        classes[status] ||
        "text-bg-secondary"
    );
}

function formatStatus(
    status
) {
    const labels = {
        active:
            "Active",
        upcoming:
            "Upcoming",
        completed:
            "Completed",
        inactive:
            "Inactive"
    };

    return (
        labels[status] ||
        String(status)
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                function (letter) {
                    return letter.toUpperCase();
                }
            )
    );
}

function formatDate(
    value
) {
    if (!value) {
        return "-";
    }

    const date =
        parseDateOnly(
            value
        );

    if (!date) {
        return escapeHtml(
            String(value)
        );
    }

    return date.toLocaleDateString(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

async function editSession(
    sessionId
) {
    try {
        const apiRequest =
            getApiRequest();

        const result =
            await apiRequest(
                "/academic-sessions/" +
                encodeURIComponent(
                    sessionId
                )
            );

        const session =
            result?.data ||
            result?.session ||
            result;

        if (!session) {
            throw new Error(
                "Academic session not found."
            );
        }

        editingSessionId =
            sessionId;

        populateForm(
            session
        );

        setModalTitle(
            "Edit Academic Session"
        );

        setSubmitButton(
            "Update Session"
        );

        openModal();
    } catch (error) {
        console.error(
            "Edit academic session error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load academic session.",
            "error"
        );
    }
}

function populateForm(
    session
) {
    setField(
        "sessionName",
        session.session_name ||
        ""
    );

    setField(
        "startDate",
        toInputDate(
            session.start_date
        )
    );

    setField(
        "endDate",
        toInputDate(
            session.end_date
        )
    );

    if (isActiveField) {
        isActiveField.checked =
            Boolean(
                session.is_active
            );
    }
}

function getFormData() {
    const sessionNameField =
        document.getElementById(
            "sessionName"
        );

    const startDateField =
        document.getElementById(
            "startDate"
        );

    const endDateField =
        document.getElementById(
            "endDate"
        );

    return {
        sessionName:
            sessionNameField
                ? sessionNameField.value.trim()
                : "",

        startDate:
            startDateField &&
            startDateField.value
                ? startDateField.value
                : null,

        endDate:
            endDateField &&
            endDateField.value
                ? endDateField.value
                : null,

        isActive:
            isActiveField
                ? Boolean(
                    isActiveField.checked
                )
                : true
    };
}

function validateForm(
    data
) {
    if (!data.sessionName) {
        return (
            "Academic session name is required."
        );
    }

    if (
        data.startDate &&
        data.endDate &&
        data.endDate <
        data.startDate
    ) {
        return (
            "End date cannot be earlier than start date."
        );
    }

    return null;
}

async function saveSession(
    event
) {
    event.preventDefault();

    const data =
        getFormData();

    const validationError =
        validateForm(
            data
        );

    if (validationError) {
        showMessage(
            validationError,
            "error"
        );

        return;
    }

    const isEditing =
        Boolean(
            editingSessionId
        );

    try {
        setSubmitButton(
            isEditing
                ? "Updating..."
                : "Saving..."
        );

        if (saveSessionBtn) {
            saveSessionBtn.disabled =
                true;
        }

        const apiRequest =
            getApiRequest();

        const endpoint =
            isEditing
                ? "/academic-sessions/" +
                    encodeURIComponent(
                        editingSessionId
                    )
                : "/academic-sessions";

        const result =
            await apiRequest(
                endpoint,
                {
                    method:
                        isEditing
                            ? "PUT"
                            : "POST",
                    body:
                        JSON.stringify(
                            data
                        )
                }
            );

        showMessage(
            result?.message ||
            (
                isEditing
                    ? "Academic session updated successfully."
                    : "Academic session created successfully."
            ),
            "success"
        );

        closeModal();

        await loadSessions();
    } catch (error) {
        console.error(
            "Save academic session error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to save academic session.",
            "error"
        );
    } finally {
        setSubmitButton(
            isEditing
                ? "Update Session"
                : "Save Session"
        );

        if (saveSessionBtn) {
            saveSessionBtn.disabled =
                false;
        }
    }
}

async function setCurrentSession(
    sessionId
) {
    const session =
        sessions.find(
            function (item) {
                return (
                    String(item.id) ===
                    String(sessionId)
                );
            }
        );

    const sessionName =
        session
            ? (
                session.session_name ||
                "this academic session"
            )
            : "this academic session";

    const confirmed =
        window.confirm(
            'Set "' +
            sessionName +
            '" as the current academic session?'
        );

    if (!confirmed) {
        return;
    }

    try {
        const apiRequest =
            getApiRequest();

        const result =
            await apiRequest(
                "/academic-sessions/" +
                encodeURIComponent(
                    sessionId
                ) +
                "/current",
                {
                    method:
                        "PATCH"
                }
            );

        showMessage(
            result?.message ||
            "Current academic session updated successfully.",
            "success"
        );

        await loadSessions();
    } catch (error) {
        console.error(
            "Set current academic session error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to set the current academic session.",
            "error"
        );
    }
}

async function deleteSession(
    sessionId
) {
    const session =
        sessions.find(
            function (item) {
                return (
                    String(item.id) ===
                    String(sessionId)
                );
            }
        );

    const sessionName =
        session
            ? (
                session.session_name ||
                "this academic session"
            )
            : "this academic session";

    const confirmed =
        window.confirm(
            'Are you sure you want to delete "' +
            sessionName +
            '"?'
        );

    if (!confirmed) {
        return;
    }

    try {
        const apiRequest =
            getApiRequest();

        await apiRequest(
            "/academic-sessions/" +
            encodeURIComponent(
                sessionId
            ),
            {
                method:
                    "DELETE"
            }
        );

        showMessage(
            "Academic session deleted successfully.",
            "success"
        );

        await loadSessions();
    } catch (error) {
        console.error(
            "Delete academic session error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to delete academic session.",
            "error"
        );
    }
}

function openAddSessionModal() {
    editingSessionId =
        null;

    if (sessionForm) {
        sessionForm.reset();
    }

    if (isActiveField) {
        isActiveField.checked =
            true;
    }

    setModalTitle(
        "Add Academic Session"
    );

    setSubmitButton(
        "Save Session"
    );

    openModal();
}

function openModal() {
    if (!sessionModal) {
        return;
    }

    if (
        window.bootstrap &&
        window.bootstrap.Modal
    ) {
        bootstrapModal =
            bootstrap.Modal.getOrCreateInstance(
                sessionModal
            );

        bootstrapModal.show();

        return;
    }

    sessionModal.style.display =
        "block";

    sessionModal.classList.add(
        "show"
    );

    sessionModal.removeAttribute(
        "aria-hidden"
    );

    document.body.classList.add(
        "modal-open"
    );
}

function closeModal() {
    if (!sessionModal) {
        return;
    }

    if (
        window.bootstrap &&
        window.bootstrap.Modal
    ) {
        bootstrapModal =
            bootstrap.Modal.getOrCreateInstance(
                sessionModal
            );

        bootstrapModal.hide();
    } else {
        sessionModal.style.display =
            "none";

        sessionModal.classList.remove(
            "show"
        );

        sessionModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    editingSessionId =
        null;
}

function setModalTitle(
    title
) {
    const titleElement =
        document.getElementById(
            "modalTitle"
        );

    if (titleElement) {
        titleElement.textContent =
            title;
    }
}

function setSubmitButton(
    text
) {
    if (!saveSessionBtn) {
        return;
    }

    const icon =
        saveSessionBtn.querySelector(
            "i"
        );

    if (icon) {
        saveSessionBtn.innerHTML =
            "";

        saveSessionBtn.appendChild(
            icon
        );

        saveSessionBtn.appendChild(
            document.createTextNode(
                " " + text
            )
        );
    } else {
        saveSessionBtn.textContent =
            text;
    }
}

function setField(
    id,
    value
) {
    const field =
        document.getElementById(
            id
        );

    if (field) {
        field.value =
            value == null
                ? ""
                : value;
    }
}

function toInputDate(
    value
) {
    if (!value) {
        return "";
    }

    const text =
        String(value)
            .substring(0, 10);

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {
        return text;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            date.getDate()
        ).padStart(2, "0")
    );
}

function escapeHtml(
    value
) {
    return String(
        value == null
            ? ""
            : value
    )
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

function escapeJs(
    value
) {
    return String(
        value == null
            ? ""
            : value
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        );
}

if (sessionForm) {
    sessionForm.addEventListener(
        "submit",
        saveSession
    );
}

if (addSessionBtn) {
    addSessionBtn.addEventListener(
        "click",
        openAddSessionModal
    );
}

if (closeModalBtn) {
    closeModalBtn.addEventListener(
        "click",
        closeModal
    );
}

if (cancelModalBtn) {
    cancelModalBtn.addEventListener(
        "click",
        closeModal
    );
}

if (searchInput) {
    searchInput.addEventListener(
        "input",
        renderSessions
    );
}

if (statusFilter) {
    statusFilter.addEventListener(
        "change",
        renderSessions
    );
}

window.loadSessions =
    loadSessions;

window.openAddSessionModal =
    openAddSessionModal;

window.editSession =
    editSession;

window.deleteSession =
    deleteSession;

window.setCurrentSession =
    setCurrentSession;

window.closeSessionModal =
    closeModal;

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadSessions();
    }
);