"use strict";

| /*                                                                         |
| -------------------------------------------------------------------------- |
| SCHOOL MANAGEMENT SYSTEM                                                   |
| ATTENDANCE JAVASCRIPT                                                      |
| -------------------------------------------------------------------------- |
|                                                                            |
| Handles:                                                                   |
|                                                                            |
| - Academic session selection                                               |
| - Term selection                                                           |
| - Attendance date                                                          |
| - Class selection                                                          |
| - Student loading                                                          |
| - Existing attendance loading                                              |
| - Attendance status selection                                              |
| - Attendance remarks                                                       |
| - Mark all present                                                         |
| - Reset attendance                                                         |
| - Bulk attendance submission                                               |
| - Attendance summary                                                       |
|                                                                            |
| -------------------------------------------------------------------------- |
| */                                                                         |

(function () {

```
/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

let students = [];

let attendanceRecords = [];

let classes = [];

let sessions = [];

let terms = [];


/*
|--------------------------------------------------------------------------
| DOM HELPERS
|--------------------------------------------------------------------------
*/

function getElement(...selectors) {

    for (const selector of selectors) {

        const element =
            document.querySelector(selector);

        if (element) {
            return element;
        }

    }

    return null;
}


function getValue(...selectors) {

    const element =
        getElement(...selectors);

    if (!element) {
        return "";
    }

    return String(
        element.value || ""
    ).trim();

}


/*
|--------------------------------------------------------------------------
| API REQUEST
|--------------------------------------------------------------------------
*/

async function request(
    url,
    options = {}
) {

    if (
        typeof window.apiRequest !==
        "function"
    ) {

        throw new Error(
            "API helper is unavailable. Please reload the page."
        );

    }

    return window.apiRequest(
        url,
        options
    );

}


/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

async function initialize() {

    setDefaultDate();

    setupEvents();

    await Promise.allSettled([
        loadSessions(),
        loadTerms(),
        loadClasses()
    ]);

    await loadStudents();

    await loadAttendance();

}


/*
|--------------------------------------------------------------------------
| DEFAULT DATE
|--------------------------------------------------------------------------
*/

function setDefaultDate() {

    const dateInput =
        getElement(
            "#attendanceDate",
            "#attendance-date",
            "[name='attendance_date']"
        );

    if (
        dateInput &&
        !dateInput.value
    ) {

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );

        dateInput.value =
            `${year}-${month}-${day}`;

    }

}


/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

function setupEvents() {

    const sessionSelect =
        getElement(
            "#sessionId",
            "#session-id",
            "[name='session_id']"
        );

    if (sessionSelect) {

        sessionSelect.addEventListener(
            "change",
            async function () {

                await loadStudents();

                await loadAttendance();

            }
        );

    }


    const termSelect =
        getElement(
            "#termId",
            "#term-id",
            "[name='term_id']"
        );

    if (termSelect) {

        termSelect.addEventListener(
            "change",
            async function () {

                await loadStudents();

                await loadAttendance();

            }
        );

    }


    const dateInput =
        getElement(
            "#attendanceDate",
            "#attendance-date",
            "[name='attendance_date']"
        );

    if (dateInput) {

        dateInput.addEventListener(
            "change",
            async function () {

                await loadAttendance();

            }
        );

    }


    const classSelect =
        getElement(
            "#classId",
            "#class-id",
            "[name='class_id']"
        );

    if (classSelect) {

        classSelect.addEventListener(
            "change",
            async function () {

                await loadStudents();

                await loadAttendance();

            }
        );

    }


    const searchInput =
        getElement(
            "#attendanceSearch",
            "#attendance-search",
            "[name='search']"
        );

    if (searchInput) {

        let timer = null;

        searchInput.addEventListener(
            "input",
            function () {

                clearTimeout(timer);

                timer =
                    setTimeout(
                        function () {

                            renderAttendance();

                        },
                        250
                    );

            }
        );

    }


    const form =
        getElement(
            "#attendanceForm",
            "form[data-attendance-form]"
        );

    if (form) {

        form.addEventListener(
            "submit",
            handleSubmit
        );

    }


    document.addEventListener(
        "change",
        function (event) {

            const select =
                event.target.closest(
                    ".attendance-status"
                );

            if (!select) {
                return;
            }

            updateStatusLabel(
                select
            );

            updateSummary();

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            const markAllButton =
                event.target.closest(
                    "[data-mark-all-present]"
                );

            if (markAllButton) {

                event.preventDefault();

                markAllPresent();

                return;

            }


            const resetButton =
                event.target.closest(
                    "[data-reset-attendance]"
                );

            if (resetButton) {

                event.preventDefault();

                resetAttendance();

                return;

            }


            const saveButton =
                event.target.closest(
                    "[data-save-attendance]"
                );

            if (saveButton) {

                event.preventDefault();

                saveAttendance();

            }

        }
    );

}


/*
|--------------------------------------------------------------------------
| LOAD ACADEMIC SESSIONS
|--------------------------------------------------------------------------
*/

async function loadSessions() {

    const select =
        getElement(
            "#sessionId",
            "#session-id",
            "[name='session_id']"
        );

    if (!select) {
        return;
    }

    try {

        const data =
            await request(
                "/academic-sessions"
            );

        sessions =
            normalizeCollection(
                data,
                [
                    "data",
                    "sessions",
                    "academicSessions"
                ]
            );

        renderSessionOptions();

    } catch (error) {

        console.error(
            "Unable to load academic sessions:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| RENDER SESSION OPTIONS
|--------------------------------------------------------------------------
*/

function renderSessionOptions() {

    const select =
        getElement(
            "#sessionId",
            "#session-id",
            "[name='session_id']"
        );

    if (!select) {
        return;
    }

    const previousValue =
        select.value;

    select.innerHTML =
        `
        <option value="">
            Select Academic Session
        </option>
        `;

    sessions.forEach(
        function (session) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                session.id;

            option.textContent =
                session.session_name ||
                session.sessionName ||
                session.name ||
                `Session ${session.id}`;

            if (
                session.is_current === true ||
                session.isCurrent === true
            ) {

                option.dataset.current =
                    "true";

            }

            select.appendChild(
                option
            );

        }
    );

    if (previousValue) {

        select.value =
            previousValue;

    }

    if (!select.value) {

        const currentOption =
            select.querySelector(
                'option[data-current="true"]'
            );

        if (currentOption) {

            select.value =
                currentOption.value;

        }

    }

}


/*
|--------------------------------------------------------------------------
| LOAD TERMS
|--------------------------------------------------------------------------
*/

async function loadTerms() {

    const select =
        getElement(
            "#termId",
            "#term-id",
            "[name='term_id']"
        );

    if (!select) {
        return;
    }

    try {

        const data =
            await request(
                "/terms"
            );

        terms =
            normalizeCollection(
                data,
                [
                    "data",
                    "terms"
                ]
            );

        renderTermOptions();

    } catch (error) {

        console.error(
            "Unable to load terms:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| RENDER TERM OPTIONS
|--------------------------------------------------------------------------
*/

function renderTermOptions() {

    const select =
        getElement(
            "#termId",
            "#term-id",
            "[name='term_id']"
        );

    if (!select) {
        return;
    }

    const previousValue =
        select.value;

    select.innerHTML =
        `
        <option value="">
            Select Term
        </option>
        `;

    terms
        .sort(
            function (a, b) {

                return Number(
                    a.term_order ??
                    a.termOrder ??
                    0
                ) -
                Number(
                    b.term_order ??
                    b.termOrder ??
                    0
                );

            }
        )
        .forEach(
            function (term) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    term.id;

                option.textContent =
                    term.term_name ||
                    term.termName ||
                    term.name ||
                    `Term ${term.id}`;

                if (
                    term.is_current === true ||
                    term.isCurrent === true
                ) {

                    option.dataset.current =
                        "true";

                }

                select.appendChild(
                    option
                );

            }
        );

    if (previousValue) {

        select.value =
            previousValue;

    }

    if (!select.value) {

        const currentOption =
            select.querySelector(
                'option[data-current="true"]'
            );

        if (currentOption) {

            select.value =
                currentOption.value;

        }

    }

}


/*
|--------------------------------------------------------------------------
| LOAD CLASSES
|--------------------------------------------------------------------------
*/

async function loadClasses() {

    const select =
        getElement(
            "#classId",
            "#class-id",
            "[name='class_id']"
        );

    if (!select) {
        return;
    }

    try {

        const data =
            await request(
                "/classes"
            );

        classes =
            normalizeCollection(
                data,
                [
                    "data",
                    "classes"
                ]
            );

        renderClassOptions();

    } catch (error) {

        console.error(
            "Unable to load classes:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| RENDER CLASS OPTIONS
|--------------------------------------------------------------------------
*/

function renderClassOptions() {

    const select =
        getElement(
            "#classId",
            "#class-id",
            "[name='class_id']"
        );

    if (!select) {
        return;
    }

    const previousValue =
        select.value;

    select.innerHTML =
        `
        <option value="">
            All Classes
        </option>
        `;

    classes.forEach(
        function (item) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item.id;

            option.textContent =
                item.class_name ||
                item.className ||
                item.name ||
                item.title ||
                `Class ${item.id}`;

            select.appendChild(
                option
            );

        }
    );

    if (previousValue) {

        select.value =
            previousValue;

    }

}


/*
|--------------------------------------------------------------------------
| LOAD STUDENTS
|--------------------------------------------------------------------------
*/

async function loadStudents() {

    try {

        const sessionId =
            getValue(
                "#sessionId",
                "#session-id",
                "[name='session_id']"
            );

        const termId =
            getValue(
                "#termId",
                "#term-id",
                "[name='term_id']"
            );

        const classId =
            getValue(
                "#classId",
                "#class-id",
                "[name='class_id']"
            );

        const params =
            new URLSearchParams();

        if (classId) {

            params.set(
                "class_id",
                classId
            );

        }

        if (sessionId) {

            params.set(
                "session_id",
                sessionId
            );

        }

        if (termId) {

            params.set(
                "term_id",
                termId
            );

        }

        const query =
            params.toString();

        const url =
            query
                ? `/students?${query}`
                : "/students";

        const data =
            await request(
                url
            );

        students =
            normalizeCollection(
                data,
                [
                    "data",
                    "students"
                ]
            );

    } catch (error) {

        console.error(
            "Unable to load students:",
            error
        );

        students = [];

        showError(
            error.message ||
            "Unable to load students."
        );

    }

}


/*
|--------------------------------------------------------------------------
| LOAD ATTENDANCE
|--------------------------------------------------------------------------
*/

async function loadAttendance() {

    showLoading();

    const sessionId =
        getValue(
            "#sessionId",
            "#session-id",
            "[name='session_id']"
        );

    const termId =
        getValue(
            "#termId",
            "#term-id",
            "[name='term_id']"
        );

    const date =
        getValue(
            "#attendanceDate",
            "#attendance-date",
            "[name='attendance_date']"
        );

    const classId =
        getValue(
            "#classId",
            "#class-id",
            "[name='class_id']"
        );

    if (
        !sessionId ||
        !termId ||
        !date
    ) {

        attendanceRecords = [];

        renderAttendance();

        return;

    }

    try {

        const params =
            new URLSearchParams();

        params.set(
            "date",
            date
        );

        params.set(
            "session_id",
            sessionId
        );

        params.set(
            "term_id",
            termId
        );

        if (classId) {

            params.set(
                "class_id",
                classId
            );

        }

        const data =
            await request(
                `/attendance?${params.toString()}`
            );

        attendanceRecords =
            normalizeCollection(
                data,
                [
                    "data",
                    "attendance",
                    "records"
                ]
            );

        renderAttendance();

    } catch (error) {

        console.error(
            "Unable to load attendance:",
            error
        );

        attendanceRecords = [];

        showError(
            error.message ||
            "Unable to load attendance."
        );

    }

}


/*
|--------------------------------------------------------------------------
| RENDER ATTENDANCE
|--------------------------------------------------------------------------
*/

function renderAttendance() {

    const container =
        getElement(
            "#attendanceTableBody",
            "#attendance-table-body",
            "tbody[data-attendance-body]"
        );

    if (!container) {
        return;
    }

    const searchInput =
        getElement(
            "#attendanceSearch",
            "#attendance-search",
            "[name='search']"
        );

    const search =
        searchInput
            ? String(
                searchInput.value || ""
            )
                .trim()
                .toLowerCase()
            : "";

    const recordsByStudent =
        new Map();

    attendanceRecords.forEach(
        function (record) {

            const studentId =
                getStudentId(
                    record
                );

            if (studentId) {

                recordsByStudent.set(
                    String(studentId),
                    record
                );

            }

        }
    );

    let records =
        students.map(
            function (student) {

                const studentId =
                    getStudentId(
                        student
                    );

                const existing =
                    recordsByStudent.get(
                        String(studentId)
                    );

                return mergeStudentAttendance(
                    student,
                    existing
                );

            }
        );

    if (!students.length) {

        records =
            attendanceRecords.map(
                function (record) {

                    return mergeStudentAttendance(
                        record,
                        record
                    );

                }
            );

    }

    if (search) {

        records =
            records.filter(
                function (record) {

                    const name =
                        getStudentName(
                            record
                        )
                            .toLowerCase();

                    const admission =
                        getAdmissionNumber(
                            record
                        )
                            .toLowerCase();

                    return (
                        name.includes(search) ||
                        admission.includes(search)
                    );

                }
            );

    }

    if (!records.length) {

        container.innerHTML =
            `
            <tr>
                <td colspan="5">

                    <div class="empty-state">

                        <i class="bi bi-calendar-x"></i>

                        <h5>
                            No students found
                        </h5>

                        <p class="mb-0">
                            Select an academic session,
                            term and class, or adjust
                            your search.
                        </p>

                    </div>

                </td>
            </tr>
            `;

        updateSummary();

        return;

    }

    container.innerHTML =
        records
            .map(
                renderAttendanceRow
            )
            .join("");

    updateSummary();

}


/*
|--------------------------------------------------------------------------
| MERGE STUDENT WITH EXISTING ATTENDANCE
|--------------------------------------------------------------------------
*/

function mergeStudentAttendance(
    student,
    attendance
) {

    const source =
        attendance ||
        {};

    return {
        ...student,
        ...source,

        student_id:
            getStudentId(
                student
            ),

        status:
            source.status ||
            "Present",

        remarks:
            source.remarks ||
            source.remark ||
            ""

    };

}


/*
|--------------------------------------------------------------------------
| RENDER ATTENDANCE ROW
|--------------------------------------------------------------------------
*/

function renderAttendanceRow(
    record
) {

    const studentName =
        getStudentName(
            record
        );

    const admissionNumber =
        getAdmissionNumber(
            record
        );

    const className =
        getClassName(
            record
        );

    const studentId =
        getStudentId(
            record
        );

    const status =
        normalizeStatus(
            record.status
        );

    const remarks =
        record.remarks ||
        record.remark ||
        "";

    const initials =
        typeof window.App?.getInitials ===
        "function"
            ? window.App.getInitials(
                studentName
            )
            : getInitials(
                studentName
            );

    return `
        <tr
            data-student-id="${escapeAttribute(studentId)}"
        >

            <td>

                <div class="d-flex align-items-center gap-2">

                    <div
                        class="student-avatar"
                        aria-hidden="true"
                    >
                        ${escapeHtml(initials)}
                    </div>

                    <div class="student-name">

                        ${escapeHtml(
                            studentName
                        )}

                    </div>

                </div>

            </td>


            <td>

                <span class="admission-number">

                    ${escapeHtml(
                        admissionNumber || "-"
                    )}

                </span>

            </td>


            <td>

                ${escapeHtml(
                    className || "-"
                )}

            </td>


            <td>

                <select
                    class="form-select status-select attendance-status"
                    data-student-id="${escapeAttribute(studentId)}"
                >

                    ${statusOption(
                        "Present",
                        status
                    )}

                    ${statusOption(
                        "Absent",
                        status
                    )}

                    ${statusOption(
                        "Late",
                        status
                    )}

                    ${statusOption(
                        "Excused",
                        status
                    )}

                </select>

            </td>


            <td>

                <input
                    type="text"
                    class="form-control remarks-input attendance-remarks"
                    data-student-id="${escapeAttribute(studentId)}"
                    value="${escapeAttribute(remarks)}"
                    placeholder="Remarks"
                >

            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| STATUS OPTION
|--------------------------------------------------------------------------
*/

function statusOption(
    value,
    selected
) {

    return `
        <option
            value="${escapeAttribute(value)}"
            ${
                value === selected
                    ? "selected"
                    : ""
            }
        >
            ${escapeHtml(value)}
        </option>
    `;

}


/*
|--------------------------------------------------------------------------
| SAVE ATTENDANCE
|--------------------------------------------------------------------------
*/

async function saveAttendance() {

    const sessionId =
        getValue(
            "#sessionId",
            "#session-id",
            "[name='session_id']"
        );

    const termId =
        getValue(
            "#termId",
            "#term-id",
            "[name='term_id']"
        );

    const attendanceDate =
        getValue(
            "#attendanceDate",
            "#attendance-date",
            "[name='attendance_date']"
        );

    const classId =
        getValue(
            "#classId",
            "#class-id",
            "[name='class_id']"
        );

    if (!sessionId) {

        notify(
            "Please select an academic session.",
            "error"
        );

        return;

    }

    if (!termId) {

        notify(
            "Please select a term.",
            "error"
        );

        return;

    }

    if (!attendanceDate) {

        notify(
            "Please select an attendance date.",
            "error"
        );

        return;

    }

    if (!classId) {

        notify(
            "Please select a class before saving attendance.",
            "error"
        );

        return;

    }

    const rows =
        document.querySelectorAll(
            "tr[data-student-id]"
        );

    const records = [];

    rows.forEach(
        function (row) {

            const studentId =
                row.getAttribute(
                    "data-student-id"
                );

            if (!studentId) {
                return;
            }

            const statusElement =
                row.querySelector(
                    ".attendance-status"
                );

            const remarksElement =
                row.querySelector(
                    ".attendance-remarks"
                );

            records.push({

                studentId:
                    studentId,

                status:
                    normalizeStatus(
                        statusElement
                            ? statusElement.value
                            : "Present"
                    ),

                remarks:
                    remarksElement
                        ? String(
                            remarksElement.value ||
                            ""
                        ).trim()
                        : ""

            });

        }
    );

    if (!records.length) {

        notify(
            "There are no students to save.",
            "error"
        );

        return;

    }

    const saveButton =
        getElement(
            "[data-save-attendance]"
        );

    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.innerHTML =
            `
            <span
                class="spinner-border spinner-border-sm me-1"
                aria-hidden="true"
            ></span>
            Saving...
            `;

    }

    try {

        await request(
            "/attendance/bulk",
            {
                method: "POST",

                body:
                    JSON.stringify({

                        classId:
                            classId,

                        sessionId:
                            sessionId,

                        termId:
                            termId,

                        attendanceDate:
                            attendanceDate,

                        records:
                            records

                    })
            }
        );

        notify(
            "Attendance saved successfully.",
            "success"
        );

        await loadAttendance();

    } catch (error) {

        console.error(
            "Attendance save failed:",
            error
        );

        notify(
            error.message ||
            "Unable to save attendance.",
            "error"
        );

    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                `
                <i class="bi bi-cloud-arrow-up me-1"></i>
                Save Attendance
                `;

        }

    }

}


/*
|--------------------------------------------------------------------------
| FORM SUBMIT
|--------------------------------------------------------------------------
*/

async function handleSubmit(
    event
) {

    event.preventDefault();

    await saveAttendance();

}


/*
|--------------------------------------------------------------------------
| MARK ALL PRESENT
|--------------------------------------------------------------------------
*/

function markAllPresent() {

    document
        .querySelectorAll(
            ".attendance-status"
        )
        .forEach(
            function (select) {

                select.value =
                    "Present";

                updateStatusLabel(
                    select
                );

            }
        );

    updateSummary();

    notify(
        "All students marked as present.",
        "success"
    );

}


/*
|--------------------------------------------------------------------------
| RESET ATTENDANCE
|--------------------------------------------------------------------------
*/

function resetAttendance() {

    document
        .querySelectorAll(
            ".attendance-status"
        )
        .forEach(
            function (select) {

                select.value =
                    "Present";

                updateStatusLabel(
                    select
                );

            }
        );


    document
        .querySelectorAll(
            ".attendance-remarks"
        )
        .forEach(
            function (input) {

                input.value =
                    "";

            }
        );

    updateSummary();

}


/*
|--------------------------------------------------------------------------
| UPDATE STATUS LABEL
|--------------------------------------------------------------------------
*/

function updateStatusLabel(
    select
) {

    const row =
        select.closest(
            "tr"
        );

    if (!row) {
        return;
    }

    const status =
        normalizeStatus(
            select.value
        );

    select.value =
        status;

}


/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

function updateSummary() {

    const rows =
        document.querySelectorAll(
            "tr[data-student-id]"
        );

    let present =
        0;

    let absent =
        0;

    let late =
        0;

    let excused =
        0;

    rows.forEach(
        function (row) {

            const select =
                row.querySelector(
                    ".attendance-status"
                );

            const status =
                select
                    ? normalizeStatus(
                        select.value
                    )
                    : "Present";

            if (status === "Present") {
                present++;
            }

            if (status === "Absent") {
                absent++;
            }

            if (status === "Late") {
                late++;
            }

            if (status === "Excused") {
                excused++;
            }

        }
    );


    setText(
        "#totalStudents",
        rows.length
    );

    setText(
        "#presentCount",
        present
    );

    setText(
        "#absentCount",
        absent
    );

    setText(
        "#lateCount",
        late
    );

    setText(
        "#excusedCount",
        excused
    );

}


/*
|--------------------------------------------------------------------------
| STUDENT ID
|--------------------------------------------------------------------------
*/

function getStudentId(
    record
) {

    return (
        record.student_id ||
        record.studentId ||
        record.id ||
        ""
    );

}


/*
|--------------------------------------------------------------------------
| STUDENT NAME
|--------------------------------------------------------------------------
*/

function getStudentName(
    record
) {

    if (
        record.student_name
    ) {

        return record.student_name;

    }

    if (
        record.studentName
    ) {

        return record.studentName;

    }

    const first =
        record.first_name ||
        record.firstName ||
        "";

    const middle =
        record.middle_name ||
        record.middleName ||
        "";

    const last =
        record.last_name ||
        record.lastName ||
        "";

    return [
        first,
        middle,
        last
    ]
        .filter(Boolean)
        .join(" ") ||
        "Unknown Student";

}


/*
|--------------------------------------------------------------------------
| ADMISSION NUMBER
|--------------------------------------------------------------------------
*/

function getAdmissionNumber(
    record
) {

    return String(
        record.admission_number ||
        record.admissionNumber ||
        record.student_number ||
        record.studentNumber ||
        ""
    );

}


/*
|--------------------------------------------------------------------------
| CLASS NAME
|--------------------------------------------------------------------------
*/

function getClassName(
    record
) {

    return (
        record.class_name ||
        record.className ||
        record.class_arm_name ||
        record.classArmName ||
        ""
    );

}


/*
|--------------------------------------------------------------------------
| NORMALIZE STATUS
|--------------------------------------------------------------------------
*/

function normalizeStatus(
    value
) {

    const normalized =
        String(
            value ||
            "Present"
        )
            .trim()
            .toLowerCase();

    if (
        normalized ===
        "absent"
    ) {

        return "Absent";

    }

    if (
        normalized ===
        "late"
    ) {

        return "Late";

    }

    if (
        normalized ===
        "excused"
    ) {

        return "Excused";

    }

    return "Present";

}


/*
|--------------------------------------------------------------------------
| NORMALIZE COLLECTION
|--------------------------------------------------------------------------
*/

function normalizeCollection(
    data,
    keys = []
) {

    if (
        Array.isArray(data)
    ) {

        return data;

    }

    for (
        const key of keys
    ) {

        if (
            Array.isArray(
                data?.[key]
            )
        ) {

            return data[key];

        }

    }

    return [];

}


/*
|--------------------------------------------------------------------------
| LOADING STATE
|--------------------------------------------------------------------------
*/

function showLoading() {

    const container =
        getElement(
            "#attendanceTableBody",
            "#attendance-table-body",
            "tbody[data-attendance-body]"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        `
        <tr>

            <td colspan="5">

                <div class="loading-state">

                    <div
                        class="spinner-border text-primary mb-3"
                        role="status"
                        aria-hidden="true"
                    ></div>

                    <p class="mb-0">
                        Loading attendance...
                    </p>

                </div>

            </td>

        </tr>
        `;

}


/*
|--------------------------------------------------------------------------
| ERROR STATE
|--------------------------------------------------------------------------
*/

function showError(
    message
) {

    const container =
        getElement(
            "#attendanceTableBody",
            "#attendance-table-body",
            "tbody[data-attendance-body]"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        `
        <tr>

            <td colspan="5">

                <div class="empty-state">

                    <i class="bi bi-exclamation-triangle"></i>

                    <h5>
                        Unable to load attendance
                    </h5>

                    <p class="mb-0">
                        ${escapeHtml(
                            message ||
                            "An unexpected error occurred."
                        )}
                    </p>

                </div>

            </td>

        </tr>
        `;

}


/*
|--------------------------------------------------------------------------
| NOTIFICATION
|--------------------------------------------------------------------------
*/

function notify(
    message,
    type = "success"
) {

    if (
        typeof window.showNotification ===
        "function"
    ) {

        window.showNotification(
            message,
            type
        );

        return;

    }

    let container =
        document.querySelector(
            "#notification-container"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "notification-container";

        document.body.appendChild(
            container
        );

    }

    const alert =
        document.createElement(
            "div"
        );

    const bootstrapType =
        type === "error"
            ? "danger"
            : type;

    alert.className =
        `alert alert-${bootstrapType} shadow-sm`;

    alert.textContent =
        message;

    container.appendChild(
        alert
    );

    setTimeout(
        function () {

            alert.remove();

        },
        4000
    );

}


/*
|--------------------------------------------------------------------------
| SET TEXT
|--------------------------------------------------------------------------
*/

function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );

    if (element) {

        element.textContent =
            String(
                value
            );

    }

}


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
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
| ESCAPE ATTRIBUTE
|--------------------------------------------------------------------------
*/

function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/*
|--------------------------------------------------------------------------
| INITIALS
|--------------------------------------------------------------------------
*/

function getInitials(
    name
) {

    if (!name) {
        return "";
    }

    return String(
        name
    )
        .trim()
        .split(
            /\s+/
        )
        .slice(
            0,
            2
        )
        .map(
            function (word) {

                return word
                    .charAt(0)
                    .toUpperCase();

            }
        )
        .join("");

}


/*
|--------------------------------------------------------------------------
| PUBLIC API
|--------------------------------------------------------------------------
*/

window.AttendancePage = {

    initialize,

    loadSessions,

    loadTerms,

    loadClasses,

    loadStudents,

    loadAttendance,

    saveAttendance,

    markAllPresent,

    resetAttendance

};


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

} else {

    initialize();

}
```

})();
