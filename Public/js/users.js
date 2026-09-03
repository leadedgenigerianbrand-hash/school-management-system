"use strict";

(function () {
    const USERS_API = "/users";
    const LOGIN_PAGE = "/pages/login.html";

    let users = [];

    const tableBody =
        document.getElementById("usersTableBody") ||
        document.getElementById("userTableBody") ||
        document.querySelector("#usersTable tbody");

    const searchInput =
        document.getElementById("searchInput") ||
        document.getElementById("userSearch");

    const roleFilter =
        document.getElementById("roleFilter") ||
        document.getElementById("userRoleFilter");

    const statusFilter =
        document.getElementById("statusFilter") ||
        document.getElementById("userStatusFilter");

    const messageContainer =
        document.getElementById("message") ||
        document.getElementById("messageContainer");

    function clearAuthentication() {
        if (typeof window.clearApiAuthentication === "function") {
            window.clearApiAuthentication();
            return;
        }

        [
            "school_management_token",
            "school_management_user",
            "token",
            "accessToken"
        ].forEach(function (key) {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }

    async function request(endpoint, options = {}) {
        if (typeof window.apiRequest === "function") {
            return window.apiRequest(endpoint, options);
        }

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

        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers
            });
        } catch (error) {
            console.error("Users API request failed:", error);
            throw new Error(
                "Unable to connect to the server. Please check your connection."
            );
        }

        if (response.status === 401) {
            clearAuthentication();

            if (!window.location.pathname.endsWith("/login.html")) {
                window.location.href = LOGIN_PAGE;
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

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();

            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = text;
            }
        }

        if (!response.ok) {
            let message = "Request failed.";

            if (data && typeof data === "object") {
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

    function showMessage(text, type = "success") {
        if (
            typeof window.showNotification === "function"
        ) {
            window.showNotification(text, type);
            return;
        }

        if (!messageContainer) {
            return;
        }

        messageContainer.textContent = text;
        messageContainer.className = `message ${type}`;

        setTimeout(function () {
            messageContainer.textContent = "";
            messageContainer.className = "message";
        }, 4000);
    }

    function getUserId(user) {
        return (
            user.id ||
            user.user_id ||
            user.userId ||
            ""
        );
    }

    function getUsername(user) {
        return (
            user.username ||
            user.user_name ||
            user.userName ||
            "-"
        );
    }

    function getFullName(user) {
        const firstName =
            user.first_name ||
            user.firstName ||
            "";

        const lastName =
            user.last_name ||
            user.lastName ||
            "";

        return (
            `${firstName} ${lastName}`.trim() ||
            user.name ||
            "-"
        );
    }

    function getRole(user) {
        return (
            user.role_name ||
            user.roleName ||
            user.role ||
            "-"
        );
    }

    function getStatus(user) {
        return String(
            user.status || "active"
        ).toLowerCase();
    }

    function getUsersFromResponse(result) {
        if (Array.isArray(result)) {
            return result;
        }

        if (Array.isArray(result?.data)) {
            return result.data;
        }

        if (Array.isArray(result?.users)) {
            return result.users;
        }

        if (Array.isArray(result?.records)) {
            return result.records;
        }

        if (
            result?.data &&
            Array.isArray(result.data.users)
        ) {
            return result.data.users;
        }

        return [];
    }

    async function loadUsers() {
        if (!tableBody) {
            return;
        }

        showLoading();

        try {
            const result = await request(USERS_API);

            users = getUsersFromResponse(result);

            populateRoleFilter();
            renderUsers();
        } catch (error) {
            console.error("Load users error:", error);

            users = [];

            showEmpty(
                error.message ||
                "Unable to load users."
            );

            showMessage(
                error.message ||
                "Unable to load users.",
                "error"
            );
        }
    }

    function renderUsers() {
        if (!tableBody) {
            return;
        }

        const searchTerm =
            searchInput?.value
                ?.trim()
                .toLowerCase() || "";

        const selectedRole =
            roleFilter?.value
                ?.trim()
                .toLowerCase() || "";

        const selectedStatus =
            statusFilter?.value
                ?.trim()
                .toLowerCase() || "";

        const filteredUsers = users.filter(function (user) {
            const username =
                getUsername(user)
                    .toLowerCase();

            const email =
                String(user.email || "")
                    .toLowerCase();

            const fullName =
                getFullName(user)
                    .toLowerCase();

            const role =
                getRole(user)
                    .toLowerCase();

            const status =
                getStatus(user);

            const matchesSearch =
                !searchTerm ||
                username.includes(searchTerm) ||
                email.includes(searchTerm) ||
                fullName.includes(searchTerm);

            const matchesRole =
                !selectedRole ||
                role === selectedRole;

            const matchesStatus =
                !selectedStatus ||
                status === selectedStatus;

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );
        });

        if (!filteredUsers.length) {
            showEmpty("No users found.");
            return;
        }

        tableBody.innerHTML =
            filteredUsers
                .map(createUserRow)
                .join("");
    }

    function createUserRow(user) {
        const id = getUserId(user);
        const encodedId =
            encodeURIComponent(String(id));

        const username =
            getUsername(user);

        const fullName =
            getFullName(user);

        const email =
            user.email || "-";

        const role =
            getRole(user);

        const status =
            getStatus(user);

        const lastLogin =
            user.last_login ||
            user.lastLogin;

        const createdAt =
            user.created_at ||
            user.createdAt;

        return `
            <tr data-user-id="${escapeHtml(encodedId)}">

                <td>
                    ${escapeHtml(username)}
                </td>

                <td>
                    ${escapeHtml(fullName)}
                </td>

                <td>
                    ${escapeHtml(email)}
                </td>

                <td>
                    <span class="role-badge">
                        ${escapeHtml(role)}
                    </span>
                </td>

                <td>
                    <span class="status-badge status-${escapeHtml(status)}">
                        ${escapeHtml(formatStatus(status))}
                    </span>
                </td>

                <td>
                    ${formatDate(lastLogin)}
                </td>

                <td>
                    ${formatDate(createdAt)}
                </td>

                <td>
                    <div class="action-buttons">

                        <button
                            type="button"
                            class="btn btn-sm btn-primary"
                            data-action="view-user"
                            data-id="${escapeHtml(encodedId)}"
                        >
                            View
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-warning"
                            data-action="toggle-user-status"
                            data-id="${escapeHtml(encodedId)}"
                        >
                            ${
                                status === "active"
                                    ? "Deactivate"
                                    : "Activate"
                            }
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            data-action="delete-user"
                            data-id="${escapeHtml(encodedId)}"
                        >
                            Delete
                        </button>

                    </div>
                </td>

            </tr>
        `;
    }

    function populateRoleFilter() {
        if (!roleFilter) {
            return;
        }

        const currentValue =
            roleFilter.value;

        const roles = [
            ...new Set(
                users
                    .map(getRole)
                    .filter(function (role) {
                        return role && role !== "-";
                    })
            )
        ].sort(function (a, b) {
            return a.localeCompare(b);
        });

        roleFilter.innerHTML = `
            <option value="">All Roles</option>

            ${roles
                .map(function (role) {
                    return `
                        <option value="${escapeHtml(
                            role.toLowerCase()
                        )}">
                            ${escapeHtml(role)}
                        </option>
                    `;
                })
                .join("")}
        `;

        roleFilter.value = currentValue;
    }

    function viewUser(id) {
        const user =
            users.find(function (item) {
                return String(
                    getUserId(item)
                ) === String(id);
            });

        if (!user) {
            showMessage(
                "User not found.",
                "error"
            );
            return;
        }

        const details = [
            `Username: ${getUsername(user)}`,
            `Name: ${getFullName(user)}`,
            `Email: ${user.email || "-"}`,
            `Role: ${getRole(user)}`,
            `Status: ${formatStatus(getStatus(user))}`
        ].join("\n");

        window.alert(details);
    }

    async function activateUser(id) {
        try {
            await request(
                `${USERS_API}/${encodeURIComponent(id)}/activate`,
                {
                    method: "PUT"
                }
            );

            showMessage(
                "User activated successfully.",
                "success"
            );

            await loadUsers();
        } catch (error) {
            console.error(
                "Activate user error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to activate user.",
                "error"
            );
        }
    }

    async function deactivateUser(id) {
        try {
            await request(
                `${USERS_API}/${encodeURIComponent(id)}/deactivate`,
                {
                    method: "PUT"
                }
            );

            showMessage(
                "User deactivated successfully.",
                "success"
            );

            await loadUsers();
        } catch (error) {
            console.error(
                "Deactivate user error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to deactivate user.",
                "error"
            );
        }
    }

    async function toggleUserStatus(id) {
        const user =
            users.find(function (item) {
                return String(
                    getUserId(item)
                ) === String(id);
            });

        if (!user) {
            showMessage(
                "User not found.",
                "error"
            );
            return;
        }

        const status =
            getStatus(user);

        const action =
            status === "active"
                ? "deactivate"
                : "activate";

        const confirmed =
            window.confirm(
                `Are you sure you want to ${action} this user?`
            );

        if (!confirmed) {
            return;
        }

        if (action === "deactivate") {
            await deactivateUser(id);
        } else {
            await activateUser(id);
        }
    }

    async function deleteUser(id) {
        const user =
            users.find(function (item) {
                return String(
                    getUserId(item)
                ) === String(id);
            });

        const username =
            user
                ? getUsername(user)
                : "this user";

        const confirmed =
            window.confirm(
                `Are you sure you want to permanently delete "${username}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            await request(
                `${USERS_API}/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            showMessage(
                "User deleted successfully.",
                "success"
            );

            await loadUsers();
        } catch (error) {
            console.error(
                "Delete user error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to delete user.",
                "error"
            );
        }
    }

    function setupEvents() {
        if (searchInput) {
            searchInput.addEventListener(
                "input",
                renderUsers
            );
        }

        if (roleFilter) {
            roleFilter.addEventListener(
                "change",
                renderUsers
            );
        }

        if (statusFilter) {
            statusFilter.addEventListener(
                "change",
                renderUsers
            );
        }

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

                if (
                    ![
                        "view-user",
                        "toggle-user-status",
                        "delete-user"
                    ].includes(action)
                ) {
                    return;
                }

                const rawId =
                    button.dataset.id;

                if (!rawId) {
                    return;
                }

                let id;

                try {
                    id =
                        decodeURIComponent(rawId);
                } catch {
                    id = rawId;
                }

                if (action === "view-user") {
                    viewUser(id);
                    return;
                }

                if (
                    action ===
                    "toggle-user-status"
                ) {
                    await toggleUserStatus(id);
                    return;
                }

                if (action === "delete-user") {
                    await deleteUser(id);
                }
            }
        );
    }

    function showLoading() {
        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="text-align:center;padding:30px;"
                >
                    Loading users...
                </td>
            </tr>
        `;
    }

    function showEmpty(message) {
        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="text-align:center;padding:30px;"
                >
                    ${escapeHtml(message)}
                </td>
            </tr>
        `;
    }

    function formatStatus(status) {
        const normalized =
            String(status || "")
                .toLowerCase();

        const labels = {
            active: "Active",
            inactive: "Inactive",
            suspended: "Suspended",
            disabled: "Disabled",
            pending: "Pending"
        };

        return (
            labels[normalized] ||
            normalized
                .replace(/_/g, " ")
                .replace(
                    /\b\w/g,
                    function (letter) {
                        return letter.toUpperCase();
                    }
                )
        );
    }

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "-";
        }

        return date.toLocaleDateString(
            "en-NG",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    }

    function escapeHtml(value) {
        if (
            window.App &&
            typeof window.App.escapeHtml ===
            "function"
        ) {
            return window.App.escapeHtml(value);
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function initialize() {
        setupEvents();
        loadUsers();
    }

    window.UsersPage = {
        initialize,
        loadUsers,
        viewUser,
        activateUser,
        deactivateUser,
        toggleUserStatus,
        deleteUser
    };

    window.loadUsers = loadUsers;
    window.viewUser = viewUser;
    window.activateUser = activateUser;
    window.deactivateUser = deactivateUser;
    window.toggleUserStatus = toggleUserStatus;
    window.deleteUser = deleteUser;

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();