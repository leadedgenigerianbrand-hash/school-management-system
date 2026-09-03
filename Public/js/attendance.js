/*
|--------------------------------------------------------------------------
| ATTENDANCE.JS
|--------------------------------------------------------------------------
| Handles the attendance page.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    let currentPage = 1;
    const pageSize = 50;

    let attendanceRecords = [];
    let students = [];
    let classes = [];

    /*
    |--------------------------------------------------------------------------
    | DOM HELPERS
    |--------------------------------------------------------------------------
    */

    function getElement(...selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);

            if (element) {
                return element;
            }
        }

        return null;
    }

    function getValue(...selectors) {
        const element = getElement(...selectors);

        return element
            ? String(element.value || "").trim()
            : "";
    }

    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    */

    async function request(url, options = {}) {
        if (typeof window.apiRequest !== "function") {
            throw new Error(
                "API helper is unavailable. Please reload the page."
            );
        }

        return window.apiRequest(url, options);
    }

    /*
    |--------------------------------------------------------------------------
    | INITIALIZE
    |--------------------------------------------------------------------------
    */

    async function initialize() {
        setDefaultDate();
        setupEvents();

        await loadClasses();
        await loadStudents();
        await loadAttendance();
    }

    /*
    |--------------------------------------------------------------------------
    | DEFAULT DATE
    |--------------------------------------------------------------------------
    */

    function setDefaultDate() {
        const dateInput = getElement(
            "#attendanceDate",
            "#attendance-date",
            "[name='attendance_date']",
            "[name='date']"
        );

        if (dateInput && !dateInput.value) {
            const now = new Date();

            const year = now.getFullYear();

            const month = String(
                now.getMonth() + 1
            ).padStart(2, "0");

            const day = String(
                now.getDate()
            ).padStart(2, "0");

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
        const dateInput = getElement(
            "#attendanceDate",
            "#attendance-date",
            "[name='attendance_date']",
            "[name='date']"
        );

        if (dateInput) {
            dateInput.addEventListener(
                "change",
                function () {
                    currentPage = 1;
                    loadAttendance();
                }
            );
        }

        const classSelect = getElement(
            "#classId",
            "#class-id",
            "[name='class_id']"
        );

        if (classSelect) {
            classSelect.addEventListener(
                "change",
                async function () {
                    currentPage = 1;

                    await loadStudents();
                    await loadAttendance();
                }
            );
        }

        const searchInput = getElement(
            "#attendanceSearch",
            "#attendance-search",
            "[name='search']"
        );

        if (searchInput) {
            const debounce =
                typeof window.App?.debounce === "function"
                    ? window.App.debounce
                    : function (callback) {
                        return callback;
                    };

            searchInput.addEventListener(
                "input",
                debounce(
                    function () {
                        currentPage = 1;
                        renderAttendance();
                    },
                    300
                )
            );
        }

        const form = getElement(
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
                const statusSelect =
                    event.target.closest(
                        ".attendance-status"
                    );

                if (!statusSelect) {
                    return;
                }

                updateStatusLabel(
                    statusSelect
                );
            }
        );

        document.addEventListener(
            "click",
            function (event) {
                const saveButton =
                    event.target.closest(
                        "[data-save-attendance]"
                    );

                if (saveButton) {
                    event.preventDefault();
                    saveAttendance();
                    return;
                }

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
                }
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD CLASSES
    |--------------------------------------------------------------------------
    */

    async function loadClasses() {
        try {
            const data =
                await request("/classes");

            classes =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.classes ||
                        []
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
        const select = getElement(
            "#classId",
            "#class-id",
            "[name='class_id']"
        );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        select.innerHTML =
            `<option value="">All Classes</option>`;

        classes.forEach(function (item) {
            const option =
                document.createElement("option");

            option.value =
                item.id;

            option.textContent =
                item.name ||
                item.class_name ||
                item.className ||
                item.title ||
                `Class ${item.id}`;

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD STUDENTS
    |--------------------------------------------------------------------------
    */

    async function loadStudents() {
        try {
            const classId = getValue(
                "#classId",
                "#class-id",
                "[name='class_id']"
            );

            let url = "/students";

            if (classId) {
                url +=
                    `?class_id=${encodeURIComponent(classId)}`;
            }

            const data =
                await request(url);

            students =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.students ||
                        []
                    );

        } catch (error) {
            console.error(
                "Unable to load students:",
                error
            );

            students = [];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD ATTENDANCE
    |--------------------------------------------------------------------------
    */

    async function loadAttendance() {
        showLoading();

        try {
            const date = getValue(
                "#attendanceDate",
                "#attendance-date",
                "[name='attendance_date']",
                "[name='date']"
            );

            const classId = getValue(
                "#classId",
                "#class-id",
                "[name='class_id']"
            );

            const params =
                new URLSearchParams();

            if (date) {
                params.set("date", date);
            }

            if (classId) {
                params.set(
                    "class_id",
                    classId
                );
            }

            const query =
                params.toString();

            const url =
                query
                    ? `/attendance?${query}`
                    : "/attendance";

            const data =
                await request(url);

            attendanceRecords =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.attendance ||
                        data?.records ||
                        []
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
        const container = getElement(
            "#attendanceTableBody",
            "#attendance-table-body",
            "tbody[data-attendance-body]",
            ".attendance-table tbody"
        );

        if (!container) {
            return;
        }

        const searchInput = getElement(
            "#attendanceSearch",
            "#attendance-search",
            "[name='search']"
        );

        const search =
            searchInput
                ? String(searchInput.value || "")
                    .trim()
                    .toLowerCase()
                : "";

        let records =
            [...attendanceRecords];

        if (search) {
            records =
                records.filter(function (record) {
                    const name =
                        getStudentName(record)
                            .toLowerCase();

                    const admission =
                        String(
                            record.admission_number ||
                            record.admissionNumber ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(search) ||
                        admission.includes(search)
                    );
                });
        }

        if (!records.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="students-empty">
                            <div class="students-empty-icon">
                                ✓
                            </div>
                            <h3>No attendance records</h3>
                            <p>
                                There are no attendance records
                                for the selected date.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        const start =
            (currentPage - 1) * pageSize;

        const end =
            start + pageSize;

        const pageRecords =
            records.slice(start, end);

        container.innerHTML =
            pageRecords
                .map(renderAttendanceRow)
                .join("");
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER ATTENDANCE ROW
    |--------------------------------------------------------------------------
    */

    function renderAttendanceRow(record) {
        const studentName =
            getStudentName(record);

        const admissionNumber =
            record.admission_number ||
            record.admissionNumber ||
            "";

        const status =
            String(
                record.status ||
                "present"
            ).toLowerCase();

        const remarks =
            record.remarks ||
            record.remark ||
            "";

        const studentId =
            record.student_id ||
            record.studentId ||
            "";

        const initials =
            typeof window.App?.getInitials === "function"
                ? window.App.getInitials(studentName)
                : getInitials(studentName);

        const escapeHtml =
            typeof window.App?.escapeHtml === "function"
                ? window.App.escapeHtml
                : escapeAttribute;

        return `
            <tr data-student-id="${escapeAttribute(studentId)}">

                <td>
                    <div class="student-name">
                        <div class="student-avatar">
                            ${escapeHtml(initials)}
                        </div>

                        <div class="student-name-text">
                            <strong>
                                ${escapeHtml(studentName)}
                            </strong>
                        </div>
                    </div>
                </td>

                <td>
                    <span class="admission-number">
                        ${escapeHtml(admissionNumber)}
                    </span>
                </td>

                <td>
                    ${getClassName(record)}
                </td>

                <td>
                    <select
                        class="attendance-status"
                        data-student-id="${escapeAttribute(studentId)}"
                    >
                        ${statusOption("present", status)}
                        ${statusOption("absent", status)}
                        ${statusOption("late", status)}
                        ${statusOption("excused", status)}
                    </select>
                </td>

                <td>
                    <input
                        type="text"
                        class="attendance-remarks"
                        data-student-id="${escapeAttribute(studentId)}"
                        value="${escapeAttribute(remarks)}"
                        placeholder="Remarks"
                    >
                </td>

                <td>
                    <span class="student-status ${escapeAttribute(status)}">
                        ${escapeHtml(capitalize(status))}
                    </span>
                </td>

            </tr>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS OPTION
    |--------------------------------------------------------------------------
    */

    function statusOption(value, selected) {
        return `
            <option
                value="${escapeAttribute(value)}"
                ${value === selected ? "selected" : ""}
            >
                ${capitalize(value)}
            </option>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE ATTENDANCE
    |--------------------------------------------------------------------------
    */

    async function saveAttendance() {
        const date = getValue(
            "#attendanceDate",
            "#attendance-date",
            "[name='attendance_date']",
            "[name='date']"
        );

        if (!date) {
            notify(
                "Please select an attendance date.",
                "error"
            );

            return;
        }

        const rows =
            document.querySelectorAll(
                "tr[data-student-id]"
            );

        const records = [];

        rows.forEach(function (row) {
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
                student_id:
                    Number(studentId),

                attendance_date:
                    date,

                status:
                    statusElement
                        ? statusElement.value
                        : "present",

                remarks:
                    remarksElement
                        ? remarksElement.value.trim()
                        : ""
            });
        });

        if (!records.length) {
            notify(
                "There are no attendance records to save.",
                "error"
            );

            return;
        }

        const saveButton =
            getElement(
                "[data-save-attendance]"
            );

        if (saveButton) {
            saveButton.disabled = true;
        }

        try {
            /*
            |------------------------------------------------------------------
            | Save each attendance record through the confirmed API layer.
            |------------------------------------------------------------------
            */

            for (const record of records) {
                await request(
                    "/attendance",
                    {
                        method: "POST",
                        body: JSON.stringify(record)
                    }
                );
            }

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
                saveButton.disabled = false;
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORM SUBMIT
    |--------------------------------------------------------------------------
    */

    async function handleSubmit(event) {
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
            .forEach(function (select) {
                select.value = "present";
                updateStatusLabel(select);
            });

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
            .forEach(function (select) {
                select.value = "present";
                updateStatusLabel(select);
            });

        document
            .querySelectorAll(
                ".attendance-remarks"
            )
            .forEach(function (input) {
                input.value = "";
            });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS LABEL
    |--------------------------------------------------------------------------
    */

    function updateStatusLabel(select) {
        const row =
            select.closest("tr");

        if (!row) {
            return;
        }

        const label =
            row.querySelector(
                ".student-status"
            );

        if (!label) {
            return;
        }

        const status =
            select.value;

        label.className =
            `student-status ${escapeAttribute(status)}`;

        label.textContent =
            capitalize(status);
    }

    function updateStatusLabels() {
        document
            .querySelectorAll(
                ".attendance-status"
            )
            .forEach(updateStatusLabel);
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT NAME
    |--------------------------------------------------------------------------
    */

    function getStudentName(record) {
        if (record.student_name) {
            return record.student_name;
        }

        if (record.studentName) {
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
    | CLASS NAME
    |--------------------------------------------------------------------------
    */

    function getClassName(record) {
        const value =
            record.class_name ||
            record.className ||
            record.class_arm_name ||
            record.classArmName ||
            "";

        return escapeAttribute(
            value || "-"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    function showLoading() {
        const container = getElement(
            "#attendanceTableBody",
            "#attendance-table-body",
            "tbody[data-attendance-body]",
            ".attendance-table tbody"
        );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="students-loading">
                        <div class="students-loading-spinner"></div>
                        <p>Loading attendance...</p>
                    </div>
                </td>
            </tr>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    function showError(message) {
        const container = getElement(
            "#attendanceTableBody",
            "#attendance-table-body",
            "tbody[data-attendance-body]",
            ".attendance-table tbody"
        );

        if (!container) {
            return;
        }

        const escapeHtml =
            typeof window.App?.escapeHtml === "function"
                ? window.App.escapeHtml
                : escapeAttribute;

        container.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="students-empty">
                        <h3>Unable to load attendance</h3>
                        <p>
                            ${escapeHtml(message)}
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
                document.createElement("div");

            container.id =
                "notification-container";

            container.style.position =
                "fixed";

            container.style.top =
                "20px";

            container.style.right =
                "20px";

            container.style.zIndex =
                "9999";

            document.body.appendChild(
                container
            );
        }

        const notification =
            document.createElement("div");

        notification.className =
            `alert alert-${type}`;

        notification.textContent =
            message;

        notification.style.marginBottom =
            "10px";

        container.appendChild(
            notification
        );

        setTimeout(
            function () {
                notification.remove();
            },
            4000
        );
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    function capitalize(value) {
        if (!value) {
            return "";
        }

        const text =
            String(value);

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1).toLowerCase()
        );
    }

    function escapeAttribute(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function getInitials(name) {
        if (!name) {
            return "";
        }

        return String(name)
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(function (word) {
                return word
                    .charAt(0)
                    .toUpperCase();
            })
            .join("");
    }

    /*
    |--------------------------------------------------------------------------
    | EXPORT
    |--------------------------------------------------------------------------
    */

    window.AttendancePage = {
        initialize,
        loadAttendance,
        loadStudents,
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

})();