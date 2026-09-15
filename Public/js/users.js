"use strict";

(function () {
    const USERS_API = "/users";
    const ROLES_API = "/roles";

    let users = [];
    let roles = [];

    const tableBody =
        document.getElementById("usersTableBody") ||
        document.getElementById("userTableBody");

    const searchInput =
        document.getElementById("searchInput") ||
        document.getElementById("userSearch");

    const roleFilter =
        document.getElementById("roleFilter") ||
        document.getElementById("userRoleFilter");

    const statusFilter =
        document.getElementById("statusFilter") ||
        document.getElementById("userStatusFilter");

    const totalUsersElement =
        document.getElementById("totalUsers");

    const activeUsersElement =
        document.getElementById("activeUsers");

    const inactiveUsersElement =
        document.getElementById("inactiveUsers");

    const displayedUsersElement =
        document.getElementById("displayedUsers");

    const messageContainer =
        document.getElementById("message") ||
        document.getElementById("messageContainer");

    const userModalElement =
        document.getElementById("userModal");

    const userForm =
        document.getElementById("userForm");

    const userIdInput =
        document.getElementById("userId");

    const firstNameInput =
        document.getElementById("firstName");

    const middleNameInput =
        document.getElementById("middleName");

    const lastNameInput =
        document.getElementById("lastName");

    const usernameInput =
        document.getElementById("username");

    const emailInput =
        document.getElementById("email");

    const phoneInput =
        document.getElementById("phone");

    const roleInput =
        document.getElementById("roleId");

    const passwordInput =
        document.getElementById("password");

    const modalTitle =
        document.getElementById("modalTitle");

    const saveButton =
        document.getElementById("saveUserButton") ||
        document.getElementById("saveButton");

    const passwordGroup =
        document.getElementById("passwordGroup");

    let userModal = null;

    function getApiFunction(name) {
        if (typeof window[name] !== "function") {
            throw new Error(
                "The application API service is not available."
            );
        }

        return window[name];
    }

    function showMessage(text, type) {
        const messageType =
            type || "success";

        if (
            typeof window.showNotification ===
            "function"
        ) {
            window.showNotification(
                text,
                messageType
            );
            return;
        }

        if (!messageContainer) {
            return;
        }

        messageContainer.textContent = text;
        messageContainer.className =
            `message ${messageType}`;

        window.setTimeout(function () {
            messageContainer.textContent = "";
            messageContainer.className =
                "message";
        }, 4000);
    }

    function getUserId(user) {
        return (
            user?.id ??
            user?.user_id ??
            user?.userId ??
            ""
        );
    }

    function getUsername(user) {
        return (
            user?.username ||
            user?.user_name ||
            user?.userName ||
            "-"
        );
    }

    function getFirstName(user) {
        return (
            user?.first_name ||
            user?.firstName ||
            ""
        );
    }

    function getMiddleName(user) {
        return (
            user?.middle_name ||
            user?.middleName ||
            ""
        );
    }

    function getLastName(user) {
        return (
            user?.last_name ||
            user?.lastName ||
            ""
        );
    }

    function getFullName(user) {
        const name = [
            getFirstName(user),
            getMiddleName(user),
            getLastName(user)
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        return name ||
            user?.name ||
            "-";
    }

    function getEmail(user) {
        return user?.email || "-";
    }

    function getPhone(user) {
        return (
            user?.phone ||
            user?.phone_number ||
            "-"
        );
    }

    function getRoleId(user) {
        return (
            user?.role_id ??
            user?.roleId ??
            ""
        );
    }

    function getRole(user) {
        return (
            user?.role_name ||
            user?.roleName ||
            user?.role ||
            "-"
        );
    }

    function getStatus(user) {
        if (
            typeof user?.is_active ===
            "boolean"
        ) {
            return user.is_active
                ? "active"
                : "inactive";
        }

        if (
            typeof user?.isActive ===
            "boolean"
        ) {
            return user.isActive
                ? "active"
                : "inactive";
        }

        return String(
            user?.status ||
            "active"
        ).toLowerCase();
    }

    function getLastLogin(user) {
        return (
            user?.last_login_at ||
            user?.lastLoginAt ||
            user?.last_login ||
            user?.lastLogin ||
            null
        );
    }

    function getCreatedAt(user) {
        return (
            user?.created_at ||
            user?.createdAt ||
            null
        );
    }

    function getUsersFromResponse(result) {
        if (Array.isArray(result)) {
            return result;
        }

        if (
            result &&
            Array.isArray(result.users)
        ) {
            return result.users;
        }

        if (
            result &&
            Array.isArray(result.data)
        ) {
            return result.data;
        }

        if (
            result?.data &&
            Array.isArray(result.data.users)
        ) {
            return result.data.users;
        }

        if (
            result &&
            Array.isArray(result.records)
        ) {
            return result.records;
        }

        return [];
    }

    function getRolesFromResponse(result) {
        if (Array.isArray(result)) {
            return result;
        }

        if (
            result &&
            Array.isArray(result.roles)
        ) {
            return result.roles;
        }

        if (
            result &&
            Array.isArray(result.data)
        ) {
            return result.data;
        }

        if (
            result?.data &&
            Array.isArray(result.data.roles)
        ) {
            return result.data.roles;
        }

        if (
            result &&
            Array.isArray(result.records)
        ) {
            return result.records;
        }

        return [];
    }

    async function loadUsers() {
        if (!tableBody) {
            return;
        }

        showLoading();

        try {
            const apiGet =
                getApiFunction("apiGet");

            const result =
                await apiGet(USERS_API);

            users =
                getUsersFromResponse(result);

            populateRoleFilter();
            updateStatistics();
            renderUsers();
        } catch (error) {
            console.error(
                "Load users error:",
                error
            );

            users = [];

            updateStatistics();

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

    async function loadRoles() {
        if (!roleInput) {
            return;
        }

        try {
            const apiGet =
                getApiFunction("apiGet");

            const result =
                await apiGet(ROLES_API);

            roles =
                getRolesFromResponse(result);

            populateRoleSelect();
        } catch (error) {
            console.error(
                "Load roles error:",
                error
            );

            roles = [];

            showMessage(
                "Unable to load roles.",
                "error"
            );
        }
    }

    function populateRoleFilter() {
        if (!roleFilter) {
            return;
        }

        const currentValue =
            roleFilter.value;

        const roleNames = [
            ...new Set(
                users
                    .map(getRole)
                    .filter(function (role) {
                        return (
                            role &&
                            role !== "-"
                        );
                    })
            )
        ].sort(function (a, b) {
            return a.localeCompare(b);
        });

        roleFilter.innerHTML =
            `<option value="">All Roles</option>` +
            roleNames
                .map(function (role) {
                    return `
                        <option value="${escapeHtml(
                            role.toLowerCase()
                        )}">
                            ${escapeHtml(role)}
                        </option>
                    `;
                })
                .join("");

        roleFilter.value =
            currentValue;
    }

    function populateRoleSelect() {
        if (!roleInput) {
            return;
        }

        const currentValue =
            roleInput.value;

        roleInput.innerHTML =
            `<option value="">Select role</option>` +
            roles
                .map(function (role) {
                    const id =
                        role?.id ??
                        role?.role_id ??
                        "";

                    const name =
                        role?.role_name ||
                        role?.roleName ||
                        role?.name ||
                        "";

                    if (!id || !name) {
                        return "";
                    }

                    return `
                        <option value="${escapeHtml(
                            String(id)
                        )}">
                            ${escapeHtml(name)}
                        </option>
                    `;
                })
                .join("");

        roleInput.value =
            currentValue;
    }

    function renderUsers() {
        if (!tableBody) {
            return;
        }

        const searchTerm =
            searchInput?.value
                ?.trim()
                .toLowerCase() ||
            "";

        const selectedRole =
            roleFilter?.value
                ?.trim()
                .toLowerCase() ||
            "";

        const selectedStatus =
            statusFilter?.value
                ?.trim()
                .toLowerCase() ||
            "";

        const filteredUsers =
            users.filter(function (user) {
                const username =
                    getUsername(user)
                        .toLowerCase();

                const fullName =
                    getFullName(user)
                        .toLowerCase();

                const email =
                    getEmail(user)
                        .toLowerCase();

                const phone =
                    getPhone(user)
                        .toLowerCase();

                const role =
                    getRole(user)
                        .toLowerCase();

                const status =
                    getStatus(user);

                const matchesSearch =
                    !searchTerm ||
                    username.includes(
                        searchTerm
                    ) ||
                    fullName.includes(
                        searchTerm
                    ) ||
                    email.includes(
                        searchTerm
                    ) ||
                    phone.includes(
                        searchTerm
                    );

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

        updateDisplayedCount(
            filteredUsers.length
        );

        if (!filteredUsers.length) {
            showEmpty(
                users.length
                    ? "No users match the selected filters."
                    : "No users found."
            );
            return;
        }

        tableBody.innerHTML =
            filteredUsers
                .map(createUserRow)
                .join("");
    }

    function createUserRow(user) {
        const id =
            getUserId(user);

        const safeId =
            escapeHtml(String(id));

        const username =
            getUsername(user);

        const fullName =
            getFullName(user);

        const email =
            getEmail(user);

        const phone =
            getPhone(user);

        const role =
            getRole(user);

        const status =
            getStatus(user);

        const lastLogin =
            getLastLogin(user);

        const createdAt =
            getCreatedAt(user);

        const statusLabel =
            formatStatus(status);

        const statusClass =
            status === "active"
                ? "status-active"
                : "status-inactive";

        const toggleLabel =
            status === "active"
                ? "Deactivate"
                : "Activate";

        return `
            <tr data-user-id="${safeId}">
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
                    ${escapeHtml(phone)}
                </td>
                <td>
                    <span class="role-badge">
                        ${escapeHtml(role)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${escapeHtml(statusLabel)}
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
                            data-id="${safeId}"
                        >
                            View
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-warning"
                            data-action="toggle-user-status"
                            data-id="${safeId}"
                        >
                            ${toggleLabel}
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            data-action="delete-user"
                            data-id="${safeId}"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function updateStatistics() {
        if (totalUsersElement) {
            totalUsersElement.textContent =
                users.length;
        }

        const activeCount =
            users.filter(function (user) {
                return (
                    getStatus(user) ===
                    "active"
                );
            }).length;

        const inactiveCount =
            users.length -
            activeCount;

        if (activeUsersElement) {
            activeUsersElement.textContent =
                activeCount;
        }

        if (inactiveUsersElement) {
            inactiveUsersElement.textContent =
                inactiveCount;
        }
    }

    function updateDisplayedCount(count) {
        if (displayedUsersElement) {
            displayedUsersElement.textContent =
                count;
        }
    }

    function showLoading() {
        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
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
                    colspan="9"
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
            return window.App.escapeHtml(
                value
            );
        }

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

    function openCreateUserModal() {
        resetForm();

        if (modalTitle) {
            modalTitle.textContent =
                "Add User";
        }

        if (saveButton) {
            saveButton.textContent =
                "Create User";
        }

        if (passwordGroup) {
            passwordGroup.style.display =
                "";
        }

        if (passwordInput) {
            passwordInput.required =
                true;
        }

        if (roleInput) {
            roleInput.disabled =
                false;
        }

        showModal();
    }

    function openEditUserModal(id) {
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

        if (userIdInput) {
            userIdInput.value =
                getUserId(user);
        }

        if (firstNameInput) {
            firstNameInput.value =
                getFirstName(user);
        }

        if (middleNameInput) {
            middleNameInput.value =
                getMiddleName(user);
        }

        if (lastNameInput) {
            lastNameInput.value =
                getLastName(user);
        }

        if (usernameInput) {
            usernameInput.value =
                getUsername(user);
        }

        if (emailInput) {
            emailInput.value =
                user?.email || "";
        }

        if (phoneInput) {
            phoneInput.value =
                user?.phone || "";
        }

        if (roleInput) {
            roleInput.value =
                getRoleId(user);
            roleInput.disabled =
                true;
        }

        if (passwordInput) {
            passwordInput.value =
                "";
            passwordInput.required =
                false;
        }

        if (passwordGroup) {
            passwordGroup.style.display =
                "none";
        }

        if (modalTitle) {
            modalTitle.textContent =
                "Edit User";
        }

        if (saveButton) {
            saveButton.textContent =
                "Save Changes";
        }

        showModal();
    }

    function resetForm() {
        if (userForm) {
            userForm.reset();
        }

        if (userIdInput) {
            userIdInput.value =
                "";
        }

        if (roleInput) {
            roleInput.disabled =
                false;
        }

        if (passwordInput) {
            passwordInput.required =
                true;
        }
    }

    function showModal() {
        if (!userModalElement) {
            return;
        }

        if (
            typeof bootstrap ===
            "undefined"
        ) {
            userModalElement.style.display =
                "block";
            userModalElement.classList.add(
                "show"
            );
            return;
        }

        if (!userModal) {
            userModal =
                new bootstrap.Modal(
                    userModalElement
                );
        }

        userModal.show();
    }

    function hideModal() {
        if (!userModalElement) {
            return;
        }

        if (
            typeof bootstrap ===
            "undefined"
        ) {
            userModalElement.style.display =
                "none";
            userModalElement.classList.remove(
                "show"
            );
            return;
        }

        if (!userModal) {
            userModal =
                new bootstrap.Modal(
                    userModalElement
                );
        }

        userModal.hide();
    }

    async function saveUser(event) {
        event.preventDefault();

        if (!userForm) {
            return;
        }

        const id =
            userIdInput?.value?.trim() ||
            "";

        const isEdit =
            Boolean(id);

        const firstName =
            firstNameInput?.value?.trim() ||
            "";

        const middleName =
            middleNameInput?.value?.trim() ||
            "";

        const lastName =
            lastNameInput?.value?.trim() ||
            "";

        const username =
            usernameInput?.value?.trim() ||
            "";

        const email =
            emailInput?.value?.trim() ||
            "";

        const phone =
            phoneInput?.value?.trim() ||
            "";

        const roleId =
            roleInput?.value?.trim() ||
            "";

        const password =
            passwordInput?.value ||
            "";

        if (
            !firstName ||
            !lastName ||
            !username ||
            !email
        ) {
            showMessage(
                "Please complete all required user fields.",
                "error"
            );
            return;
        }

        if (
            !isEdit &&
            !roleId
        ) {
            showMessage(
                "Please select a role.",
                "error"
            );
            return;
        }

        if (
            !isEdit &&
            password.length < 8
        ) {
            showMessage(
                "Password must be at least 8 characters.",
                "error"
            );
            return;
        }

        const payload = {
            firstName,
            middleName,
            lastName,
            username,
            email,
            phone
        };

        if (!isEdit) {
            payload.roleId =
                Number(roleId);

            payload.password =
                password;
        }

        try {
            if (saveButton) {
                saveButton.disabled =
                    true;
                saveButton.textContent =
                    isEdit
                        ? "Saving..."
                        : "Creating...";
            }

            if (isEdit) {
                const apiPut =
                    getApiFunction("apiPut");

                await apiPut(
                    `${USERS_API}/${encodeURIComponent(id)}`,
                    payload
                );

                showMessage(
                    "User updated successfully.",
                    "success"
                );
            } else {
                const apiPost =
                    getApiFunction("apiPost");

                await apiPost(
                    USERS_API,
                    payload
                );

                showMessage(
                    "User created successfully.",
                    "success"
                );
            }

            hideModal();
            resetForm();
            await loadUsers();
        } catch (error) {
            console.error(
                "Save user error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to save user.",
                "error"
            );
        } finally {
            if (saveButton) {
                saveButton.disabled =
                    false;
                saveButton.textContent =
                    isEdit
                        ? "Save Changes"
                        : "Create User";
            }
        }
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
            `Email: ${getEmail(user)}`,
            `Phone: ${getPhone(user)}`,
            `Role: ${getRole(user)}`,
            `Status: ${formatStatus(getStatus(user))}`,
            `Last Login: ${formatDate(getLastLogin(user))}`,
            `Created: ${formatDate(getCreatedAt(user))}`
        ].join("\n");

        window.alert(details);
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

        const isActive =
            status === "active";

        const action =
            isActive
                ? "deactivate"
                : "activate";

        const confirmed =
            window.confirm(
                `Are you sure you want to ${action} this user?`
            );

        if (!confirmed) {
            return;
        }

        try {
            const apiPatch =
                getApiFunction("apiPatch");

            await apiPatch(
                `${USERS_API}/${encodeURIComponent(id)}/${action}`,
                {}
            );

            showMessage(
                isActive
                    ? "User deactivated successfully."
                    : "User activated successfully.",
                "success"
            );

            await loadUsers();
        } catch (error) {
            console.error(
                "Toggle user status error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to change user status.",
                "error"
            );
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
            const apiDelete =
                getApiFunction("apiDelete");

            await apiDelete(
                `${USERS_API}/${encodeURIComponent(id)}`
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

        if (userForm) {
            userForm.addEventListener(
                "submit",
                saveUser
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

                const rawId =
                    button.dataset.id;

                if (!rawId) {
                    return;
                }

                let id;

                try {
                    id =
                        decodeURIComponent(
                            rawId
                        );
                } catch {
                    id = rawId;
                }

                if (
                    action ===
                    "view-user"
                ) {
                    viewUser(id);
                    return;
                }

                if (
                    action ===
                    "edit-user"
                ) {
                    openEditUserModal(id);
                    return;
                }

                if (
                    action ===
                    "toggle-user-status"
                ) {
                    await toggleUserStatus(id);
                    return;
                }

                if (
                    action ===
                    "delete-user"
                ) {
                    await deleteUser(id);
                    return;
                }

                if (
                    action ===
                    "add-user"
                ) {
                    openCreateUserModal();
                }
            }
        );

        const addUserButton =
            document.getElementById(
                "addUserButton"
            );

        if (addUserButton) {
            addUserButton.addEventListener(
                "click",
                openCreateUserModal
            );
        }

        const cancelButtons =
            document.querySelectorAll(
                "[data-action='cancel-user']"
            );

        cancelButtons.forEach(
            function (button) {
                button.addEventListener(
                    "click",
                    hideModal
                );
            }
        );

        if (userModalElement) {
            userModalElement.addEventListener(
                "hidden.bs.modal",
                resetForm
            );
        }
    }

    function initialize() {
        setupEvents();
        loadRoles();
        loadUsers();
    }

    window.UsersPage = {
        initialize,
        loadUsers,
        loadRoles,
        openCreateUserModal,
        openEditUserModal,
        viewUser,
        toggleUserStatus,
        deleteUser
    };

    window.loadUsers =
        loadUsers;

    window.viewUser =
        viewUser;

    window.toggleUserStatus =
        toggleUserStatus;

    window.deleteUser =
        deleteUser;

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