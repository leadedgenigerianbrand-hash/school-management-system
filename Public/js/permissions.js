"use strict";

(function () {
    let permissions = [];

    function getElements() {
        return {
            tableBody: document.getElementById("permissionsTableBody"),
            searchInput: document.getElementById("searchInput"),
            moduleFilter: document.getElementById("moduleFilter"),
            refreshButton: document.getElementById("refreshPermissionsButton"),
            count: document.getElementById("permissionCount"),
            message: document.getElementById("message"),
            openCreateButton: document.getElementById("openCreatePermissionButton"),
            modal: document.getElementById("permissionModal"),
            modalTitle: document.getElementById("modalTitle"),
            form: document.getElementById("permissionForm"),
            permissionId: document.getElementById("permissionId"),
            permissionName: document.getElementById("permissionName"),
            permissionDescription: document.getElementById("permissionDescription"),
            closeModalButton: document.getElementById("closePermissionModalButton"),
            cancelButton: document.getElementById("cancelPermissionButton"),
            saveButton: document.getElementById("savePermissionButton")
        };
    }

    function showMessage(text, type = "success") {
        const { message } = getElements();

        if (!message) {
            return;
        }

        message.textContent = text;
        message.className = `message ${type}`;

        window.setTimeout(() => {
            message.textContent = "";
            message.className = "message";
        }, 4000);
    }

    function getPermissionId(permission) {
        return permission?.id ?? "";
    }

    function getPermissionName(permission) {
        return permission?.permission_name ?? "";
    }

    function getPermissionDescription(permission) {
        return permission?.description ?? "";
    }

    function getPermissionModule(permission) {
        const permissionName = getPermissionName(permission);

        if (!permissionName) {
            return "";
        }

        const separatorIndex = permissionName.indexOf(".");

        if (separatorIndex === -1) {
            return permissionName;
        }

        return permissionName.substring(
            0,
            separatorIndex
        );
    }

    function getPermissionCreatedAt(permission) {
        return permission?.created_at ?? "";
    }

    async function loadPermissions() {
        const { tableBody } = getElements();

        showLoading();

        try {
            const result = await apiGet("/permissions");

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
            console.error(
                "Load permissions error:",
                error
            );

            permissions = [];

            if (tableBody) {
                showEmpty(
                    error.message ||
                    "Unable to load permissions."
                );
            }

            updateCount(0);

            showMessage(
                error.message ||
                "Unable to load permissions.",
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
            searchInput?.value
                .trim()
                .toLowerCase() || "";

        const selectedModule =
            moduleFilter?.value
                .trim()
                .toLowerCase() || "";

        const filteredPermissions =
            permissions.filter((permission) => {
                const name =
                    getPermissionName(permission)
                        .toLowerCase();

                const description =
                    getPermissionDescription(permission)
                        .toLowerCase();

                const module =
                    getPermissionModule(permission)
                        .toLowerCase();

                const matchesSearch =
                    !searchTerm ||
                    name.includes(searchTerm) ||
                    description.includes(searchTerm) ||
                    module.includes(searchTerm);

                const matchesModule =
                    !selectedModule ||
                    module === selectedModule;

                return (
                    matchesSearch &&
                    matchesModule
                );
            });

        updateCount(
            filteredPermissions.length
        );

        if (!filteredPermissions.length) {
            showEmpty(
                "No permissions found."
            );
            return;
        }

        tableBody.innerHTML =
            filteredPermissions
                .map(createPermissionRow)
                .join("");
    }

    function createPermissionRow(permission) {
        const id =
            getPermissionId(permission);

        const name =
            getPermissionName(permission) ||
            "-";

        const module =
            getPermissionModule(permission) ||
            "-";

        const description =
            getPermissionDescription(permission) ||
            "-";

        const createdAt =
            getPermissionCreatedAt(permission);

        return `
            <tr>
                <td>${escapeHtml(id)}</td>
                <td>
                    <strong>
                        ${escapeHtml(name)}
                    </strong>
                </td>
                <td>
                    <span class="module-badge">
                        ${escapeHtml(module)}
                    </span>
                </td>
                <td>
                    ${escapeHtml(description)}
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

        const currentValue =
            moduleFilter.value;

        const modules = [
            ...new Set(
                permissions
                    .map(getPermissionModule)
                    .map((module) =>
                        String(module).trim()
                    )
                    .filter(Boolean)
            )
        ].sort((a, b) =>
            a.localeCompare(b)
        );

        moduleFilter.innerHTML = `
            <option value="">
                All Modules
            </option>
            ${modules
                .map(
                    (module) => `
                        <option
                            value="${escapeAttribute(
                                module.toLowerCase()
                            )}"
                        >
                            ${escapeHtml(module)}
                        </option>
                    `
                )
                .join("")}
        `;

        const matchingOption =
            Array.from(
                moduleFilter.options
            ).find(
                (option) =>
                    option.value ===
                    currentValue
            );

        moduleFilter.value =
            matchingOption
                ? currentValue
                : "";
    }

    function updateCount(count) {
        const { count: countElement } =
            getElements();

        if (!countElement) {
            return;
        }

        countElement.textContent =
            String(count);
    }

    function openCreateModal() {
        const {
            modal,
            modalTitle,
            form,
            permissionId,
            permissionName,
            permissionDescription,
            saveButton
        } = getElements();

        if (!modal || !form) {
            showMessage(
                "Permission form is not available.",
                "error"
            );
            return;
        }

        form.reset();

        if (permissionId) {
            permissionId.value = "";
        }

        if (permissionName) {
            permissionName.value = "";
        }

        if (permissionDescription) {
            permissionDescription.value = "";
        }

        if (modalTitle) {
            modalTitle.textContent =
                "Create Permission";
        }

        if (saveButton) {
            saveButton.textContent =
                "Save Permission";
        }

        showModal(modal);
    }

    function openEditModal(id) {
        const permission =
            permissions.find(
                (item) =>
                    String(
                        getPermissionId(item)
                    ) === String(id)
            );

        if (!permission) {
            showMessage(
                "Permission not found.",
                "error"
            );
            return;
        }

        const {
            modal,
            modalTitle,
            permissionId,
            permissionName,
            permissionDescription,
            saveButton
        } = getElements();

        if (!modal) {
            showMessage(
                "Permission form is not available.",
                "error"
            );
            return;
        }

        if (permissionId) {
            permissionId.value =
                getPermissionId(permission);
        }

        if (permissionName) {
            permissionName.value =
                getPermissionName(permission);
        }

        if (permissionDescription) {
            permissionDescription.value =
                getPermissionDescription(
                    permission
                );
        }

        if (modalTitle) {
            modalTitle.textContent =
                "Edit Permission";
        }

        if (saveButton) {
            saveButton.textContent =
                "Update Permission";
        }

        showModal(modal);
    }

    function showModal(modal) {
        if (
            typeof bootstrap !== "undefined" &&
            bootstrap.Modal
        ) {
            const instance =
                bootstrap.Modal.getOrCreateInstance(
                    modal
                );

            instance.show();
            return;
        }

        modal.style.display = "block";
        modal.classList.add("show");
        modal.setAttribute(
            "aria-hidden",
            "false"
        );
    }

    function hideModal() {
        const { modal } = getElements();

        if (!modal) {
            return;
        }

        if (
            typeof bootstrap !== "undefined" &&
            bootstrap.Modal
        ) {
            const instance =
                bootstrap.Modal.getInstance(
                    modal
                );

            if (instance) {
                instance.hide();
                return;
            }
        }

        modal.style.display = "none";
        modal.classList.remove("show");
        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    async function savePermission(event) {
        event.preventDefault();

        const {
            form,
            permissionId,
            permissionName,
            permissionDescription,
            saveButton
        } = getElements();

        if (!form) {
            return;
        }

        const name =
            permissionName?.value
                .trim() || "";

        const description =
            permissionDescription?.value
                .trim() || "";

        if (!name) {
            showMessage(
                "Permission name is required.",
                "error"
            );

            permissionName?.focus();

            return;
        }

        if (!/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(name)) {
            showMessage(
                "Permission name must use the format module.action.",
                "error"
            );

            permissionName?.focus();

            return;
        }

        const id =
            permissionId?.value
                .trim() || "";

        const payload = {
            permission_name: name,
            description:
                description || null
        };

        const originalButtonText =
            saveButton?.textContent ||
            "Save Permission";

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent =
                id
                    ? "Updating..."
                    : "Saving...";
        }

        try {
            if (id) {
                await apiPut(
                    `/permissions/${encodeURIComponent(id)}`,
                    payload
                );

                showMessage(
                    "Permission updated successfully.",
                    "success"
                );
            } else {
                await apiPost(
                    "/permissions",
                    payload
                );

                showMessage(
                    "Permission created successfully.",
                    "success"
                );
            }

            hideModal();

            await loadPermissions();
        } catch (error) {
            console.error(
                "Save permission error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to save permission.",
                "error"
            );
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent =
                    originalButtonText;
            }
        }
    }

    async function deletePermission(id) {
        const permission =
            permissions.find(
                (item) =>
                    String(
                        getPermissionId(item)
                    ) === String(id)
            );

        const name =
            permission
                ? getPermissionName(permission)
                : "this permission";

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            await apiDelete(
                `/permissions/${encodeURIComponent(id)}`
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

    function showLoading() {
        const { tableBody } =
            getElements();

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;padding:30px;"
                >
                    Loading permissions...
                </td>
            </tr>
        `;
    }

    function showEmpty(text) {
        const { tableBody } =
            getElements();

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

        return escapeHtml(
            date.toLocaleDateString(
                "en-NG",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            )
        );
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }

    function setupEvents() {
        const {
            searchInput,
            moduleFilter,
            refreshButton,
            openCreateButton,
            form,
            closeModalButton,
            cancelButton
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

        if (refreshButton) {
            refreshButton.addEventListener(
                "click",
                loadPermissions
            );
        }

        if (openCreateButton) {
            openCreateButton.addEventListener(
                "click",
                openCreateModal
            );
        }

        if (form) {
            form.addEventListener(
                "submit",
                savePermission
            );
        }

        if (closeModalButton) {
            closeModalButton.addEventListener(
                "click",
                hideModal
            );
        }

        if (cancelButton) {
            cancelButton.addEventListener(
                "click",
                hideModal
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
                    openEditModal(id);
                    return;
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

    window.loadPermissions =
        loadPermissions;

    window.addPermission =
        openCreateModal;

    window.editPermission =
        openEditModal;

    window.deletePermission =
        deletePermission;

    window.PermissionsPage = {
        initialize: loadPermissions,
        loadPermissions,
        addPermission: openCreateModal,
        editPermission: openEditModal,
        deletePermission
    };

    function initialize() {
        setupEvents();
        loadPermissions();
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();