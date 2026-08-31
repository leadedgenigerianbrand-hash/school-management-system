const API_BASE = "/api";

let roles = [];


/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

const tableBody =
    document.getElementById("rolesTableBody") ||
    document.getElementById("roleTableBody") ||
    document.querySelector("#rolesTable tbody");

const searchInput =
    document.getElementById("searchInput") ||
    document.getElementById("roleSearch");

const statusFilter =
    document.getElementById("statusFilter") ||
    document.getElementById("roleStatusFilter");

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
| LOAD ROLES
|--------------------------------------------------------------------------
*/

async function loadRoles() {

    try {

        showLoading();


        const result =
            await apiRequest(
                "/roles"
            );


        roles =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.roles)
                    ? result.roles
                    : Array.isArray(result)
                        ? result
                        : [];


        renderRoles();


    } catch (error) {

        console.error(
            "Load roles error:",
            error
        );


        showEmpty(
            "Unable to load roles."
        );


        showMessage(
            error.message ||
            "Unable to load roles.",
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| RENDER ROLES
|--------------------------------------------------------------------------
*/

function renderRoles() {

    if (!tableBody) {
        return;
    }


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toLowerCase()
            : "";


    const filteredRoles =
        roles.filter(
            role => {

                const name =
                    String(
                        role.name ||
                        role.role_name ||
                        role.roleName ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        role.description ||
                        ""
                    ).toLowerCase();


                const status =
                    String(
                        role.status ||
                        "active"
                    ).toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    name.includes(searchTerm) ||
                    description.includes(searchTerm);


                const matchesStatus =
                    !selectedStatus ||
                    status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    if (
        filteredRoles.length === 0
    ) {

        showEmpty(
            "No roles found."
        );

        return;

    }


    tableBody.innerHTML =
        filteredRoles
            .map(
                role =>
                    createRoleRow(
                        role
                    )
            )
            .join("");

}


/*
|--------------------------------------------------------------------------
| CREATE ROLE ROW
|--------------------------------------------------------------------------
*/

function createRoleRow(
    role
) {

    const id =
        role.id;


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
            role.status ||
            "active"
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

                <span class="status-badge status-${escapeHtml(status)}">
                    ${formatStatus(status)}
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
                        onclick="viewRole('${escapeJs(id)}')"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-secondary"
                        onclick="editRole('${escapeJs(id)}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        onclick="deleteRole('${escapeJs(id)}')"
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
| ADD ROLE
|--------------------------------------------------------------------------
*/

function addRole() {

    window.location.href =
        "role-form.html";

}


/*
|--------------------------------------------------------------------------
| VIEW ROLE
|--------------------------------------------------------------------------
*/

function viewRole(
    id
) {

    window.location.href =
        `role-profile.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| EDIT ROLE
|--------------------------------------------------------------------------
*/

function editRole(
    id
) {

    window.location.href =
        `role-form.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| DELETE ROLE
|--------------------------------------------------------------------------
*/

async function deleteRole(
    id
) {

    const role =
        roles.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const roleName =
        role
            ? (
                role.name ||
                role.role_name ||
                role.roleName ||
                "this role"
            )
            : "this role";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${roleName}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/roles/${id}`,
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


/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderRoles
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
        renderRoles
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
                colspan="6"
                style="
                    text-align:center;
                    padding:30px;
                "
            >
                Loading roles...
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
                colspan="6"
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
            "Disabled"

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

window.loadRoles =
    loadRoles;

window.addRole =
    addRole;

window.viewRole =
    viewRole;

window.editRole =
    editRole;

window.deleteRole =
    deleteRole;


/*
|--------------------------------------------------------------------------
| INITIALISE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadRoles();

    }
);