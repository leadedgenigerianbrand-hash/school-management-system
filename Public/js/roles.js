"use strict";

(function () {
let roles = [];
let selectedRoleId = null;
let availablePermissions = [];
let eventsInitialized = false;

```
function getElements() {
    return {
        tableBody:
            document.getElementById("rolesTableBody") ||
            document.querySelector("#rolesTable tbody"),

        searchInput:
            document.getElementById("searchInput"),

        message:
            document.getElementById("message"),

        roleCount:
            document.getElementById("roleCount"),

        refreshButton:
            document.getElementById("refreshRolesButton"),

        createButton:
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

        cancelRoleButton:
            document.getElementById("cancelRoleButton"),

        permissionsModal:
            document.getElementById("permissionsModal"),

        permissionsTitle:
            document.getElementById("permissionsTitle"),

        permissionsList:
            document.getElementById("permissionsList"),

        saveRolePermissionsButton:
            document.getElementById(
                "saveRolePermissionsButton"
            ),

        cancelPermissionsButton:
            document.getElementById(
                "cancelPermissionsButton"
            )
    };
}

function showMessage(
    text,
    type = "success"
) {
    const { message } = getElements();

    if (!message) {
        return;
    }

    message.textContent = text;
    message.className =
        `message ${type}`;

    window.clearTimeout(
        showMessage.timeout
    );

    showMessage.timeout =
        window.setTimeout(() => {
            message.textContent = "";
            message.className = "message";
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

function normalizeRole(role) {
    return {
        id:
            role?.id ??
            role?.role_id ??
            null,

        role_name:
            role?.role_name ??
            role?.roleName ??
            role?.name ??
            "",

        description:
            role?.description ??
            "",

        permissions_count:
            role?.permissions_count ??
            role?.permission_count ??
            role?.permissionsCount ??
            null,

        created_at:
            role?.created_at ??
            role?.createdAt ??
            null
    };
}

function extractArray(result, propertyNames = []) {
    if (Array.isArray(result)) {
        return result;
    }

    if (
        result &&
        Array.isArray(result.data)
    ) {
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

async function apiRequest(
    endpoint,
    options = {}
) {
    if (
        typeof window.apiRequest ===
        "function"
    ) {
        return window.apiRequest(
            endpoint,
            options
        );
    }

    throw new Error(
        "The central API service is not available."
    );
}

async function loadRoles() {
    const {
        tableBody
    } = getElements();

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:30px;">
                    Loading roles...
                </td>
            </tr>
        `;
    }

    try {
        const result =
            await apiRequest("/roles");

        roles = extractArray(
            result,
            ["roles", "records"]
        ).map(normalizeRole);

        renderRoles();
        updateRoleCount();
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

        showMessage(
            error.message ||
            "Unable to load roles.",
            "error"
        );
    }
}

function updateRoleCount() {
    const {
        roleCount
    } = getElements();

    if (!roleCount) {
        return;
    }

    roleCount.textContent =
        String(roles.length);
}

function getFilteredRoles() {
    const {
        searchInput
    } = getElements();

    const searchTerm =
        searchInput?.value
            .trim()
            .toLowerCase() || "";

    if (!searchTerm) {
        return roles;
    }

    return roles.filter((role) => {
        const name =
            String(
                role.role_name || ""
            ).toLowerCase();

        const description =
            String(
                role.description || ""
            ).toLowerCase();

        return (
            name.includes(searchTerm) ||
            description.includes(searchTerm)
        );
    });
}

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
                : "No roles found."
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

    const name =
        role.role_name || "-";

    const description =
        role.description || "-";

    const permissionsCount =
        role.permissions_count;

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
                    permissionsCount !== null &&
                    permissionsCount !== undefined
                        ? escapeHtml(
                            permissionsCount
                        )
                        : "-"
                }
            </td>

            <td>
                ${formatDate(
                    role.created_at
                )}
            </td>

            <td>
                <div class="action-buttons">
                    <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        data-action="manage-permissions"
                        data-id="${escapeHtml(id)}"
                    >
                        Permissions
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-secondary"
                        data-action="edit-role"
                        data-id="${escapeHtml(id)}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        data-action="delete-role"
                        data-id="${escapeHtml(id)}"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function showLoadingPermissions() {
    const {
        permissionsList
    } = getElements();

    if (!permissionsList) {
        return;
    }

    permissionsList.innerHTML = `
        <div style="text-align:center;padding:25px;">
            Loading permissions...
        </div>
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
            <td colspan="6" style="text-align:center;padding:30px;">
                ${escapeHtml(text)}
            </td>
        </tr>
    `;
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

    if (roleForm) {
        roleForm.reset();
    }

    if (roleId) {
        roleId.value =
            role?.id ?? "";
    }

    if (roleName) {
        roleName.value =
            role?.role_name ?? "";
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

    roleModal.classList.add(
        "show"
    );

    roleModal.setAttribute(
        "aria-hidden",
        "false"
    );

    if (roleName) {
        window.setTimeout(
            () => roleName.focus(),
            50
        );
    }
}

function closeRoleModal() {
    const {
        roleModal,
        roleForm
    } = getElements();

    if (roleForm) {
        roleForm.reset();
    }

    if (roleModal) {
        roleModal.classList.remove(
            "show"
        );

        roleModal.setAttribute(
            "aria-hidden",
            "true"
        );
    }
}

async function saveRole(event) {
    if (event) {
        event.preventDefault();
    }

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

    const payload = {
        role_name: name,
        description
    };

    const isEditing =
        Boolean(id);

    if (saveRoleButton) {
        saveRoleButton.disabled = true;
        saveRoleButton.textContent =
            isEditing
                ? "Updating..."
                : "Creating...";
    }

    try {
        await apiRequest(
            isEditing
                ? `/roles/${encodeURIComponent(id)}`
                : "/roles",
            {
                method:
                    isEditing
                        ? "PUT"
                        : "POST",
                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

        showMessage(
            isEditing
                ? "Role updated successfully."
                : "Role created successfully.",
            "success"
        );

        closeRoleModal();

        await loadRoles();
    } catch (error) {
        console.error(
            "Save role error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to save role.",
            "error"
        );
    } finally {
        if (saveRoleButton) {
            saveRoleButton.disabled =
                false;

            saveRoleButton.textContent =
                "Save Role";
        }
    }
}

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

    const roleName =
        role.role_name ||
        "this role";

    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${roleName}"?`
        );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(
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

async function loadPermissionsForRole(
    roleId
) {
    showLoadingPermissions();

    try {
        const result =
            await apiRequest(
                `/roles/${encodeURIComponent(
                    roleId
                )}/permissions`
            );

        const permissions =
            extractArray(
                result,
                [
                    "permissions",
                    "records"
                ]
            );

        availablePermissions =
            permissions.map(
                normalizePermission
            );

        renderPermissions();
    } catch (error) {
        console.error(
            "Load role permissions error:",
            error
        );

        availablePermissions = [];

        const {
            permissionsList
        } = getElements();

        if (permissionsList) {
            permissionsList.innerHTML = `
                <div style="text-align:center;padding:25px;">
                    Unable to load permissions.
                </div>
            `;
        }

        showMessage(
            error.message ||
            "Unable to load role permissions.",
            "error"
        );
    }
}

function normalizePermission(
    permission
) {
    return {
        id:
            permission?.id ??
            permission?.permission_id ??
            null,

        permission_name:
            permission?.permission_name ??
            permission?.permissionName ??
            permission?.name ??
            "",

        description:
            permission?.description ??
            "",

        assigned:
            Boolean(
                permission?.assigned ??
                permission?.is_assigned ??
                permission?.has_permission ??
                false
            )
    };
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
            <div style="text-align:center;padding:25px;">
                No permissions available.
            </div>
        `;

        return;
    }

    permissionsList.innerHTML =
        availablePermissions
            .map(
                (permission) => `
                    <label
                        class="permission-item"
                        style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #e5e7eb;cursor:pointer;"
                    >
                        <input
                            type="checkbox"
                            class="role-permission-checkbox"
                            value="${escapeHtml(
                                permission.id
                            )}"
                            ${
                                permission.assigned
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            <strong>
                                ${escapeHtml(
                                    permission.permission_name
                                )}
                            </strong>

                            ${
                                permission.description
                                    ? `
                                        <small style="display:block;margin-top:3px;">
                                            ${escapeHtml(
                                                permission.description
                                            )}
                                        </small>
                                    `
                                    : ""
                            }
                        </span>
                    </label>
                `
            )
            .join("");
}

async function openPermissionsModal(
    roleId
) {
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
        permissionsTitle,
        permissionsList
    } = getElements();

    selectedRoleId =
        roleId;

    if (permissionsTitle) {
        permissionsTitle.textContent =
            `Permissions — ${role.role_name}`;
    }

    if (permissionsList) {
        permissionsList.innerHTML = "";
    }

    if (permissionsModal) {
        permissionsModal.classList.add(
            "show"
        );

        permissionsModal.setAttribute(
            "aria-hidden",
            "false"
        );
    }

    await loadPermissionsForRole(
        roleId
    );
}

function closePermissionsModal() {
    const {
        permissionsModal,
        permissionsList
    } = getElements();

    selectedRoleId = null;
    availablePermissions = [];

    if (permissionsList) {
        permissionsList.innerHTML = "";
    }

    if (permissionsModal) {
        permissionsModal.classList.remove(
            "show"
        );

        permissionsModal.setAttribute(
            "aria-hidden",
            "true"
        );
    }
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
        saveRolePermissionsButton,
        permissionsList
    } = getElements();

    const selectedPermissions =
        permissionsList
            ? Array.from(
                permissionsList.querySelectorAll(
                    ".role-permission-checkbox:checked"
                )
            ).map(
                (checkbox) =>
                    checkbox.value
            )
            : [];

    if (saveRolePermissionsButton) {
        saveRolePermissionsButton.disabled =
            true;

        saveRolePermissionsButton.textContent =
            "Saving...";
    }

    try {
        await apiRequest(
            `/roles/${encodeURIComponent(
                selectedRoleId
            )}/permissions`,
            {
                method: "PUT",
                body:
                    JSON.stringify({
                        permissionIds:
                            selectedPermissions
                    })
            }
        );

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

        showMessage(
            error.message ||
            "Unable to update role permissions.",
            "error"
        );
    } finally {
        if (saveRolePermissionsButton) {
            saveRolePermissionsButton.disabled =
                false;

            saveRolePermissionsButton.textContent =
                "Save Permissions";
        }
    }
}

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
        cancelRoleButton,
        cancelPermissionsButton,
        saveRolePermissionsButton
    } = getElements();

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderRoles
        );
    }

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadRoles
        );
    }

    if (createButton) {
        createButton.addEventListener(
            "click",
            () => openRoleModal()
        );
    }

    if (roleForm) {
        roleForm.addEventListener(
            "submit",
            saveRole
        );
    }

    if (cancelRoleButton) {
        cancelRoleButton.addEventListener(
            "click",
            closeRoleModal
        );
    }

    if (cancelPermissionsButton) {
        cancelPermissionsButton.addEventListener(
            "click",
            closePermissionsModal
        );
    }

    if (saveRolePermissionsButton) {
        saveRolePermissionsButton.addEventListener(
            "click",
            saveRolePermissions
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
            }
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key !==
                "Escape"
            ) {
                return;
            }

            closeRoleModal();
            closePermissionsModal();
        }
    );

    document.addEventListener(
        "click",
        (event) => {
            const {
                roleModal,
                permissionsModal
            } = getElements();

            if (
                roleModal &&
                event.target ===
                    roleModal
            ) {
                closeRoleModal();
            }

            if (
                permissionsModal &&
                event.target ===
                    permissionsModal
            ) {
                closePermissionsModal();
            }
        }
    );
}

function initialize() {
    setupEvents();
    loadRoles();
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
    saveRolePermissions
};

window.loadRoles =
    loadRoles;

window.addRole =
    () => openRoleModal();

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
