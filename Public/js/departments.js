const API_BASE = "/api";

let departments = [];


/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

const tableBody =
    document.getElementById("departmentsTableBody") ||
    document.getElementById("departmentTableBody") ||
    document.querySelector("#departmentsTable tbody");

const searchInput =
    document.getElementById("searchInput") ||
    document.getElementById("departmentSearch");

const statusFilter =
    document.getElementById("statusFilter");

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
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


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
| LOAD DEPARTMENTS
|--------------------------------------------------------------------------
*/

async function loadDepartments() {

    try {

        showLoading();


        const result =
            await apiRequest(
                "/departments"
            );


        departments =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.departments)
                    ? result.departments
                    : Array.isArray(result)
                        ? result
                        : [];


        renderDepartments();


    } catch (error) {

        console.error(
            "Load departments error:",
            error
        );


        showEmpty(
            "Unable to load departments."
        );


        showMessage(
            error.message ||
            "Unable to load departments.",
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| RENDER DEPARTMENTS
|--------------------------------------------------------------------------
*/

function renderDepartments() {

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


    const filteredDepartments =
        departments.filter(
            department => {

                const name =
                    String(
                        department.department_name ||
                        department.departmentName ||
                        department.name ||
                        ""
                    ).toLowerCase();


                const code =
                    String(
                        department.department_code ||
                        department.departmentCode ||
                        department.code ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        department.description ||
                        ""
                    ).toLowerCase();


                const status =
                    String(
                        department.status ||
                        "active"
                    ).toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    name.includes(searchTerm) ||
                    code.includes(searchTerm) ||
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
        filteredDepartments.length === 0
    ) {

        showEmpty(
            "No departments found."
        );

        return;

    }


    tableBody.innerHTML =
        filteredDepartments
            .map(
                department =>
                    createDepartmentRow(
                        department
                    )
            )
            .join("");

}


/*
|--------------------------------------------------------------------------
| CREATE TABLE ROW
|--------------------------------------------------------------------------
*/

function createDepartmentRow(
    department
) {

    const id =
        department.id;


    const name =
        department.department_name ||
        department.departmentName ||
        department.name ||
        "-";


    const code =
        department.department_code ||
        department.departmentCode ||
        department.code ||
        "-";


    const description =
        department.description ||
        "-";


    const status =
        String(
            department.status ||
            "active"
        ).toLowerCase();


    const createdAt =
        department.created_at ||
        department.createdAt;


    return `
        <tr>

            <td>
                ${escapeHtml(name)}
            </td>

            <td>
                ${escapeHtml(code)}
            </td>

            <td>
                ${escapeHtml(description)}
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
                        onclick="editDepartment('${escapeJs(id)}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        onclick="deleteDepartment('${escapeJs(id)}')"
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
| ADD DEPARTMENT
|--------------------------------------------------------------------------
*/

function addDepartment() {

    window.location.href =
        "department-form.html";

}


/*
|--------------------------------------------------------------------------
| EDIT DEPARTMENT
|--------------------------------------------------------------------------
*/

function editDepartment(
    id
) {

    window.location.href =
        `department-form.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| DELETE DEPARTMENT
|--------------------------------------------------------------------------
*/

async function deleteDepartment(
    id
) {

    const department =
        departments.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const departmentName =
        department
            ? (
                department.department_name ||
                department.departmentName ||
                department.name ||
                "this department"
            )
            : "this department";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${departmentName}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/departments/${id}`,
            {
                method: "DELETE"
            }
        );


        showMessage(
            "Department deleted successfully.",
            "success"
        );


        await loadDepartments();


    } catch (error) {

        console.error(
            "Delete department error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to delete department.",
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| VIEW DEPARTMENT
|--------------------------------------------------------------------------
*/

function viewDepartment(
    id
) {

    window.location.href =
        `department-profile.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderDepartments
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
        renderDepartments
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
                Loading departments...
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

        archived:
            "Archived"

    };


    return (
        labels[status] ||
        status
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

window.loadDepartments =
    loadDepartments;

window.addDepartment =
    addDepartment;

window.editDepartment =
    editDepartment;

window.deleteDepartment =
    deleteDepartment;

window.viewDepartment =
    viewDepartment;


/*
|--------------------------------------------------------------------------
| INITIALISE PAGE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadDepartments();

    }
);