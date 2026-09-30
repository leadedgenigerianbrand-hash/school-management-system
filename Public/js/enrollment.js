"use strict";

/*
|--------------------------------------------------------------------------
| ENROLLMENT PAGE
|--------------------------------------------------------------------------
|
| Handles:
|
| - Student selection
| - Academic session selection
| - Academic level selection
| - Class selection
| - Class arm selection
| - Department selection
| - Existing enrollment lookup
| - New enrollment submission
| - UUID and numeric ID compatibility
|
| Backend enrollment routes:
|
| GET  /api/enrollments/student/:studentId
| GET  /api/enrollments/student/:studentId/session/:academicSessionId
| POST /api/enrollments/student/:studentId
|
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    const API_BASE = "/api";

    const STUDENTS_PAGE =
        "/pages/students.html";

    const TOKEN_KEYS = [
        "school_management_token",
        "token",
        "authToken",
        "accessToken"
    ];

    let students = [];
    let academicSessions = [];
    let academicLevels = [];
    let classes = [];
    let classArms = [];
    let departments = [];

    let selectedStudent = null;
    let currentEnrollment = null;

    /*
    |--------------------------------------------------------------------------
    | BASIC HELPERS
    |--------------------------------------------------------------------------
    */

    function findElement(id) {
        return document.getElementById(id);
    }

    function getToken() {
        for (
            let index = 0;
            index < TOKEN_KEYS.length;
            index += 1
        ) {
            const key =
                TOKEN_KEYS[index];

            const localValue =
                localStorage.getItem(key);

            if (localValue) {
                return localValue;
            }

            const sessionValue =
                sessionStorage.getItem(key);

            if (sessionValue) {
                return sessionValue;
            }
        }

        return "";
    }

    function clearAuthentication() {
        TOKEN_KEYS.forEach(function (key) {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        localStorage.removeItem(
            "school_management_user"
        );

        sessionStorage.removeItem(
            "school_management_user"
        );
    }

    function escapeHtml(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeObject(data) {
        if (!data) {
            return null;
        }

        if (
            typeof data === "object" &&
            !Array.isArray(data)
        ) {
            if (
                data.data &&
                typeof data.data === "object" &&
                !Array.isArray(data.data)
            ) {
                return data.data;
            }

            if (
                data.student &&
                typeof data.student === "object"
            ) {
                return data.student;
            }

            if (
                data.enrollment &&
                typeof data.enrollment === "object"
            ) {
                return data.enrollment;
            }

            return data;
        }

        return null;
    }

    function normalizeArray(
        data,
        keys
    ) {
        if (Array.isArray(data)) {
            return data;
        }

        if (!data) {
            return [];
        }

        if (
            data.data &&
            Array.isArray(data.data)
        ) {
            return data.data;
        }

        if (
            data.data &&
            typeof data.data === "object"
        ) {
            const nested =
                normalizeArray(
                    data.data,
                    keys
                );

            if (nested.length) {
                return nested;
            }
        }

        if (Array.isArray(keys)) {
            for (
                let index = 0;
                index < keys.length;
                index += 1
            ) {
                const key =
                    keys[index];

                if (
                    Array.isArray(
                        data[key]
                    )
                ) {
                    return data[key];
                }
            }
        }

        if (
            Array.isArray(
                data.students
            )
        ) {
            return data.students;
        }

        if (
            Array.isArray(
                data.results
            )
        ) {
            return data.results;
        }

        if (
            Array.isArray(
                data.rows
            )
        ) {
            return data.rows;
        }

        return [];
    }

    function getRecordId(record) {
        if (!record) {
            return "";
        }

        return (
            record.id ??
            record.uuid ??
            record.student_id ??
            record.studentId ??
            record.academic_session_id ??
            record.academicSessionId ??
            record.academic_level_id ??
            record.academicLevelId ??
            record.class_id ??
            record.classId ??
            record.class_arm_id ??
            record.classArmId ??
            record.department_id ??
            record.departmentId ??
            ""
        );
    }

    function getRecordName(record) {
        if (!record) {
            return "";
        }

        return (
            record.name ??
            record.title ??
            record.label ??
            record.session_name ??
            record.sessionName ??
            record.academic_session_name ??
            record.academicSessionName ??
            record.level_name ??
            record.levelName ??
            record.class_name ??
            record.className ??
            record.class_arm_name ??
            record.classArmName ??
            record.department_name ??
            record.departmentName ??
            ""
        );
    }

    function getStudentNumber(student) {
        if (!student) {
            return "";
        }

        return (
            student.student_number ??
            student.studentNumber ??
            student.admission_number ??
            student.admissionNumber ??
            student.registration_number ??
            student.registrationNumber ??
            student.student_code ??
            student.studentCode ??
            ""
        );
    }

    function getFullName(student) {
        if (!student) {
            return "";
        }

        const directName =
            student.full_name ??
            student.fullName ??
            student.name;

        if (directName) {
            return String(
                directName
            ).trim();
        }

        const firstName =
            student.first_name ??
            student.firstName ??
            "";

        const middleName =
            student.middle_name ??
            student.middleName ??
            "";

        const lastName =
            student.last_name ??
            student.lastName ??
            "";

        return [
            firstName,
            middleName,
            lastName
        ]
            .filter(function (value) {
                return (
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
                );
            })
            .join(" ")
            .trim();
    }

    /*
    |--------------------------------------------------------------------------
    | API URLS
    |--------------------------------------------------------------------------
    */

    function getStudentApiUrl() {
        return (
            API_BASE +
            "/students"
        );
    }

    function getAcademicSessionApiUrl() {
        return (
            API_BASE +
            "/academic-sessions"
        );
    }

    function getAcademicLevelApiUrl() {
        return (
            API_BASE +
            "/academic-levels"
        );
    }

    function getClassApiUrl() {
        return (
            API_BASE +
            "/classes"
        );
    }

    function getClassArmApiUrl() {
        return (
            API_BASE +
            "/class-arms"
        );
    }

    function getDepartmentApiUrl() {
        return (
            API_BASE +
            "/departments"
        );
    }

    function getEnrollmentApiUrl(
        studentId,
        academicSessionId
    ) {
        const base =
            API_BASE +
            "/enrollments/student/" +
            encodeURIComponent(
                String(studentId)
            );

        if (
            academicSessionId !== undefined &&
            academicSessionId !== null &&
            String(academicSessionId).trim() !== ""
        ) {
            return (
                base +
                "/session/" +
                encodeURIComponent(
                    String(
                        academicSessionId
                    )
                )
            );
        }

        return base;
    }

    /*
    |--------------------------------------------------------------------------
    | API REQUEST
    |--------------------------------------------------------------------------
    */

    async function apiRequest(
        url,
        options
    ) {
        const requestOptions =
            Object.assign(
                {
                    method: "GET",
                    headers: {}
                },
                options || {}
            );

        const headers =
            Object.assign(
                {},
                requestOptions.headers || {}
            );

        const token =
            getToken();

        if (token) {
            headers.Authorization =
                "Bearer " + token;
        }

        headers.Accept =
            "application/json";

        requestOptions.headers =
            headers;

        requestOptions.credentials =
            "include";

        let response;

        try {
            response =
                await fetch(
                    url,
                    requestOptions
                );
        } catch (networkError) {
            throw new Error(
                "Unable to connect to the server. Please check that the school management server is running."
            );
        }

        let responseData = null;

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            contentType.includes(
                "application/json"
            )
        ) {
            try {
                responseData =
                    await response.json();
            } catch (parseError) {
                responseData = null;
            }
        } else {
            try {
                const text =
                    await response.text();

                responseData =
                    text
                        ? {
                              message:
                                  text
                          }
                        : null;
            } catch (textError) {
                responseData = null;
            }
        }

        if (
            response.status === 401
        ) {
            clearAuthentication();

            if (
                window.location.pathname !==
                "/pages/login.html"
            ) {
                window.location.href =
                    "/pages/login.html";
            }

            throw new Error(
                "Your session has expired. Please sign in again."
            );
        }

        if (
            !response.ok
        ) {
            const message =
                responseData?.message ||
                responseData?.error ||
                (
                    response.status ===
                    403
                        ? "You are not authorized to perform this action."
                        : response.status ===
                          404
                        ? "The requested enrollment information was not found."
                        : "The server could not complete the request."
                );

            const error =
                new Error(
                    message
                );

            error.status =
                response.status;

            error.response =
                responseData;

            throw error;
        }

        return responseData;
    }

    /*
    |--------------------------------------------------------------------------
    | MESSAGE / LOADING UI
    |--------------------------------------------------------------------------
    */

    function showMessage(
        message,
        type
    ) {
        const container =
            findElement(
                "enrollmentMessageContainer"
            ) ||
            findElement(
                "messageContainer"
            ) ||
            findElement(
                "enrollmentMessage"
            );

        if (!container) {
            console.log(
                message
            );

            return;
        }

        const safeType =
            type ||
            "info";

        container.className =
            "alert alert-" +
            (
                safeType ===
                "error"
                    ? "danger"
                    : safeType ===
                      "warning"
                    ? "warning"
                    : safeType ===
                      "success"
                    ? "success"
                    : "info"
            );

        container.textContent =
            message || "";

        container.classList.add(
            "show"
        );

        container.style.display =
            "block";
    }

    function hideMessage() {
        const container =
            findElement(
                "enrollmentMessageContainer"
            ) ||
            findElement(
                "messageContainer"
            ) ||
            findElement(
                "enrollmentMessage"
            );

        if (!container) {
            return;
        }

        container.classList.remove(
            "show"
        );

        container.style.display =
            "none";

        container.textContent =
            "";
    }

    function setLoading(
        elementId,
        loading,
        text
    ) {
        const element =
            findElement(
                elementId
            );

        if (!element) {
            return;
        }

        if (loading) {
            element.classList.add(
                "show"
            );

            element.style.display =
                "";

            if (text) {
                element.textContent =
                    " " + text;
            }
        } else {
            element.classList.remove(
                "show"
            );
        }
    }

    function showPage() {
        const loading =
            findElement(
                "pageLoading"
            );

        const form =
            findElement(
                "enrollmentForm"
            );

        if (loading) {
            loading.style.display =
                "none";
        }

        if (form) {
            form.style.display =
                "";
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SELECT POPULATION
    |--------------------------------------------------------------------------
    */

    function populateSelect(
        selectId,
        records,
        placeholder,
        valueGetter,
        labelGetter
    ) {
        const select =
            findElement(
                selectId
            );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        select.innerHTML =
            "";

        const placeholderOption =
            document.createElement(
                "option"
            );

        placeholderOption.value =
            "";

        placeholderOption.textContent =
            placeholder;

        select.appendChild(
            placeholderOption
        );

        (
            Array.isArray(records)
                ? records
                : []
        ).forEach(function (
            record
        ) {
            const id =
                valueGetter(record);

            const label =
                labelGetter(record);

            if (
                id === undefined ||
                id === null ||
                String(id).trim() === ""
            ) {
                return;
            }

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(id);

            option.textContent =
                label ||
                "Unnamed";

            select.appendChild(
                option
            );
        });

        if (
            currentValue
        ) {
            const matchingOption =
                Array.from(
                    select.options
                ).find(function (
                    option
                ) {
                    return (
                        option.value ===
                        String(
                            currentValue
                        )
                    );
                });

            if (
                matchingOption
            ) {
                select.value =
                    String(
                        currentValue
                    );
            }
        }
    }

    function populateStudents() {
        const select =
            findElement(
                "studentId"
            );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        select.innerHTML =
            "";

        const placeholder =
            document.createElement(
                "option"
            );

        placeholder.value =
            "";

        placeholder.textContent =
            "Select student";

        select.appendChild(
            placeholder
        );

        students.forEach(function (
            student
        ) {
            const id =
                getRecordId(
                    student
                );

            if (
                id === undefined ||
                id === null ||
                String(id).trim() === ""
            ) {
                return;
            }

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(id);

            const studentNumber =
                getStudentNumber(
                    student
                );

            const fullName =
                getFullName(
                    student
                );

            option.textContent =
                studentNumber
                    ? studentNumber +
                      " - " +
                      (
                          fullName ||
                          "Unnamed student"
                      )
                    : (
                          fullName ||
                          "Unnamed student"
                      );

            select.appendChild(
                option
            );
        });

        if (
            currentValue
        ) {
            select.value =
                String(
                    currentValue
                );
        }
    }

    function populateAcademicSessions() {
        populateSelect(
            "academicSessionId",
            academicSessions,
            "Select academic session",
            function (
                record
            ) {
                return (
                    record.id ??
                    record.academic_session_id ??
                    record.academicSessionId
                );
            },
            function (
                record
            ) {
                return (
                    record.name ||
                    record.session_name ||
                    record.sessionName ||
                    record.academic_session_name ||
                    record.academicSessionName ||
                    record.year ||
                    ""
                );
            }
        );
    }

    function populateAcademicLevels() {
        populateSelect(
            "academicLevelId",
            academicLevels,
            "Select academic level",
            function (
                record
            ) {
                return (
                    record.id ??
                    record.academic_level_id ??
                    record.academicLevelId
                );
            },
            function (
                record
            ) {
                return (
                    record.name ||
                    record.level_name ||
                    record.levelName ||
                    record.title ||
                    ""
                );
            }
        );
    }

    function populateClasses() {
        populateSelect(
            "classId",
            classes,
            "Select class",
            function (
                record
            ) {
                return (
                    record.id ??
                    record.class_id ??
                    record.classId
                );
            },
            function (
                record
            ) {
                return (
                    record.name ||
                    record.class_name ||
                    record.className ||
                    record.title ||
                    ""
                );
            }
        );
    }

    function populateDepartments() {
        populateSelect(
            "departmentId",
            departments,
            "Select department",
            function (
                record
            ) {
                return (
                    record.id ??
                    record.department_id ??
                    record.departmentId
                );
            },
            function (
                record
            ) {
                return (
                    record.name ||
                    record.department_name ||
                    record.departmentName ||
                    record.title ||
                    ""
                );
            }
        );
    }

    function populateClassArms(
        classId
    ) {
        const select =
            findElement(
                "classArmId"
            );

        if (!select) {
            return;
        }

        const filtered =
            classArms.filter(
                function (
                    arm
                ) {
                    const armClassId =
                        arm.class_id ??
                        arm.classId;

                    if (
                        !classId
                    ) {
                        return false;
                    }

                    return (
                        String(
                            armClassId
                        ) ===
                        String(
                            classId
                        )
                    );
                }
            );

        populateSelect(
            "classArmId",
            filtered,
            "Select class arm",
            function (
                record
            ) {
                return (
                    record.id ??
                    record.class_arm_id ??
                    record.classArmId
                );
            },
            function (
                record
            ) {
                return (
                    record.name ||
                    record.class_arm_name ||
                    record.classArmName ||
                    record.title ||
                    ""
                );
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT SUMMARY
    |--------------------------------------------------------------------------
    */

    function renderStudentSummary(
        student
    ) {
        const summary =
            findElement(
                "studentSummary"
            );

        if (!summary) {
            return;
        }

        if (!student) {
            summary.classList.remove(
                "visible"
            );

            setSummaryValue(
                "summaryStudentNumber",
                "Not selected"
            );

            setSummaryValue(
                "summaryStudentName",
                "Not selected"
            );

            setSummaryValue(
                "summaryStudentGender",
                "Not provided"
            );

            setSummaryValue(
                "summaryStudentEmail",
                "Not provided"
            );

            return;
        }

        summary.classList.add(
            "visible"
        );

        setSummaryValue(
            "summaryStudentNumber",
            getStudentNumber(
                student
            ) ||
                "Not provided"
        );

        setSummaryValue(
            "summaryStudentName",
            getFullName(
                student
            ) ||
                "Not provided"
        );

        setSummaryValue(
            "summaryStudentGender",
            student.gender ||
                student.sex ||
                "Not provided"
        );

        setSummaryValue(
            "summaryStudentEmail",
            student.email ||
                "Not provided"
        );
    }

    function setSummaryValue(
        id,
        value
    ) {
        const element =
            findElement(
                id
            );

        if (element) {
            element.textContent =
                value ||
                "Not provided";
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EXISTING ENROLLMENT
    |--------------------------------------------------------------------------
    */

    function renderExistingEnrollment(
        enrollment
    ) {
        const container =
            findElement(
                "existingEnrollment"
            );

        if (!container) {
            return;
        }

        if (!enrollment) {
            currentEnrollment =
                null;

            container.classList.remove(
                "show"
            );

            return;
        }

        currentEnrollment =
            enrollment;

        container.classList.add(
            "show"
        );

        setSummaryValue(
            "existingEnrollmentSession",
            enrollment.academic_session_name ||
                enrollment.academicSessionName ||
                enrollment.academic_session ||
                enrollment.academicSession ||
                enrollment.session_name ||
                enrollment.sessionName ||
                enrollment.session ||
                "Not available"
        );

        setSummaryValue(
            "existingEnrollmentLevel",
            enrollment.academic_level_name ||
                enrollment.academicLevelName ||
                enrollment.academic_level ||
                enrollment.academicLevel ||
                enrollment.level_name ||
                enrollment.levelName ||
                enrollment.level ||
                "Not available"
        );

        setSummaryValue(
            "existingEnrollmentClass",
            enrollment.class_name ||
                enrollment.className ||
                enrollment.class ||
                "Not available"
        );

        setSummaryValue(
            "existingEnrollmentArm",
            enrollment.class_arm_name ||
                enrollment.classArmName ||
                enrollment.class_arm ||
                enrollment.classArm ||
                enrollment.arm ||
                "Not available"
        );

        setSummaryValue(
            "existingEnrollmentDepartment",
            enrollment.department_name ||
                enrollment.departmentName ||
                enrollment.department ||
                "Not available"
        );

        const enrollmentDate =
            enrollment.enrollment_date ||
            enrollment.enrollmentDate ||
            enrollment.admission_date ||
            enrollment.admissionDate ||
            "";

        setSummaryValue(
            "existingEnrollmentDate",
            enrollmentDate
                ? formatDate(
                      enrollmentDate
                  )
                : "Not available"
        );

        setSummaryValue(
            "existingEnrollmentStatus",
            enrollment.admission_status ||
                enrollment.admissionStatus ||
                enrollment.status ||
                "Not available"
        );
    }

    function formatDate(
        value
    ) {
        if (!value) {
            return "Not provided";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(
                value
            );
        }

        return date.toLocaleDateString(
            "en-NG",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | COLLECTION LOADING
    |--------------------------------------------------------------------------
    */

    async function loadCollection(
        url,
        keys
    ) {
        const data =
            await apiRequest(
                url
            );

        return normalizeArray(
            data,
            keys
        );
    }

    async function loadStudents() {
        setLoading(
            "studentLoading",
            true,
            "Loading students..."
        );

        try {
            students =
                await loadCollection(
                    getStudentApiUrl(),
                    [
                        "students"
                    ]
                );

            populateStudents();

            return students;
        } finally {
            setLoading(
                "studentLoading",
                false
            );
        }
    }

    async function loadAcademicSessions() {
        setLoading(
            "sessionLoading",
            true,
            "Loading sessions..."
        );

        try {
            academicSessions =
                await loadCollection(
                    getAcademicSessionApiUrl(),
                    [
                        "academicSessions",
                        "sessions"
                    ]
                );

            populateAcademicSessions();

            return academicSessions;
        } finally {
            setLoading(
                "sessionLoading",
                false
            );
        }
    }

    async function loadAcademicLevels() {
        setLoading(
            "levelLoading",
            true,
            "Loading levels..."
        );

        try {
            academicLevels =
                await loadCollection(
                    getAcademicLevelApiUrl(),
                    [
                        "academicLevels",
                        "levels"
                    ]
                );

            populateAcademicLevels();

            return academicLevels;
        } finally {
            setLoading(
                "levelLoading",
                false
            );
        }
    }

    async function loadClasses() {
        setLoading(
            "classLoading",
            true,
            "Loading classes..."
        );

        try {
            classes =
                await loadCollection(
                    getClassApiUrl(),
                    [
                        "classes"
                    ]
                );

            populateClasses();

            return classes;
        } finally {
            setLoading(
                "classLoading",
                false
            );
        }
    }

    async function loadDepartments() {
        setLoading(
            "departmentLoading",
            true,
            "Loading departments..."
        );

        try {
            departments =
                await loadCollection(
                    getDepartmentApiUrl(),
                    [
                        "departments"
                    ]
                );

            populateDepartments();

            return departments;
        } finally {
            setLoading(
                "departmentLoading",
                false
            );
        }
    }

    async function loadClassArms() {
        setLoading(
            "classArmLoading",
            true,
            "Loading class arms..."
        );

        try {
            classArms =
                await loadCollection(
                    getClassArmApiUrl(),
                    [
                        "classArms",
                        "class_arms"
                    ]
                );

            const classSelect =
                findElement(
                    "classId"
                );

            populateClassArms(
                classSelect
                    ? classSelect.value
                    : ""
            );

            return classArms;
        } finally {
            setLoading(
                "classArmLoading",
                false
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT SELECTION
    |--------------------------------------------------------------------------
    */

    async function loadStudentFromSelection(
        studentId
    ) {
        if (!studentId) {
            selectedStudent =
                null;

            renderStudentSummary(
                null
            );

            renderExistingEnrollment(
                null
            );

            return;
        }

        const localStudent =
            students.find(
                function (
                    student
                ) {
                    const id =
                        getRecordId(
                            student
                        );

                    return (
                        String(id) ===
                        String(
                            studentId
                        )
                    );
                }
            );

        selectedStudent =
            localStudent ||
            null;

        renderStudentSummary(
            selectedStudent
        );

        if (
            !selectedStudent
        ) {
            try {
                const data =
                    await apiRequest(
                        getStudentApiUrl() +
                            "/" +
                            encodeURIComponent(
                                String(
                                    studentId
                                )
                            )
                    );

                selectedStudent =
                    normalizeObject(
                        data
                    );

                renderStudentSummary(
                    selectedStudent
                );
            } catch (error) {
                showMessage(
                    error.message ||
                        "Unable to load the selected student.",
                    "error"
                );

                return;
            }
        }

        await loadExistingStudentEnrollment(
            studentId
        );
    }

    async function loadExistingStudentEnrollment(
        studentId
    ) {
        if (!studentId) {
            renderExistingEnrollment(
                null
            );

            return null;
        }

        try {
            /*
            |--------------------------------------------------------------------------
            | IMPORTANT:
            | The actual backend enrollment route is:
            |
            | GET /api/enrollments/student/:studentId
            |--------------------------------------------------------------------------
            */

            const data =
                await apiRequest(
                    getEnrollmentApiUrl(
                        studentId
                    )
                );

            const enrollment =
                normalizeObject(
                    data
                );

            renderExistingEnrollment(
                enrollment
            );

            return enrollment;
        } catch (error) {
            if (
                error &&
                (
                    error.status ===
                    404 ||
                    (
                        error.message &&
                        error.message
                            .toLowerCase()
                            .includes(
                                "not found"
                            )
                    )
                )
            ) {
                renderExistingEnrollment(
                    null
                );

                return null;
            }

            console.warn(
                "Existing enrollment could not be loaded:",
                error
            );

            renderExistingEnrollment(
                null
            );

            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORM DATA
    |--------------------------------------------------------------------------
    |
    | DO NOT convert IDs to Number().
    |
    | PostgreSQL records in this application use UUID identifiers.
    | IDs must remain strings when sent to the backend.
    |--------------------------------------------------------------------------
    */

    function getIdValue(
        value
    ) {
        if (
            value === undefined ||
            value === null
        ) {
            return null;
        }

        const normalized =
            String(
                value
            ).trim();

        return normalized
            ? normalized
            : null;
    }

    function getFormData() {
        const studentId =
            getIdValue(
                findElement(
                    "studentId"
                )?.value
            );

        const academicSessionId =
            getIdValue(
                findElement(
                    "academicSessionId"
                )?.value
            );

        const academicLevelId =
            getIdValue(
                findElement(
                    "academicLevelId"
                )?.value
            );

        const classId =
            getIdValue(
                findElement(
                    "classId"
                )?.value
            );

        const classArmId =
            getIdValue(
                findElement(
                    "classArmId"
                )?.value
            );

        const departmentId =
            getIdValue(
                findElement(
                    "departmentId"
                )?.value
            );

        const enrollmentDate =
            findElement(
                "enrollmentDate"
            )?.value ||
            null;

        const admissionStatus =
            findElement(
                "admissionStatus"
            )?.value ||
            "Enrolled";

        return {
            studentId,
            academicSessionId,
            academicLevelId,
            classId,
            classArmId,
            departmentId,
            enrollmentDate,
            admissionStatus
        };
    }

    function validateForm(
        data
    ) {
        if (!data.studentId) {
            return (
                "Please select a student."
            );
        }

        if (
            !data.academicSessionId
        ) {
            return (
                "Please select an academic session."
            );
        }

        if (!data.classId) {
            return (
                "Please select a class."
            );
        }

        if (
            !data.admissionStatus
        ) {
            return (
                "Please select an enrollment status."
            );
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | SUBMIT BUTTON
    |--------------------------------------------------------------------------
    */

    function setSubmitState(
        submitting
    ) {
        const button =
            findElement(
                "saveEnrollmentButton"
            );

        if (!button) {
            return;
        }

        if (submitting) {
            button.disabled =
                true;

            button.dataset.originalText =
                button.textContent;

            button.textContent =
                "Saving Enrollment...";
        } else {
            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                "Save Enrollment";
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SUBMIT ENROLLMENT
    |--------------------------------------------------------------------------
    */

    async function submitEnrollment(
        event
    ) {
        if (event) {
            event.preventDefault();
        }

        hideMessage();

        const formData =
            getFormData();

        const validationError =
            validateForm(
                formData
            );

        if (validationError) {
            showMessage(
                validationError,
                "error"
            );

            return;
        }

        setSubmitState(
            true
        );

        try {
            const payload = {
                studentId:
                    formData.studentId,

                academicSessionId:
                    formData.academicSessionId,

                classId:
                    formData.classId,

                classArmId:
                    formData.classArmId,

                departmentId:
                    formData.departmentId,

                enrollmentDate:
                    formData.enrollmentDate,

                admissionStatus:
                    formData.admissionStatus,

                status:
                    formData.admissionStatus
            };

            /*
            |--------------------------------------------------------------------------
            | Actual backend route:
            |
            | POST /api/enrollments/student/:studentId
            |--------------------------------------------------------------------------
            */

            const data =
                await apiRequest(
                    getEnrollmentApiUrl(
                        formData.studentId
                    ),
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            const enrollment =
                normalizeObject(
                    data
                );

            currentEnrollment =
                enrollment;

            renderExistingEnrollment(
                enrollment
            );

            showMessage(
                "Student enrollment was saved successfully.",
                "success"
            );

            const form =
                findElement(
                    "enrollmentForm"
                );

            if (form) {
                form.reset();
            }

            selectedStudent =
                null;

            renderStudentSummary(
                null
            );

            /*
            |--------------------------------------------------------------------------
            | Give the success message time to be seen, then return to students.
            |--------------------------------------------------------------------------
            */

            setTimeout(
                function () {
                    window.location.href =
                        STUDENTS_PAGE;
                },
                1200
            );
        } catch (error) {
            console.error(
                "Enrollment submission error:",
                error
            );

            showMessage(
                error.message ||
                    "Unable to save student enrollment.",
                "error"
            );
        } finally {
            setSubmitState(
                false
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EVENT HANDLERS
    |--------------------------------------------------------------------------
    */

    function handleStudentChange() {
        const select =
            findElement(
                "studentId"
            );

        if (!select) {
            return;
        }

        loadStudentFromSelection(
            select.value
        ).catch(
            function (
                error
            ) {
                console.error(
                    "Student selection error:",
                    error
                );

                showMessage(
                    error.message ||
                        "Unable to load the selected student.",
                    "error"
                );
            }
        );
    }

    function handleClassChange() {
        const select =
            findElement(
                "classId"
            );

        const classId =
            select
                ? select.value
                : "";

        populateClassArms(
            classId
        );
    }

    function handleReset() {
        window.setTimeout(
            function () {
                selectedStudent =
                    null;

                currentEnrollment =
                    null;

                renderStudentSummary(
                    null
                );

                renderExistingEnrollment(
                    null
                );

                populateClassArms(
                    ""
                );

                hideMessage();
            },
            0
        );
    }

    function setupEventListeners() {
        const form =
            findElement(
                "enrollmentForm"
            );

        if (form) {
            form.addEventListener(
                "submit",
                submitEnrollment
            );

            form.addEventListener(
                "reset",
                handleReset
            );
        }

        const studentSelect =
            findElement(
                "studentId"
            );

        if (studentSelect) {
            studentSelect.addEventListener(
                "change",
                handleStudentChange
            );
        }

        const classSelect =
            findElement(
                "classId"
            );

        if (classSelect) {
            classSelect.addEventListener(
                "change",
                handleClassChange
            );
        }

        const backButton =
            findElement(
                "backToStudentsButton"
            );

        if (backButton) {
            backButton.addEventListener(
                "click",
                function () {
                    window.location.href =
                        STUDENTS_PAGE;
                }
            );
        }

        const cancelButton =
            findElement(
                "cancelEnrollmentButton"
            );

        if (cancelButton) {
            cancelButton.addEventListener(
                "click",
                function () {
                    window.location.href =
                        STUDENTS_PAGE;
                }
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | INITIAL DATA
    |--------------------------------------------------------------------------
    */

    async function loadInitialData() {
        const results =
            await Promise.allSettled(
                [
                    loadStudents(),
                    loadAcademicSessions(),
                    loadAcademicLevels(),
                    loadClasses(),
                    loadClassArms(),
                    loadDepartments()
                ]
            );

        const failed =
            results.filter(
                function (
                    result
                ) {
                    return (
                        result.status ===
                        "rejected"
                    );
                }
            );

        if (
            failed.length
        ) {
            console.warn(
                "Some enrollment reference data could not be loaded.",
                failed
            );
        }

        showPage();

        if (
            !students.length
        ) {
            showMessage(
                "No students are currently available for enrollment.",
                "warning"
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | URL STUDENT ID
    |--------------------------------------------------------------------------
    */

    function getStudentIdFromUrl() {
        const params =
            new URLSearchParams(
                window.location.search
            );

        return (
            params.get(
                "studentId"
            ) ||
            params.get(
                "student_id"
            ) ||
            params.get(
                "id"
            ) ||
            ""
        );
    }

    /*
    |--------------------------------------------------------------------------
    | INITIALIZATION
    |--------------------------------------------------------------------------
    */

    async function initializeEnrollmentPage() {
        setupEventListeners();

        const studentId =
            getStudentIdFromUrl();

        try {
            await loadInitialData();

            if (
                studentId
            ) {
                const studentSelect =
                    findElement(
                        "studentId"
                    );

                if (
                    studentSelect
                ) {
                    const option =
                        Array.from(
                            studentSelect.options
                        ).find(
                            function (
                                item
                            ) {
                                return (
                                    item.value ===
                                    String(
                                        studentId
                                    )
                                );
                            }
                        );

                    if (
                        option
                    ) {
                        studentSelect.value =
                            String(
                                studentId
                            );

                        await loadStudentFromSelection(
                            studentId
                        );
                    } else {
                        /*
                        |--------------------------------------------------------------------------
                        | The student may not have appeared in the collection response.
                        | Try loading the student directly so UUID-based links still work.
                        |--------------------------------------------------------------------------
                        */

                        try {
                            const data =
                                await apiRequest(
                                    getStudentApiUrl() +
                                        "/" +
                                        encodeURIComponent(
                                            String(
                                                studentId
                                            )
                                        )
                                );

                            const student =
                                normalizeObject(
                                    data
                                );

                            if (
                                student
                            ) {
                                const id =
                                    getRecordId(
                                        student
                                    );

                                const newOption =
                                    document.createElement(
                                        "option"
                                    );

                                newOption.value =
                                    String(
                                        id ||
                                            studentId
                                    );

                                newOption.textContent =
                                    getStudentNumber(
                                        student
                                    )
                                        ? getStudentNumber(
                                              student
                                          ) +
                                          " - " +
                                          getFullName(
                                              student
                                          )
                                        : getFullName(
                                              student
                                          ) ||
                                          "Selected student";

                                studentSelect.appendChild(
                                    newOption
                                );

                                studentSelect.value =
                                    String(
                                        id ||
                                            studentId
                                    );

                                await loadStudentFromSelection(
                                    id ||
                                        studentId
                                );
                            }
                        } catch (
                            directStudentError
                        ) {
                            console.warn(
                                "Student supplied in URL could not be loaded:",
                                directStudentError
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error(
                "Enrollment page initialization error:",
                error
            );

            showPage();

            showMessage(
                error.message ||
                    "Unable to load enrollment information.",
                "error"
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PUBLIC COMPATIBILITY
    |--------------------------------------------------------------------------
    */

    window.initializeEnrollmentPage =
        initializeEnrollmentPage;

    window.submitEnrollment =
        submitEnrollment;

    window.loadExistingStudentEnrollment =
        loadExistingStudentEnrollment;

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
            initializeEnrollmentPage
        );
    } else {
        initializeEnrollmentPage();
    }
})();