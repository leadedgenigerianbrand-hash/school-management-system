"use strict";

(function () {
    const NOTIFICATIONS_API = "/notifications";

    function showMessage(message, type = "info") {
        if (typeof window.showNotification === "function") {
            window.showNotification(message, type);
            return;
        }

        const alertBox = document.getElementById("notificationMessage");

        if (alertBox) {
            alertBox.textContent = message;
            alertBox.className = `alert alert-${type}`;
            alertBox.hidden = false;

            setTimeout(() => {
                alertBox.hidden = true;
            }, 4000);

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
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return escapeHtml(value);
        }

        return date.toLocaleString();
    }

    function getNotificationId(notification) {
        return (
            notification.id ||
            notification.notification_id ||
            notification.notificationId
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

    function isRead(notification) {
        return (
            notification.is_read === true ||
            notification.isRead === true ||
            notification.read === true
        );
    }

    function getNotificationList(data) {
        if (Array.isArray(data)) return data;

        if (Array.isArray(data.notifications)) {
            return data.notifications;
        }

        if (Array.isArray(data.data)) {
            return data.data;
        }

        if (data.data && Array.isArray(data.data.notifications)) {
            return data.data.notifications;
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

        let url = endpoint;

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
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

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            if (typeof window.clearApiAuthentication === "function") {
                window.clearApiAuthentication();
            } else {
                localStorage.removeItem("school_management_token");
                localStorage.removeItem("school_management_user");
                sessionStorage.removeItem("school_management_token");
                sessionStorage.removeItem("school_management_user");
            }

            if (!window.location.pathname.endsWith("/login.html")) {
                window.location.href = "/pages/login.html";
            }

            throw new Error("Authentication required.");
        }

        if (response.status === 403) {
            throw new Error(
                "You do not have permission to perform this action."
            );
        }

        const contentType = response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            let message = "Request failed.";

            if (data && typeof data === "object") {
                message = data.message || data.error || message;
            } else if (typeof data === "string" && data.trim()) {
                message = data;
            }

            throw new Error(message);
        }

        return data;
    }

    async function loadNotifications() {
        const container =
            document.getElementById("notificationsList") ||
            document.getElementById("notificationList");

        if (!container) return;

        try {
            container.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Loading notifications...</p>
                </div>
            `;

            const data = await request(NOTIFICATIONS_API);
            const notifications = getNotificationList(data);

            renderNotifications(notifications);
            updateUnreadCount(notifications);
        } catch (error) {
            console.error("Load notifications error:", error);

            container.innerHTML = `
                <div class="alert alert-danger">
                    ${escapeHtml(error.message || "Unable to load notifications.")}
                </div>
            `;
        }
    }

    function renderNotifications(notifications) {
        const container =
            document.getElementById("notificationsList") ||
            document.getElementById("notificationList");

        if (!container) return;

        if (!notifications.length) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div style="font-size: 2rem;">🔔</div>
                    <h5 class="mt-3">No notifications</h5>
                    <p class="text-muted mb-0">
                        You do not have any notifications at the moment.
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications
            .map((notification) => {
                const id = getNotificationId(notification);
                const title = getNotificationTitle(notification);
                const message = getNotificationMessage(notification);
                const read = isRead(notification);

                return `
                    <div
                        class="notification-item ${read ? "read" : "unread"}"
                        data-notification-id="${escapeHtml(id)}"
                    >
                        <div class="notification-content">
                            <div class="d-flex justify-content-between align-items-start gap-3">
                                <div>
                                    <h6 class="mb-1">
                                        ${escapeHtml(title)}
                                    </h6>

                                    <p class="mb-1">
                                        ${escapeHtml(message)}
                                    </p>
                                </div>

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

                            <small class="text-muted">
                                ${formatDate(
                                    notification.created_at ||
                                    notification.createdAt ||
                                    notification.date
                                )}
                            </small>

                            ${
                                !read && id
                                    ? `
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-primary mt-2"
                                            data-action="mark-read"
                                            data-id="${encodeURIComponent(id)}"
                                        >
                                            Mark as read
                                        </button>
                                    `
                                    : ""
                            }
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    function updateUnreadCount(notifications) {
        const unreadCount = notifications.filter(
            (notification) => !isRead(notification)
        ).length;

        const elements = document.querySelectorAll(
            "[data-notification-count], #notificationCount, #unreadNotificationCount"
        );

        elements.forEach((element) => {
            element.textContent = unreadCount;

            if (unreadCount > 0) {
                element.hidden = false;
            } else {
                element.hidden = true;
            }
        });
    }

    async function markAsRead(id) {
        if (!id) return;

        try {
            await request(
                `${NOTIFICATIONS_API}/${encodeURIComponent(id)}/read`,
                {
                    method: "PATCH"
                }
            );

            showMessage("Notification marked as read.", "success");
            await loadNotifications();
        } catch (error) {
            console.error("Mark notification read error:", error);
            showMessage(
                error.message || "Unable to mark notification as read.",
                "danger"
            );
        }
    }

    async function markAllAsRead() {
        try {
            await request(`${NOTIFICATIONS_API}/read-all`, {
                method: "PATCH"
            });

            showMessage("All notifications marked as read.", "success");
            await loadNotifications();
        } catch (error) {
            console.error("Mark all notifications read error:", error);
            showMessage(
                error.message || "Unable to mark all notifications as read.",
                "danger"
            );
        }
    }

    function setupEvents() {
        document.addEventListener("click", async function (event) {
            const button = event.target.closest("[data-action]");

            if (!button) return;

            const action = button.dataset.action;
            const id = button.dataset.id;

            if (action === "mark-read") {
                await markAsRead(
                    decodeURIComponent(id || "")
                );
            }

            if (action === "mark-all-read") {
                await markAllAsRead();
            }

            if (action === "refresh-notifications") {
                await loadNotifications();
            }
        });
    }

    async function initialize() {
        setupEvents();

        const container =
            document.getElementById("notificationsList") ||
            document.getElementById("notificationList");

        if (container) {
            await loadNotifications();
        }
    }

    window.NotificationsPage = {
        initialize,
        loadNotifications,
        markAsRead,
        markAllAsRead
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();