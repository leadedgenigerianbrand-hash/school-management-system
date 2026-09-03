"use strict";

(function () {
    const API_BASE = "/api";
    const TOKEN_KEY = "school_management_token";

    let permissions = [];

    function getToken() {
        return (
            localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY) ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            ""
        );
    }

    async function apiRequest(endpoint, options = {}) {
        let url = endpoint;

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            if (!url.startsWith("/")) {
                url = "/" + url;
            }

            if (!url.startsWith(API_BASE + "/")) {
                url = API_BASE + url;
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
            console.error("Permission API error:", error);
            throw new Error(
                "Unable to connect to the server."
            );
        }

        if (response.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("school_management_user");
            sessionStorage.removeItem(TOKEN_KEY);
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

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new Error(
                typeof data === "object"
                    ? data.message || data.error || "Request failed."
                    : data || "Request failed."
            );
        }

        return data;
    }

    function getElements() {
        return {
            tableBody:
                document.getElementById("permissionsTableBody") ||
                document.getElementById("permissionTableBody") ||
                document.querySelector("#permissionsTable tbody"),

            searchInput:
                document.getElementById("searchInput") ||
                document.getElementById("permissionSearch"),

            moduleFilter:
                document.getElementById("moduleFilter") ||
                document.getElementById("permissionModuleFilter"),

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

    async function loadPermissions() {
        const { tableBody } = getElements();

        showLoading();

        try {
            const result = await apiRequest("/permissions");

            permissions =
                Array.isArray(result)
                    ? result
                    : Array.isArray(result?.data)
                        ? result.data
                        : Array.isArray(result?.permissions)
                            ? result.permissions
                            : Array.isArray(result?.records)
                                ? result.records
                                : [];

            populateModuleFilter();
            renderPermissions();
        } catch (error) {
            console.error("Load permissions error:", error);

            permissions = [];

            if (tableBody) {
                showEmpty("Unable to load permissions.");
            }

            showMessage(
                error.message || "Unable to load permissions.",
                "error"
            );
        }
    }

    function renderPermissions() {
        const {
            tableBody,
            searchInput,
            moduleFilter
        } = getElements();

        if (!tableBody) {
            return;
        }

        const searchTerm =
            searchInput?.value.trim().toLowerCase() || "";

        const selectedModule =
            moduleFilter?.value.trim().toLowerCase() || "";

        const filtered = permissions.filter((permission) => {
            const name = String(
                permission.name ||
                permission.permission_name ||
                permission.permissionName ||
                ""
            ).toLowerCase();

            const description = String(
                permission.description || ""
            ).toLowerCase();

            const module = String(
                permission.module ||
                permission.module_name ||
                permission.moduleName ||
                ""
            ).toLowerCase();

            const matchesSearch =
                !searchTerm ||
                name.includes(searchTerm) ||
                description.includes(searchTerm) ||
                module.includes(searchTerm);

            const matchesModule =
                !selectedModule ||
                module === selectedModule;

            return matchesSearch && matchesModule;
        });

        if (!filtered.length) {
            showEmpty("No permissions found.");
            return;
        }

        tableBody.innerHTML = filtered
            .map(createPermissionRow)
            .join("");
    }

    function createPermissionRow(permission) {
        const id =
            permission.id ??
            permission.permission_id ??
            "";

        const name =
            permission.name ||
            permission.permission_name ||
            permission.permissionName ||
            "-";

        const description =
            permission.description ||
            "-";

        const module =
            permission.module ||
            permission.module_name ||
            permission.moduleName ||
            "-";

        const createdAt =
            permission.created_at ||
            permission.createdAt ||
            "";

        return `
            <tr>
                <td>${escapeHtml(name)}</td>

                <td>${escapeHtml(description)}</td>

                <td>
                    <span class="module-badge">
                        ${escapeHtml(module)}
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
                            data-action="edit-permission"
                            data-id="${escapeAttribute(id)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            data-action="delete-permission"
                            data-id="${escapeAttribute(id)}"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function populateModuleFilter() {
        const { moduleFilter } = getElements();

        if (!moduleFilter) {
            return;
        }

        const currentValue = moduleFilter.value;

        const modules = [
            ...new Set(
                permissions
                    .map(
                        (permission) =>
                            permission.module ||
                            permission.module_name ||
                            permission.moduleName ||
                            ""
                    )
                    .map((module) => String(module).trim())
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b));

        moduleFilter.innerHTML = `
            <option value="">All Modules</option>
            ${modules
                .map(
                    (module) => `
                        <option value="${escapeAttribute(
                            module.toLowerCase()
                        )}">
                            ${escapeHtml(module)}
                        </option>
                    `
                )
                .join("")}
        `;

        moduleFilter.value = currentValue;
    }

    function addPermission() {
        const page = document.querySelector(
            "[data-permission-form]"
        );

        if (page) {
            page.scrollIntoView({
                behavior: "smooth"
            });
            return;
        }

        showMessage(
            "Permission creation form is not available on this page.",
            "error"
        );
    }

    function editPermission(id) {
        const permission = permissions.find(
            (item) =>
                String(
                    item.id ??
                    item.permission_id
                ) === String(id)
        );

        if (!permission) {
            return;
        }

        const form = document.querySelector(
            "#permissionForm"
        );

        if (!form) {
            showMessage(
                "Permission editing form is not available on this page.",
                "error"
            );
            return;
        }

        form.dataset.editingId = id;

        setFormValue(
            form,
            "#name",
            permission.name ||
            permission.permission_name ||
            permission.permissionName
        );

        setFormValue(
            form,
            "#description",
            permission.description
        );

        setFormValue(
            form,
            "#module",
            permission.module ||
            permission.module_name ||
            permission.moduleName
        );

        const submitButton =
            form.querySelector(
                "button[type='submit']"
            );

        if (submitButton) {
            submitButton.textContent =
                "Update Permission";
        }

        form.scrollIntoView({
            behavior: "smooth"
        });
    }

    async function deletePermission(id) {
        const permission = permissions.find(
            (item) =>
                String(
                    item.id ??
                    item.permission_id
                ) === String(id)
        );

        const name =
            permission?.name ||
            permission?.permission_name ||
            permission?.permissionName ||
            "this permission";

        if (
            !window.confirm(
                `Are you sure you want to delete "${name}"?`
            )
        ) {
            return;
        }

        try {
            await apiRequest(
                `/permissions/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            showMessage(
                "Permission deleted successfully.",
                "success"
            );

            await loadPermissions();
        } catch (error) {
            console.error(
                "Delete permission error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to delete permission.",
                "error"
            );
        }
    }

    function setFormValue(form, selector, value) {
        const element = form.querySelector(selector);

        if (element) {
            element.value = value ?? "";
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
                    colspan="5"
                    style="text-align:center;padding:30px;"
                >
                    Loading permissions...
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
                    colspan="5"
                    style="text-align:center;padding:30px;"
                >
                    ${escapeHtml(text)}
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
            return "-";
        }

        return date.toLocaleDateString("en-NG", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
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
            moduleFilter
        } = getElements();

        if (searchInput) {
            searchInput.addEventListener(
                "input",
                renderPermissions
            );
        }

        if (moduleFilter) {
            moduleFilter.addEventListener(
                "change",
                renderPermissions
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

                if (
                    action ===
                    "edit-permission"
                ) {
                    editPermission(id);
                }

                if (
                    action ===
                    "delete-permission"
                ) {
                    await deletePermission(id);
                }
            }
        );
    }

    window.loadPermissions = loadPermissions;
    window.addPermission = addPermission;
    window.editPermission = editPermission;
    window.deletePermission = deletePermission;

    window.PermissionsPage = {
        initialize: loadPermissions,
        loadPermissions,
        addPermission,
        editPermission,
        deletePermission
    };

    function initialize() {
        setupEvents();
        loadPermissions();
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