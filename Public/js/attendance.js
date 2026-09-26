"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| ATTENDANCE JAVASCRIPT
|--------------------------------------------------------------------------
|
| Supports:
|
| - Student attendance
| - Staff attendance
| - All attendance
| - Academic session selection
| - Term selection
| - Attendance date
| - Class selection
| - Student loading
| - Staff loading
| - Existing attendance loading
| - Attendance status selection
| - Attendance remarks
| - Search
| - Mark all present
| - Reset attendance
| - Bulk student attendance submission
| - Individual staff attendance submission
| - Attendance summary
|
|--------------------------------------------------------------------------
*/

(function () {

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    let attendanceType = "student";

    let students = [];

    let staff = [];

    let attendanceRecords = [];

    let staffAttendanceRecords = [];

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

        setupAttendanceModes();

        updateInterfaceForMode();

        await Promise.allSettled([
            loadSessions(),
            loadTerms(),
            loadClasses()
        ]);

        await loadPeople();

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
    | ATTENDANCE MODE BUTTONS
    |--------------------------------------------------------------------------
    */

    function setupAttendanceModes() {

        const modeButtons =
            document.querySelectorAll(
                "[data-attendance-type]"
            );

        modeButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    async function (event) {

                        event.preventDefault();

                        const type =
                            button.getAttribute(
                                "data-attendance-type"
                            );

                        if (
                            type !== "student" &&
                            type !== "staff" &&
                            type !== "all"
                        ) {
                            return;
                        }

                        if (
                            attendanceType === type
                        ) {
                            return;
                        }

                        attendanceType =
                            type;

                        updateInterfaceForMode();

                        await loadPeople();

                        await loadAttendance();

                    }
                );

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE INTERFACE FOR MODE
    |--------------------------------------------------------------------------
    */

    function updateInterfaceForMode() {

        const modeButtons =
            document.querySelectorAll(
                "[data-attendance-type]"
            );

        modeButtons.forEach(
            function (button) {

                const type =
                    button.getAttribute(
                        "data-attendance-type"
                    );

                const active =
                    type === attendanceType;

                button.classList.toggle(
                    "active",
                    active
                );

                button.setAttribute(
                    "aria-pressed",
                    active
                        ? "true"
                        : "false"
                );

            }
        );


        const classFilterContainer =
            getElement(
                "#classFilterContainer"
            );

        if (classFilterContainer) {

            if (
                attendanceType === "staff"
            ) {

                classFilterContainer.style.display =
                    "none";

            } else {

                classFilterContainer.style.display =
                    "";

            }

        }


        const searchLabel =
            getElement(
                "#attendanceSearchLabel",
                "label[for='attendanceSearch']",
                "label[for='attendance-search']"
            );

        if (searchLabel) {

            if (
                attendanceType === "student"
            ) {

                searchLabel.textContent =
                    "Search Student";

            } else if (
                attendanceType === "staff"
            ) {

                searchLabel.textContent =
                    "Search Staff";

            } else {

                searchLabel.textContent =
                    "Search Students / Staff";

            }

        }


        const searchHelp =
            getElement(
                "#attendanceSearchHelp",
                "#attendance-search-help"
            );

        if (searchHelp) {

            if (
                attendanceType === "student"
            ) {

                searchHelp.textContent =
                    "Search by student name or admission number.";

            } else if (
                attendanceType === "staff"
            ) {

                searchHelp.textContent =
                    "Search by staff name, staff number or department.";

            } else {

                searchHelp.textContent =
                    "Search students by name/admission number or staff by name/staff number/department.";

            }

        }


        updateTotalLabel();

    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE TOTAL LABEL
    |--------------------------------------------------------------------------
    */

    function updateTotalLabel() {

        const label =
            getElement(
                "#totalLabel"
            );

        if (!label) {
            return;
        }

        if (
            attendanceType === "student"
        ) {

            label.textContent =
                "Total Students";

        } else if (
            attendanceType === "staff"
        ) {

            label.textContent =
                "Total Staff";

        } else {

            label.textContent =
                "Total People";

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

                    await loadPeople();

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

                    await loadPeople();

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

                    await loadPeople();

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
                            200
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
    | LOAD PEOPLE
    |--------------------------------------------------------------------------
    */

    async function loadPeople() {

        if (
            attendanceType === "student"
        ) {

            await loadStudents();

            return;

        }

        if (
            attendanceType === "staff"
        ) {

            await loadStaff();

            return;

        }

        await Promise.all([
            loadStudents(),
            loadStaff()
        ]);

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

            if (
                attendanceType === "student" ||
                attendanceType === "all"
            ) {

                showError(
                    error.message ||
                    "Unable to load students."
                );

            }

        }

    }


    /*
    |--------------------------------------------------------------------------
    | LOAD STAFF
    |--------------------------------------------------------------------------
    */

    async function loadStaff() {

        try {

            const data =
                await request(
                    "/staff"
                );

            staff =
                normalizeCollection(
                    data,
                    [
                        "data",
                        "staff"
                    ]
                );

        } catch (error) {

            console.error(
                "Unable to load staff:",
                error
            );

            staff = [];

            if (
                attendanceType === "staff" ||
                attendanceType === "all"
            ) {

                showError(
                    error.message ||
                    "Unable to load staff."
                );

            }

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

            staffAttendanceRecords = [];

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


            attendanceRecords = [];

            staffAttendanceRecords = [];


            if (
                attendanceType === "student" ||
                attendanceType === "all"
            ) {

                try {

                    const studentData =
                        await request(
                            `/attendance?${params.toString()}`
                        );

                    attendanceRecords =
                        normalizeCollection(
                            studentData,
                            [
                                "data",
                                "attendance",
                                "records"
                            ]
                        );

                } catch (studentError) {

                    console.error(
                        "Unable to load student attendance:",
                        studentError
                    );

                    if (
                        attendanceType === "student"
                    ) {

                        throw studentError;

                    }

                }

            }


            if (
                attendanceType === "staff" ||
                attendanceType === "all"
            ) {

                try {

                    const staffData =
                        await request(
                            `/attendance/staff/date?${params.toString()}`
                        );

                    staffAttendanceRecords =
                        normalizeCollection(
                            staffData,
                            [
                                "data",
                                "attendance",
                                "records"
                            ]
                        );

                } catch (staffError) {

                    console.error(
                        "Unable to load staff attendance:",
                        staffError
                    );

                    if (
                        attendanceType === "staff"
                    ) {

                        throw staffError;

                    }

                }

            }


            renderAttendance();

        } catch (error) {

            console.error(
                "Unable to load attendance:",
                error
            );

            attendanceRecords = [];

            staffAttendanceRecords = [];

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


        const studentAttendanceMap =
            new Map();

        attendanceRecords.forEach(
            function (record) {

                const studentId =
                    getStudentId(
                        record
                    );

                if (studentId) {

                    studentAttendanceMap.set(
                        String(studentId),
                        record
                    );

                }

            }
        );


        const staffAttendanceMap =
            new Map();

        staffAttendanceRecords.forEach(
            function (record) {

                const staffId =
                    getStaffId(
                        record
                    );

                if (staffId) {

                    staffAttendanceMap.set(
                        String(staffId),
                        record
                    );

                }

            }
        );


        let records = [];


        /*
        ----------------------------------------------------------------------
        STUDENTS
        ----------------------------------------------------------------------
        */

        if (
            attendanceType === "student" ||
            attendanceType === "all"
        ) {

            const studentRecords =
                students.map(
                    function (student) {

                        const studentId =
                            getStudentId(
                                student
                            );

                        const existing =
                            studentAttendanceMap.get(
                                String(studentId)
                            );

                        return mergeStudentAttendance(
                            student,
                            existing
                        );

                    }
                );

            records.push(
                ...studentRecords
            );

        }


        /*
        ----------------------------------------------------------------------
        STAFF
        ----------------------------------------------------------------------
        */

        if (
            attendanceType === "staff" ||
            attendanceType === "all"
        ) {

            const staffRecords =
                staff.map(
                    function (person) {

                        const staffId =
                            getStaffId(
                                person
                            );

                        const existing =
                            staffAttendanceMap.get(
                                String(staffId)
                            );

                        return mergeStaffAttendance(
                            person,
                            existing
                        );

                    }
                );

            records.push(
                ...staffRecords
            );

        }


        /*
        ----------------------------------------------------------------------
        FALLBACK TO EXISTING RECORDS
        ----------------------------------------------------------------------
        */

        if (!records.length) {

            if (
                attendanceType === "student"
            ) {

                records =
                    attendanceRecords.map(
                        function (record) {

                            return mergeStudentAttendance(
                                record,
                                record
                            );

                        }
                    );

            } else if (
                attendanceType === "staff"
            ) {

                records =
                    staffAttendanceRecords.map(
                        function (record) {

                            return mergeStaffAttendance(
                                record,
                                record
                            );

                        }
                    );

            } else {

                records =
                    [
                        ...attendanceRecords.map(
                            function (record) {

                                return mergeStudentAttendance(
                                    record,
                                    record
                                );

                            }
                        ),
                        ...staffAttendanceRecords.map(
                            function (record) {

                                return mergeStaffAttendance(
                                    record,
                                    record
                                );

                            }
                        )
                    ];

            }

        }


        /*
        ----------------------------------------------------------------------
        SEARCH
        ----------------------------------------------------------------------
        */

        if (search) {

            records =
                records.filter(
                    function (record) {

                        if (
                            getPersonType(record) ===
                            "staff"
                        ) {

                            const name =
                                getStaffName(
                                    record
                                )
                                    .toLowerCase();

                            const staffNumber =
                                getStaffNumber(
                                    record
                                )
                                    .toLowerCase();

                            const department =
                                getDepartmentName(
                                    record
                                )
                                    .toLowerCase();

                            const position =
                                String(
                                    record.position ||
                                    ""
                                )
                                    .toLowerCase();

                            return (
                                name.includes(search) ||
                                staffNumber.includes(search) ||
                                department.includes(search) ||
                                position.includes(search)
                            );

                        }


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
                                ${escapeHtml(
                                    getEmptyTitle()
                                )}
                            </h5>

                            <p class="mb-0">
                                ${escapeHtml(
                                    getEmptyMessage()
                                )}
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
    | EMPTY STATE TITLE
    |--------------------------------------------------------------------------
    */

    function getEmptyTitle() {

        if (
            attendanceType === "student"
        ) {

            return "No students found";

        }

        if (
            attendanceType === "staff"
        ) {

            return "No staff found";

        }

        return "No students or staff found";

    }


    /*
    |--------------------------------------------------------------------------
    | EMPTY STATE MESSAGE
    |--------------------------------------------------------------------------
    */

    function getEmptyMessage() {

        if (
            attendanceType === "staff"
        ) {

            return "No staff members match the current search.";

        }

        if (
            attendanceType === "all"
        ) {

            return "Select an academic session and term, or adjust your search.";

        }

        return "Select an academic session, term and class, or adjust your search.";

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

            person_type:
                "student",

            student_id:
                getStudentId(
                    student
                ),

            status:
                normalizeStatus(
                    source.status
                ),

            remarks:
                source.remarks ||
                source.remark ||
                "",

            class_id:
                source.class_id ||
                source.classId ||
                student.class_id ||
                student.classId ||
                student.enrollment_class_id ||
                ""

        };

    }


    /*
    |--------------------------------------------------------------------------
    | MERGE STAFF WITH EXISTING ATTENDANCE
    |--------------------------------------------------------------------------
    */

    function mergeStaffAttendance(
        person,
        attendance
    ) {

        const source =
            attendance ||
            {};

        return {
            ...person,
            ...source,

            person_type:
                "staff",

            staff_id:
                getStaffId(
                    person
                ),

            status:
                normalizeStatus(
                    source.status
                ),

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

        const personType =
            getPersonType(
                record
            );


        const isStaff =
            personType === "staff";


        const personName =
            isStaff
                ? getStaffName(record)
                : getStudentName(record);


        const identifier =
            isStaff
                ? getStaffNumber(record)
                : getAdmissionNumber(record);


        const secondary =
            isStaff
                ? getStaffSecondaryText(record)
                : getStudentSecondaryText(record);


        const personId =
            isStaff
                ? getStaffId(record)
                : getStudentId(record);


        const className =
            isStaff
                ? getDepartmentName(record)
                : getClassName(record);


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
                    personName
                )
                : getInitials(
                    personName
                );


        const dataAttribute =
            isStaff
                ? "data-staff-id"
                : "data-student-id";


        return `
            <tr
                ${dataAttribute}="${escapeAttribute(personId)}"
                data-person-type="${escapeAttribute(personType)}"
            >

                <td>

                    <div class="d-flex align-items-center gap-2">

                        <div
                            class="student-avatar"
                            aria-hidden="true"
                        >
                            ${escapeHtml(initials)}
                        </div>

                        <div>

                            <div class="student-name">
                                ${escapeHtml(
                                    personName
                                )}
                            </div>

                            ${
                                secondary
                                    ? `
                                    <small class="text-muted">
                                        ${escapeHtml(
                                            secondary
                                        )}
                                    </small>
                                    `
                                    : ""
                            }

                        </div>

                    </div>

                </td>


                <td>

                    <span class="admission-number">

                        ${escapeHtml(
                            identifier || "-"
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
                        data-person-id="${escapeAttribute(personId)}"
                        data-person-type="${escapeAttribute(personType)}"
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
                        data-person-id="${escapeAttribute(personId)}"
                        data-person-type="${escapeAttribute(personType)}"
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


        const rows =
            document.querySelectorAll(
                "tr[data-person-type]"
            );


        const studentRecords = [];

        const staffRecords = [];


        rows.forEach(
            function (row) {

                const personType =
                    row.getAttribute(
                        "data-person-type"
                    );


                const personId =
                    personType === "staff"
                        ? row.getAttribute(
                            "data-staff-id"
                        )
                        : row.getAttribute(
                            "data-student-id"
                        );


                if (!personId) {
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


                const status =
                    normalizeStatus(
                        statusElement
                            ? statusElement.value
                            : "Present"
                    );


                const remarks =
                    remarksElement
                        ? String(
                            remarksElement.value ||
                            ""
                        ).trim()
                        : "";


                const record = {

                    status,

                    remarks

                };


                if (
                    personType === "staff"
                ) {

                    record.staffId =
                        personId;

                    staffRecords.push(
                        record
                    );

                } else {

                    record.studentId =
                        personId;

                    studentRecords.push(
                        record
                    );

                }

            }
        );


        if (
            !studentRecords.length &&
            !staffRecords.length
        ) {

            notify(
                "There are no people to save.",
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

            /*
            ------------------------------------------------------------------
            STUDENT-ONLY MODE
            ------------------------------------------------------------------
            */

            if (
                attendanceType === "student"
            ) {

                if (
                    !studentRecords.length
                ) {

                    throw new Error(
                        "There are no students to save."
                    );

                }


                if (classId) {

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
                                        studentRecords

                                })

                        }
                    );

                } else {

                    await saveIndividualStudents(
                        studentRecords,
                        sessionId,
                        termId,
                        attendanceDate
                    );

                }

            }


            /*
            ------------------------------------------------------------------
            STAFF-ONLY MODE
            ------------------------------------------------------------------
            */

            else if (
                attendanceType === "staff"
            ) {

                await saveIndividualStaff(
                    staffRecords,
                    sessionId,
                    termId,
                    attendanceDate
                );

            }


            /*
            ------------------------------------------------------------------
            ALL MODE
            ------------------------------------------------------------------
            */

            else {

                if (
                    studentRecords.length
                ) {

                    await saveIndividualStudents(
                        studentRecords,
                        sessionId,
                        termId,
                        attendanceDate
                    );

                }


                if (
                    staffRecords.length
                ) {

                    await saveIndividualStaff(
                        staffRecords,
                        sessionId,
                        termId,
                        attendanceDate
                    );

                }

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
    | SAVE INDIVIDUAL STUDENTS
    |--------------------------------------------------------------------------
    */

    async function saveIndividualStudents(
        records,
        sessionId,
        termId,
        attendanceDate
    ) {

        const classId =
            getValue(
                "#classId",
                "#class-id",
                "[name='class_id']"
            );


        for (
            const record of records
        ) {

            const student =
                findStudentById(
                    record.studentId
                );


            const studentClassId =
                classId ||
                getClassId(
                    student
                );


            if (!studentClassId) {

                throw new Error(
                    "A class is required for student attendance. Please select a class."
                );

            }


            await request(
                "/attendance",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            studentId:
                                record.studentId,

                            classId:
                                studentClassId,

                            sessionId:
                                sessionId,

                            termId:
                                termId,

                            attendanceDate:
                                attendanceDate,

                            status:
                                record.status,

                            remarks:
                                record.remarks,

                            attendanceMethod:
                                "Manual"

                        })

                }
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | SAVE INDIVIDUAL STAFF
    |--------------------------------------------------------------------------
    */

    async function saveIndividualStaff(
        records,
        sessionId,
        termId,
        attendanceDate
    ) {

        if (!records.length) {

            throw new Error(
                "There are no staff members to save."
            );

        }


        for (
            const record of records
        ) {

            await request(
                "/attendance",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            staffId:
                                record.staffId,

                            sessionId:
                                sessionId,

                            termId:
                                termId,

                            attendanceDate:
                                attendanceDate,

                            status:
                                record.status,

                            remarks:
                                record.remarks,

                            attendanceMethod:
                                "Manual"

                        })

                }
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | FIND STUDENT
    |--------------------------------------------------------------------------
    */

    function findStudentById(
        studentId
    ) {

        return students.find(
            function (student) {

                return String(
                    getStudentId(
                        student
                    )
                ) === String(
                    studentId
                );

            }
        ) || null;

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


        const label =
            attendanceType === "student"
                ? "All students marked as present."
                : attendanceType === "staff"
                    ? "All staff marked as present."
                    : "All students and staff marked as present.";


        notify(
            label,
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
                "tr[data-person-type]"
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


                if (
                    status === "Present"
                ) {

                    present++;

                }


                if (
                    status === "Absent"
                ) {

                    absent++;

                }


                if (
                    status === "Late"
                ) {

                    late++;

                }


                if (
                    status === "Excused"
                ) {

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


        updateTotalLabel();

    }


    /*
    |--------------------------------------------------------------------------
    | PERSON TYPE
    |--------------------------------------------------------------------------
    */

    function getPersonType(
        record
    ) {

        if (
            record?.person_type ===
            "staff"
        ) {

            return "staff";

        }

        if (
            record?.personType ===
            "staff"
        ) {

            return "staff";

        }

        if (
            record?.staff_id ||
            record?.staffId
        ) {

            return "staff";

        }

        return "student";

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
            record?.student_id ||
            record?.studentId ||
            (
                getPersonType(record) ===
                "student"
                    ? record?.id
                    : ""
            ) ||
            ""
        );

    }


    /*
    |--------------------------------------------------------------------------
    | STAFF ID
    |--------------------------------------------------------------------------
    */

    function getStaffId(
        record
    ) {

        return (
            record?.staff_id ||
            record?.staffId ||
            (
                getPersonType(record) ===
                "staff"
                    ? record?.id
                    : ""
            ) ||
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
            record?.student_name
        ) {

            return record.student_name;

        }


        if (
            record?.studentName
        ) {

            return record.studentName;

        }


        const first =
            record?.first_name ||
            record?.firstName ||
            "";


        const middle =
            record?.middle_name ||
            record?.middleName ||
            "";


        const last =
            record?.last_name ||
            record?.lastName ||
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
    | STAFF NAME
    |--------------------------------------------------------------------------
    */

    function getStaffName(
        record
    ) {

        if (
            record?.staff_name
        ) {

            return record.staff_name;

        }


        if (
            record?.staffName
        ) {

            return record.staffName;

        }


        const first =
            record?.first_name ||
            record?.firstName ||
            "";


        const middle =
            record?.middle_name ||
            record?.middleName ||
            "";


        const last =
            record?.last_name ||
            record?.lastName ||
            "";


        return [
            first,
            middle,
            last
        ]
            .filter(Boolean)
            .join(" ") ||
            "Unknown Staff";

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
            record?.admission_number ||
            record?.admissionNumber ||
            record?.student_number ||
            record?.studentNumber ||
            ""
        );

    }


    /*
    |--------------------------------------------------------------------------
    | STAFF NUMBER
    |--------------------------------------------------------------------------
    */

    function getStaffNumber(
        record
    ) {

        return String(
            record?.staff_number ||
            record?.staffNumber ||
            ""
        );

    }


    /*
    |--------------------------------------------------------------------------
    | STAFF SECONDARY TEXT
    |--------------------------------------------------------------------------
    */

    function getStaffSecondaryText(
        record
    ) {

        const employmentType =
            record?.employment_type ||
            record?.employmentType ||
            "";


        const position =
            record?.position ||
            "";


        return [
            employmentType,
            position
        ]
            .filter(Boolean)
            .join(" • ");

    }


    /*
    |--------------------------------------------------------------------------
    | STUDENT SECONDARY TEXT
    |--------------------------------------------------------------------------
    */

    function getStudentSecondaryText(
        record
    ) {

        const email =
            record?.email ||
            "";


        return String(
            email
        );

    }


    /*
    |--------------------------------------------------------------------------
    | DEPARTMENT NAME
    |--------------------------------------------------------------------------
    */

    function getDepartmentName(
        record
    ) {

        return (
            record?.department_name ||
            record?.departmentName ||
            record?.department ||
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
            record?.class_name ||
            record?.className ||
            record?.class_arm_name ||
            record?.classArmName ||
            record?.class_title ||
            record?.classTitle ||
            ""
        );

    }


    /*
    |--------------------------------------------------------------------------
    | CLASS ID
    |--------------------------------------------------------------------------
    */

    function getClassId(
        record
    ) {

        return (
            record?.class_id ||
            record?.classId ||
            record?.enrollment_class_id ||
            record?.enrollmentClassId ||
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

})();