const API_BASE = "/api";

let permissions = [];


/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

const tableBody =
    document.getElementById("permissionsTableBody") ||
    document.getElementById("permissionTableBody") ||
    document.querySelector("#permissionsTable tbody");

const searchInput =
    document.getElementById("searchInput") ||
    document.getElementById("permissionSearch");

const moduleFilter =
    document.getElementById("moduleFilter") ||
    document.getElementById("permissionModuleFilter");

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
| LOAD PERMISSIONS
|--------------------------------------------------------------------------
*/

async function loadPermissions() {

    try {

        showLoading();


        const result =
            await apiRequest(
                "/permissions"
            );


        permissions =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.permissions)
                    ? result.permissions
                    : Array.isArray(result)
                        ? result
                        : [];


        renderPermissions();

        populateModuleFilter();


    } catch (error) {

        console.error(
            "Load permissions error:",
            error
        );


        showEmpty(
            "Unable to load permissions."
        );


        showMessage(
            error.message ||
            "Unable to load permissions.",
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| RENDER PERMISSIONS
|--------------------------------------------------------------------------
*/

function renderPermissions() {

    if (!tableBody) {
        return;
    }


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedModule =
        moduleFilter
            ? moduleFilter.value
                .trim()
                .toLowerCase()
            : "";


    const filteredPermissions =
        permissions.filter(
            permission => {

                const name =
                    String(
                        permission.name ||
                        permission.permission_name ||
                        permission.permissionName ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        permission.description ||
                        ""
                    ).toLowerCase();


                const module =
                    String(
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


                return (
                    matchesSearch &&
                    matchesModule
                );

            }
        );


    if (
        filteredPermissions.length === 0
    ) {

        showEmpty(
            "No permissions found."
        );

        return;

    }


    tableBody.innerHTML =
        filteredPermissions
            .map(
                permission =>
                    createPermissionRow(
                        permission
                    )
            )
            .join("");

}


/*
|--------------------------------------------------------------------------
| CREATE PERMISSION ROW
|--------------------------------------------------------------------------
*/

function createPermissionRow(
    permission
) {

    const id =
        permission.id;


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
        permission.createdAt;


    return `
        <tr>

            <td>
                ${escapeHtml(name)}
            </td>

            <td>
                ${escapeHtml(description)}
            </td>

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
                        onclick="editPermission('${escapeJs(id)}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        onclick="deletePermission('${escapeJs(id)}')"
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
| POPULATE MODULE FILTER
|--------------------------------------------------------------------------
*/

function populateModuleFilter() {

    if (!moduleFilter) {
        return;
    }


    const currentValue =
        moduleFilter.value;


    const modules =
        [
            ...new Set(
                permissions
                    .map(
                        permission =>
                            permission.module ||
                            permission.module_name ||
                            permission.moduleName ||
                            ""
                    )
                    .filter(
                        module =>
                            String(module).trim()
                    )
                    .map(
                        module =>
                            String(module).trim()
                    )
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );


    const existingOptions =
        Array.from(
            moduleFilter.options
        )
        .map(
            option =>
                option.value
        );


    if (
        existingOptions.length <= 1
    ) {

        moduleFilter.innerHTML =
            `
                <option value="">
                    All Modules
                </option>
            ` +
            modules
                .map(
                    module =>
                        `
                            <option value="${escapeHtml(module.toLowerCase())}">
                                ${escapeHtml(module)}
                            </option>
                        `
                )
                .join("");

    }


    moduleFilter.value =
        currentValue;

}


/*
|--------------------------------------------------------------------------
| ADD PERMISSION
|--------------------------------------------------------------------------
*/

function addPermission() {

    window.location.href =
        "permission-form.html";

}


/*
|--------------------------------------------------------------------------
| EDIT PERMISSION
|--------------------------------------------------------------------------
*/

function editPermission(
    id
) {

    window.location.href =
        `permission-form.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| VIEW PERMISSION
|--------------------------------------------------------------------------
*/

function viewPermission(
    id
) {

    window.location.href =
        `permission-profile.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| DELETE PERMISSION
|--------------------------------------------------------------------------
*/

async function deletePermission(
    id
) {

    const permission =
        permissions.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const permissionName =
        permission
            ? (
                permission.name ||
                permission.permission_name ||
                permission.permissionName ||
                "this permission"
            )
            : "this permission";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${permissionName}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/permissions/${id}`,
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


/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderPermissions
    );

}


/*
|--------------------------------------------------------------------------
| MODULE FILTER
|--------------------------------------------------------------------------
*/

if (moduleFilter) {

    moduleFilter.addEventListener(
        "change",
        renderPermissions
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
                colspan="5"
                style="
                    text-align:center;
                    padding:30px;
                "
            >
                Loading permissions...
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
                colspan="5"
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

window.loadPermissions =
    loadPermissions;

window.addPermission =
    addPermission;

window.editPermission =
    editPermission;

window.viewPermission =
    viewPermission;

window.deletePermission =
    deletePermission;


/*
|--------------------------------------------------------------------------
| INITIALISE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadPermissions();

    }
);