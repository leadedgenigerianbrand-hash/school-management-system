const API_BASE = "/api";

let classArms = [];
let classes = [];
let teachers = [];

const tableBody =
    document.getElementById("classArmsTableBody") ||
    document.getElementById("classArmTableBody") ||
    document.querySelector("#classArmsTable tbody");

const searchInput =
    document.getElementById("searchInput");

const classFilter =
    document.getElementById("classFilter");

const statusFilter =
    document.getElementById("statusFilter");

const messageContainer =
    document.getElementById("message");


/*
|--------------------------------------------------------------------------
| Authentication
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
| API Request
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

        data = await response.json();

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
| Show Message
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
| Load Classes
|--------------------------------------------------------------------------
*/

async function loadClasses() {

    try {

        const result =
            await apiRequest(
                "/classes"
            );


        classes =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.classes)
                    ? result.classes
                    : Array.isArray(result)
                        ? result
                        : [];


        populateClassFilter();


    } catch (error) {

        console.error(
            "Load classes error:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| Populate Class Filter
|--------------------------------------------------------------------------
*/

function populateClassFilter() {

    if (!classFilter) {
        return;
    }


    classFilter.innerHTML =
        `
        <option value="">
            All Classes
        </option>
        `;


    classes.forEach(
        schoolClass => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                schoolClass.id;


            option.textContent =
                schoolClass.class_name ||
                schoolClass.className ||
                schoolClass.name ||
                `Class ${schoolClass.id}`;


            classFilter.appendChild(
                option
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| Load Teachers
|--------------------------------------------------------------------------
*/

async function loadTeachers() {

    try {

        const result =
            await apiRequest(
                "/staff"
            );


        teachers =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.staff)
                    ? result.staff
                    : Array.isArray(result)
                        ? result
                        : [];


    } catch (error) {

        console.error(
            "Load teachers error:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| Load Class Arms
|--------------------------------------------------------------------------
*/

async function loadClassArms() {

    try {

        showLoading();


        const result =
            await apiRequest(
                "/class-arms"
            );


        classArms =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.classArms)
                    ? result.classArms
                    : Array.isArray(result)
                        ? result
                        : [];


        renderClassArms();


    } catch (error) {

        console.error(
            "Load class arms error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to load class arms.",
            "error"
        );


        showEmpty(
            "Unable to load class arms."
        );

    }

}


/*
|--------------------------------------------------------------------------
| Render Class Arms
|--------------------------------------------------------------------------
*/

function renderClassArms() {

    if (!tableBody) {
        return;
    }


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedClass =
        classFilter
            ? classFilter.value
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .toLowerCase()
            : "";


    const filtered =
        classArms.filter(
            arm => {

                const armName =
                    String(
                        arm.arm_name ||
                        arm.armName ||
                        ""
                    ).toLowerCase();


                const armCode =
                    String(
                        arm.arm_code ||
                        arm.armCode ||
                        ""
                    ).toLowerCase();


                const className =
                    String(
                        arm.class_name ||
                        arm.className ||
                        getClassName(
                            arm.class_id ||
                            arm.classId
                        ) ||
                        ""
                    ).toLowerCase();


                const status =
                    String(
                        arm.status ||
                        "active"
                    ).toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    armName.includes(searchTerm) ||
                    armCode.includes(searchTerm) ||
                    className.includes(searchTerm);


                const matchesClass =
                    !selectedClass ||
                    String(
                        arm.class_id ||
                        arm.classId ||
                        ""
                    ) ===
                    String(selectedClass);


                const matchesStatus =
                    !selectedStatus ||
                    status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesClass &&
                    matchesStatus
                );

            }
        );


    if (filtered.length === 0) {

        showEmpty(
            "No class arms found."
        );

        return;

    }


    tableBody.innerHTML =
        filtered
            .map(
                arm =>
                    createRow(
                        arm
                    )
            )
            .join("");

}


/*
|--------------------------------------------------------------------------
| Create Table Row
|--------------------------------------------------------------------------
*/

function createRow(
    arm
) {

    const id =
        arm.id;


    const className =
        arm.class_name ||
        arm.className ||
        getClassName(
            arm.class_id ||
            arm.classId
        ) ||
        "-";


    const armName =
        arm.arm_name ||
        arm.armName ||
        "-";


    const armCode =
        arm.arm_code ||
        arm.armCode ||
        "-";


    const capacity =
        arm.capacity ??
        "-";


    const teacher =
        getTeacherName(
            arm.class_teacher_id ||
            arm.classTeacherId ||
            arm.teacher_id ||
            arm.teacherId
        ) ||
        arm.teacher_name ||
        arm.teacherName ||
        "-";


    const status =
        String(
            arm.status ||
            "active"
        ).toLowerCase();


    return `
        <tr>

            <td>
                ${escapeHtml(className)}
            </td>

            <td>
                ${escapeHtml(armName)}
            </td>

            <td>
                ${escapeHtml(armCode)}
            </td>

            <td>
                ${escapeHtml(capacity)}
            </td>

            <td>
                ${escapeHtml(teacher)}
            </td>

            <td>
                <span class="status-badge status-${escapeHtml(status)}">
                    ${formatStatus(status)}
                </span>
            </td>

            <td>

                <div class="action-buttons">

                    <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        onclick="editClassArm('${escapeJs(id)}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        onclick="deleteClassArm('${escapeJs(id)}')"
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
| Get Class Name
|--------------------------------------------------------------------------
*/

function getClassName(
    classId
) {

    if (!classId) {
        return "";
    }


    const schoolClass =
        classes.find(
            item =>
                String(item.id) ===
                String(classId)
        );


    if (!schoolClass) {
        return "";
    }


    return (
        schoolClass.class_name ||
        schoolClass.className ||
        schoolClass.name ||
        ""
    );

}


/*
|--------------------------------------------------------------------------
| Get Teacher Name
|--------------------------------------------------------------------------
*/

function getTeacherName(
    teacherId
) {

    if (!teacherId) {
        return "";
    }


    const teacher =
        teachers.find(
            item =>
                String(item.id) ===
                String(teacherId)
        );


    if (!teacher) {
        return "";
    }


    const firstName =
        teacher.first_name ||
        teacher.firstName ||
        "";


    const lastName =
        teacher.last_name ||
        teacher.lastName ||
        "";


    const fullName =
        `${firstName} ${lastName}`
            .trim();


    return (
        fullName ||
        teacher.staff_name ||
        teacher.staffName ||
        teacher.name ||
        ""
    );

}


/*
|--------------------------------------------------------------------------
| Format Status
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
| Loading State
|--------------------------------------------------------------------------
*/

function showLoading() {

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>

            <td
                colspan="7"
                style="
                    text-align:center;
                    padding:30px;
                "
            >
                Loading class arms...
            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| Empty State
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
                colspan="7"
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
| Add Class Arm
|--------------------------------------------------------------------------
*/

function addClassArm() {

    window.location.href =
        "class-arm-form.html";

}


/*
|--------------------------------------------------------------------------
| Edit Class Arm
|--------------------------------------------------------------------------
*/

function editClassArm(
    id
) {

    window.location.href =
        `class-arm-form.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| Delete Class Arm
|--------------------------------------------------------------------------
*/

async function deleteClassArm(
    id
) {

    const arm =
        classArms.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const armName =
        arm
            ? (
                arm.arm_name ||
                arm.armName ||
                "this class arm"
            )
            : "this class arm";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${armName}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/class-arms/${id}`,
            {
                method: "DELETE"
            }
        );


        showMessage(
            "Class arm deleted successfully.",
            "success"
        );


        await loadClassArms();


    } catch (error) {

        console.error(
            "Delete class arm error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to delete class arm.",
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderClassArms
    );

}


/*
|--------------------------------------------------------------------------
| Class Filter
|--------------------------------------------------------------------------
*/

if (classFilter) {

    classFilter.addEventListener(
        "change",
        renderClassArms
    );

}


/*
|--------------------------------------------------------------------------
| Status Filter
|--------------------------------------------------------------------------
*/

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        renderClassArms
    );

}


/*
|--------------------------------------------------------------------------
| Escape HTML
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
| Escape JavaScript
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
| Global Functions
|--------------------------------------------------------------------------
*/

window.loadClassArms =
    loadClassArms;

window.addClassArm =
    addClassArm;

window.editClassArm =
    editClassArm;

window.deleteClassArm =
    deleteClassArm;


/*
|--------------------------------------------------------------------------
| Initialisation
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        await Promise.all([
            loadClasses(),
            loadTeachers()
        ]);


        await loadClassArms();

    }
);