"use strict";

(function () {
"use strict";

```
const API_BASE = "/api";
const TOKEN_KEYS = [
    "token",
    "authToken",
    "accessToken"
];

const LOGIN_PAGE = "/pages/login.html";
const STUDENTS_PAGE = "/pages/students.html";

let students = [];
let academicSessions = [];
let academicLevels = [];
let classes = [];
let classArms = [];
let departments = [];

let selectedStudent = null;
let currentEnrollment = null;

function findElement(ids) {
    const list = Array.isArray(ids)
        ? ids
        : [ids];

    for (const id of list) {
        const element =
            document.getElementById(id);

        if (element) {
            return element;
        }
    }

    return null;
}

function getToken() {
    for (const key of TOKEN_KEYS) {
        const localToken =
            localStorage.getItem(key);

        if (localToken) {
            return localToken;
        }

        const sessionToken =
            sessionStorage.getItem(key);

        if (sessionToken) {
            return sessionToken;
        }
    }

    return "";
}

function clearAuthentication() {
    TOKEN_KEYS.forEach(function (key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

function escapeHtml(value) {
    return String(
        value === undefined ||
        value === null
            ? ""
            : value
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getFullName(student) {
    if (!student) {
        return "Student";
    }

    const existingName =
        student.full_name ||
        student.fullName ||
        student.name;

    if (existingName) {
        return String(existingName).trim();
    }

    const firstName =
        student.first_name ||
        student.firstName ||
        "";

    const middleName =
        student.middle_name ||
        student.middleName ||
        "";

    const lastName =
        student.last_name ||
        student.lastName ||
        "";

    return [
        firstName,
        middleName,
        lastName
    ]
        .filter(function (value) {
            return String(value).trim() !== "";
        })
        .join(" ")
        .trim() || "Student";
}

function getStudentNumber(student) {
    if (!student) {
        return "";
    }

    return (
        student.student_number ||
        student.studentNumber ||
        student.admission_number ||
        student.admissionNumber ||
        student.registration_number ||
        student.registrationNumber ||
        ""
    );
}

function normalizeObject(data) {
    if (!data) {
        return null;
    }

    if (
        data.data &&
        data.data.student
    ) {
        return data.data.student;
    }

    if (data.student) {
        return data.student;
    }

    if (data.data) {
        return data.data;
    }

    return data;
}

function normalizeArray(data, keys) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data) {
        return [];
    }

    const possibleKeys =
        Array.isArray(keys)
            ? keys
            : [];

    for (const key of possibleKeys) {
        if (Array.isArray(data[key])) {
            return data[key];
        }

        if (
            data.data &&
            Array.isArray(data.data[key])
        ) {
            return data.data[key];
        }
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    return [];
}

function getRecordId(record) {
    if (!record) {
        return null;
    }

    return (
        record.id ||
        record.student_id ||
        record.studentId ||
        record.class_id ||
        record.classId ||
        record.class_arm_id ||
        record.classArmId ||
        record.department_id ||
        record.departmentId ||
        record.academic_session_id ||
        record.academicSessionId ||
        record.academic_level_id ||
        record.academicLevelId ||
        null
    );
}

function getRecordName(record) {
    if (!record) {
        return "";
    }

    return (
        record.name ||
        record.title ||
        record.label ||
        record.class_name ||
        record.className ||
        record.class_arm_name ||
        record.classArmName ||
        record.department_name ||
        record.departmentName ||
        record.academic_session_name ||
        record.academicSessionName ||
        record.session_name ||
        record.sessionName ||
        record.level_name ||
        record.levelName ||
        record.description ||
        ""
    );
}

function getStudentApiUrl() {
    return API_BASE + "/students";
}

function getAcademicSessionApiUrl() {
    return API_BASE + "/academic-sessions";
}

function getAcademicLevelApiUrl() {
    return API_BASE + "/academic-levels";
}

function getClassApiUrl() {
    return API_BASE + "/classes";
}

function getDepartmentApiUrl() {
    return API_BASE + "/departments";
}

function getClassArmApiUrl() {
    return API_BASE + "/class-arms";
}

async function apiRequest(url, options) {
    const token = getToken();

    const requestOptions = {
        method: "GET",
        credentials: "include",
        ...(options || {})
    };

    requestOptions.headers = {
        Accept: "application/json",
        ...(requestOptions.headers || {})
    };

    if (token) {
        requestOptions.headers.Authorization =
            "Bearer " + token;
    }

    const response =
        await fetch(
            url,
            requestOptions
        );

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    let data;

    if (
        contentType.includes(
            "application/json"
        )
    ) {
        data = await response.json();
    } else {
        const text =
            await response.text();

        if (!text) {
            data = {};
        } else {
            try {
                data = JSON.parse(text);
            } catch (error) {
                throw new Error(
                    "The server returned an invalid response."
                );
            }
        }
    }

    if (response.status === 401) {
        clearAuthentication();

        window.location.href =
            LOGIN_PAGE;

        throw new Error(
            "Your session has expired. Please log in again."
        );
    }

    if (!response.ok) {
        const message =
            data &&
            (
                data.message ||
                data.error
            );

        throw new Error(
            message ||
            "Unable to complete the request."
        );
    }

    return data;
}

function showMessage(
    message,
    type
) {
    const element =
        findElement(
            "enrollmentMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.className =
        "alert enrollment-message";

    if (type === "success") {
        element.classList.add(
            "alert-success"
        );
    } else if (type === "warning") {
        element.classList.add(
            "alert-warning"
        );
    } else {
        element.classList.add(
            "alert-danger"
        );
    }

    element.classList.add("show");
}

function hideMessage() {
    const element =
        findElement(
            "enrollmentMessage"
        );

    if (!element) {
        return;
    }

    element.textContent = "";
    element.className =
        "alert enrollment-message";
}

function setLoading(
    elementId,
    isLoading,
    text
) {
    const element =
        findElement(elementId);

    if (!element) {
        return;
    }

    if (isLoading) {
        element.classList.add("show");

        if (text) {
            element.lastChild.textContent =
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
        form.style.display = "";
    }
}

function populateSelect(
    selectId,
    records,
    placeholder,
    valueGetter,
    labelGetter
) {
    const select =
        findElement(selectId);

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

    records.forEach(function (record) {
        const id =
            valueGetter(record);

        const label =
            labelGetter(record);

        if (
            id === undefined ||
            id === null ||
            id === ""
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

    if (currentValue) {
        const matchingOption =
            Array.from(
                select.options
            ).find(function (option) {
                return (
                    option.value ===
                    currentValue
                );
            });

        if (matchingOption) {
            select.value =
                currentValue;
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

    select.innerHTML = "";

    const placeholder =
        document.createElement(
            "option"
        );

    placeholder.value = "";
    placeholder.textContent =
        "Select student";

    select.appendChild(
        placeholder
    );

    students.forEach(function (student) {
        const id =
            student.id ||
            student.student_id ||
            student.studentId;

        if (!id) {
            return;
        }

        const option =
            document.createElement(
                "option"
            );

        option.value =
            String(id);

        option.textContent =
            getStudentNumber(student)
                ? getStudentNumber(student) +
                  " - " +
                  getFullName(student)
                : getFullName(student);

        select.appendChild(
            option
        );
    });

    if (currentValue) {
        select.value =
            currentValue;
    }
}

function populateAcademicSessions() {
    populateSelect(
        "academicSessionId",
        academicSessions,
        "Select academic session",
        function (record) {
            return (
                record.id ||
                record.academic_session_id ||
                record.academicSessionId
            );
        },
        function (record) {
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
        function (record) {
            return (
                record.id ||
                record.academic_level_id ||
                record.academicLevelId
            );
        },
        function (record) {
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
        function (record) {
            return (
                record.id ||
                record.class_id ||
                record.classId
            );
        },
        function (record) {
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
        function (record) {
            return (
                record.id ||
                record.department_id ||
                record.departmentId
            );
        },
        function (record) {
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
            function (arm) {
                const armClassId =
                    arm.class_id ||
                    arm.classId;

                if (!classId) {
                    return false;
                }

                return (
                    String(armClassId) ===
                    String(classId)
                );
            }
        );

    populateSelect(
        "classArmId",
        filtered,
        "Select class arm",
        function (record) {
            return (
                record.id ||
                record.class_arm_id ||
                record.classArmId
            );
        },
        function (record) {
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
        getStudentNumber(student) ||
        "Not provided"
    );

    setSummaryValue(
        "summaryStudentName",
        getFullName(student)
    );

    setSummaryValue(
        "summaryStudentGender",
        student.gender ||
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
        findElement(id);

    if (element) {
        element.textContent =
            value ||
            "Not provided";
    }
}

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
        currentEnrollment = null;

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
        enrollment.session ||
        "Not available"
    );

    setSummaryValue(
        "existingEnrollmentLevel",
        enrollment.academic_level_name ||
        enrollment.academicLevelName ||
        enrollment.academic_level ||
        enrollment.academicLevel ||
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
            ? formatDate(enrollmentDate)
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

function formatDate(value) {
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
        return String(value);
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

async function loadCollection(
    url,
    keys
) {
    const data =
        await apiRequest(url);

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

async function loadStudentFromSelection(
    studentId
) {
    if (!studentId) {
        selectedStudent = null;

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
            function (student) {
                const id =
                    student.id ||
                    student.student_id ||
                    student.studentId;

                return (
                    String(id) ===
                    String(studentId)
                );
            }
        );

    selectedStudent =
        localStudent || null;

    renderStudentSummary(
        selectedStudent
    );

    if (!selectedStudent) {
        try {
            const data =
                await apiRequest(
                    getStudentApiUrl() +
                    "/" +
                    encodeURIComponent(
                        studentId
                    )
                );

            selectedStudent =
                normalizeObject(data);

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
        const data =
            await apiRequest(
                API_BASE +
                "/students/" +
                encodeURIComponent(
                    studentId
                ) +
                "/enrollment"
            );

        const enrollment =
            normalizeObject(data);

        renderExistingEnrollment(
            enrollment
        );

        return enrollment;
    } catch (error) {
        if (
            error &&
            error.message &&
            (
                error.message
                    .toLowerCase()
                    .includes("not found")
            )
        ) {
            renderExistingEnrollment(
                null
            );

            return null;
        }

        console.warn(
            "Existing enrollment could not be loaded:",
            error.message
        );

        renderExistingEnrollment(
            null
        );

        return null;
    }
}

function getNumberValue(
    value
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number =
        Number(value);

    if (
        !Number.isInteger(number) ||
        number <= 0
    ) {
        return null;
    }

    return number;
}

function getFormData() {
    const studentId =
        getNumberValue(
            findElement(
                "studentId"
            )?.value
        );

    const academicSessionId =
        getNumberValue(
            findElement(
                "academicSessionId"
            )?.value
        );

    const academicLevelId =
        getNumberValue(
            findElement(
                "academicLevelId"
            )?.value
        );

    const classId =
        getNumberValue(
            findElement(
                "classId"
            )?.value
        );

    const classArmId =
        getNumberValue(
            findElement(
                "classArmId"
            )?.value
        );

    const departmentId =
        getNumberValue(
            findElement(
                "departmentId"
            )?.value
        );

    const enrollmentDate =
        findElement(
            "enrollmentDate"
        )?.value || null;

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
        return "Please select a student.";
    }

    if (!data.academicSessionId) {
        return "Please select an academic session.";
    }

    if (!data.classId) {
        return "Please select a class.";
    }

    if (!data.admissionStatus) {
        return "Please select an enrollment status.";
    }

    return null;
}

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
        button.disabled = true;
        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Saving Enrollment...";
    } else {
        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            "Save Enrollment";
    }
}

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

    setSubmitState(true);

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

        const data =
            await apiRequest(
                API_BASE +
                "/students/" +
                encodeURIComponent(
                    formData.studentId
                ) +
                "/enrollment",
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
            normalizeObject(data);

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

        selectedStudent = null;

        renderStudentSummary(
            null
        );

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
        setSubmitState(false);
    }
}

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
    ).catch(function (error) {
        console.error(
            "Student selection error:",
            error
        );
    });
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
            selectedStudent = null;
            currentEnrollment = null;

            renderStudentSummary(
                null
            );

            renderExistingEnrollment(
                null
            );

            populateClassArms("");

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

async function loadInitialData() {
    const results =
        await Promise.allSettled([
            loadStudents(),
            loadAcademicSessions(),
            loadAcademicLevels(),
            loadClasses(),
            loadClassArms(),
            loadDepartments()
        ]);

    const failed =
        results.filter(
            function (result) {
                return (
                    result.status ===
                    "rejected"
                );
            }
        );

    if (failed.length) {
        console.warn(
            "Some enrollment reference data could not be loaded.",
            failed
        );
    }

    showPage();

    if (!students.length) {
        showMessage(
            "No students are currently available for enrollment.",
            "warning"
        );
    }
}

async function initializeEnrollmentPage() {
    setupEventListeners();

    const params =
        new URLSearchParams(
            window.location.search
        );

    const studentId =
        params.get("studentId") ||
        params.get("student_id") ||
        params.get("id") ||
        "";

    try {
        await loadInitialData();

        if (studentId) {
            const studentSelect =
                findElement(
                    "studentId"
                );

            if (studentSelect) {
                const option =
                    Array.from(
                        studentSelect.options
                    ).find(
                        function (item) {
                            return (
                                item.value ===
                                String(
                                    studentId
                                )
                            );
                        }
                    );

                if (option) {
                    studentSelect.value =
                        String(
                            studentId
                        );

                    await loadStudentFromSelection(
                        studentId
                    );
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

window.initializeEnrollmentPage =
    initializeEnrollmentPage;

window.submitEnrollment =
    submitEnrollment;

window.loadExistingStudentEnrollment =
    loadExistingStudentEnrollment;

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
```

})();
