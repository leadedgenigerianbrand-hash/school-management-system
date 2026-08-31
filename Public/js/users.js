const API_BASE = "/api";

let users = [];


/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

function getToken() {

    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token")
    );

}


/*
|--------------------------------------------------------------------------
| API REQUEST
|--------------------------------------------------------------------------
*/

async function apiRequest(
    url,
    options = {}
) {

    const token = getToken();

    const headers = {
        ...(options.headers || {})
    };


    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            API_BASE + url,
            {
                ...options,
                headers
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            "Request failed."
        );

    }


    return data;

}


/*
|--------------------------------------------------------------------------
| SHOW MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(
    text,
    type = "success"
) {

    if (!messageContainer) {
        return;
    }


    messageContainer.textContent =
        text;


    messageContainer.className =
        `message ${type}`;


    setTimeout(
        function() {

            messageContainer.textContent =
                "";

            messageContainer.className =
                "message";

        },
        4000
    );

}


/*
|--------------------------------------------------------------------------
| LOAD USERS
|--------------------------------------------------------------------------
*/

async function loadUsers() {

    try {

        showLoading();


        const result =
            await apiRequest(
                "/users"
            );


        users =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.users)
                    ? result.users
                    : Array.isArray(result)
                        ? result
                        : [];


        renderUsers();

        populateRoleFilter();


    } catch (error) {

        console.error(
            "Load users error:",
            error
        );


        showEmpty(
            "Unable to load users."
        );


        showMessage(
            error.message ||
            "Unable to load users.",
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| RENDER USERS
|--------------------------------------------------------------------------
*/

function renderUsers() {

    if (!tableBody) {
        return;
    }


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedRole =
        roleFilter
            ? roleFilter.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toLowerCase()
            : "";


    const filteredUsers =
        users.filter(
            user => {

                const username =
                    String(
                        user.username ||
                        user.user_name ||
                        user.userName ||
                        ""
                    ).toLowerCase();


                const email =
                    String(
                        user.email ||
                        ""
                    ).toLowerCase();


                const firstName =
                    String(
                        user.first_name ||
                        user.firstName ||
                        ""
                    ).toLowerCase();


                const lastName =
                    String(
                        user.last_name ||
                        user.lastName ||
                        ""
                    ).toLowerCase();


                const fullName =
                    `${firstName} ${lastName}`
                        .trim()
                        .toLowerCase();


                const role =
                    String(
                        user.role_name ||
                        user.roleName ||
                        user.role ||
                        ""
                    ).toLowerCase();


                const status =
                    String(
                        user.status ||
                        "active"
                    ).toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    username.includes(searchTerm) ||
                    email.includes(searchTerm) ||
                    firstName.includes(searchTerm) ||
                    lastName.includes(searchTerm) ||
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

            }
        );


    if (
        filteredUsers.length === 0
    ) {

        showEmpty(
            "No users found."
        );

        return;

    }


    tableBody.innerHTML =
        filteredUsers
            .map(
                user =>
                    createUserRow(
                        user
                    )
            )
            .join("");

}


/*
|--------------------------------------------------------------------------
| CREATE USER ROW
|--------------------------------------------------------------------------
*/

function createUserRow(
    user
) {

    const id =
        user.id;


    const username =
        user.username ||
        user.user_name ||
        user.userName ||
        "-";


    const firstName =
        user.first_name ||
        user.firstName ||
        "";


    const lastName =
        user.last_name ||
        user.lastName ||
        "";


    const fullName =
        `${firstName} ${lastName}`
            .trim() ||
        "-";


    const email =
        user.email ||
        "-";


    const role =
        user.role_name ||
        user.roleName ||
        user.role ||
        "-";


    const status =
        String(
            user.status ||
            "active"
        ).toLowerCase();


    const lastLogin =
        user.last_login ||
        user.lastLogin;


    const createdAt =
        user.created_at ||
        user.createdAt;


    return `
        <tr>

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
                    ${formatStatus(status)}
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
                        onclick="viewUser('${escapeJs(id)}')"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-secondary"
                        onclick="editUser('${escapeJs(id)}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-warning"
                        onclick="toggleUserStatus('${escapeJs(id)}')"
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
                        onclick="deleteUser('${escapeJs(id)}')"
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| POPULATE ROLE FILTER
|--------------------------------------------------------------------------
*/

function populateRoleFilter() {

    if (!roleFilter) {
        return;
    }


    const currentValue =
        roleFilter.value;


    const roles =
        [
            ...new Set(
                users
                    .map(
                        user =>
                            user.role_name ||
                            user.roleName ||
                            user.role ||
                            ""
                    )
                    .filter(
                        role =>
                            String(role).trim()
                    )
                    .map(
                        role =>
                            String(role).trim()
                    )
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );


    const existingOptions =
        Array.from(
            roleFilter.options
        )
        .map(
            option =>
                option.value
        );


    if (
        existingOptions.length <= 1
    ) {

        roleFilter.innerHTML =
            `
                <option value="">
                    All Roles
                </option>
            ` +
            roles
                .map(
                    role =>
                        `
                            <option value="${escapeHtml(role.toLowerCase())}">
                                ${escapeHtml(role)}
                            </option>
                        `
                )
                .join("");

    }


    roleFilter.value =
        currentValue;

}


/*
|--------------------------------------------------------------------------
| ADD USER
|--------------------------------------------------------------------------
*/

function addUser() {

    window.location.href =
        "user-form.html";

}


/*
|--------------------------------------------------------------------------
| VIEW USER
|--------------------------------------------------------------------------
*/

function viewUser(
    id
) {

    window.location.href =
        `user-profile.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| EDIT USER
|--------------------------------------------------------------------------
*/

function editUser(
    id
) {

    window.location.href =
        `user-form.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| ACTIVATE USER
|--------------------------------------------------------------------------
*/

async function activateUser(
    id
) {

    try {

        await apiRequest(
            `/users/${id}/activate`,
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


/*
|--------------------------------------------------------------------------
| DEACTIVATE USER
|--------------------------------------------------------------------------
*/

async function deactivateUser(
    id
) {

    try {

        await apiRequest(
            `/users/${id}/deactivate`,
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


/*
|--------------------------------------------------------------------------
| TOGGLE USER STATUS
|--------------------------------------------------------------------------
*/

async function toggleUserStatus(
    id
) {

    const user =
        users.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!user) {

        showMessage(
            "User not found.",
            "error"
        );

        return;

    }


    const status =
        String(
            user.status ||
            "active"
        ).toLowerCase();


    if (status === "active") {

        const confirmed =
            window.confirm(
                "Are you sure you want to deactivate this user?"
            );


        if (!confirmed) {
            return;
        }


        await deactivateUser(
            id
        );

    } else {

        const confirmed =
            window.confirm(
                "Are you sure you want to activate this user?"
            );


        if (!confirmed) {
            return;
        }


        await activateUser(
            id
        );

    }

}


/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/

async function deleteUser(
    id
) {

    const user =
        users.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const username =
        user
            ? (
                user.username ||
                user.user_name ||
                user.userName ||
                "this user"
            )
            : "this user";


    const confirmed =
        window.confirm(
            `Are you sure you want to permanently delete "${username}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/users/${id}`,
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


/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderUsers
    );

}


/*
|--------------------------------------------------------------------------
| ROLE FILTER
|--------------------------------------------------------------------------
*/

if (roleFilter) {

    roleFilter.addEventListener(
        "change",
        renderUsers
    );

}


/*
|--------------------------------------------------------------------------
| STATUS FILTER
|--------------------------------------------------------------------------
*/

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        renderUsers
    );

}


/*
|--------------------------------------------------------------------------
| LOADING STATE
|--------------------------------------------------------------------------
*/

function showLoading() {

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>

            <td
                colspan="8"
                style="
                    text-align:center;
                    padding:30px;
                "
            >
                Loading users...
            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

function showEmpty(
    text
) {

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>

            <td
                colspan="8"
                style="
                    text-align:center;
                    padding:30px;
                "
            >
                ${escapeHtml(text)}
            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| FORMAT STATUS
|--------------------------------------------------------------------------
*/

function formatStatus(
    status
) {

    const labels = {

        active:
            "Active",

        inactive:
            "Inactive",

        suspended:
            "Suspended",

        disabled:
            "Disabled",

        pending:
            "Pending"

    };


    return (
        labels[status] ||
        String(status)
            .replace(
                /_/g,
                " "
            )
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            )
    );

}


/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(
    value
) {

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


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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


/*
|--------------------------------------------------------------------------
| ESCAPE JAVASCRIPT
|--------------------------------------------------------------------------
*/

function escapeJs(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        );

}


/*
|--------------------------------------------------------------------------
| GLOBAL FUNCTIONS
|--------------------------------------------------------------------------
*/

window.loadUsers =
    loadUsers;

window.addUser =
    addUser;

window.viewUser =
    viewUser;

window.editUser =
    editUser;

window.activateUser =
    activateUser;

window.deactivateUser =
    deactivateUser;

window.toggleUserStatus =
    toggleUserStatus;

window.deleteUser =
    deleteUser;


/*
|--------------------------------------------------------------------------
| INITIALISE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadUsers();

    }
);