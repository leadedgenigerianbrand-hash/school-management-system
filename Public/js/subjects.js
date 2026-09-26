"use strict";

(function () {
const API_BASE = "/api";
const SUBJECTS_API = `${API_BASE}/subjects`;

const PAGE_SIZE = 10;

let subjects = [];
let filteredSubjects = [];
let currentPage = 1;
let subjectToDelete = null;
let deleteModalInstance = null;

const elements = {
    tableBody: document.getElementById("subjectsTableBody"),
    searchInput: document.getElementById("searchInput"),
    compulsoryFilter: document.getElementById("compulsoryFilter"),
    statusFilter: document.getElementById("statusFilter"),
    refreshButton: document.getElementById("refreshButton"),
    addSubjectButton: document.getElementById("addSubjectButton"),
    previousButton: document.getElementById("previousButton"),
    nextButton: document.getElementById("nextButton"),
    pageNumber: document.getElementById("pageNumber"),
    showingFrom: document.getElementById("showingFrom"),
    showingTo: document.getElementById("showingTo"),
    totalResults: document.getElementById("totalResults"),
    pageMessage: document.getElementById("pageMessage"),
    totalSubjects: document.getElementById("totalSubjects"),
    activeSubjects: document.getElementById("activeSubjects"),
    compulsorySubjects: document.getElementById("compulsorySubjects"),
    optionalSubjects: document.getElementById("optionalSubjects"),
    deleteModal: document.getElementById("deleteModal"),
    deleteSubjectName: document.getElementById("deleteSubjectName"),
    confirmDeleteButton: document.getElementById("confirmDeleteButton"),
    closeDeleteModal: document.getElementById("closeDeleteModal"),
    cancelDeleteButton: document.getElementById("cancelDeleteButton"),
    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebarOverlay"),
    sidebarToggle: document.getElementById("sidebarToggle"),
    logoutButton: document.getElementById("logoutButton"),
    userName: document.getElementById("userName")
};

function getToken() {
    return (
        localStorage.getItem("school_management_token") ||
        sessionStorage.getItem("school_management_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        ""
    );
}

function buildHeaders(options = {}) {
    const headers = {
        Accept: "application/json",
        ...(options.headers || {})
    };

    const token = getToken();

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

    return headers;
}

async function apiRequest(endpoint, options = {}) {
    let url = endpoint;

    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {
        if (!url.startsWith("/")) {
            url = `/${url}`;
        }

        if (!url.startsWith("/api/")) {
            url = `/api${url}`;
        }
    }

    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers: buildHeaders(options)
        });
    } catch (error) {
        console.error("Subjects API connection error:", error);

        throw new Error(
            "Unable to connect to the server."
        );
    }

    if (response.status === 401) {
        clearAuthentication();

        if (
            !window.location.pathname.endsWith(
                "/login.html"
            )
        ) {
            window.location.href = "/pages/login.html";
        }

        throw new Error(
            "Your session has expired. Please log in again."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "You do not have permission to perform this action."
        );
    }

    const contentType =
        response.headers.get("content-type") || "";

    let data = null;

    try {
        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message =
            typeof data === "object" && data
                ? data.message ||
                  data.error ||
                  "Request failed."
                : data ||
                  "Request failed.";

        throw new Error(message);
    }

    return data;
}

function clearAuthentication() {
    const keys = [
        "school_management_token",
        "school_management_user",
        "token",
        "accessToken",
        "user"
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

function extractArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.subjects)) {
        return data.subjects;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data?.records)) {
        return data.records;
    }

    return [];
}

function getSubjectId(subject) {
    return (
        subject?.id ??
        subject?.subjectId ??
        subject?.subject_id ??
        ""
    );
}

function getSubjectName(subject) {
    return (
        subject?.subjectName ??
        subject?.subject_name ??
        subject?.name ??
        ""
    );
}

function getSubjectCode(subject) {
    return (
        subject?.subjectCode ??
        subject?.subject_code ??
        subject?.code ??
        ""
    );
}

function getDescription(subject) {
    return subject?.description ?? "";
}

function getIsCompulsory(subject) {
    const value =
        subject?.isCompulsory ??
        subject?.is_compulsory ??
        subject?.compulsory;

    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        const normalized = value
            .trim()
            .toLowerCase();

        if (
            normalized === "true" ||
            normalized === "1" ||
            normalized === "yes" ||
            normalized === "compulsory"
        ) {
            return true;
        }

        if (
            normalized === "false" ||
            normalized === "0" ||
            normalized === "no" ||
            normalized === "optional"
        ) {
            return false;
        }
    }

    return false;
}

function getIsActive(subject) {
    const value =
        subject?.isActive ??
        subject?.is_active ??
        subject?.active;

    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        const normalized = value
            .trim()
            .toLowerCase();

        if (
            normalized === "true" ||
            normalized === "1" ||
            normalized === "yes" ||
            normalized === "active"
        ) {
            return true;
        }

        if (
            normalized === "false" ||
            normalized === "0" ||
            normalized === "no" ||
            normalized === "inactive"
        ) {
            return false;
        }
    }

    return true;
}

function getCreatedAt(subject) {
    return (
        subject?.createdAt ??
        subject?.created_at ??
        null
    );
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function showMessage(message, type = "success") {
    if (!elements.pageMessage) {
        return;
    }

    elements.pageMessage.textContent =
        message;

    elements.pageMessage.className =
        "alert";

    if (type === "error") {
        elements.pageMessage.classList.add(
            "alert-danger"
        );
    } else if (type === "warning") {
        elements.pageMessage.classList.add(
            "alert-warning"
        );
    } else {
        elements.pageMessage.classList.add(
            "alert-success"
        );
    }

    elements.pageMessage.classList.remove(
        "d-none"
    );

    window.clearTimeout(
        showMessage.timeout
    );

    showMessage.timeout = window.setTimeout(
        () => {
            elements.pageMessage.classList.add(
                "d-none"
            );
        },
        4000
    );
}

function showLoading() {
    if (!elements.tableBody) {
        return;
    }

    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted py-5">
                <div class="spinner-border spinner-border-sm me-2"></div>
                Loading subjects...
            </td>
        </tr>
    `;
}

function showEmptyState(message = "No subjects found.") {
    if (!elements.tableBody) {
        return;
    }

    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted py-5">
                <i class="bi bi-book fs-2 d-block mb-2"></i>
                ${escapeHtml(message)}
            </td>
        </tr>
    `;
}

function showErrorState(message) {
    if (!elements.tableBody) {
        return;
    }

    elements.tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted py-5">
                <i class="bi bi-exclamation-circle fs-2 d-block mb-2"></i>

                <div>
                    Unable to load subjects.
                </div>

                <div class="small mt-1">
                    ${escapeHtml(message)}
                </div>

                <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm mt-3"
                    id="subjectsRetryButton">

                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Try Again

                </button>
            </td>
        </tr>
    `;

    const retryButton =
        document.getElementById(
            "subjectsRetryButton"
        );

    if (retryButton) {
        retryButton.addEventListener(
            "click",
            loadSubjects
        );
    }
}

function getStatusBadge(isActive) {
    if (isActive) {
        return `
            <span class="badge rounded-pill bg-success-subtle text-success">
                Active
            </span>
        `;
    }

    return `
        <span class="badge rounded-pill bg-danger-subtle text-danger">
            Inactive
        </span>
    `;
}

function getCompulsoryBadge(isCompulsory) {
    if (isCompulsory) {
        return `
            <span class="badge rounded-pill bg-primary-subtle text-primary">
                Compulsory
            </span>
        `;
    }

    return `
        <span class="badge rounded-pill bg-warning-subtle text-warning-emphasis">
            Optional
        </span>
    `;
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHtml(value);
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

function renderSubjects() {
    if (!elements.tableBody) {
        return;
    }

    const total =
        filteredSubjects.length;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total / PAGE_SIZE
            )
        );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start =
        (currentPage - 1) *
        PAGE_SIZE;

    const end =
        Math.min(
            start + PAGE_SIZE,
            total
        );

    const pageSubjects =
        filteredSubjects.slice(
            start,
            end
        );

    if (pageSubjects.length === 0) {
        showEmptyState();
        updatePagination(
            0,
            0,
            0,
            1
        );
        return;
    }

    elements.tableBody.innerHTML =
        pageSubjects
            .map(
                (subject, index) =>
                    renderSubjectRow(
                        subject,
                        start + index + 1
                    )
            )
            .join("");

    updatePagination(
        start + 1,
        end,
        total,
        totalPages
    );
}

function renderSubjectRow(subject, rowNumber) {
    const id =
        getSubjectId(subject);

    const name =
        getSubjectName(subject) ||
        "—";

    const code =
        getSubjectCode(subject) ||
        "—";

    const description =
        getDescription(subject) ||
        "—";

    const isCompulsory =
        getIsCompulsory(subject);

    const isActive =
        getIsActive(subject);

    return `
        <tr>

            <td>
                ${rowNumber}
            </td>

            <td>
                <span class="subject-code">
                    ${escapeHtml(code)}
                </span>
            </td>

            <td>
                <span class="subject-name">
                    ${escapeHtml(name)}
                </span>
            </td>

            <td>
                ${getCompulsoryBadge(
                    isCompulsory
                )}
            </td>

            <td>
                <span
                    class="description"
                    title="${escapeAttribute(
                        description
                    )}">
                    ${escapeHtml(
                        description
                    )}
                </span>
            </td>

            <td>
                ${getStatusBadge(
                    isActive
                )}
            </td>

            <td>
                <div class="d-flex gap-1">

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        data-action="edit"
                        data-id="${escapeAttribute(
                            id
                        )}"
                        title="Edit subject">

                        <i class="bi bi-pencil"></i>

                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        data-action="delete"
                        data-id="${escapeAttribute(
                            id
                        )}"
                        title="Delete subject">

                        <i class="bi bi-trash3"></i>

                    </button>

                </div>
            </td>

        </tr>
    `;
}

function filterSubjects() {
    const search =
        String(
            elements.searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const compulsoryFilter =
        String(
            elements.compulsoryFilter?.value ||
            ""
        );

    const statusFilter =
        String(
            elements.statusFilter?.value ||
            ""
        );

    filteredSubjects =
        subjects.filter(
            (subject) => {
                const name =
                    String(
                        getSubjectName(
                            subject
                        )
                    )
                        .toLowerCase();

                const code =
                    String(
                        getSubjectCode(
                            subject
                        )
                    )
                        .toLowerCase();

                const description =
                    String(
                        getDescription(
                            subject
                        )
                    )
                        .toLowerCase();

                const matchesSearch =
                    !search ||
                    name.includes(
                        search
                    ) ||
                    code.includes(
                        search
                    ) ||
                    description.includes(
                        search
                    );

                const isCompulsory =
                    getIsCompulsory(
                        subject
                    );

                const isActive =
                    getIsActive(
                        subject
                    );

                const matchesCompulsory =
                    compulsoryFilter === "" ||
                    String(
                        isCompulsory
                    ) ===
                        compulsoryFilter;

                const matchesStatus =
                    statusFilter === "" ||
                    String(
                        isActive
                    ) ===
                        statusFilter;

                return (
                    matchesSearch &&
                    matchesCompulsory &&
                    matchesStatus
                );
            }
        );

    currentPage = 1;

    renderSubjects();
}

function updateStatistics() {
    const total =
        subjects.length;

    const active =
        subjects.filter(
            (subject) =>
                getIsActive(
                    subject
                )
        ).length;

    const compulsory =
        subjects.filter(
            (subject) =>
                getIsCompulsory(
                    subject
                )
        ).length;

    const optional =
        subjects.filter(
            (subject) =>
                !getIsCompulsory(
                    subject
                )
        ).length;

    if (elements.totalSubjects) {
        elements.totalSubjects.textContent =
            total;
    }

    if (elements.activeSubjects) {
        elements.activeSubjects.textContent =
            active;
    }

    if (elements.compulsorySubjects) {
        elements.compulsorySubjects.textContent =
            compulsory;
    }

    if (elements.optionalSubjects) {
        elements.optionalSubjects.textContent =
            optional;
    }
}

function updatePagination(
    from,
    to,
    total,
    totalPages
) {
    if (elements.showingFrom) {
        elements.showingFrom.textContent =
            from;
    }

    if (elements.showingTo) {
        elements.showingTo.textContent =
            to;
    }

    if (elements.totalResults) {
        elements.totalResults.textContent =
            total;
    }

    if (elements.pageNumber) {
        elements.pageNumber.textContent =
            `Page ${currentPage} of ${totalPages}`;
    }

    if (elements.previousButton) {
        elements.previousButton.disabled =
            currentPage <= 1;
    }

    if (elements.nextButton) {
        elements.nextButton.disabled =
            currentPage >= totalPages;
    }
}

async function loadSubjects() {
    showLoading();

    try {
        const data =
            await apiRequest(
                SUBJECTS_API
            );

        subjects =
            extractArray(data);

        updateStatistics();

        filterSubjects();

    } catch (error) {
        console.error(
            "Load subjects error:",
            error
        );

        subjects = [];
        filteredSubjects = [];

        updateStatistics();

        showErrorState(
            error.message ||
            "Unable to load subjects."
        );

        updatePagination(
            0,
            0,
            0,
            1
        );

        showMessage(
            error.message ||
            "Unable to load subjects.",
            "error"
        );
    }
}

function editSubject(id) {
    if (!id) {
        showMessage(
            "Subject ID was not found.",
            "error"
        );

        return;
    }

    window.location.href =
        `/pages/subject-form.html?id=${encodeURIComponent(
            id
        )}`;
}

function openDeleteModal(id) {
    const subject =
        subjects.find(
            (item) =>
                String(
                    getSubjectId(
                        item
                    )
                ) ===
                String(id)
        );

    if (!subject) {
        showMessage(
            "Subject record was not found.",
            "error"
        );

        return;
    }

    subjectToDelete = id;

    if (elements.deleteSubjectName) {
        elements.deleteSubjectName.textContent =
            getSubjectName(
                subject
            ) ||
            "this subject";
    }

    if (!deleteModalInstance) {
        if (
            elements.deleteModal &&
            typeof bootstrap !==
                "undefined"
        ) {
            deleteModalInstance =
                new bootstrap.Modal(
                    elements.deleteModal
                );
        }
    }

    if (deleteModalInstance) {
        deleteModalInstance.show();
    }
}

function closeDeleteModal() {
    subjectToDelete = null;

    if (deleteModalInstance) {
        deleteModalInstance.hide();
    }
}

async function deleteSubject() {
    if (!subjectToDelete) {
        return;
    }

    const id =
        subjectToDelete;

    try {
        if (elements.confirmDeleteButton) {
            elements.confirmDeleteButton.disabled =
                true;

            elements.confirmDeleteButton.innerHTML =
                `
                <span class="spinner-border spinner-border-sm me-1"></span>
                Deleting...
                `;
        }

        await apiRequest(
            `${SUBJECTS_API}/${encodeURIComponent(
                id
            )}`,
            {
                method: "DELETE"
            }
        );

        closeDeleteModal();

        showMessage(
            "Subject deleted successfully.",
            "success"
        );

        await loadSubjects();

    } catch (error) {
        console.error(
            "Delete subject error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to delete subject.",
            "error"
        );

    } finally {
        if (elements.confirmDeleteButton) {
            elements.confirmDeleteButton.disabled =
                false;

            elements.confirmDeleteButton.innerHTML =
                `
                <i class="bi bi-trash3 me-1"></i>
                Delete Subject
                `;
        }
    }
}

function handleTableClick(event) {
    const button =
        event.target.closest(
            "[data-action]"
        );

    if (!button) {
        return;
    }

    const action =
        button.dataset.action;

    const id =
        button.dataset.id;

    if (!id) {
        return;
    }

    if (action === "edit") {
        editSubject(id);
        return;
    }

    if (action === "delete") {
        openDeleteModal(id);
    }
}

function goToPreviousPage() {
    if (currentPage <= 1) {
        return;
    }

    currentPage--;

    renderSubjects();
}

function goToNextPage() {
    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredSubjects.length /
                    PAGE_SIZE
            )
        );

    if (currentPage >= totalPages) {
        return;
    }

    currentPage++;

    renderSubjects();
}

function openAddSubject() {
    window.location.href =
        "/pages/subject-form.html";
}

function setupSidebar() {
    if (
        elements.sidebarToggle &&
        elements.sidebar &&
        elements.sidebarOverlay
    ) {
        elements.sidebarToggle.addEventListener(
            "click",
            () => {
                elements.sidebar.classList.toggle(
                    "show"
                );

                elements.sidebarOverlay.classList.toggle(
                    "show"
                );
            }
        );

        elements.sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );
    }
}

function closeSidebar() {
    if (elements.sidebar) {
        elements.sidebar.classList.remove(
            "show"
        );
    }

    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.classList.remove(
            "show"
        );
    }
}

function setupLogout() {
    if (!elements.logoutButton) {
        return;
    }

    elements.logoutButton.addEventListener(
        "click",
        () => {
            if (
                typeof window.logout ===
                "function"
            ) {
                window.logout();
                return;
            }

            clearAuthentication();

            window.location.href =
                "/pages/login.html";
        }
    );
}

function loadStoredUser() {
    if (!elements.userName) {
        return;
    }

    try {
        const rawUser =
            localStorage.getItem(
                "school_management_user"
            ) ||
            sessionStorage.getItem(
                "school_management_user"
            ) ||
            localStorage.getItem(
                "user"
            ) ||
            sessionStorage.getItem(
                "user"
            );

        if (!rawUser) {
            return;
        }

        const user =
            JSON.parse(
                rawUser
            );

        elements.userName.textContent =
            user?.name ||
            user?.full_name ||
            user?.fullName ||
            user?.username ||
            "";
    } catch {
        elements.userName.textContent =
            "";
    }
}

function setupEvents() {
    if (elements.searchInput) {
        elements.searchInput.addEventListener(
            "input",
            filterSubjects
        );
    }

    if (elements.compulsoryFilter) {
        elements.compulsoryFilter.addEventListener(
            "change",
            filterSubjects
        );
    }

    if (elements.statusFilter) {
        elements.statusFilter.addEventListener(
            "change",
            filterSubjects
        );
    }

    if (elements.refreshButton) {
        elements.refreshButton.addEventListener(
            "click",
            loadSubjects
        );
    }

    if (elements.addSubjectButton) {
        elements.addSubjectButton.addEventListener(
            "click",
            openAddSubject
        );
    }

    if (elements.previousButton) {
        elements.previousButton.addEventListener(
            "click",
            goToPreviousPage
        );
    }

    if (elements.nextButton) {
        elements.nextButton.addEventListener(
            "click",
            goToNextPage
        );
    }

    if (elements.tableBody) {
        elements.tableBody.addEventListener(
            "click",
            handleTableClick
        );
    }

    if (elements.confirmDeleteButton) {
        elements.confirmDeleteButton.addEventListener(
            "click",
            deleteSubject
        );
    }

    if (elements.closeDeleteModal) {
        elements.closeDeleteModal.addEventListener(
            "click",
            closeDeleteModal
        );
    }

    if (elements.cancelDeleteButton) {
        elements.cancelDeleteButton.addEventListener(
            "click",
            closeDeleteModal
        );
    }

    setupSidebar();
    setupLogout();
}

async function initialize() {
    loadStoredUser();

    setupEvents();

    if (
        elements.deleteModal &&
        typeof bootstrap !==
            "undefined"
    ) {
        deleteModalInstance =
            new bootstrap.Modal(
                elements.deleteModal
            );
    }

    await loadSubjects();
}

window.SubjectsPage = {
    initialize,
    loadSubjects,
    renderSubjects,
    filterSubjects,
    editSubject,
    deleteSubject,
    openDeleteModal,
    closeDeleteModal,
    openAddSubject
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
