"use strict";

(function () {
    let roles = [];
    let selectedRoleId = null;
    let selectedRolePermissions = [];
    let availablePermissions = [];
    let eventsInitialized = false;
    let searchTimer = null;

    const API_BASE = "/api";

    /* ==========================================================================
       AUTHENTICATION
    ========================================================================== */

    function getToken() {
        if (
            window.Auth &&
            typeof window.Auth.getStoredToken === "function"
        ) {
            return window.Auth.getStoredToken();
        }

        return (
            localStorage.getItem("school_management_token") ||
            sessionStorage.getItem("school_management_token") ||
            ""
        );
    }

    function redirectToLogin() {
        window.location.replace("/pages/login.html");
    }

    /* ==========================================================================
       ELEMENTS
    ========================================================================== */

    function getElements() {
        return {
            sidebar: document.getElementById("smsSidebar"),
            sidebarToggle: document.getElementById("sidebarToggle"),
            sidebarOverlay: document.getElementById("sidebarOverlay"),

            tableBody:
                document.getElementById("rolesTableBody") ||
                document.getElementById("rolesTable") ||
                document.querySelector("#rolesTable tbody"),

            searchInput: document.getElementById("searchInput"),

            message: document.getElementById("message"),

            roleCount: document.getElementById("roleCount"),

            totalPermissions:
                document.getElementById("totalPermissions"),

            rolesWithUsers:
                document.getElementById("rolesWithUsers"),

            assignedUsers:
                document.getElementById("assignedUsers"),

            refreshButton:
                document.getElementById("refreshRolesButton"),

            createButton:
                document.getElementById("addRoleButton") ||
                document.getElementById("openCreateRoleButton"),

            roleModal:
                document.getElementById("roleModal"),

            roleForm:
                document.getElementById("roleForm"),

            roleId:
                document.getElementById("roleId"),

            roleName:
                document.getElementById("roleName"),

            roleDescription:
                document.getElementById("roleDescription"),

            modalTitle:
                document.getElementById("modalTitle"),

            saveRoleButton:
                document.getElementById("saveRoleButton"),

            permissionsModal:
                document.getElementById("permissionsModal"),

            permissionsTitle:
                document.getElementById("permissionsTitle"),

            permissionsList:
                document.getElementById("permissionsList"),

            saveRolePermissionsButton:
                document.getElementById("saveRolePermissionsButton"),

            usersModal:
                document.getElementById("usersModal"),

            usersModalTitle:
                document.getElementById("usersModalTitle"),

            usersList:
                document.getElementById("usersList")
        };
    }

    /* ==========================================================================
       GENERAL HELPERS
    ========================================================================== */

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

    function showMessage(text, type = "success") {
        const { message } = getElements();

        if (!message) {
            return;
        }

        message.className = `alert ${
            type === "error"
                ? "alert-danger"
                : type === "warning"
                    ? "alert-warning"
                    : "alert-success"
        } alert-dismissible fade show`;

        message.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <i class="bi ${
                    type === "error"
                        ? "bi-exclamation-triangle-fill"
                        : type === "warning"
                            ? "bi-exclamation-circle-fill"
                            : "bi-check-circle-fill"
                }"></i>

                <span>${escapeHtml(text)}</span>

                <button
                    type="button"
                    class="btn-close ms-auto"
                    data-bs-dismiss="alert"
                    aria-label="Close">
                </button>
            </div>
        `;

        window.clearTimeout(showMessage.timeout);

        showMessage.timeout = window.setTimeout(() => {
            const alert = document.getElementById("message");

            if (alert) {
                const instance =
                    bootstrap.Alert.getOrCreateInstance(alert);

                instance.close();
            }
        }, 4500);
    }

    function extractArray(result, propertyNames = []) {
        if (Array.isArray(result)) {
            return result;
        }

        if (result && Array.isArray(result.data)) {
            return result.data;
        }

        for (const propertyName of propertyNames) {
            if (
                result &&
                Array.isArray(result[propertyName])
            ) {
                return result[propertyName];
            }
        }

        return [];
    }

    function normalizeRole(role) {
        return {
            id:
                role?.id ??
                role?.role_id ??
                null,

            roleName:
                role?.roleName ??
                role?.role_name ??
                role?.name ??
                "",

            description:
                role?.description ??
                "",

            permissionCount:
                Number(
                    role?.permissionCount ??
                    role?.permission_count ??
                    role?.permissions_count ??
                    role?.permissionsCount ??
                    0
                ),

            userCount:
                Number(
                    role?.userCount ??
                    role?.user_count ??
                    role?.users_count ??
                    role?.usersCount ??
                    0
                ),

            createdAt:
                role?.createdAt ??
                role?.created_at ??
                null
        };
    }

    function normalizePermission(permission) {
        const permissionName =
            permission?.permission_name ??
            permission?.permissionName ??
            permission?.name ??
            "";

        return {
            id:
                permission?.id ??
                permission?.permission_id ??
                null,

            permissionName,

            description:
                permission?.description ??
                "",

            assigned:
                Boolean(
                    permission?.assigned ??
                    permission?.is_assigned ??
                    permission?.has_permission ??
                    false
                ),

            module:
                permissionName.includes(".")
                    ? permissionName.split(".")[0]
                    : "General"
        };
    }

    function normalizeUser(user) {
        const constructedName = [
            user?.first_name,
            user?.middle_name,
            user?.last_name
        ]
            .filter(Boolean)
            .join(" ");

        return {
            id:
                user?.id ??
                user?.user_id ??
                null,

            name:
                user?.name ??
                user?.full_name ??
                constructedName ??
                "",

            email:
                user?.email ??
                "",

            username:
                user?.username ??
                "",

            isActive:
                user?.is_active ??
                user?.isActive ??
                true
        };
    }

    /* ==========================================================================
       API
    ========================================================================== */

    async function request(endpoint, options = {}) {
        const token = getToken();

        if (!token) {
            redirectToLogin();
            throw new Error("Your session has expired.");
        }

        if (typeof window.apiRequest === "function") {
            return window.apiRequest(endpoint, options);
        }

        const headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        };

        const response = await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,
                headers,
                credentials: "include"
            }
        );

        if (response.status === 401) {
            if (
                window.Auth &&
                typeof window.Auth.clearAuthentication === "function"
            ) {
                window.Auth.clearAuthentication();
            }

            redirectToLogin();

            throw new Error("Your session has expired.");
        }

        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                data?.error ||
                `Request failed with status ${response.status}.`
            );
        }

        return data;
    }

    /* ==========================================================================
       SIDEBAR
    ========================================================================== */

    function openSidebar() {
        const {
            sidebar,
            sidebarOverlay
        } = getElements();

        sidebar?.classList.add("show");
        sidebarOverlay?.classList.add("show");
        document.body.classList.add("sidebar-open");
    }

    function closeSidebar() {
        const {
            sidebar,
            sidebarOverlay
        } = getElements();

        sidebar?.classList.remove("show");
        sidebarOverlay?.classList.remove("show");
        document.body.classList.remove("sidebar-open");
    }

    function setupSidebar() {
        const {
            sidebarToggle,
            sidebarOverlay
        } = getElements();

        sidebarToggle?.addEventListener(
            "click",
            openSidebar
        );

        sidebarOverlay?.addEventListener(
            "click",
            closeSidebar
        );

        document.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    closeSidebar();
                }
            }
        );

        document
            .querySelectorAll("[data-dashboard-link]")
            .forEach((link) => {
                link.addEventListener(
                    "click",
                    closeSidebar
                );
            });
    }

    /* ==========================================================================
       ROLE SUMMARY
    ========================================================================== */

    async function loadRoleSummary() {
        try {
            const result =
                await request("/roles/summary");

            const records =
                extractArray(
                    result,
                    ["summary", "roles", "records"]
                );

            const normalized =
                records.map(normalizeRole);

            const totalPermissions =
                normalized.reduce(
                    (total, role) =>
                        total +
                        role.permissionCount,
                    0
                );

            const rolesWithUsers =
                normalized.filter(
                    (role) =>
                        role.userCount > 0
                ).length;

            const assignedUsers =
                normalized.reduce(
                    (total, role) =>
                        total +
                        role.userCount,
                    0
                );

            const {
                totalPermissions: totalPermissionsElement,
                rolesWithUsers: rolesWithUsersElement,
                assignedUsers: assignedUsersElement
            } = getElements();

            if (totalPermissionsElement) {
                totalPermissionsElement.textContent =
                    totalPermissions;
            }

            if (rolesWithUsersElement) {
                rolesWithUsersElement.textContent =
                    rolesWithUsers;
            }

            if (assignedUsersElement) {
                assignedUsersElement.textContent =
                    assignedUsers;
            }
        } catch (error) {
            console.warn(
                "Role summary could not be loaded:",
                error
            );

            updateSummaryFromRoles();
        }
    }

    function updateSummaryFromRoles() {
        const totalPermissions =
            roles.reduce(
                (total, role) =>
                    total +
                    Number(role.permissionCount || 0),
                0
            );

        const rolesWithUsers =
            roles.filter(
                (role) =>
                    Number(role.userCount || 0) > 0
            ).length;

        const assignedUsers =
            roles.reduce(
                (total, role) =>
                    total +
                    Number(role.userCount || 0),
                0
            );

        const {
            totalPermissions: totalPermissionsElement,
            rolesWithUsers: rolesWithUsersElement,
            assignedUsers: assignedUsersElement
        } = getElements();

        if (totalPermissionsElement) {
            totalPermissionsElement.textContent =
                totalPermissions;
        }

        if (rolesWithUsersElement) {
            rolesWithUsersElement.textContent =
                rolesWithUsers;
        }

        if (assignedUsersElement) {
            assignedUsersElement.textContent =
                assignedUsers;
        }
    }

    /* ==========================================================================
       LOAD ROLES
    ========================================================================== */

    async function loadRoles() {
        const {
            tableBody,
            refreshButton
        } = getElements();

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading">
                        <div class="d-flex justify-content-center align-items-center gap-2">
                            <div
                                class="spinner-border spinner-border-sm text-primary"
                                role="status"
                                aria-hidden="true">
                            </div>

                            <span>Loading roles...</span>
                        </div>
                    </td>
                </tr>
            `;
        }

        if (refreshButton) {
            refreshButton.disabled = true;
        }

        try {
            const result =
                await request("/roles");

            roles =
                extractArray(
                    result,
                    ["roles", "records"]
                ).map(normalizeRole);

            renderRoles();
            updateRoleCount();
            updateSummaryFromRoles();

            await loadRoleSummary();
        } catch (error) {
            console.error(
                "Load roles error:",
                error
            );

            roles = [];

            showEmpty(
                "Unable to load roles."
            );

            updateRoleCount();
            updateSummaryFromRoles();

            if (
                error?.message !==
                "Your session has expired."
            ) {
                showMessage(
                    error.message ||
                    "Unable to load roles.",
                    "error"
                );
            }
        } finally {
            if (refreshButton) {
                refreshButton.disabled = false;
            }
        }
    }

    function updateRoleCount() {
        const {
            roleCount
        } = getElements();

        if (!roleCount) {
            return;
        }

        const count =
            roles.length;

        roleCount.textContent =
            `${count} ${count === 1 ? "role" : "roles"}`;
    }

    /* ==========================================================================
       SEARCH
    ========================================================================== */

    function getFilteredRoles() {
        const {
            searchInput
        } = getElements();

        const term =
            searchInput?.value
                .trim()
                .toLowerCase() || "";

        if (!term) {
            return roles;
        }

        return roles.filter((role) => {
            return (
                role.roleName
                    .toLowerCase()
                    .includes(term) ||
                role.description
                    .toLowerCase()
                    .includes(term)
            );
        });
    }

    /* ==========================================================================
       ROLE TABLE
    ========================================================================== */

    function renderRoles() {
        const {
            tableBody
        } = getElements();

        if (!tableBody) {
            return;
        }

        const filteredRoles =
            getFilteredRoles();

        if (!filteredRoles.length) {
            showEmpty(
                roles.length
                    ? "No roles match your search."
                    : "No roles have been created yet."
            );

            return;
        }

        tableBody.innerHTML =
            filteredRoles
                .map(createRoleRow)
                .join("");
    }

    function createRoleRow(role) {
        const id =
            role.id ?? "";

        return `
            <tr>
                <td>
                    <span class="role-id">
                        ${escapeHtml(id)}
                    </span>
                </td>

                <td>
                    <div class="role-name">
                        ${escapeHtml(
                            role.roleName || "-"
                        )}
                    </div>
                </td>

                <td>
                    <div class="description">
                        ${escapeHtml(
                            role.description || "-"
                        )}
                    </div>
                </td>

                <td>
                    <span class="count-badge">
                        <i class="bi bi-key-fill"></i>
                        ${escapeHtml(
                            role.permissionCount
                        )}
                    </span>
                </td>

                <td>
                    <span class="count-badge">
                        <i class="bi bi-people-fill"></i>
                        ${escapeHtml(
                            role.userCount
                        )}
                    </span>
                </td>

                <td>
                    ${formatDate(role.createdAt)}
                </td>

                <td>
                    <div class="action-buttons">

                        <button
                            type="button"
                            class="btn btn-sm btn-primary"
                            data-action="manage-permissions"
                            data-id="${escapeHtml(id)}"
                            title="Manage permissions">

                            <i class="bi bi-key-fill"></i>

                            <span class="d-inline">
    Permissions
</span>
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            data-action="view-users"
                            data-id="${escapeHtml(id)}"
                            title="View users">

                            <i class="bi bi-people-fill"></i>

                            <span class="d-none d-xl-inline">
                                Users
                            </span>
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-dark"
                            data-action="edit-role"
                            data-id="${escapeHtml(id)}"
                            title="Edit role">

                            <i class="bi bi-pencil-fill"></i>

                            <span class="d-none d-xl-inline">
                                Edit
                            </span>
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            data-action="delete-role"
                            data-id="${escapeHtml(id)}"
                            title="Delete role">

                            <i class="bi bi-trash-fill"></i>

                            <span class="d-none d-xl-inline">
                                Delete
                            </span>
                        </button>

                    </div>
                </td>
            </tr>
        `;
    }

    function showEmpty(text) {
        const {
            tableBody
        } = getElements();

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    <div class="empty-icon">
                        <i class="bi bi-shield-lock"></i>
                    </div>

                    <div class="fw-semibold mb-1">
                        ${escapeHtml(text)}
                    </div>

                    <div class="small text-muted">
                        Create a role or change your search criteria.
                    </div>
                </td>
            </tr>
        `;
    }

    /* ==========================================================================
       ROLE MODAL
    ========================================================================== */

    function getBootstrapModal(element) {
        if (
            !element ||
            typeof bootstrap === "undefined"
        ) {
            return null;
        }

        return bootstrap.Modal.getOrCreateInstance(
            element
        );
    }

    function openRoleModal(role = null) {
        const {
            roleModal,
            roleForm,
            roleId,
            roleName,
            roleDescription,
            modalTitle
        } = getElements();

        if (!roleModal) {
            return;
        }

        roleForm?.reset();

        if (roleId) {
            roleId.value =
                role?.id ?? "";
        }

        if (roleName) {
            roleName.value =
                role?.roleName ?? "";
        }

        if (roleDescription) {
            roleDescription.value =
                role?.description ?? "";
        }

        if (modalTitle) {
            modalTitle.textContent =
                role
                    ? "Edit Role"
                    : "Create Role";
        }

        getBootstrapModal(
            roleModal
        )?.show();

        window.setTimeout(() => {
            roleName?.focus();
        }, 300);
    }

    function closeRoleModal() {
        const {
            roleModal,
            roleForm
        } = getElements();

        roleForm?.reset();

        getBootstrapModal(
            roleModal
        )?.hide();
    }

    /* ==========================================================================
       SAVE ROLE
    ========================================================================== */

    async function saveRole(event) {
        event?.preventDefault();

        const {
            roleId,
            roleName,
            roleDescription,
            saveRoleButton
        } = getElements();

        const name =
            roleName?.value.trim() || "";

        const description =
            roleDescription?.value.trim() || "";

        if (!name) {
            showMessage(
                "Role name is required.",
                "error"
            );

            roleName?.focus();

            return;
        }

        const id =
            roleId?.value.trim() || "";

        const isEditing =
            Boolean(id);

        const payload = {
            roleName: name,
            description
        };

        if (saveRoleButton) {
            saveRoleButton.disabled = true;

            saveRoleButton.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm me-1"
                    aria-hidden="true">
                </span>

                ${isEditing ? "Updating..." : "Creating..."}
            `;
        }

        try {
            await request(
                isEditing
                    ? `/roles/${encodeURIComponent(id)}`
                    : "/roles",
                {
                    method:
                        isEditing
                            ? "PUT"
                            : "POST",

                    body:
                        JSON.stringify(payload)
                }
            );

            closeRoleModal();

            showMessage(
                isEditing
                    ? "Role updated successfully."
                    : "Role created successfully.",
                "success"
            );

            await loadRoles();
        } catch (error) {
            console.error(
                "Save role error:",
                error
            );

            if (
                error?.message !==
                "Your session has expired."
            ) {
                showMessage(
                    error.message ||
                    "Unable to save role.",
                    "error"
                );
            }
        } finally {
            if (saveRoleButton) {
                saveRoleButton.disabled = false;

                saveRoleButton.innerHTML = `
                    <i class="bi bi-check-lg"></i>
                    Save Role
                `;
            }
        }
    }

    /* ==========================================================================
       EDIT / DELETE
    ========================================================================== */

    function findRole(id) {
        return roles.find(
            (role) =>
                String(role.id) ===
                String(id)
        );
    }

    function editRole(id) {
        const role =
            findRole(id);

        if (!role) {
            showMessage(
                "The selected role could not be found.",
                "error"
            );

            return;
        }

        openRoleModal(role);
    }

    async function deleteRole(id) {
        const role =
            findRole(id);

        if (!role) {
            showMessage(
                "The selected role could not be found.",
                "error"
            );

            return;
        }

        const name =
            role.roleName ||
            "this role";

        if (role.userCount > 0) {
            showMessage(
                `"${name}" cannot be deleted because it has ${role.userCount} assigned user(s).`,
                "warning"
            );

            return;
        }

        if (role.permissionCount > 0) {
            showMessage(
                `"${name}" cannot be deleted while permissions are assigned to it.`,
                "warning"
            );

            return;
        }

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${name}"?`
            );

        if (!confirmed) {
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

            if (
                error?.message !==
                "Your session has expired."
            ) {
                showMessage(
                    error.message ||
                    "Unable to delete role.",
                    "error"
                );
            }
        }
    }

    /* ==========================================================================
       PERMISSIONS
    ========================================================================== */

    async function loadAllPermissions() {
        const result =
            await request("/permissions");

        return extractArray(
            result,
            ["permissions", "records"]
        ).map(normalizePermission);
    }

    async function loadAssignedPermissions(roleId) {
        const result =
            await request(
                `/roles/${encodeURIComponent(
                    roleId
                )}/permissions`
            );

        return extractArray(
            result,
            ["permissions", "records"]
        ).map(normalizePermission);
    }

    function showLoadingPermissions() {
        const {
            permissionsList
        } = getElements();

        if (!permissionsList) {
            return;
        }

        permissionsList.innerHTML = `
            <div class="permission-loading">
                <div
                    class="spinner-border spinner-border-sm text-primary"
                    role="status"
                    aria-hidden="true">
                </div>

                <span>Loading permissions...</span>
            </div>
        `;
    }

    function groupPermissionsByModule(permissions) {
        const groups = {};

        permissions.forEach((permission) => {
            const module =
                permission.module ||
                "General";

            if (!groups[module]) {
                groups[module] = [];
            }

            groups[module].push(permission);
        });

        return groups;
    }

    function renderPermissions() {
        const {
            permissionsList
        } = getElements();

        if (!permissionsList) {
            return;
        }

        if (!availablePermissions.length) {
            permissionsList.innerHTML = `
                <div class="permission-empty">
                    <i class="bi bi-key"></i>

                    <div class="fw-semibold">
                        No permissions available
                    </div>

                    <div class="small text-muted mt-1">
                        Create permissions before assigning them to roles.
                    </div>
                </div>
            `;

            return;
        }

        const groups =
            groupPermissionsByModule(
                availablePermissions
            );

        const sortedModules =
            Object.keys(groups).sort(
                (a, b) =>
                    a.localeCompare(b)
            );

        permissionsList.innerHTML =
            sortedModules
                .map((module) => {
                    const modulePermissions =
                        groups[module].sort(
                            (a, b) =>
                                a.permissionName.localeCompare(
                                    b.permissionName
                                )
                        );

                    const moduleLabel =
                        module
                            .replace(/[-_]/g, " ")
                            .replace(
                                /\b\w/g,
                                (letter) =>
                                    letter.toUpperCase()
                            );

                    return `
                        <div class="permission-module-group">

                            <div class="permission-module-header">
                                <div>
                                    <i class="bi bi-folder2-open me-2"></i>
                                    ${escapeHtml(moduleLabel)}
                                </div>

                                <span class="badge text-bg-light border">
                                    ${modulePermissions.length}
                                </span>
                            </div>

                            <div class="permission-module-items">

                                ${modulePermissions
                                    .map(
                                        (permission) => `
                                            <label
                                                class="permission-item"
                                                for="permission-${escapeHtml(
                                                    permission.id
                                                )}"
                                            >
                                                <input
                                                    id="permission-${escapeHtml(
                                                        permission.id
                                                    )}"
                                                    type="checkbox"
                                                    class="form-check-input role-permission-checkbox"
                                                    value="${escapeHtml(
                                                        permission.id
                                                    )}"
                                                    ${
                                                        permission.assigned
                                                            ? "checked"
                                                            : ""
                                                    }
                                                >

                                                <span class="permission-content">

                                                    <span class="permission-name">
                                                        ${escapeHtml(
                                                            permission.permissionName
                                                        )}
                                                    </span>

                                                    ${
                                                        permission.description
                                                            ? `
                                                                <span class="permission-description">
                                                                    ${escapeHtml(
                                                                        permission.description
                                                                    )}
                                                                </span>
                                                            `
                                                            : ""
                                                    }

                                                </span>
                                            </label>
                                        `
                                    )
                                    .join("")}

                            </div>
                        </div>
                    `;
                })
                .join("");
    }

    async function openPermissionsModal(roleId) {
        const role =
            findRole(roleId);

        if (!role) {
            showMessage(
                "The selected role could not be found.",
                "error"
            );

            return;
        }

        const {
            permissionsModal,
            permissionsTitle
        } = getElements();

        selectedRoleId =
            roleId;

        if (permissionsTitle) {
            permissionsTitle.textContent =
                `Permissions — ${role.roleName}`;
        }

        showLoadingPermissions();

        getBootstrapModal(
            permissionsModal
        )?.show();

        try {
            const [
                allPermissions,
                assignedPermissions
            ] = await Promise.all([
                loadAllPermissions(),
                loadAssignedPermissions(roleId)
            ]);

            const assignedIds =
                new Set(
                    assignedPermissions
                        .map(
                            (permission) =>
                                String(
                                    permission.id
                                )
                        )
                );

            selectedRolePermissions =
                Array.from(assignedIds);

            availablePermissions =
                allPermissions.map(
                    (permission) => ({
                        ...permission,

                        assigned:
                            assignedIds.has(
                                String(
                                    permission.id
                                )
                            )
                    })
                );

            renderPermissions();
        } catch (error) {
            console.error(
                "Load permissions error:",
                error
            );

            availablePermissions = [];
            selectedRolePermissions = [];

            const {
                permissionsList
            } = getElements();

            if (permissionsList) {
                permissionsList.innerHTML = `
                    <div class="permission-empty text-danger">
                        <i class="bi bi-exclamation-triangle"></i>

                        <div class="fw-semibold">
                            Unable to load permissions
                        </div>

                        <div class="small mt-1">
                            ${escapeHtml(
                                error.message ||
                                "Please try again."
                            )}
                        </div>
                    </div>
                `;
            }

            if (
                error?.message !==
                "Your session has expired."
            ) {
                showMessage(
                    error.message ||
                    "Unable to load role permissions.",
                    "error"
                );
            }
        }
    }

    function closePermissionsModal() {
        const {
            permissionsModal
        } = getElements();

        selectedRoleId = null;
        selectedRolePermissions = [];
        availablePermissions = [];

        getBootstrapModal(
            permissionsModal
        )?.hide();
    }

    async function saveRolePermissions() {
        if (!selectedRoleId) {
            showMessage(
                "No role is selected.",
                "error"
            );

            return;
        }

        const {
            permissionsList,
            saveRolePermissionsButton
        } = getElements();

        const selectedIds =
            permissionsList
                ? Array.from(
                    permissionsList.querySelectorAll(
                        ".role-permission-checkbox:checked"
                    )
                ).map(
                    (checkbox) =>
                        String(
                            checkbox.value
                        )
                )
                : [];

        const originalIds =
            new Set(
                selectedRolePermissions.map(
                    (id) =>
                        String(id)
                )
            );

        const selectedSet =
            new Set(selectedIds);

        const permissionIdsToAdd =
            selectedIds.filter(
                (id) =>
                    !originalIds.has(id)
            );

        const permissionIdsToRemove =
            Array.from(originalIds).filter(
                (id) =>
                    !selectedSet.has(id)
            );

        if (saveRolePermissionsButton) {
            saveRolePermissionsButton.disabled =
                true;

            saveRolePermissionsButton.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm me-1"
                    aria-hidden="true">
                </span>

                Saving...
            `;
        }

        try {
            for (
                const permissionId
                of permissionIdsToAdd
            ) {
                await request(
                    `/roles/${encodeURIComponent(
                        selectedRoleId
                    )}/permissions`,
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                permissionId
                            })
                    }
                );
            }

            for (
                const permissionId
                of permissionIdsToRemove
            ) {
                await request(
                    `/roles/${encodeURIComponent(
                        selectedRoleId
                    )}/permissions/${encodeURIComponent(
                        permissionId
                    )}`,
                    {
                        method: "DELETE"
                    }
                );
            }

            showMessage(
                "Role permissions updated successfully.",
                "success"
            );

            closePermissionsModal();

            await loadRoles();
        } catch (error) {
            console.error(
                "Save role permissions error:",
                error
            );

            if (
                error?.message !==
                "Your session has expired."
            ) {
                showMessage(
                    error.message ||
                    "Unable to update role permissions.",
                    "error"
                );
            }
        } finally {
            if (saveRolePermissionsButton) {
                saveRolePermissionsButton.disabled =
                    false;

                saveRolePermissionsButton.innerHTML = `
                    <i class="bi bi-check-lg"></i>
                    Save Permissions
                `;
            }
        }
    }

    /* ==========================================================================
       ROLE USERS
    ========================================================================== */

    async function openUsersModal(roleId) {
        const role =
            findRole(roleId);

        if (!role) {
            showMessage(
                "The selected role could not be found.",
                "error"
            );

            return;
        }

        const {
            usersModal,
            usersModalTitle,
            usersList
        } = getElements();

        if (usersModalTitle) {
            usersModalTitle.textContent =
                `Users — ${role.roleName}`;
        }

        if (usersList) {
            usersList.innerHTML = `
                <div class="users-loading">
                    <div
                        class="spinner-border spinner-border-sm text-primary"
                        role="status"
                        aria-hidden="true">
                    </div>

                    <span>Loading users...</span>
                </div>
            `;
        }

        getBootstrapModal(
            usersModal
        )?.show();

        try {
            const result =
                await request(
                    `/roles/${encodeURIComponent(
                        roleId
                    )}/users`
                );

            const users =
                extractArray(
                    result,
                    ["users", "records"]
                ).map(normalizeUser);

            renderUsers(users);
        } catch (error) {
            console.error(
                "Load role users error:",
                error
            );

            if (usersList) {
                usersList.innerHTML = `
                    <div class="users-empty text-danger">
                        <i class="bi bi-exclamation-triangle"></i>

                        <div class="fw-semibold mt-2">
                            Unable to load users
                        </div>

                        <div class="small mt-1">
                            ${escapeHtml(
                                error.message ||
                                "Please try again."
                            )}
                        </div>
                    </div>
                `;
            }

            if (
                error?.message !==
                "Your session has expired."
            ) {
                showMessage(
                    error.message ||
                    "Unable to load role users.",
                    "error"
                );
            }
        }
    }

    function renderUsers(users) {
        const {
            usersList
        } = getElements();

        if (!usersList) {
            return;
        }

        if (!users.length) {
            usersList.innerHTML = `
                <div class="users-empty">
                    <i class="bi bi-people"></i>

                    <div class="fw-semibold mt-2">
                        No users assigned
                    </div>

                    <div class="small text-muted mt-1">
                        This role is not currently assigned to any users.
                    </div>
                </div>
            `;

            return;
        }

        usersList.innerHTML =
            users
                .map(
                    (user) => `
                        <div class="user-row">

                            <div class="user-avatar">
                                <i class="bi bi-person-fill"></i>
                            </div>

                            <div class="user-info">

                                <div class="fw-semibold">
                                    ${escapeHtml(
                                        user.name ||
                                        user.username ||
                                        "Unnamed User"
                                    )}
                                </div>

                                <div class="small text-muted">
                                    ${escapeHtml(
                                        user.email ||
                                        user.username ||
                                        "-"
                                    )}
                                </div>

                            </div>

                            <span class="badge ${
                                user.isActive
                                    ? "text-bg-success"
                                    : "text-bg-secondary"
                            }">
                                ${
                                    user.isActive
                                        ? "Active"
                                        : "Inactive"
                                }
                            </span>

                        </div>
                    `
                )
                .join("");
    }

    /* ==========================================================================
       EVENTS
    ========================================================================== */

    function setupEvents() {
        if (eventsInitialized) {
            return;
        }

        eventsInitialized = true;

        const {
            searchInput,
            refreshButton,
            createButton,
            roleForm,
            saveRolePermissionsButton
        } = getElements();

        setupSidebar();

        searchInput?.addEventListener(
            "input",
            () => {
                window.clearTimeout(
                    searchTimer
                );

                searchTimer =
                    window.setTimeout(
                        renderRoles,
                        150
                    );
            }
        );

        refreshButton?.addEventListener(
            "click",
            loadRoles
        );

        createButton?.addEventListener(
            "click",
            () =>
                openRoleModal()
        );

        roleForm?.addEventListener(
            "submit",
            saveRole
        );

        saveRolePermissionsButton?.addEventListener(
            "click",
            saveRolePermissions
        );

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
                    "edit-role"
                ) {
                    editRole(id);
                    return;
                }

                if (
                    action ===
                    "delete-role"
                ) {
                    await deleteRole(id);
                    return;
                }

                if (
                    action ===
                    "manage-permissions"
                ) {
                    await openPermissionsModal(
                        id
                    );
                    return;
                }

                if (
                    action ===
                    "view-users"
                ) {
                    await openUsersModal(
                        id
                    );
                }
            }
        );
    }

    /* ==========================================================================
       INITIALIZATION
    ========================================================================== */

    async function initialize() {
        setupEvents();

        await loadRoles();
    }

    window.RolesPage = {
        initialize,
        loadRoles,
        renderRoles,

        addRole: () =>
            openRoleModal(),

        editRole,
        deleteRole,

        openPermissionsModal,
        closePermissionsModal,
        saveRolePermissions,

        openUsersModal
    };

    window.loadRoles =
        loadRoles;

    window.addRole =
        () =>
            openRoleModal();

    window.editRole =
        editRole;

    window.deleteRole =
        deleteRole;

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