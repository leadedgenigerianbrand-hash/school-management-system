const API_BASE = "/api";

const sessionTableBody = document.getElementById("sessionTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sessionForm = document.getElementById("sessionForm");
const sessionModal = document.getElementById("sessionModal");
const messageContainer = document.getElementById("message");

let sessions = [];
let editingSessionId = null;

function getToken() {
    return (
        localStorage.getItem("school_management_token") ||
        sessionStorage.getItem("school_management_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken")
    );
}

async function apiRequest(url, options = {}) {
    const token = getToken();

    const headers = {
        ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = "Bearer " + token;
    }

    const response = await fetch(API_BASE + url, {
        ...options,
        headers
    });

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (response.status === 401 || response.status === 403) {
        throw new Error("Authentication required.");
    }

    if (!response.ok) {
        throw new Error(
            data && data.message
                ? data.message
                : "Request failed."
        );
    }

    return data;
}

function showMessage(message, type = "success") {
    if (!messageContainer) {
        return;
    }

    messageContainer.textContent = message;
    messageContainer.className = "message " + type;

    setTimeout(function () {
        messageContainer.textContent = "";
        messageContainer.className = "message";
    }, 4000);
}

async function loadSessions() {
    try {
        showLoading();

        const result = await apiRequest("/academic-sessions");

        sessions = Array.isArray(result && result.data)
            ? result.data
            : Array.isArray(result && result.sessions)
                ? result.sessions
                : Array.isArray(result)
                    ? result
                    : [];

        renderSessions();
    } catch (error) {
        console.error("Load academic sessions error:", error);

        showMessage(
            error.message || "Unable to load academic sessions.",
            "error"
        );

        showEmptyState("Unable to load academic sessions.");
    }
}

function renderSessions() {
    if (!sessionTableBody) {
        return;
    }

    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedStatus = statusFilter
        ? statusFilter.value.toLowerCase()
        : "";

    const filteredSessions = sessions.filter(function (session) {
        const sessionName = String(
            session.session_name ||
            session.sessionName ||
            ""
        ).toLowerCase();

        const sessionCode = String(
            session.session_code ||
            session.sessionCode ||
            ""
        ).toLowerCase();

        const status = String(
            session.status || ""
        ).toLowerCase();

        const matchesSearch =
            !searchTerm ||
            sessionName.includes(searchTerm) ||
            sessionCode.includes(searchTerm);

        const matchesStatus =
            !selectedStatus ||
            status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filteredSessions.length === 0) {
        showEmptyState("No academic sessions found.");
        return;
    }

    sessionTableBody.innerHTML = filteredSessions
        .map(createSessionRow)
        .join("");
}

function createSessionRow(session) {
    const id = session.id;

    const name = escapeHtml(
        session.session_name ||
        session.sessionName ||
        "-"
    );

    const code = escapeHtml(
        session.session_code ||
        session.sessionCode ||
        "-"
    );

    const startDate = formatDate(
        session.start_date ||
        session.startDate
    );

    const endDate = formatDate(
        session.end_date ||
        session.endDate
    );

    const status = String(
        session.status || "upcoming"
    ).toLowerCase();

    const statusLabel = formatStatus(status);

    return `
        <tr>
            <td>${name}</td>
            <td>${code}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>
                <span class="status-badge status-${escapeHtml(status)}">
                    ${escapeHtml(statusLabel)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        onclick="editSession('${escapeJs(id)}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        onclick="deleteSession('${escapeJs(id)}')"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHtml(String(value));
    }

    return date.toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatStatus(status) {
    const labels = {
        active: "Active",
        upcoming: "Upcoming",
        completed: "Completed",
        inactive: "Inactive"
    };

    if (labels[status]) {
        return labels[status];
    }

    return String(status)
        .replace(/_/g, " ")
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}

function showLoading() {
    if (!sessionTableBody) {
        return;
    }

    sessionTableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;padding:30px;">
                Loading academic sessions...
            </td>
        </tr>
    `;
}

function showEmptyState(text) {
    if (!sessionTableBody) {
        return;
    }

    sessionTableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;padding:30px;">
                ${escapeHtml(text)}
            </td>
        </tr>
    `;
}

function openAddSessionModal() {
    editingSessionId = null;

    if (sessionForm) {
        sessionForm.reset();
    }

    setModalTitle("Add Academic Session");
    setSubmitButton("Save Session");
    openModal();
}

async function editSession(sessionId) {
    try {
        const result = await apiRequest(
            "/academic-sessions/" + encodeURIComponent(sessionId)
        );

        const session =
            (result && result.data) ||
            (result && result.session) ||
            result;

        if (!session) {
            throw new Error("Academic session not found.");
        }

        editingSessionId = sessionId;

        populateForm(session);

        setModalTitle("Edit Academic Session");
        setSubmitButton("Update Session");
        openModal();
    } catch (error) {
        console.error("Edit session error:", error);

        showMessage(
            error.message ||
            "Unable to load academic session.",
            "error"
        );
    }
}

function populateForm(session) {
    setField(
        "sessionName",
        session.session_name ||
        session.sessionName ||
        ""
    );

    setField(
        "sessionCode",
        session.session_code ||
        session.sessionCode ||
        ""
    );

    setField(
        "startDate",
        toInputDate(
            session.start_date ||
            session.startDate
        )
    );

    setField(
        "endDate",
        toInputDate(
            session.end_date ||
            session.endDate
        )
    );

    setField(
        "description",
        session.description || ""
    );

    const statusField = document.getElementById("status");

    if (statusField) {
        statusField.value =
            session.status || "upcoming";
    }
}

function setField(id, value) {
    const field = document.getElementById(id);

    if (field) {
        field.value = value;
    }
}

function toInputDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).substring(0, 10);
    }

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );
}

function getFormData() {
    function getValue(id) {
        const field = document.getElementById(id);
        return field ? field.value.trim() : "";
    }

    const statusField = document.getElementById("status");

    return {
        sessionName: getValue("sessionName"),
        sessionCode: getValue("sessionCode") || null,
        startDate: getValue("startDate") || null,
        endDate: getValue("endDate") || null,
        description: getValue("description") || null,
        status: statusField
            ? statusField.value
            : "upcoming"
    };
}

function validateForm(data) {
    if (!data.sessionName) {
        return "Academic session name is required.";
    }

    if (
        data.startDate &&
        data.endDate &&
        data.endDate < data.startDate
    ) {
        return "End date cannot be earlier than start date.";
    }

    return null;
}

async function saveSession(event) {
    event.preventDefault();

    const data = getFormData();
    const validationError = validateForm(data);

    if (validationError) {
        showMessage(validationError, "error");
        return;
    }

    const isEditing = Boolean(editingSessionId);

    try {
        setSubmitButton(
            isEditing ? "Updating..." : "Saving..."
        );

        const result = await apiRequest(
            isEditing
                ? "/academic-sessions/" +
                  encodeURIComponent(editingSessionId)
                : "/academic-sessions",
            {
                method: isEditing ? "PUT" : "POST",
                body: JSON.stringify(data)
            }
        );

        showMessage(
            (result && result.message) ||
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
    }
}

async function deleteSession(sessionId) {
    const session = sessions.find(function (item) {
        return String(item.id) === String(sessionId);
    });

    const sessionName = session
        ? (
            session.session_name ||
            session.sessionName ||
            "this academic session"
        )
        : "this academic session";

    const confirmed = window.confirm(
        'Are you sure you want to delete "' +
        sessionName +
        '"?'
    );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(
            "/academic-sessions/" +
            encodeURIComponent(sessionId),
            {
                method: "DELETE"
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

function openModal() {
    if (!sessionModal) {
        return;
    }

    sessionModal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeModal() {
    if (!sessionModal) {
        return;
    }

    sessionModal.style.display = "none";
    document.body.style.overflow = "";
    editingSessionId = null;
}

function setModalTitle(title) {
    const titleElement =
        document.getElementById("modalTitle");

    if (titleElement) {
        titleElement.textContent = title;
    }
}

function setSubmitButton(text) {
    const button =
        document.getElementById("submitButton");

    if (button) {
        button.textContent = text;
    }
}

function escapeHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJs(value) {
    return String(value == null ? "" : value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}

if (sessionForm) {
    sessionForm.addEventListener("submit", saveSession);
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

if (sessionModal) {
    sessionModal.addEventListener(
        "click",
        function (event) {
            if (event.target === sessionModal) {
                closeModal();
            }
        }
    );
}

window.loadSessions = loadSessions;
window.openAddSessionModal = openAddSessionModal;
window.editSession = editSession;
window.deleteSession = deleteSession;
window.closeSessionModal = closeModal;

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadSessions();
    }
);