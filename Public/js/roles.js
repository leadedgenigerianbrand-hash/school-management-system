"use strict";

(function () {
    let roles = [];

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

        const headers = {
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

        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers
            });
        } catch (error) {
            console.error("Roles API error:", error);
            throw new Error(
                "Unable to connect to the server."
            );
        }

        if (response.status === 401) {
            localStorage.removeItem("school_management_token");
            localStorage.removeItem("school_management_user");
            sessionStorage.removeItem("school_management_token");
            sessionStorage.removeItem("school_management_user");

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

        const contentType =
            response.headers.get("content-type") || "";

        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            throw new Error(
                typeof data === "object"
                    ? data.message ||
                      data.error ||
                      "Request failed."
                    : data || "Request failed."
            );
        }

        return data;
    }

    function getElements() {
        return {
            tableBody:
                document.getElementById("rolesTableBody") ||
                document.getElementById("roleTableBody") ||
                document.querySelector("#rolesTable tbody"),

            searchInput:
                document.getElementById("searchInput") ||
                document.getElementById("roleSearch"),

            statusFilter:
                document.getElementById("statusFilter") ||
                document.getElementById("roleStatusFilter"),

            message:
                document.getElementById("message") ||
                document.getElementById("messageContainer")
        };
    }

    function showMessage(text, type = "success") {
        const { message } = getElements();

        if (!message) {
            return;
        }

        message.textContent = text;
        message.className = `message ${type}`;

        setTimeout(() => {
            message.textContent = "";
            message.className = "message";
        }, 4000);
    }

    async function loadRoles() {
        showLoading();

        try {
            const result = await request("/roles");

            roles =
                Array.isArray(result)
                    ? result
                    : Array.isArray(result?.data)
                        ? result.data
                        : Array.isArray(result?.roles)
                            ? result.roles
                            : Array.isArray(result?.records)
                                ? result.records
                                : [];

            renderRoles();
        } catch (error) {
            console.error(
                "Load roles error:",
                error
            );

            roles = [];

            showEmpty("Unable to load roles.");

            showMessage(
                error.message ||
                "Unable to load roles.",
                "error"
            );
        }
    }

    function renderRoles() {
        const {
            tableBody,
            searchInput,
            statusFilter
        } = getElements();

        if (!tableBody) {
            return;
        }

        const searchTerm =
            searchInput?.value.trim().toLowerCase() || "";

        const selectedStatus =
            statusFilter?.value.trim().toLowerCase() || "";

        const filteredRoles = roles.filter((role) => {
            const name = String(
                role.name ||
                role.role_name ||
                role.roleName ||
                ""
            ).toLowerCase();

            const description = String(
                role.description || ""
            ).toLowerCase();

            const status = String(
                role.status || "active"
            ).toLowerCase();

            const matchesSearch =
                !searchTerm ||
                name.includes(searchTerm) ||
                description.includes(searchTerm);

            const matchesStatus =
                !selectedStatus ||
                status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        if (!filteredRoles.length) {
            showEmpty("No roles found.");
            return;
        }

        tableBody.innerHTML =
            filteredRoles
                .map(createRoleRow)
                .join("");
    }

    function createRoleRow(role) {
        const id =
            role.id ??
            role.role_id ??
            "";

        const name =
            role.name ||
            role.role_name ||
            role.roleName ||
            "-";

        const description =
            role.description ||
            "-";

        const status =
            String(
                role.status || "active"
            ).toLowerCase();

        const createdAt =
            role.created_at ||
            role.createdAt;

        const permissionsCount =
            role.permissions_count ??
            role.permission_count ??
            role.permissionsCount ??
            "";

        return `
            <tr>
                <td>
                    ${escapeHtml(name)}
                </td>

                <td>
                    ${escapeHtml(description)}
                </td>

                <td>
                    ${
                        permissionsCount !== ""
                            ? escapeHtml(permissionsCount)
                            : "-"
                    }
                </td>

                <td>
                    <span
                        class="status-badge status-${escapeAttribute(status)}"
                    >
                        ${escapeHtml(
                            formatStatus(status)
                        )}
                    </span>
                </td>

                <td>
                    ${formatDate(createdAt)}
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="btn btn-sm btn-primary"
                            data-action="view-role"
                            data-id="${escapeAttribute(id)}"
                        >
                            View
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-secondary"
                            data-action="edit-role"
                            data-id="${escapeAttribute(id)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            data-action="delete-role"
                            data-id="${escapeAttribute(id)}"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function addRole() {
        window.location.href =
            "role-form.html";
    }

    function viewRole(id) {
        window.location.href =
            `role-profile.html?id=${encodeURIComponent(id)}`;
    }

    function editRole(id) {
        window.location.href =
            `role-form.html?id=${encodeURIComponent(id)}`;
    }

    async function deleteRole(id) {
        const role = roles.find(
            (item) =>
                String(
                    item.id ??
                    item.role_id
                ) === String(id)
        );

        const roleName =
            role?.name ||
            role?.role_name ||
            role?.roleName ||
            "this role";

        if (
            !window.confirm(
                `Are you sure you want to delete "${roleName}"?`
            )
        ) {
            return;
        }

        try {
            await request(
                `/roles/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            showMessage(
                "Role deleted successfully.",
                "success"
            );

            await loadRoles();
        } catch (error) {
            console.error(
                "Delete role error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to delete role.",
                "error"
            );
        }
    }

    function showLoading() {
        const { tableBody } = getElements();

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;padding:30px;"
                >
                    Loading roles...
                </td>
            </tr>
        `;
    }

    function showEmpty(text) {
        const { tableBody } = getElements();

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;padding:30px;"
                >
                    ${escapeHtml(text)}
                </td>
            </tr>
        `;
    }

    function formatStatus(status) {
        const labels = {
            active: "Active",
            inactive: "Inactive",
            suspended: "Suspended",
            disabled: "Disabled"
        };

        return (
            labels[status] ||
            String(status)
                .replace(/_/g, " ")
                .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase()
                )
        );
    }

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
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

    function setupEvents() {
        const {
            searchInput,
            statusFilter
        } = getElements();

        if (searchInput) {
            searchInput.addEventListener(
                "input",
                renderRoles
            );
        }

        if (statusFilter) {
            statusFilter.addEventListener(
                "change",
                renderRoles
            );
        }

        document.addEventListener(
            "click",
            async (event) => {
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

                if (action === "view-role") {
                    viewRole(id);
                    return;
                }

                if (action === "edit-role") {
                    editRole(id);
                    return;
                }

                if (action === "delete-role") {
                    await deleteRole(id);
                }
            }
        );
    }

    window.loadRoles = loadRoles;
    window.addRole = addRole;
    window.viewRole = viewRole;
    window.editRole = editRole;
    window.deleteRole = deleteRole;

    window.RolesPage = {
        initialize: loadRoles,
        loadRoles,
        addRole,
        viewRole,
        editRole,
        deleteRole
    };

    function initialize() {
        setupEvents();
        loadRoles();
    }

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