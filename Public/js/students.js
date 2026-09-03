"use strict";

const STUDENTS_API = "/api/students";

let students = [];
let filteredStudents = [];

let currentPage = 1;

const PAGE_SIZE = 10;

let studentToDelete = null;


/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    initializeStudentsPage
);

async function initializeStudentsPage() {

    if (typeof protectPage === "function") {

        try {
            await protectPage();
        } catch (error) {
            console.error(
                "Page protection error:",
                error
            );
        }
    }

    initializeElements();
    initializeEvents();

    await loadStudents();
}


/*
|--------------------------------------------------------------------------
| ELEMENTS
|--------------------------------------------------------------------------
*/

let tableBody;
let searchInput;
let statusFilter;
let genderFilter;
let refreshButton;
let addStudentButton;

let previousButton;
let nextButton;
let pageNumber;

let showingFrom;
let showingTo;
let totalResults;

let totalStudents;
let activeStudents;
let maleStudents;
let femaleStudents;

let deleteModal;
let deleteStudentName;
let confirmDeleteButton;
let closeDeleteModalButton;
let cancelDeleteButton;


/*
|--------------------------------------------------------------------------
| INITIALIZE ELEMENTS
|--------------------------------------------------------------------------
*/

function initializeElements() {

    tableBody =
        document.getElementById("studentsTableBody");

    searchInput =
        document.getElementById("searchInput");

    statusFilter =
        document.getElementById("statusFilter");

    genderFilter =
        document.getElementById("genderFilter");

    refreshButton =
        document.getElementById("refreshButton");

    addStudentButton =
        document.getElementById("addStudentButton");

    previousButton =
        document.getElementById("previousButton");

    nextButton =
        document.getElementById("nextButton");

    pageNumber =
        document.getElementById("pageNumber");

    showingFrom =
        document.getElementById("showingFrom");

    showingTo =
        document.getElementById("showingTo");

    totalResults =
        document.getElementById("totalResults");

    totalStudents =
        document.getElementById("totalStudents");

    activeStudents =
        document.getElementById("activeStudents");

    maleStudents =
        document.getElementById("maleStudents");

    femaleStudents =
        document.getElementById("femaleStudents");

    deleteModal =
        document.getElementById("deleteModal");

    deleteStudentName =
        document.getElementById("deleteStudentName");

    confirmDeleteButton =
        document.getElementById("confirmDeleteButton");

    closeDeleteModalButton =
        document.getElementById("closeDeleteModal");

    cancelDeleteButton =
        document.getElementById("cancelDeleteModal") ||
        document.getElementById("cancelDeleteButton");
}


/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

function initializeEvents() {

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            handleFilters
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            handleFilters
        );
    }

    if (genderFilter) {
        genderFilter.addEventListener(
            "change",
            handleFilters
        );
    }

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadStudents
        );
    }

    if (addStudentButton) {
        addStudentButton.addEventListener(
            "click",
            function () {
                window.location.href =
                    "/pages/student-form.html";
            }
        );
    }

    if (previousButton) {
        previousButton.addEventListener(
            "click",
            function () {

                if (currentPage > 1) {
                    currentPage--;
                    renderStudents();
                }

            }
        );
    }

    if (nextButton) {
        nextButton.addEventListener(
            "click",
            function () {

                const totalPages =
                    getTotalPages();

                if (currentPage < totalPages) {
                    currentPage++;
                    renderStudents();
                }

            }
        );
    }

    if (tableBody) {
        tableBody.addEventListener(
            "click",
            handleTableAction
        );
    }

    if (closeDeleteModalButton) {
        closeDeleteModalButton.addEventListener(
            "click",
            closeDeleteModal
        );
    }

    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener(
            "click",
            closeDeleteModal
        );
    }

    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener(
            "click",
            confirmDeleteStudent
        );
    }

    if (deleteModal) {
        deleteModal.addEventListener(
            "click",
            function (event) {

                if (event.target === deleteModal) {
                    closeDeleteModal();
                }

            }
        );
    }

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                deleteModal &&
                !deleteModal.hidden
            ) {
                closeDeleteModal();
            }

        }
    );
}


/*
|--------------------------------------------------------------------------
| LOAD STUDENTS
|--------------------------------------------------------------------------
*/

async function loadStudents() {

    if (!tableBody) {
        return;
    }

    showLoading();

    try {

        if (typeof apiGet !== "function") {
            throw new Error(
                "API service is not available."
            );
        }

        /*
         * IMPORTANT:
         * Use the complete API path.
         * This sends the JWT through apiGet().
         */

        const data =
            await apiGet(STUDENTS_API);

        if (!data) {
            throw new Error(
                "Unable to load students."
            );
        }

        students =
            extractStudents(data);

        updateStatistics();

        currentPage = 1;

        applyFilters();

    } catch (error) {

        console.error(
            "Load students error:",
            error
        );

        students = [];
        filteredStudents = [];

        updateStatistics();
        renderStudents();

        showMessage(
            error.message ||
            "Unable to load students.",
            "error"
        );
    }
}


/*
|--------------------------------------------------------------------------
| EXTRACT STUDENTS
|--------------------------------------------------------------------------
*/

function extractStudents(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.students)
    ) {
        return data.students;
    }

    if (
        data &&
        Array.isArray(data.data)
    ) {
        return data.data;
    }

    if (
        data &&
        data.data &&
        Array.isArray(data.data.students)
    ) {
        return data.data.students;
    }

    if (
        data &&
        Array.isArray(data.rows)
    ) {
        return data.rows;
    }

    return [];
}


/*
|--------------------------------------------------------------------------
| FILTERS
|--------------------------------------------------------------------------
*/

function handleFilters() {

    currentPage = 1;

    applyFilters();
}


function applyFilters() {

    const search =
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

    const selectedGender =
        genderFilter
            ? genderFilter.value
                .trim()
                .toLowerCase()
            : "";

    filteredStudents =
        students.filter(
            function (student) {

                const name =
                    getStudentName(student)
                        .toLowerCase();

                const admissionNumber =
                    String(
                        getField(
                            student,
                            "admission_number",
                            "admissionNumber"
                        ) || ""
                    ).toLowerCase();

                const studentNumber =
                    String(
                        getField(
                            student,
                            "student_number",
                            "studentNumber"
                        ) || ""
                    ).toLowerCase();

                const phone =
                    String(
                        getField(
                            student,
                            "phone",
                            "phoneNumber"
                        ) || ""
                    ).toLowerCase();

                const email =
                    String(
                        getField(
                            student,
                            "email",
                            "email"
                        ) || ""
                    ).toLowerCase();

                const status =
                    String(
                        getField(
                            student,
                            "status",
                            "status"
                        ) || "active"
                    ).toLowerCase();

                const gender =
                    String(
                        getField(
                            student,
                            "gender",
                            "gender"
                        ) || ""
                    ).toLowerCase();

                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    admissionNumber.includes(search) ||
                    studentNumber.includes(search) ||
                    phone.includes(search) ||
                    email.includes(search);

                const matchesStatus =
                    !selectedStatus ||
                    status === selectedStatus;

                const matchesGender =
                    !selectedGender ||
                    gender === selectedGender;

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesGender
                );
            }
        );

    renderStudents();
}


/*
|--------------------------------------------------------------------------
| RENDER STUDENTS
|--------------------------------------------------------------------------
*/

function renderStudents() {

    if (!tableBody) {
        return;
    }

    const total =
        filteredStudents.length;

    const totalPages =
        getTotalPages();

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start =
        (currentPage - 1) * PAGE_SIZE;

    const end =
        Math.min(
            start + PAGE_SIZE,
            total
        );

    const pageStudents =
        filteredStudents.slice(
            start,
            end
        );

    tableBody.innerHTML = "";

    if (pageStudents.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-cell"
                >
                    No students found.
                </td>
            </tr>
        `;
    }

    pageStudents.forEach(
        function (student, index) {

            const id =
                getStudentId(student);

            const name =
                getStudentName(student);

            const admissionNumber =
                getField(
                    student,
                    "admission_number",
                    "admissionNumber"
                );

            const gender =
                getField(
                    student,
                    "gender",
                    "gender"
                );

            const className =
                getField(
                    student,
                    "class_name",
                    "className"
                ) ||
                getField(
                    student,
                    "class",
                    "class"
                ) ||
                getField(
                    student,
                    "class_level",
                    "classLevel"
                );

            const classArm =
                getField(
                    student,
                    "class_arm_name",
                    "classArmName"
                ) ||
                getField(
                    student,
                    "class_arm",
                    "classArm"
                );

            const phone =
                getField(
                    student,
                    "phone",
                    "phoneNumber"
                );

            const status =
                getField(
                    student,
                    "status",
                    "status"
                ) || "active";

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${start + index + 1}
                </td>

                <td>
                    <span class="admission-number">
                        ${escapeHtml(
                            valueOrDash(
                                admissionNumber
                            )
                        )}
                    </span>
                </td>

                <td>
                    <span class="student-name">
                        ${escapeHtml(
                            valueOrDash(name)
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHtml(
                        valueOrDash(gender)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        valueOrDash(className)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        valueOrDash(classArm)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        valueOrDash(phone)
                    )}
                </td>

                <td>
                    <span
                        class="${getStatusClass(status)}"
                    >
                        ${escapeHtml(status)}
                    </span>
                </td>

                <td>
                    <div class="actions">

                        <button
                            type="button"
                            class="action-button view-button"
                            data-action="view"
                            data-id="${escapeHtml(id)}"
                        >
                            View
                        </button>

                        <button
                            type="button"
                            class="action-button edit-button"
                            data-action="edit"
                            data-id="${escapeHtml(id)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="action-button delete-button"
                            data-action="delete"
                            data-id="${escapeHtml(id)}"
                        >
                            Delete
                        </button>

                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        }
    );

    updatePagination(
        total,
        start,
        end,
        totalPages
    );
}


/*
|--------------------------------------------------------------------------
| TABLE ACTION
|--------------------------------------------------------------------------
*/

function handleTableAction(event) {

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

        showMessage(
            "Student ID was not found.",
            "error"
        );

        return;
    }

    if (action === "view") {
        viewStudent(id);
    }

    if (action === "edit") {
        editStudent(id);
    }

    if (action === "delete") {
        openDeleteModal(id);
    }
}


/*
|--------------------------------------------------------------------------
| VIEW STUDENT
|--------------------------------------------------------------------------
*/

function viewStudent(id) {

    window.location.href =
        "/pages/student-profile.html?id=" +
        encodeURIComponent(id);
}


/*
|--------------------------------------------------------------------------
| EDIT STUDENT
|--------------------------------------------------------------------------
*/

function editStudent(id) {

    window.location.href =
        "/pages/student-form.html?id=" +
        encodeURIComponent(id);
}


/*
|--------------------------------------------------------------------------
| DELETE MODAL
|--------------------------------------------------------------------------
*/

function openDeleteModal(id) {

    const student =
        students.find(
            function (item) {
                return String(
                    getStudentId(item)
                ) === String(id);
            }
        );

    if (!student) {

        showMessage(
            "Student record was not found.",
            "error"
        );

        return;
    }

    studentToDelete = id;

    if (deleteStudentName) {
        deleteStudentName.textContent =
            getStudentName(student) ||
            "this student";
    }

    if (deleteModal) {
        deleteModal.hidden = false;
    }
}


function closeDeleteModal() {

    studentToDelete = null;

    if (deleteModal) {
        deleteModal.hidden = true;
    }
}


/*
|--------------------------------------------------------------------------
| DELETE STUDENT
|--------------------------------------------------------------------------
*/

async function confirmDeleteStudent() {

    if (!studentToDelete) {
        return;
    }

    try {

        if (confirmDeleteButton) {
            confirmDeleteButton.disabled = true;
            confirmDeleteButton.textContent =
                "Deleting...";
        }

        if (typeof apiDelete !== "function") {
            throw new Error(
                "API service is not available."
            );
        }

        const data =
            await apiDelete(
                STUDENTS_API +
                "/" +
                encodeURIComponent(
                    studentToDelete
                )
            );

        if (!data) {
            throw new Error(
                "Unable to delete student."
            );
        }

        closeDeleteModal();

        showMessage(
            "Student deleted successfully.",
            "success"
        );

        await loadStudents();

    } catch (error) {

        console.error(
            "Delete student error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to delete student.",
            "error"
        );

    } finally {

        if (confirmDeleteButton) {
            confirmDeleteButton.disabled = false;
            confirmDeleteButton.textContent =
                "Delete Student";
        }
    }
}


/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

function updateStatistics() {

    const total =
        students.length;

    const active =
        students.filter(
            function (student) {

                return String(
                    getField(
                        student,
                        "status",
                        "status"
                    ) || "active"
                )
                    .toLowerCase() ===
                    "active";
            }
        ).length;

    const male =
        students.filter(
            function (student) {

                return String(
                    getField(
                        student,
                        "gender",
                        "gender"
                    ) || ""
                )
                    .toLowerCase() ===
                    "male";
            }
        ).length;

    const female =
        students.filter(
            function (student) {

                return String(
                    getField(
                        student,
                        "gender",
                        "gender"
                    ) || ""
                )
                    .toLowerCase() ===
                    "female";
            }
        ).length;

    if (totalStudents) {
        totalStudents.textContent = total;
    }

    if (activeStudents) {
        activeStudents.textContent = active;
    }

    if (maleStudents) {
        maleStudents.textContent = male;
    }

    if (femaleStudents) {
        femaleStudents.textContent = female;
    }
}


/*
|--------------------------------------------------------------------------
| PAGINATION
|--------------------------------------------------------------------------
*/

function getTotalPages() {

    return Math.max(
        1,
        Math.ceil(
            filteredStudents.length /
            PAGE_SIZE
        )
    );
}


function updatePagination(
    total,
    start,
    end,
    totalPages
) {

    if (showingFrom) {
        showingFrom.textContent =
            total === 0
                ? 0
                : start + 1;
    }

    if (showingTo) {
        showingTo.textContent = end;
    }

    if (totalResults) {
        totalResults.textContent = total;
    }

    if (pageNumber) {
        pageNumber.textContent =
            "Page " +
            currentPage +
            " of " +
            totalPages;
    }

    if (previousButton) {
        previousButton.disabled =
            currentPage <= 1;
    }

    if (nextButton) {
        nextButton.disabled =
            currentPage >= totalPages;
    }
}


/*
|--------------------------------------------------------------------------
| LOADING
|--------------------------------------------------------------------------
*/

function showLoading() {

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="9"
                class="loading-cell"
            >
                Loading students...
            </td>
        </tr>
    `;
}


/*
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "pageMessage"
        );

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;

    element.className =
        "message " + type;

    setTimeout(
        function () {
            element.className =
                "message";
        },
        4000
    );
}


/*
|--------------------------------------------------------------------------
| STUDENT NAME
|--------------------------------------------------------------------------
*/

function getStudentName(student) {

    if (!student) {
        return "";
    }

    if (student.name) {
        return student.name;
    }

    return [
        student.first_name ||
        student.firstName ||
        "",

        student.middle_name ||
        student.middleName ||
        "",

        student.last_name ||
        student.lastName ||
        ""
    ]
        .filter(Boolean)
        .join(" ");
}


/*
|--------------------------------------------------------------------------
| STUDENT ID
|--------------------------------------------------------------------------
*/

function getStudentId(student) {

    if (!student) {
        return "";
    }

    return (
        student.id ||
        student.student_id ||
        student.studentId ||
        ""
    );
}


/*
|--------------------------------------------------------------------------
| FIELD
|--------------------------------------------------------------------------
*/

function getField(
    student,
    snakeCase,
    camelCase
) {

    if (!student) {
        return "";
    }

    return (
        student[snakeCase] ??
        student[camelCase]
    );
}


/*
|--------------------------------------------------------------------------
| SAFE VALUE
|--------------------------------------------------------------------------
*/

function valueOrDash(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    return value;
}


/*
|--------------------------------------------------------------------------
| STATUS CLASS
|--------------------------------------------------------------------------
*/

function getStatusClass(status) {

    const normalized =
        String(
            status || "active"
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );

    return (
        "status status-" +
        normalized
    );
}


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| GLOBAL EXPORTS
|--------------------------------------------------------------------------
*/

window.students = students;

window.loadStudents =
    loadStudents;

window.viewStudent =
    viewStudent;

window.editStudent =
    editStudent;

window.openDeleteModal =
    openDeleteModal;

window.closeDeleteModal =
    closeDeleteModal;

window.confirmDeleteStudent =
    confirmDeleteStudent;

window.initializeStudentsPage =
    initializeStudentsPage;