"use strict";

(function () {
const NOTIFICATIONS_API = "/api/notifications";
const USERS_API = "/api/users";

```
let notifications = [];
let users = [];
let initialized = false;

function getElement(id) {
    return document.getElementById(id);
}

function showMessage(message, type = "info") {
    if (typeof window.showNotification === "function") {
        window.showNotification(message, type);
        return;
    }

    let alertBox = getElement("notificationMessage");

    if (!alertBox) {
        alertBox = document.createElement("div");
        alertBox.id = "notificationMessage";
        alertBox.className = "alert";
        alertBox.style.position = "fixed";
        alertBox.style.top = "20px";
        alertBox.style.right = "20px";
        alertBox.style.zIndex = "9999";
        alertBox.style.minWidth = "280px";
        document.body.appendChild(alertBox);
    }

    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.hidden = false;

    window.clearTimeout(alertBox._hideTimer);

    alertBox._hideTimer = window.setTimeout(function () {
        alertBox.hidden = true;
    }, 4000);
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

function getNotificationId(notification) {
    return (
        notification.id ||
        notification.notification_id ||
        notification.notificationId ||
        ""
    );
}

function getNotificationTitle(notification) {
    return (
        notification.title ||
        notification.subject ||
        "Notification"
    );
}

function getNotificationMessage(notification) {
    return (
        notification.message ||
        notification.body ||
        notification.content ||
        ""
    );
}

function getNotificationType(notification) {
    return (
        notification.type ||
        notification.notification_type ||
        "General"
    );
}

function getNotificationPriority(notification) {
    return (
        notification.priority ||
        notification.notification_priority ||
        "Normal"
    );
}

function isRead(notification) {
    return (
        notification.is_read === true ||
        notification.isRead === true ||
        notification.read === true
    );
}

function getNotificationUserId(notification) {
    return (
        notification.user_id ||
        notification.userId ||
        ""
    );
}

function getNotificationList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data || typeof data !== "object") {
        return [];
    }

    if (Array.isArray(data.notifications)) {
        return data.notifications;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (
        data.data &&
        Array.isArray(data.data.notifications)
    ) {
        return data.data.notifications;
    }

    if (
        data.data &&
        Array.isArray(data.data.data)
    ) {
        return data.data.data;
    }

    return [];
}

function getUserList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data || typeof data !== "object") {
        return [];
    }

    if (Array.isArray(data.users)) {
        return data.users;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (
        data.data &&
        Array.isArray(data.data.users)
    ) {
        return data.data.users;
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

    const response = await fetch(endpoint, {
        ...options,
        headers
    });

    if (response.status === 401) {
        if (
            typeof window.clearApiAuthentication === "function"
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

        throw new Error("Authentication required.");
    }

    if (response.status === 403) {
        throw new Error(
            "You do not have permission to perform this action."
        );
    }

    const contentType =
        response.headers.get("content-type") || "";

    let data;

    if (
        contentType.includes("application/json")
    ) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        let message = "Request failed.";

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

function getCurrentUserId() {
    const userData =
        localStorage.getItem(
            "school_management_user"
        ) ||
        sessionStorage.getItem(
            "school_management_user"
        );

    if (!userData) {
        return "";
    }

    try {
        const user = JSON.parse(userData);

        return (
            user.id ||
            user.userId ||
            user.user_id ||
            ""
        );
    } catch (error) {
        return "";
    }
}

function getCurrentFilters() {
    const searchInput =
        getElement("searchInput");

    const statusFilter =
        getElement("statusFilter");

    const typeFilter =
        getElement("typeFilter");

    return {
        search: searchInput
            ? searchInput.value.trim().toLowerCase()
            : "",
        status: statusFilter
            ? statusFilter.value
            : "all",
        type: typeFilter
            ? typeFilter.value
            : "all"
    };
}

function filterNotifications() {
    const filters = getCurrentFilters();

    return notifications.filter(
        function (notification) {
            const title =
                getNotificationTitle(
                    notification
                ).toLowerCase();

            const message =
                getNotificationMessage(
                    notification
                ).toLowerCase();

            const type =
                getNotificationType(
                    notification
                );

            const read =
                isRead(notification);

            const matchesSearch =
                !filters.search ||
                title.includes(
                    filters.search
                ) ||
                message.includes(
                    filters.search
                ) ||
                type
                    .toLowerCase()
                    .includes(
                        filters.search
                    );

            let matchesStatus = true;

            if (
                filters.status === "unread"
            ) {
                matchesStatus = !read;
            }

            if (
                filters.status === "read"
            ) {
                matchesStatus = read;
            }

            const matchesType =
                filters.type === "all" ||
                type === filters.type;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            );
        }
    );
}

function renderNotifications() {
    const container =
        getElement("notificationList") ||
        getElement("notificationsList");

    if (!container) {
        return;
    }

    const filtered =
        filterNotifications();

    if (!filtered.length) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="fs-1 mb-3">🔔</div>
                <h5 class="mb-2">No notifications found</h5>
                <p class="text-muted mb-0">
                    There are no notifications matching your current filters.
                </p>
            </div>
        `;

        updateSummaryCards();
        updateNotificationCount(0);
        return;
    }

    container.innerHTML = filtered
        .map(function (notification) {
            const id =
                getNotificationId(
                    notification
                );

            const title =
                getNotificationTitle(
                    notification
                );

            const message =
                getNotificationMessage(
                    notification
                );

            const type =
                getNotificationType(
                    notification
                );

            const priority =
                getNotificationPriority(
                    notification
                );

            const read =
                isRead(notification);

            const priorityClass =
                priority === "High"
                    ? "danger"
                    : priority === "Low"
                    ? "secondary"
                    : "primary";

            const typeBadge =
                escapeHtml(type);

            return `
                <div
                    class="card mb-3 notification-item ${
                        read ? "read" : "unread"
                    }"
                    data-notification-id="${escapeHtml(id)}"
                >
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start gap-3">
                            <div class="flex-grow-1">
                                <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                                    <h6 class="mb-0">
                                        ${escapeHtml(title)}
                                    </h6>

                                    <span class="badge bg-light text-dark border">
                                        ${typeBadge}
                                    </span>

                                    <span class="badge bg-${priorityClass}">
                                        ${escapeHtml(priority)}
                                    </span>

                                    ${
                                        !read
                                            ? `
                                                <span class="badge bg-primary">
                                                    New
                                                </span>
                                            `
                                            : ""
                                    }
                                </div>

                                <p class="mb-2">
                                    ${escapeHtml(message)}
                                </p>

                                <small class="text-muted">
                                    ${escapeHtml(
                                        formatDate(
                                            notification.created_at ||
                                            notification.createdAt ||
                                            notification.date
                                        )
                                    )}
                                </small>
                            </div>

                            <div class="d-flex flex-wrap gap-2">
                                ${
                                    !read && id
                                        ? `
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-outline-primary"
                                                data-action="mark-read"
                                                data-id="${escapeHtml(id)}"
                                            >
                                                Mark as read
                                            </button>
                                        `
                                        : ""
                                }

                                ${
                                    read && id
                                        ? `
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-outline-secondary"
                                                data-action="mark-unread"
                                                data-id="${escapeHtml(id)}"
                                            >
                                                Mark as unread
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
                                                data-action="delete-notification"
                                                data-id="${escapeHtml(id)}"
                                            >
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

    updateSummaryCards();
    updateNotificationCount(
        filtered.length
    );
}

function updateNotificationCount(
    count
) {
    const element =
        getElement("notificationCount");

    if (element) {
        element.textContent = String(count);
    }
}

function updateSummaryCards() {
    const total =
        notifications.length;

    const unread =
        notifications.filter(
            function (notification) {
                return !isRead(notification);
            }
        ).length;

    const read =
        notifications.filter(
            function (notification) {
                return isRead(notification);
            }
        ).length;

    const highPriority =
        notifications.filter(
            function (notification) {
                return (
                    getNotificationPriority(
                        notification
                    ).toLowerCase() ===
                    "high"
                );
            }
        ).length;

    const totalElement =
        getElement("totalNotifications");

    const unreadElement =
        getElement("unreadNotifications");

    const readElement =
        getElement("readNotifications");

    const highPriorityElement =
        getElement(
            "highPriorityNotifications"
        );

    if (totalElement) {
        totalElement.textContent =
            String(total);
    }

    if (unreadElement) {
        unreadElement.textContent =
            String(unread);
    }

    if (readElement) {
        readElement.textContent =
            String(read);
    }

    if (highPriorityElement) {
        highPriorityElement.textContent =
            String(highPriority);
    }
}

function setLoadingState() {
    const container =
        getElement("notificationList") ||
        getElement("notificationsList");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="text-center py-5">
            <div
                class="spinner-border"
                role="status"
            >
                <span class="visually-hidden">
                    Loading...
                </span>
            </div>

            <p class="text-muted mt-3 mb-0">
                Loading notifications...
            </p>
        </div>
    `;
}

async function loadNotifications() {
    const container =
        getElement("notificationList") ||
        getElement("notificationsList");

    if (!container) {
        return;
    }

    try {
        setLoadingState();

        const data =
            await request(
                NOTIFICATIONS_API
            );

        notifications =
            getNotificationList(data);

        renderNotifications();
        updateSummaryCards();
    } catch (error) {
        console.error(
            "Load notifications error:",
            error
        );

        notifications = [];

        container.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHtml(
                    error.message ||
                    "Unable to load notifications."
                )}
            </div>
        `;

        updateSummaryCards();

        showMessage(
            error.message ||
            "Unable to load notifications.",
            "danger"
        );
    }
}

async function loadUsers() {
    const userSelect =
        getElement("notificationUserId");

    if (!userSelect) {
        return;
    }

    try {
        const data =
            await request(USERS_API);

        users = getUserList(data);

        renderUserOptions();
    } catch (error) {
        console.error(
            "Load users error:",
            error
        );

        userSelect.innerHTML = `
            <option value="">
                Unable to load users
            </option>
        `;
    }
}

function getUserDisplayName(user) {
    const fullName =
        user.full_name ||
        user.fullName;

    if (fullName) {
        return fullName;
    }

    const firstName =
        user.first_name ||
        user.firstName ||
        "";

    const middleName =
        user.middle_name ||
        user.middleName ||
        "";

    const lastName =
        user.last_name ||
        user.lastName ||
        "";

    const name =
        `${firstName} ${middleName} ${lastName}`
            .replace(/\s+/g, " ")
            .trim();

    return (
        name ||
        user.username ||
        user.email ||
        "User"
    );
}

function getUserId(user) {
    return (
        user.id ||
        user.user_id ||
        user.userId ||
        ""
    );
}

function renderUserOptions() {
    const select =
        getElement("notificationUserId");

    if (!select) {
        return;
    }

    const currentValue =
        select.value;

    select.innerHTML = `
        <option value="">
            Select a user
        </option>
    `;

    users.forEach(function (user) {
        const id = getUserId(user);

        if (!id) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = id;
        option.textContent =
            getUserDisplayName(user);

        select.appendChild(option);
    });

    if (currentValue) {
        select.value = currentValue;
    }
}

async function markAsRead(id) {
    if (!id) {
        return;
    }

    try {
        await request(
            `${NOTIFICATIONS_API}/${encodeURIComponent(
                id
            )}/read`,
            {
                method: "PATCH"
            }
        );

        showMessage(
            "Notification marked as read.",
            "success"
        );

        await loadNotifications();
    } catch (error) {
        console.error(
            "Mark notification read error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to mark notification as read.",
            "danger"
        );
    }
}

async function markAsUnread(id) {
    if (!id) {
        return;
    }

    try {
        await request(
            `${NOTIFICATIONS_API}/${encodeURIComponent(
                id
            )}/unread`,
            {
                method: "PATCH"
            }
        );

        showMessage(
            "Notification marked as unread.",
            "success"
        );

        await loadNotifications();
    } catch (error) {
        console.error(
            "Mark notification unread error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to mark notification as unread.",
            "danger"
        );
    }
}

async function markAllAsRead() {
    try {
        await request(
            `${NOTIFICATIONS_API}/my/mark-all-read`,
            {
                method: "PATCH"
            }
        );

        showMessage(
            "All notifications marked as read.",
            "success"
        );

        await loadNotifications();
    } catch (error) {
        console.error(
            "Mark all notifications read error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to mark all notifications as read.",
            "danger"
        );
    }
}

async function deleteNotification(id) {
    if (!id) {
        return;
    }

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this notification?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await request(
            `${NOTIFICATIONS_API}/${encodeURIComponent(
                id
            )}`,
            {
                method: "DELETE"
            }
        );

        showMessage(
            "Notification deleted successfully.",
            "success"
        );

        await loadNotifications();
    } catch (error) {
        console.error(
            "Delete notification error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to delete notification.",
            "danger"
        );
    }
}

async function deleteReadNotifications() {
    const confirmed =
        window.confirm(
            "Are you sure you want to delete all read notifications?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await request(
            `${NOTIFICATIONS_API}/my/delete-read`,
            {
                method: "DELETE"
            }
        );

        showMessage(
            "Read notifications deleted successfully.",
            "success"
        );

        await loadNotifications();
    } catch (error) {
        console.error(
            "Delete read notifications error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to delete read notifications.",
            "danger"
        );
    }
}

function getModalInstance() {
    const modalElement =
        getElement("notificationModal");

    if (
        !modalElement ||
        !window.bootstrap ||
        !window.bootstrap.Modal
    ) {
        return null;
    }

    return (
        window.bootstrap.Modal.getInstance(
            modalElement
        ) ||
        new window.bootstrap.Modal(
            modalElement
        )
    );
}

function resetNotificationForm() {
    const form =
        getElement("notificationForm");

    if (form) {
        form.reset();
    }

    const userId =
        getElement("notificationUserId");

    if (userId) {
        userId.value = "";
    }

    const type =
        getElement("notificationType");

    if (type) {
        type.value = "General";
    }

    const priority =
        getElement("notificationPriority");

    if (priority) {
        priority.value = "Normal";
    }
}

async function createNotification(
    event
) {
    if (event) {
        event.preventDefault();
    }

    const userId =
        getElement(
            "notificationUserId"
        )?.value.trim();

    const title =
        getElement(
            "notificationTitle"
        )?.value.trim();

    const type =
        getElement(
            "notificationType"
        )?.value || "General";

    const priority =
        getElement(
            "notificationPriority"
        )?.value || "Normal";

    const message =
        getElement(
            "notificationMessage"
        )?.value.trim();

    if (!userId) {
        showMessage(
            "Please select a user.",
            "warning"
        );
        return;
    }

    if (!title) {
        showMessage(
            "Please enter a notification title.",
            "warning"
        );
        return;
    }

    if (!message) {
        showMessage(
            "Please enter a notification message.",
            "warning"
        );
        return;
    }

    const submitButton =
        getElement(
            "saveNotificationButton"
        );

    const originalText =
        submitButton
            ? submitButton.textContent
            : "";

    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent =
                "Saving...";
        }

        await request(
            NOTIFICATIONS_API,
            {
                method: "POST",
                body: JSON.stringify({
                    userId,
                    title,
                    message,
                    type,
                    priority
                })
            }
        );

        showMessage(
            "Notification created successfully.",
            "success"
        );

        resetNotificationForm();

        const modal =
            getModalInstance();

        if (modal) {
            modal.hide();
        }

        await loadNotifications();
    } catch (error) {
        console.error(
            "Create notification error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to create notification.",
            "danger"
        );
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent =
                originalText ||
                "Save Notification";
        }
    }
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
                action === "mark-read"
            ) {
                await markAsRead(id);
                return;
            }

            if (
                action === "mark-unread"
            ) {
                await markAsUnread(id);
                return;
            }

            if (
                action ===
                "delete-notification"
            ) {
                await deleteNotification(
                    id
                );
                return;
            }

            if (
                action ===
                "mark-all-read"
            ) {
                await markAllAsRead();
                return;
            }

            if (
                action ===
                "delete-read"
            ) {
                await deleteReadNotifications();
                return;
            }

            if (
                action ===
                "refresh-notifications"
            ) {
                await loadNotifications();
            }
        }
    );

    const searchInput =
        getElement("searchInput");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderNotifications
        );
    }

    const statusFilter =
        getElement("statusFilter");

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            renderNotifications
        );
    }

    const typeFilter =
        getElement("typeFilter");

    if (typeFilter) {
        typeFilter.addEventListener(
            "change",
            renderNotifications
        );
    }

    const refreshButton =
        getElement(
            "refreshNotificationsButton"
        );

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadNotifications
        );
    }

    const markAllReadButton =
        getElement(
            "markAllReadButton"
        );

    if (markAllReadButton) {
        markAllReadButton.addEventListener(
            "click",
            markAllAsRead
        );
    }

    const deleteReadButton =
        getElement(
            "deleteReadButton"
        );

    if (deleteReadButton) {
        deleteReadButton.addEventListener(
            "click",
            deleteReadNotifications
        );
    }

    const createButton =
        getElement(
            "createNotificationButton"
        );

    if (createButton) {
        createButton.addEventListener(
            "click",
            async function () {
                resetNotificationForm();
                await loadUsers();
            }
        );
    }

    const form =
        getElement(
            "notificationForm"
        );

    if (form) {
        form.addEventListener(
            "submit",
            createNotification
        );
    }

    const modal =
        getElement(
            "notificationModal"
        );

    if (modal) {
        modal.addEventListener(
            "hidden.bs.modal",
            resetNotificationForm
        );
    }
}

async function initialize() {
    setupEvents();

    const container =
        getElement("notificationList") ||
        getElement("notificationsList");

    if (!container) {
        return;
    }

    await loadNotifications();
}

window.NotificationsPage = {
    initialize,
    loadNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    createNotification,
    loadUsers
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
