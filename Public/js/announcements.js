"use strict";

(function () {
const ANNOUNCEMENTS_API = "/api/announcements";

```
let announcements = [];
let initialized = false;
let editingAnnouncementId = null;

function getElement(id) {
    return document.getElementById(id);
}

function showMessage(message, type = "info") {
    if (typeof window.showNotification === "function") {
        window.showNotification(message, type);
        return;
    }

    const container =
        getElement("announcementMessageContainer");

    if (container) {
        container.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${escapeHtml(message)}
                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                ></button>
            </div>
        `;

        return;
    }

    console.log(`[${type}] ${message}`);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
}

function formatDateForInput(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
        date.getDate()
    ).padStart(2, "0");
    const hours = String(
        date.getHours()
    ).padStart(2, "0");
    const minutes = String(
        date.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getAnnouncementId(announcement) {
    return (
        announcement.id ||
        announcement.announcement_id ||
        announcement.announcementId ||
        ""
    );
}

function getAnnouncementTitle(announcement) {
    return (
        announcement.title ||
        announcement.subject ||
        "Announcement"
    );
}

function getAnnouncementMessage(announcement) {
    return (
        announcement.message ||
        announcement.content ||
        announcement.body ||
        ""
    );
}

function getAnnouncementPriority(announcement) {
    return (
        announcement.priority ||
        announcement.announcement_priority ||
        "Normal"
    );
}

function getAnnouncementStatus(announcement) {
    const value =
        announcement.status ||
        announcement.announcement_status ||
        "";

    if (!value) {
        if (
            announcement.is_published === true ||
            announcement.isPublished === true
        ) {
            return "Published";
        }

        return "Draft";
    }

    return normalizeStatus(value);
}

function normalizeStatus(value) {
    const status = String(value || "")
        .trim()
        .toLowerCase();

    if (status === "published") {
        return "Published";
    }

    if (status === "archived") {
        return "Archived";
    }

    return "Draft";
}

function getAnnouncementStartDate(announcement) {
    return (
        announcement.start_date ||
        announcement.startDate ||
        announcement.publish_date ||
        announcement.publishDate ||
        announcement.published_at ||
        announcement.publishedAt ||
        ""
    );
}

function getAnnouncementEndDate(announcement) {
    return (
        announcement.end_date ||
        announcement.endDate ||
        announcement.expiry_date ||
        announcement.expiryDate ||
        ""
    );
}

function getAnnouncementList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data || typeof data !== "object") {
        return [];
    }

    if (Array.isArray(data.announcements)) {
        return data.announcements;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (
        data.data &&
        Array.isArray(data.data.announcements)
    ) {
        return data.data.announcements;
    }

    if (
        data.data &&
        Array.isArray(data.data.data)
    ) {
        return data.data.data;
    }

    return [];
}

async function request(endpoint, options = {}) {
    if (typeof window.apiRequest === "function") {
        return window.apiRequest(
            endpoint,
            options
        );
    }

    const token =
        localStorage.getItem(
            "school_management_token"
        ) ||
        sessionStorage.getItem(
            "school_management_token"
        ) ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        "";

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers["Content-Type"] &&
        !headers["content-type"]
    ) {
        headers["Content-Type"] =
            "application/json";
    }

    const response = await fetch(
        endpoint,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {
        if (
            typeof window.clearApiAuthentication ===
            "function"
        ) {
            window.clearApiAuthentication();
        } else {
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
        }

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
        response.headers.get(
            "content-type"
        ) || "";

    let data;

    if (
        contentType.includes(
            "application/json"
        )
    ) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        let message =
            "Request failed.";

        if (
            data &&
            typeof data === "object"
        ) {
            message =
                data.message ||
                data.error ||
                message;
        } else if (
            typeof data === "string" &&
            data.trim()
        ) {
            message = data;
        }

        throw new Error(message);
    }

    return data;
}

function getCurrentFilters() {
    const searchInput =
        getElement("searchInput");

    const statusFilter =
        getElement("statusFilter");

    const priorityFilter =
        getElement("priorityFilter");

    return {
        search: searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "",
        status: statusFilter
            ? statusFilter.value
            : "all",
        priority: priorityFilter
            ? priorityFilter.value
            : "all"
    };
}

function filterAnnouncements() {
    const filters =
        getCurrentFilters();

    return announcements.filter(
        function (announcement) {
            const title =
                getAnnouncementTitle(
                    announcement
                ).toLowerCase();

            const message =
                getAnnouncementMessage(
                    announcement
                ).toLowerCase();

            const status =
                getAnnouncementStatus(
                    announcement
                );

            const priority =
                getAnnouncementPriority(
                    announcement
                );

            const matchesSearch =
                !filters.search ||
                title.includes(
                    filters.search
                ) ||
                message.includes(
                    filters.search
                ) ||
                status
                    .toLowerCase()
                    .includes(
                        filters.search
                    );

            const matchesStatus =
                filters.status === "all" ||
                status.toLowerCase() ===
                    filters.status.toLowerCase();

            const matchesPriority =
                filters.priority === "all" ||
                priority.toLowerCase() ===
                    filters.priority.toLowerCase();

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        }
    );
}

function getStatusBadgeClass(status) {
    if (status === "Published") {
        return "success";
    }

    if (status === "Archived") {
        return "secondary";
    }

    return "warning";
}

function getPriorityBadgeClass(priority) {
    if (
        String(priority).toLowerCase() ===
        "high"
    ) {
        return "danger";
    }

    if (
        String(priority).toLowerCase() ===
        "low"
    ) {
        return "secondary";
    }

    return "primary";
}

function renderAnnouncements() {
    const container =
        getElement("announcementList");

    if (!container) {
        return;
    }

    const filtered =
        filterAnnouncements();

    updateStatistics();
    updateAnnouncementCount(
        filtered.length
    );

    if (!filtered.length) {
        container.innerHTML = `
            <div class="empty-announcements">
                <div class="announcement-icon mb-3">
                    <i class="bi bi-megaphone"></i>
                </div>

                <h5>
                    No announcements found
                </h5>

                <p class="text-muted mb-0">
                    There are no announcements matching your current filters.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        filtered
            .map(function (announcement) {
                const id =
                    getAnnouncementId(
                        announcement
                    );

                const title =
                    getAnnouncementTitle(
                        announcement
                    );

                const message =
                    getAnnouncementMessage(
                        announcement
                    );

                const status =
                    getAnnouncementStatus(
                        announcement
                    );

                const priority =
                    getAnnouncementPriority(
                        announcement
                    );

                const startDate =
                    getAnnouncementStartDate(
                        announcement
                    );

                const endDate =
                    getAnnouncementEndDate(
                        announcement
                    );

                return `
                    <div
                        class="card announcement-item mb-3"
                        data-announcement-id="${escapeHtml(id)}"
                    >
                        <div class="card-body">

                            <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">

                                <div class="flex-grow-1">

                                    <div class="d-flex flex-wrap align-items-center gap-2 mb-2">

                                        <h5 class="mb-0">
                                            ${escapeHtml(title)}
                                        </h5>

                                        <span class="badge bg-${getStatusBadgeClass(status)} announcement-badge">
                                            ${escapeHtml(status)}
                                        </span>

                                        <span class="badge bg-${getPriorityBadgeClass(priority)} announcement-badge">
                                            ${escapeHtml(priority)}
                                        </span>

                                    </div>

                                    <div class="announcement-message mb-3">
                                        ${escapeHtml(message)}
                                    </div>

                                    <div class="announcement-meta text-muted">

                                        ${
                                            startDate
                                                ? `
                                                    <span class="me-3">
                                                        <i class="bi bi-calendar-event"></i>
                                                        ${escapeHtml(
                                                            formatDate(
                                                                startDate
                                                            )
                                                        )}
                                                    </span>
                                                `
                                                : ""
                                        }

                                        ${
                                            endDate
                                                ? `
                                                    <span>
                                                        <i class="bi bi-calendar-x"></i>
                                                        Expires:
                                                        ${escapeHtml(
                                                            formatDate(
                                                                endDate
                                                            )
                                                        )}
                                                    </span>
                                                `
                                                : ""
                                        }

                                    </div>

                                </div>

                                <div class="d-flex flex-wrap gap-2">

                                    ${
                                        id
                                            ? `
                                                <button
                                                    type="button"
                                                    class="btn btn-sm btn-outline-primary"
                                                    data-action="edit-announcement"
                                                    data-id="${escapeHtml(id)}"
                                                >
                                                    <i class="bi bi-pencil"></i>
                                                    Edit
                                                </button>
                                            `
                                            : ""
                                    }

                                    ${
                                        id &&
                                        status !==
                                            "Published"
                                            ? `
                                                <button
                                                    type="button"
                                                    class="btn btn-sm btn-outline-success"
                                                    data-action="publish-announcement"
                                                    data-id="${escapeHtml(id)}"
                                                >
                                                    <i class="bi bi-check-circle"></i>
                                                    Publish
                                                </button>
                                            `
                                            : ""
                                    }

                                    ${
                                        id &&
                                        status ===
                                            "Published"
                                            ? `
                                                <button
                                                    type="button"
                                                    class="btn btn-sm btn-outline-warning"
                                                    data-action="archive-announcement"
                                                    data-id="${escapeHtml(id)}"
                                                >
                                                    <i class="bi bi-archive"></i>
                                                    Archive
                                                </button>
                                            `
                                            : ""
                                    }

                                    ${
                                        id
                                            ? `
                                                <button
                                                    type="button"
                                                    class="btn btn-sm btn-outline-danger"
                                                    data-action="delete-announcement"
                                                    data-id="${escapeHtml(id)}"
                                                >
                                                    <i class="bi bi-trash"></i>
                                                    Delete
                                                </button>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                        </div>
                    </div>
                `;
            })
            .join("");
}

function updateAnnouncementCount(
    count
) {
    const element =
        getElement("announcementCount");

    if (!element) {
        return;
    }

    element.textContent =
        `${count} ${
            count === 1
                ? "announcement"
                : "announcements"
        }`;
}

function updateStatistics() {
    const total =
        announcements.length;

    const published =
        announcements.filter(
            function (announcement) {
                return (
                    getAnnouncementStatus(
                        announcement
                    ) === "Published"
                );
            }
        ).length;

    const drafts =
        announcements.filter(
            function (announcement) {
                return (
                    getAnnouncementStatus(
                        announcement
                    ) === "Draft"
                );
            }
        ).length;

    const priority =
        announcements.filter(
            function (announcement) {
                return (
                    String(
                        getAnnouncementPriority(
                            announcement
                        )
                    ).toLowerCase() ===
                    "high"
                );
            }
        ).length;

    const totalElement =
        getElement(
            "totalAnnouncements"
        );

    const publishedElement =
        getElement(
            "publishedAnnouncements"
        );

    const draftElement =
        getElement(
            "draftAnnouncements"
        );

    const priorityElement =
        getElement(
            "priorityAnnouncements"
        );

    if (totalElement) {
        totalElement.textContent =
            String(total);
    }

    if (publishedElement) {
        publishedElement.textContent =
            String(published);
    }

    if (draftElement) {
        draftElement.textContent =
            String(drafts);
    }

    if (priorityElement) {
        priorityElement.textContent =
            String(priority);
    }
}

function showLoading() {
    const container =
        getElement("announcementList");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="empty-announcements">

            <div
                class="spinner-border"
                role="status"
            >
                <span class="visually-hidden">
                    Loading...
                </span>
            </div>

            <p class="text-muted mt-3 mb-0">
                Loading announcements...
            </p>

        </div>
    `;
}

async function loadAnnouncements() {
    const container =
        getElement("announcementList");

    if (!container) {
        return;
    }

    try {
        showLoading();

        const data =
            await request(
                ANNOUNCEMENTS_API
            );

        announcements =
            getAnnouncementList(data);

        renderAnnouncements();
    } catch (error) {
        console.error(
            "Load announcements error:",
            error
        );

        announcements = [];

        container.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHtml(
                    error.message ||
                    "Unable to load announcements."
                )}
            </div>
        `;

        updateStatistics();
        updateAnnouncementCount(0);

        showMessage(
            error.message ||
            "Unable to load announcements.",
            "danger"
        );
    }
}

function resetForm() {
    const form =
        getElement(
            "announcementForm"
        );

    if (form) {
        form.reset();
    }

    editingAnnouncementId = null;

    const id =
        getElement("announcementId");

    if (id) {
        id.value = "";
    }

    const priority =
        getElement(
            "announcementPriority"
        );

    if (priority) {
        priority.value = "Normal";
    }

    const status =
        getElement(
            "announcementStatus"
        );

    if (status) {
        status.value = "Draft";
    }

    const modalTitle =
        getElement(
            "announcementModalLabel"
        );

    if (modalTitle) {
        modalTitle.textContent =
            "Create Announcement";
    }

    const validation =
        getElement(
            "announcementValidationMessage"
        );

    if (validation) {
        validation.hidden = true;
        validation.textContent = "";
    }
}

function fillForm(announcement) {
    const id =
        getAnnouncementId(
            announcement
        );

    editingAnnouncementId = id;

    const idField =
        getElement("announcementId");

    const titleField =
        getElement(
            "announcementTitle"
        );

    const messageField =
        getElement(
            "announcementMessage"
        );

    const priorityField =
        getElement(
            "announcementPriority"
        );

    const statusField =
        getElement(
            "announcementStatus"
        );

    const startDateField =
        getElement(
            "announcementStartDate"
        );

    const endDateField =
        getElement(
            "announcementEndDate"
        );

    if (idField) {
        idField.value = id;
    }

    if (titleField) {
        titleField.value =
            getAnnouncementTitle(
                announcement
            );
    }

    if (messageField) {
        messageField.value =
            getAnnouncementMessage(
                announcement
            );
    }

    if (priorityField) {
        priorityField.value =
            getAnnouncementPriority(
                announcement
            );
    }

    if (statusField) {
        statusField.value =
            getAnnouncementStatus(
                announcement
            );
    }

    if (startDateField) {
        startDateField.value =
            formatDateForInput(
                getAnnouncementStartDate(
                    announcement
                )
            );
    }

    if (endDateField) {
        endDateField.value =
            formatDateForInput(
                getAnnouncementEndDate(
                    announcement
                )
            );
    }

    const modalTitle =
        getElement(
            "announcementModalLabel"
        );

    if (modalTitle) {
        modalTitle.textContent =
            "Edit Announcement";
    }
}

function openCreateModal() {
    resetForm();

    const modalElement =
        getElement(
            "announcementModal"
        );

    if (
        modalElement &&
        window.bootstrap &&
        window.bootstrap.Modal
    ) {
        const modal =
            window.bootstrap.Modal.getOrCreateInstance(
                modalElement
            );

        modal.show();
    }
}

function openEditModal(id) {
    const announcement =
        announcements.find(
            function (item) {
                return (
                    String(
                        getAnnouncementId(
                            item
                        )
                    ) ===
                    String(id)
                );
            }
        );

    if (!announcement) {
        showMessage(
            "Announcement could not be found.",
            "warning"
        );
        return;
    }

    fillForm(announcement);

    const modalElement =
        getElement(
            "announcementModal"
        );

    if (
        modalElement &&
        window.bootstrap &&
        window.bootstrap.Modal
    ) {
        const modal =
            window.bootstrap.Modal.getOrCreateInstance(
                modalElement
            );

        modal.show();
    }
}

function validateForm() {
    const title =
        getElement(
            "announcementTitle"
        )?.value.trim();

    const message =
        getElement(
            "announcementMessage"
        )?.value.trim();

    const startDate =
        getElement(
            "announcementStartDate"
        )?.value;

    const endDate =
        getElement(
            "announcementEndDate"
        )?.value;

    const validation =
        getElement(
            "announcementValidationMessage"
        );

    let error = "";

    if (!title) {
        error =
            "Please enter the announcement title.";
    } else if (!message) {
        error =
            "Please enter the announcement message.";
    } else if (
        startDate &&
        endDate &&
        new Date(startDate) >
            new Date(endDate)
    ) {
        error =
            "The expiry date cannot be earlier than the publish date.";
    }

    if (validation) {
        validation.textContent =
            error;

        validation.hidden =
            !error;
    }

    return !error;
}

function getFormPayload() {
    const title =
        getElement(
            "announcementTitle"
        )?.value.trim();

    const message =
        getElement(
            "announcementMessage"
        )?.value.trim();

    const priority =
        getElement(
            "announcementPriority"
        )?.value ||
        "Normal";

    const status =
        getElement(
            "announcementStatus"
        )?.value ||
        "Draft";

    const startDate =
        getElement(
            "announcementStartDate"
        )?.value;

    const endDate =
        getElement(
            "announcementEndDate"
        )?.value;

    return {
        title,
        message,
        priority,
        status,
        startDate:
            startDate || null,
        endDate:
            endDate || null
    };
}

async function saveAnnouncement(
    event
) {
    if (event) {
        event.preventDefault();
    }

    if (!validateForm()) {
        return;
    }

    const button =
        getElement(
            "saveAnnouncementButton"
        );

    const originalText =
        button
            ? button.textContent
            : "";

    try {
        if (button) {
            button.disabled = true;
            button.textContent =
                "Saving...";
        }

        const payload =
            getFormPayload();

        let endpoint =
            ANNOUNCEMENTS_API;

        let method = "POST";

        if (editingAnnouncementId) {
            endpoint =
                `${ANNOUNCEMENTS_API}/${encodeURIComponent(
                    editingAnnouncementId
                )}`;

            method = "PUT";
        }

        await request(
            endpoint,
            {
                method,
                body: JSON.stringify(
                    payload
                )
            }
        );

        showMessage(
            editingAnnouncementId
                ? "Announcement updated successfully."
                : "Announcement created successfully.",
            "success"
        );

        closeModal();

        await loadAnnouncements();
    } catch (error) {
        console.error(
            "Save announcement error:",
            error
        );

        const validation =
            getElement(
                "announcementValidationMessage"
            );

        if (validation) {
            validation.textContent =
                error.message ||
                "Unable to save announcement.";

            validation.hidden = false;
        }

        showMessage(
            error.message ||
            "Unable to save announcement.",
            "danger"
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                originalText ||
                "Save Announcement";
        }
    }
}

function closeModal() {
    const modalElement =
        getElement(
            "announcementModal"
        );

    if (
        modalElement &&
        window.bootstrap &&
        window.bootstrap.Modal
    ) {
        const modal =
            window.bootstrap.Modal.getInstance(
                modalElement
            );

        if (modal) {
            modal.hide();
        }
    }

    resetForm();
}

async function publishAnnouncement(
    id
) {
    if (!id) {
        return;
    }

    try {
        await request(
            `${ANNOUNCEMENTS_API}/${encodeURIComponent(
                id
            )}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    status: "Published"
                })
            }
        );

        showMessage(
            "Announcement published successfully.",
            "success"
        );

        await loadAnnouncements();
    } catch (error) {
        console.error(
            "Publish announcement error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to publish announcement.",
            "danger"
        );
    }
}

async function archiveAnnouncement(
    id
) {
    if (!id) {
        return;
    }

    try {
        await request(
            `${ANNOUNCEMENTS_API}/${encodeURIComponent(
                id
            )}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    status: "Archived"
                })
            }
        );

        showMessage(
            "Announcement archived successfully.",
            "success"
        );

        await loadAnnouncements();
    } catch (error) {
        console.error(
            "Archive announcement error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to archive announcement.",
            "danger"
        );
    }
}

async function deleteAnnouncement(
    id
) {
    if (!id) {
        return;
    }

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this announcement?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await request(
            `${ANNOUNCEMENTS_API}/${encodeURIComponent(
                id
            )}`,
            {
                method: "DELETE"
            }
        );

        showMessage(
            "Announcement deleted successfully.",
            "success"
        );

        await loadAnnouncements();
    } catch (error) {
        console.error(
            "Delete announcement error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to delete announcement.",
            "danger"
        );
    }
}

function clearFilters() {
    const searchInput =
        getElement("searchInput");

    const statusFilter =
        getElement("statusFilter");

    const priorityFilter =
        getElement("priorityFilter");

    if (searchInput) {
        searchInput.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "all";
    }

    if (priorityFilter) {
        priorityFilter.value = "all";
    }

    renderAnnouncements();
}

function setupEvents() {
    if (initialized) {
        return;
    }

    initialized = true;

    document.addEventListener(
        "click",
        async function (event) {
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
                button.dataset.id || "";

            if (
                action ===
                "edit-announcement"
            ) {
                openEditModal(id);
                return;
            }

            if (
                action ===
                "publish-announcement"
            ) {
                await publishAnnouncement(
                    id
                );
                return;
            }

            if (
                action ===
                "archive-announcement"
            ) {
                await archiveAnnouncement(
                    id
                );
                return;
            }

            if (
                action ===
                "delete-announcement"
            ) {
                await deleteAnnouncement(
                    id
                );
            }
        }
    );

    const searchInput =
        getElement("searchInput");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderAnnouncements
        );
    }

    const statusFilter =
        getElement("statusFilter");

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            renderAnnouncements
        );
    }

    const priorityFilter =
        getElement(
            "priorityFilter"
        );

    if (priorityFilter) {
        priorityFilter.addEventListener(
            "change",
            renderAnnouncements
        );
    }

    const clearFiltersButton =
        getElement(
            "clearAnnouncementFiltersButton"
        );

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener(
            "click",
            clearFilters
        );
    }

    const refreshButton =
        getElement(
            "refreshAnnouncementsButton"
        );

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadAnnouncements
        );
    }

    const createButton =
        getElement(
            "createAnnouncementButton"
        );

    if (createButton) {
        createButton.addEventListener(
            "click",
            function () {
                resetForm();
            }
        );
    }

    const form =
        getElement(
            "announcementForm"
        );

    if (form) {
        form.addEventListener(
            "submit",
            saveAnnouncement
        );
    }

    const modal =
        getElement(
            "announcementModal"
        );

    if (modal) {
        modal.addEventListener(
            "hidden.bs.modal",
            resetForm
        );
    }
}

async function initialize() {
    setupEvents();

    const container =
        getElement(
            "announcementList"
        );

    if (!container) {
        return;
    }

    await loadAnnouncements();
}

window.AnnouncementsPage = {
    initialize,
    loadAnnouncements,
    openCreateModal,
    openEditModal,
    saveAnnouncement,
    publishAnnouncement,
    archiveAnnouncement,
    deleteAnnouncement,
    clearFilters
};

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );
} else {
    initialize();
}
```

})();
