"use strict";

| /*                                                                         |
| -------------------------------------------------------------------------- |
| TIMETABLE PAGE                                                             |
| -------------------------------------------------------------------------- |
|                                                                            |
| Frontend controller for:                                                   |
|                                                                            |
| /pages/timetable.html                                                      |
|                                                                            |
| API:                                                                       |
|                                                                            |
| /api/timetable                                                             |
|                                                                            |
| Responsibilities:                                                          |
| - Load timetable supporting data                                           |
| - Load timetable entries                                                   |
| - Render weekly timetable                                                  |
| - Create timetable entries                                                 |
| - Update timetable entries                                                 |
| - Delete timetable entries                                                 |
| - Check class conflicts                                                    |
| - Check teacher conflicts                                                  |
| - Handle filters                                                           |
| - Handle printing                                                          |
|                                                                            |
| -------------------------------------------------------------------------- |
| */                                                                         |

(function () {
const API_BASE = "/api";

```
const TIMETABLE_API = `${API_BASE}/timetable`;
const SESSION_API = `${API_BASE}/academic-sessions`;
const CLASS_API = `${API_BASE}/classes`;
const CLASS_ARM_API = `${API_BASE}/class-arms`;
const SUBJECT_API = `${API_BASE}/subjects`;
const STAFF_API = `${API_BASE}/staff`;

const state = {
    timetable: [],
    sessions: [],
    classes: [],
    classArms: [],
    subjects: [],
    staff: [],
    editingId: null,
    modal: null,
    loading: false
};

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

const DAY_ORDER = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7
};

const elements = {};

/*
|--------------------------------------------------------------------------
| INITIALIZATION
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", initializeTimetablePage);

async function initializeTimetablePage() {
    cacheElements();
    initializeBootstrapModal();
    bindEvents();
    initializeCommonPageControls();

    await loadReferenceData();
    await loadTimetable();
}

/*
|--------------------------------------------------------------------------
| ELEMENT CACHE
|--------------------------------------------------------------------------
*/

function cacheElements() {
    elements.messageContainer =
        document.getElementById("messageContainer");

    elements.loadingContainer =
        document.getElementById("loadingContainer");

    elements.totalTimetableEntries =
        document.getElementById("totalTimetableEntries");

    elements.totalTimetableClasses =
        document.getElementById("totalTimetableClasses");

    elements.totalTimetableSubjects =
        document.getElementById("totalTimetableSubjects");

    elements.totalTimetableTeachers =
        document.getElementById("totalTimetableTeachers");

    elements.academicSessionFilter =
        document.getElementById("academicSessionFilter");

    elements.classFilter =
        document.getElementById("classFilter");

    elements.classArmFilter =
        document.getElementById("classArmFilter");

    elements.teacherFilter =
        document.getElementById("teacherFilter");

    elements.subjectFilter =
        document.getElementById("subjectFilter");

    elements.dayFilter =
        document.getElementById("dayFilter");

    elements.searchTimetable =
        document.getElementById("searchTimetable");

    elements.applyFiltersButton =
        document.getElementById("applyFiltersButton");

    elements.clearFiltersButton =
        document.getElementById("clearFiltersButton");

    elements.refreshTimetableButton =
        document.getElementById("refreshTimetableButton");

    elements.printTimetableButton =
        document.getElementById("printTimetableButton");

    elements.addTimetableButton =
        document.getElementById("addTimetableButton");

    elements.emptyAddTimetableButton =
        document.getElementById("emptyAddTimetableButton");

    elements.emptyTimetableContainer =
        document.getElementById("emptyTimetableContainer");

    elements.timetableTableContainer =
        document.getElementById("timetableTableContainer");

    elements.timetableTableBody =
        document.getElementById("timetableTableBody");

    elements.timetablePeriodLabel =
        document.getElementById("timetablePeriodLabel");

    elements.timetableModal =
        document.getElementById("timetableModal");

    elements.timetableForm =
        document.getElementById("timetableForm");

    elements.timetableModalLabel =
        document.getElementById("timetableModalLabel");

    elements.timetableId =
        document.getElementById("timetableId");

    elements.selectedEntryInfo =
        document.getElementById("selectedEntryInfo");

    elements.selectedEntryTitle =
        document.getElementById("selectedEntryTitle");

    elements.selectedEntryDescription =
        document.getElementById("selectedEntryDescription");

    elements.academicSessionId =
        document.getElementById("academicSessionId");

    elements.classId =
        document.getElementById("classId");

    elements.classArmId =
        document.getElementById("classArmId");

    elements.subjectId =
        document.getElementById("subjectId");

    elements.teacherId =
        document.getElementById("teacherId");

    elements.dayOfWeek =
        document.getElementById("dayOfWeek");

    elements.startTime =
        document.getElementById("startTime");

    elements.endTime =
        document.getElementById("endTime");

    elements.room =
        document.getElementById("room");

    elements.conflictMessage =
        document.getElementById("conflictMessage");

    elements.formMessage =
        document.getElementById("formMessage");

    elements.saveTimetableButton =
        document.getElementById("saveTimetableButton");

    elements.deleteTimetableButton =
        document.getElementById("deleteTimetableButton");
}

/*
|--------------------------------------------------------------------------
| BOOTSTRAP MODAL
|--------------------------------------------------------------------------
*/

function initializeBootstrapModal() {
    if (
        elements.timetableModal &&
        typeof bootstrap !== "undefined" &&
        bootstrap.Modal
    ) {
        state.modal = bootstrap.Modal.getOrCreateInstance(
            elements.timetableModal
        );
    }
}

/*
|--------------------------------------------------------------------------
| EVENT BINDINGS
|--------------------------------------------------------------------------
*/

function bindEvents() {
    elements.addTimetableButton?.addEventListener(
        "click",
        () => openCreateModal()
    );

    elements.emptyAddTimetableButton?.addEventListener(
        "click",
        () => openCreateModal()
    );

    elements.refreshTimetableButton?.addEventListener(
        "click",
        () => loadTimetable()
    );

    elements.applyFiltersButton?.addEventListener(
        "click",
        () => loadTimetable()
    );

    elements.clearFiltersButton?.addEventListener(
        "click",
        clearFilters
    );

    elements.printTimetableButton?.addEventListener(
        "click",
        printTimetable
    );

    elements.timetableForm?.addEventListener(
        "submit",
        handleFormSubmit
    );

    elements.deleteTimetableButton?.addEventListener(
        "click",
        handleDelete
    );

    elements.classFilter?.addEventListener(
        "change",
        () => {
            const classId = elements.classFilter.value;
            populateClassArmFilter(classId);
        }
    );

    elements.classId?.addEventListener(
        "change",
        () => {
            const classId = elements.classId.value;
            populateClassArmForm(classId);
        }
    );

    elements.academicSessionFilter?.addEventListener(
        "change",
        () => loadTimetable()
    );

    elements.classFilter?.addEventListener(
        "change",
        () => loadTimetable()
    );

    elements.classArmFilter?.addEventListener(
        "change",
        () => loadTimetable()
    );

    elements.teacherFilter?.addEventListener(
        "change",
        () => loadTimetable()
    );

    elements.subjectFilter?.addEventListener(
        "change",
        () => loadTimetable()
    );

    elements.dayFilter?.addEventListener(
        "change",
        () => loadTimetable()
    );

    let searchTimer;

    elements.searchTimetable?.addEventListener(
        "input",
        () => {
            clearTimeout(searchTimer);

            searchTimer = setTimeout(
                () => loadTimetable(),
                350
            );
        }
    );

    elements.dayOfWeek?.addEventListener(
        "change",
        clearConflictMessage
    );

    elements.startTime?.addEventListener(
        "change",
        clearConflictMessage
    );

    elements.endTime?.addEventListener(
        "change",
        clearConflictMessage
    );

    elements.classId?.addEventListener(
        "change",
        clearConflictMessage
    );

    elements.classArmId?.addEventListener(
        "change",
        clearConflictMessage
    );

    elements.teacherId?.addEventListener(
        "change",
        clearConflictMessage
    );
}

/*
|--------------------------------------------------------------------------
| COMMON PAGE CONTROLS
|--------------------------------------------------------------------------
*/

function initializeCommonPageControls() {
    const sidebarToggle =
        document.getElementById("sidebarToggle");

    const sidebar =
        document.getElementById("sidebar");

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener(
            "click",
            () => {
                sidebar.classList.toggle("show");
            }
        );
    }

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            handleLogout
        );
    }

    updateUserName();
}

function updateUserName() {
    const userNameElement =
        document.getElementById("userName");

    if (!userNameElement) {
        return;
    }

    try {
        const user =
            JSON.parse(
                localStorage.getItem("user") ||
                localStorage.getItem("currentUser") ||
                "null"
            );

        if (user) {
            const name =
                user.fullName ||
                user.name ||
                [
                    user.firstName,
                    user.lastName
                ]
                    .filter(Boolean)
                    .join(" ") ||
                user.email ||
                "User";

            userNameElement.textContent = name;
        }
    } catch (error) {
        console.warn(
            "Unable to read current user.",
            error
        );
    }
}

function handleLogout() {
    try {
        if (
            typeof window.logout === "function"
        ) {
            window.logout();
            return;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("currentUser");
    } catch (error) {
        console.warn(
            "Logout cleanup failed.",
            error
        );
    }

    window.location.href = "/pages/login.html";
}

/*
|--------------------------------------------------------------------------
| REFERENCE DATA
|--------------------------------------------------------------------------
*/

async function loadReferenceData() {
    try {
        const [
            sessionsResponse,
            classesResponse,
            classArmsResponse,
            subjectsResponse,
            staffResponse
        ] = await Promise.all([
            apiRequest(SESSION_API),
            apiRequest(CLASS_API),
            apiRequest(CLASS_ARM_API),
            apiRequest(SUBJECT_API),
            apiRequest(`${STAFF_API}?limit=200`)
        ]);

        state.sessions =
            normalizeCollection(
                sessionsResponse,
                [
                    "sessions",
                    "academicSessions",
                    "data"
                ]
            );

        state.classes =
            normalizeCollection(
                classesResponse,
                [
                    "classes",
                    "data"
                ]
            );

        state.classArms =
            normalizeCollection(
                classArmsResponse,
                [
                    "classArms",
                    "class_arms",
                    "data"
                ]
            );

        state.subjects =
            normalizeCollection(
                subjectsResponse,
                [
                    "subjects",
                    "data"
                ]
            );

        state.staff =
            normalizeCollection(
                staffResponse,
                [
                    "staff",
                    "employees",
                    "data"
                ]
            );

        populateReferenceSelects();
    } catch (error) {
        console.error(
            "Unable to load timetable reference data:",
            error
        );

        showMessage(
            error.message ||
            "Some timetable reference data could not be loaded.",
            "warning"
        );
    }
}

function populateReferenceSelects() {
    populateSessions(
        elements.academicSessionFilter,
        state.sessions,
        "All Sessions"
    );

    populateSessions(
        elements.academicSessionId,
        state.sessions,
        "Select academic session"
    );

    populateClasses(
        elements.classFilter,
        state.classes,
        "All Classes"
    );

    populateClasses(
        elements.classId,
        state.classes,
        "Select class"
    );

    populateClassArms(
        elements.classArmFilter,
        state.classArms,
        "All Class Arms"
    );

    populateSubjects(
        elements.subjectFilter,
        state.subjects,
        "All Subjects"
    );

    populateSubjects(
        elements.subjectId,
        state.subjects,
        "Select subject"
    );

    populateStaff(
        elements.teacherFilter,
        state.staff,
        "All Teachers"
    );

    populateStaff(
        elements.teacherId,
        state.staff,
        "Select teacher"
    );
}

function populateSessions(
    select,
    sessions,
    placeholder
) {
    if (!select) {
        return;
    }

    const currentValue = select.value;

    select.innerHTML = "";

    appendOption(
        select,
        "",
        placeholder
    );

    sessions
        .slice()
        .sort((a, b) =>
            String(
                getSessionName(a)
            ).localeCompare(
                String(
                    getSessionName(b)
                )
            )
        )
        .forEach(session => {
            appendOption(
                select,
                getId(session),
                getSessionName(session)
            );
        });

    if (
        currentValue &&
        Array.from(select.options)
            .some(option =>
                option.value === currentValue
            )
    ) {
        select.value = currentValue;
    }
}

function populateClasses(
    select,
    classes,
    placeholder
) {
    if (!select) {
        return;
    }

    const currentValue = select.value;

    select.innerHTML = "";

    appendOption(
        select,
        "",
        placeholder
    );

    classes
        .slice()
        .sort((a, b) =>
            String(
                getClassName(a)
            ).localeCompare(
                String(
                    getClassName(b)
                )
            )
        )
        .forEach(item => {
            appendOption(
                select,
                getId(item),
                getClassName(item)
            );
        });

    if (
        currentValue &&
        Array.from(select.options)
            .some(option =>
                option.value === currentValue
            )
    ) {
        select.value = currentValue;
    }
}

function populateClassArms(
    select,
    classArms,
    placeholder,
    classId = null
) {
    if (!select) {
        return;
    }

    const currentValue = select.value;

    select.innerHTML = "";

    appendOption(
        select,
        "",
        placeholder
    );

    let filtered = classArms;

    if (classId) {
        filtered = classArms.filter(
            arm =>
                String(
                    getField(
                        arm,
                        [
                            "classId",
                            "class_id"
                        ]
                    ) || ""
                ) === String(classId)
        );
    }

    filtered
        .slice()
        .sort((a, b) =>
            String(
                getClassArmName(a)
            ).localeCompare(
                String(
                    getClassArmName(b)
                )
            )
        )
        .forEach(item => {
            appendOption(
                select,
                getId(item),
                getClassArmName(item)
            );
        });

    if (
        currentValue &&
        Array.from(select.options)
            .some(option =>
                option.value === currentValue
            )
    ) {
        select.value = currentValue;
    }
}

function populateClassArmFilter(
    classId = null
) {
    populateClassArms(
        elements.classArmFilter,
        state.classArms,
        "All Class Arms",
        classId || null
    );

    loadTimetable();
}

function populateClassArmForm(
    classId = null
) {
    populateClassArms(
        elements.classArmId,
        state.classArms,
        "Select class arm",
        classId || null
    );
}

function populateSubjects(
    select,
    subjects,
    placeholder
) {
    if (!select) {
        return;
    }

    const currentValue = select.value;

    select.innerHTML = "";

    appendOption(
        select,
        "",
        placeholder
    );

    subjects
        .slice()
        .sort((a, b) =>
            String(
                getSubjectName(a)
            ).localeCompare(
                String(
                    getSubjectName(b)
                )
            )
        )
        .forEach(item => {
            appendOption(
                select,
                getId(item),
                getSubjectName(item)
            );
        });

    if (
        currentValue &&
        Array.from(select.options)
            .some(option =>
                option.value === currentValue
            )
    ) {
        select.value = currentValue;
    }
}

function populateStaff(
    select,
    staff,
    placeholder
) {
    if (!select) {
        return;
    }

    const currentValue = select.value;

    select.innerHTML = "";

    appendOption(
        select,
        "",
        placeholder
    );

    staff
        .slice()
        .sort((a, b) =>
            String(
                getStaffName(a)
            ).localeCompare(
                String(
                    getStaffName(b)
                )
            )
        )
        .forEach(item => {
            appendOption(
                select,
                getId(item),
                getStaffName(item)
            );
        });

    if (
        currentValue &&
        Array.from(select.options)
            .some(option =>
                option.value === currentValue
            )
    ) {
        select.value = currentValue;
    }
}

function appendOption(
    select,
    value,
    label
) {
    const option =
        document.createElement("option");

    option.value =
        value === null ||
        value === undefined
            ? ""
            : String(value);

    option.textContent =
        label || "";

    select.appendChild(option);
}

/*
|--------------------------------------------------------------------------
| LOAD TIMETABLE
|--------------------------------------------------------------------------
*/

async function loadTimetable() {
    if (state.loading) {
        return;
    }

    state.loading = true;

    showLoading(true);

    try {
        const params =
            new URLSearchParams();

        const sessionId =
            elements.academicSessionFilter?.value;

        const classId =
            elements.classFilter?.value;

        const classArmId =
            elements.classArmFilter?.value;

        const teacherId =
            elements.teacherFilter?.value;

        const subjectId =
            elements.subjectFilter?.value;

        const dayOfWeek =
            elements.dayFilter?.value;

        const search =
            elements.searchTimetable?.value
                ?.trim();

        if (sessionId) {
            params.set(
                "academicSessionId",
                sessionId
            );
        }

        if (classId) {
            params.set(
                "classId",
                classId
            );
        }

        if (classArmId) {
            params.set(
                "classArmId",
                classArmId
            );
        }

        if (teacherId) {
            params.set(
                "teacherId",
                teacherId
            );
        }

        if (subjectId) {
            params.set(
                "subjectId",
                subjectId
            );
        }

        if (dayOfWeek) {
            params.set(
                "dayOfWeek",
                dayOfWeek
            );
        }

        if (search) {
            params.set(
                "search",
                search
            );
        }

        params.set("limit", "200");

        const queryString =
            params.toString();

        const url =
            queryString
                ? `${TIMETABLE_API}?${queryString}`
                : TIMETABLE_API;

        const response =
            await apiRequest(url);

        state.timetable =
            normalizeCollection(
                response,
                [
                    "timetable",
                    "entries",
                    "data"
                ]
            );

        renderTimetable();
        updateStatistics();
        updatePeriodLabel();
    } catch (error) {
        console.error(
            "Unable to load timetable:",
            error
        );

        state.timetable = [];

        renderTimetable();

        showMessage(
            error.message ||
            "Unable to load timetable.",
            "danger"
        );
    } finally {
        state.loading = false;
        showLoading(false);
    }
}

/*
|--------------------------------------------------------------------------
| RENDER TIMETABLE
|--------------------------------------------------------------------------
*/

function renderTimetable() {
    if (!elements.timetableTableBody) {
        return;
    }

    elements.timetableTableBody.innerHTML = "";

    const entries =
        state.timetable
            .slice()
            .sort(compareTimetableEntries);

    if (!entries.length) {
        elements.emptyTimetableContainer
            ?.classList.remove("d-none");

        elements.timetableTableContainer
            ?.classList.add("d-none");

        return;
    }

    elements.emptyTimetableContainer
        ?.classList.add("d-none");

    elements.timetableTableContainer
        ?.classList.remove("d-none");

    const grouped =
        groupEntriesByTime(entries);

    const timeSlots =
        Object.keys(grouped)
            .sort(compareTimeLabels);

    timeSlots.forEach(timeSlot => {
        const row =
            document.createElement("tr");

        const timeCell =
            document.createElement("td");

        timeCell.className =
            "time-cell";

        timeCell.textContent =
            formatTimeRangeFromLabel(
                timeSlot
            );

        row.appendChild(timeCell);

        DAYS.forEach(day => {
            const cell =
                document.createElement("td");

            const dayEntries =
                entries.filter(
                    entry =>
                        normalizeDay(
                            getDay(entry)
                        ) === day &&
                        createTimeLabel(
                            getStartTime(entry),
                            getEndTime(entry)
                        ) === timeSlot
                );

            dayEntries.forEach(
                entry => {
                    cell.appendChild(
                        createTimetableEntryElement(
                            entry
                        )
                    );
                }
            );

            row.appendChild(cell);
        });

        elements.timetableTableBody.appendChild(
            row
        );
    });
}

function groupEntriesByTime(entries) {
    const grouped = {};

    entries.forEach(entry => {
        const label =
            createTimeLabel(
                getStartTime(entry),
                getEndTime(entry)
            );

        if (!grouped[label]) {
            grouped[label] = [];
        }

        grouped[label].push(entry);
    });

    return grouped;
}

function createTimetableEntryElement(
    entry
) {
    const wrapper =
        document.createElement("div");

    wrapper.className =
        "timetable-entry";

    wrapper.title =
        "Click to edit timetable entry";

    const subject =
        document.createElement("div");

    subject.className =
        "entry-subject";

    subject.textContent =
        getSubjectNameFromEntry(entry);

    const className =
        document.createElement("div");

    className.className =
        "entry-class";

    className.textContent =
        buildClassDisplay(entry);

    const teacher =
        document.createElement("div");

    teacher.className =
        "entry-teacher";

    teacher.textContent =
        `Teacher: ${getTeacherNameFromEntry(entry)}`;

    const room =
        document.createElement("div");

    room.className =
        "entry-room";

    const roomValue =
        getRoom(entry);

    room.textContent =
        roomValue
            ? `Venue: ${roomValue}`
            : "Venue: Not specified";

    wrapper.appendChild(subject);
    wrapper.appendChild(className);
    wrapper.appendChild(teacher);
    wrapper.appendChild(room);

    wrapper.addEventListener(
        "click",
        () => openEditModal(entry)
    );

    return wrapper;
}

/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

function updateStatistics() {
    const entries =
        state.timetable;

    if (elements.totalTimetableEntries) {
        elements.totalTimetableEntries.textContent =
            entries.length;
    }

    const classIds =
        new Set(
            entries
                .map(entry =>
                    getField(
                        entry,
                        [
                            "classId",
                            "class_id"
                        ]
                    )
                )
                .filter(Boolean)
        );

    const subjectIds =
        new Set(
            entries
                .map(entry =>
                    getField(
                        entry,
                        [
                            "subjectId",
                            "subject_id"
                        ]
                    )
                )
                .filter(Boolean)
        );

    const teacherIds =
        new Set(
            entries
                .map(entry =>
                    getField(
                        entry,
                        [
                            "teacherId",
                            "teacher_id"
                        ]
                    )
                )
                .filter(Boolean)
        );

    if (elements.totalTimetableClasses) {
        elements.totalTimetableClasses.textContent =
            classIds.size;
    }

    if (elements.totalTimetableSubjects) {
        elements.totalTimetableSubjects.textContent =
            subjectIds.size;
    }

    if (elements.totalTimetableTeachers) {
        elements.totalTimetableTeachers.textContent =
            teacherIds.size;
    }
}

function updatePeriodLabel() {
    if (!elements.timetablePeriodLabel) {
        return;
    }

    const sessionId =
        elements.academicSessionFilter?.value;

    const session =
        state.sessions.find(
            item =>
                String(
                    getId(item)
                ) === String(sessionId)
        );

    const sessionName =
        session
            ? getSessionName(session)
            : "All Sessions";

    const classId =
        elements.classFilter?.value;

    const classItem =
        state.classes.find(
            item =>
                String(
                    getId(item)
                ) === String(classId)
        );

    const className =
        classItem
            ? getClassName(classItem)
            : "All Classes";

    elements.timetablePeriodLabel.textContent =
        `${sessionName} • ${className}`;
}

/*
|--------------------------------------------------------------------------
| CREATE MODAL
|--------------------------------------------------------------------------
*/

function openCreateModal() {
    state.editingId = null;

    if (!elements.timetableForm) {
        return;
    }

    elements.timetableForm.reset();

    elements.timetableId.value = "";

    elements.timetableModalLabel.textContent =
        "Add Timetable Entry";

    elements.saveTimetableButton.innerHTML =
        '<i class="bi bi-check-lg"></i> Save Timetable Entry';

    elements.deleteTimetableButton
        ?.classList.add("d-none");

    elements.selectedEntryInfo
        ?.classList.add("d-none");

    clearFormMessage();
    clearConflictMessage();

    populateReferenceSelects();

    if (
        elements.academicSessionFilter?.value
    ) {
        elements.academicSessionId.value =
            elements.academicSessionFilter.value;
    }

    if (
        elements.classFilter?.value
    ) {
        elements.classId.value =
            elements.classFilter.value;

        populateClassArmForm(
            elements.classId.value
        );
    }

    if (
        elements.classArmFilter?.value
    ) {
        elements.classArmId.value =
            elements.classArmFilter.value;
    }

    if (
        elements.teacherFilter?.value
    ) {
        elements.teacherId.value =
            elements.teacherFilter.value;
    }

    if (
        elements.subjectFilter?.value
    ) {
        elements.subjectId.value =
            elements.subjectFilter.value;
    }

    if (
        elements.dayFilter?.value
    ) {
        elements.dayOfWeek.value =
            elements.dayFilter.value;
    }

    showModal();
}

/*
|--------------------------------------------------------------------------
| EDIT MODAL
|--------------------------------------------------------------------------
*/

function openEditModal(entry) {
    state.editingId =
        getId(entry);

    elements.timetableModalLabel.textContent =
        "Edit Timetable Entry";

    elements.timetableId.value =
        getId(entry);

    populateReferenceSelects();

    elements.academicSessionId.value =
        getField(
            entry,
            [
                "academicSessionId",
                "academic_session_id"
            ]
        ) || "";

    elements.classId.value =
        getField(
            entry,
            [
                "classId",
                "class_id"
            ]
        ) || "";

    populateClassArmForm(
        elements.classId.value
    );

    elements.classArmId.value =
        getField(
            entry,
            [
                "classArmId",
                "class_arm_id"
            ]
        ) || "";

    elements.subjectId.value =
        getField(
            entry,
            [
                "subjectId",
                "subject_id"
            ]
        ) || "";

    elements.teacherId.value =
        getField(
            entry,
            [
                "teacherId",
                "teacher_id"
            ]
        ) || "";

    elements.dayOfWeek.value =
        normalizeDay(
            getDay(entry)
        );

    elements.startTime.value =
        normalizeTimeInput(
            getStartTime(entry)
        );

    elements.endTime.value =
        normalizeTimeInput(
            getEndTime(entry)
        );

    elements.room.value =
        getRoom(entry) || "";

    elements.selectedEntryTitle.textContent =
        getSubjectNameFromEntry(entry);

    elements.selectedEntryDescription.textContent =
        `${buildClassDisplay(entry)} • ${formatTimeRangeFromValues(
            getStartTime(entry),
            getEndTime(entry)
        )}`;

    elements.selectedEntryInfo
        ?.classList.remove("d-none");

    elements.saveTimetableButton.innerHTML =
        '<i class="bi bi-check-lg"></i> Update Timetable Entry';

    elements.deleteTimetableButton
        ?.classList.remove("d-none");

    clearFormMessage();
    clearConflictMessage();

    showModal();
}

function showModal() {
    if (state.modal) {
        state.modal.show();
        return;
    }

    if (
        elements.timetableModal &&
        typeof bootstrap !== "undefined" &&
        bootstrap.Modal
    ) {
        state.modal =
            bootstrap.Modal.getOrCreateInstance(
                elements.timetableModal
            );

        state.modal.show();
    }
}

function hideModal() {
    if (state.modal) {
        state.modal.hide();
    }
}

/*
|--------------------------------------------------------------------------
| FORM SUBMISSION
|--------------------------------------------------------------------------
*/

async function handleFormSubmit(event) {
    event.preventDefault();

    clearFormMessage();
    clearConflictMessage();

    const validation =
        validateForm();

    if (!validation.valid) {
        showFormMessage(
            validation.message,
            "danger"
        );

        return;
    }

    const payload =
        collectFormData();

    setSaveButtonLoading(true);

    try {
        const conflict =
            await checkConflicts(
                payload,
                state.editingId
            );

        if (conflict.classConflict) {
            showConflictMessage(
                "This class already has another timetable entry during the selected time."
            );

            return;
        }

        if (conflict.teacherConflict) {
            showConflictMessage(
                "This teacher already has another timetable entry during the selected time."
            );

            return;
        }

        if (state.editingId) {
            await updateTimetableEntry(
                state.editingId,
                payload
            );
        } else {
            await createTimetableEntry(
                payload
            );
        }
    } catch (error) {
        console.error(
            "Unable to save timetable entry:",
            error
        );

        showFormMessage(
            error.message ||
            "Unable to save timetable entry.",
            "danger"
        );
    } finally {
        setSaveButtonLoading(false);
    }
}

function validateForm() {
    const requiredFields = [
        {
            element: elements.academicSessionId,
            label: "Academic session"
        },
        {
            element: elements.classId,
            label: "Class"
        },
        {
            element: elements.classArmId,
            label: "Class arm"
        },
        {
            element: elements.subjectId,
            label: "Subject"
        },
        {
            element: elements.teacherId,
            label: "Teacher"
        },
        {
            element: elements.dayOfWeek,
            label: "Day"
        },
        {
            element: elements.startTime,
            label: "Start time"
        },
        {
            element: elements.endTime,
            label: "End time"
        }
    ];

    for (const field of requiredFields) {
        if (
            !field.element ||
            !field.element.value
        ) {
            return {
                valid: false,
                message:
                    `${field.label} is required.`
            };
        }
    }

    if (
        elements.startTime.value >=
        elements.endTime.value
    ) {
        return {
            valid: false,
            message:
                "End time must be later than start time."
        };
    }

    return {
        valid: true
    };
}

function collectFormData() {
    return {
        academicSessionId:
            elements.academicSessionId.value,

        classId:
            elements.classId.value,

        classArmId:
            elements.classArmId.value,

        subjectId:
            elements.subjectId.value,

        teacherId:
            elements.teacherId.value,

        dayOfWeek:
            elements.dayOfWeek.value,

        startTime:
            elements.startTime.value,

        endTime:
            elements.endTime.value,

        room:
            elements.room.value.trim()
    };
}

/*
|--------------------------------------------------------------------------
| CONFLICT CHECKING
|--------------------------------------------------------------------------
*/

async function checkConflicts(
    payload,
    excludeId = null
) {
    const requestPayload = {
        ...payload
    };

    if (excludeId) {
        requestPayload.excludeId =
            excludeId;
    }

    const [
        classResponse,
        teacherResponse
    ] = await Promise.all([
        apiRequest(
            `${TIMETABLE_API}/check-class-conflict`,
            {
                method: "POST",
                body: JSON.stringify(
                    requestPayload
                )
            }
        ),
        apiRequest(
            `${TIMETABLE_API}/check-teacher-conflict`,
            {
                method: "POST",
                body: JSON.stringify(
                    requestPayload
                )
            }
        )
    ]);

    return {
        classConflict:
            Boolean(
                getConflictValue(
                    classResponse
                )
            ),

        teacherConflict:
            Boolean(
                getConflictValue(
                    teacherResponse
                )
            )
    };
}

function getConflictValue(response) {
    if (!response) {
        return false;
    }

    if (
        typeof response.conflict ===
        "boolean"
    ) {
        return response.conflict;
    }

    if (
        response.data &&
        typeof response.data.conflict ===
        "boolean"
    ) {
        return response.data.conflict;
    }

    return Boolean(
        response.entry ||
        response.data?.entry
    );
}

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

async function createTimetableEntry(
    payload
) {
    const response =
        await apiRequest(
            TIMETABLE_API,
            {
                method: "POST",
                body: JSON.stringify(
                    payload
                )
            }
        );

    showMessage(
        getResponseMessage(
            response,
            "Timetable entry created successfully."
        ),
        "success"
    );

    hideModal();

    await loadTimetable();
}

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

async function updateTimetableEntry(
    id,
    payload
) {
    const response =
        await apiRequest(
            `${TIMETABLE_API}/${encodeURIComponent(id)}`,
            {
                method: "PUT",
                body: JSON.stringify(
                    payload
                )
            }
        );

    showMessage(
        getResponseMessage(
            response,
            "Timetable entry updated successfully."
        ),
        "success"
    );

    hideModal();

    await loadTimetable();
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

async function handleDelete() {
    if (!state.editingId) {
        return;
    }

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this timetable entry?"
        );

    if (!confirmed) {
        return;
    }

    elements.deleteTimetableButton.disabled =
        true;

    try {
        const response =
            await apiRequest(
                `${TIMETABLE_API}/${encodeURIComponent(
                    state.editingId
                )}`,
                {
                    method: "DELETE"
                }
            );

        showMessage(
            getResponseMessage(
                response,
                "Timetable entry deleted successfully."
            ),
            "success"
        );

        hideModal();

        state.editingId = null;

        await loadTimetable();
    } catch (error) {
        console.error(
            "Unable to delete timetable entry:",
            error
        );

        showFormMessage(
            error.message ||
            "Unable to delete timetable entry.",
            "danger"
        );
    } finally {
        elements.deleteTimetableButton.disabled =
            false;
    }
}

/*
|--------------------------------------------------------------------------
| FILTERS
|--------------------------------------------------------------------------
*/

function clearFilters() {
    if (elements.academicSessionFilter) {
        elements.academicSessionFilter.value =
            "";
    }

    if (elements.classFilter) {
        elements.classFilter.value =
            "";
    }

    if (elements.classArmFilter) {
        populateClassArms(
            elements.classArmFilter,
            state.classArms,
            "All Class Arms"
        );
    }

    if (elements.teacherFilter) {
        elements.teacherFilter.value =
            "";
    }

    if (elements.subjectFilter) {
        elements.subjectFilter.value =
            "";
    }

    if (elements.dayFilter) {
        elements.dayFilter.value =
            "";
    }

    if (elements.searchTimetable) {
        elements.searchTimetable.value =
            "";
    }

    loadTimetable();
}

/*
|--------------------------------------------------------------------------
| PRINT
|--------------------------------------------------------------------------
*/

function printTimetable() {
    window.print();
}

/*
|--------------------------------------------------------------------------
| UI STATE
|--------------------------------------------------------------------------
*/

function showLoading(show) {
    if (!elements.loadingContainer) {
        return;
    }

    if (show) {
        elements.loadingContainer.style.display =
            "block";
    } else {
        elements.loadingContainer.style.display =
            "none";
    }
}

function showMessage(
    message,
    type = "info"
) {
    if (!elements.messageContainer) {
        return;
    }

    const alert =
        document.createElement("div");

    alert.className =
        `alert alert-${type} alert-dismissible fade show`;

    alert.setAttribute(
        "role",
        "alert"
    );

    alert.textContent =
        message;

    const closeButton =
        document.createElement("button");

    closeButton.type =
        "button";

    closeButton.className =
        "btn-close";

    closeButton.setAttribute(
        "data-bs-dismiss",
        "alert"
    );

    closeButton.setAttribute(
        "aria-label",
        "Close"
    );

    alert.appendChild(
        closeButton
    );

    elements.messageContainer.innerHTML =
        "";

    elements.messageContainer.appendChild(
        alert
    );
}

function showFormMessage(
    message,
    type = "danger"
) {
    if (!elements.formMessage) {
        return;
    }

    elements.formMessage.innerHTML =
        "";

    const alert =
        document.createElement("div");

    alert.className =
        `alert alert-${type} mb-0`;

    alert.textContent =
        message;

    elements.formMessage.appendChild(
        alert
    );
}

function clearFormMessage() {
    if (elements.formMessage) {
        elements.formMessage.innerHTML =
            "";
    }
}

function showConflictMessage(
    message
) {
    if (!elements.conflictMessage) {
        return;
    }

    elements.conflictMessage.textContent =
        message;

    elements.conflictMessage.style.display =
        "block";
}

function clearConflictMessage() {
    if (!elements.conflictMessage) {
        return;
    }

    elements.conflictMessage.textContent =
        "";

    elements.conflictMessage.style.display =
        "none";
}

function setSaveButtonLoading(
    loading
) {
    if (!elements.saveTimetableButton) {
        return;
    }

    elements.saveTimetableButton.disabled =
        loading;

    if (loading) {
        elements.saveTimetableButton.innerHTML =
            '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Saving...';
    } else if (state.editingId) {
        elements.saveTimetableButton.innerHTML =
            '<i class="bi bi-check-lg"></i> Update Timetable Entry';
    } else {
        elements.saveTimetableButton.innerHTML =
            '<i class="bi bi-check-lg"></i> Save Timetable Entry';
    }
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
    const requestOptions = {
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.body
                ? {
                    "Content-Type":
                        "application/json"
                }
                : {}),
            ...(options.headers || {})
        }
    };

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

    if (token) {
        requestOptions.headers.Authorization =
            `Bearer ${token}`;
    }

    const response =
        await fetch(
            url,
            requestOptions
        );

    let data = null;

    try {
        data =
            await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}.`;

        const error =
            new Error(message);

        error.status =
            response.status;

        error.response =
            data;

        throw error;
    }

    return data;
}

/*
|--------------------------------------------------------------------------
| RESPONSE NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeCollection(
    response,
    preferredKeys = []
) {
    if (Array.isArray(response)) {
        return response;
    }

    if (!response) {
        return [];
    }

    for (const key of preferredKeys) {
        if (
            Array.isArray(
                response[key]
            )
        ) {
            return response[key];
        }
    }

    if (
        response.data &&
        Array.isArray(response.data)
    ) {
        return response.data;
    }

    if (
        response.data &&
        typeof response.data ===
        "object"
    ) {
        for (const key of preferredKeys) {
            if (
                Array.isArray(
                    response.data[key]
                )
            ) {
                return response.data[key];
            }
        }
    }

    if (
        response.rows &&
        Array.isArray(response.rows)
    ) {
        return response.rows;
    }

    if (
        response.results &&
        Array.isArray(response.results)
    ) {
        return response.results;
    }

    return [];
}

function getResponseMessage(
    response,
    fallback
) {
    return (
        response?.message ||
        response?.data?.message ||
        fallback
    );
}

/*
|--------------------------------------------------------------------------
| FIELD HELPERS
|--------------------------------------------------------------------------
*/

function getId(item) {
    return getField(
        item,
        [
            "id",
            "timetableId",
            "timetable_id"
        ]
    );
}

function getField(
    item,
    fields
) {
    if (!item) {
        return null;
    }

    for (const field of fields) {
        if (
            item[field] !== undefined &&
            item[field] !== null
        ) {
            return item[field];
        }
    }

    return null;
}

function getSessionName(
    session
) {
    return (
        getField(
            session,
            [
                "sessionName",
                "session_name",
                "name",
                "academicSession",
                "academic_session"
            ]
        ) ||
        "Unnamed Session"
    );
}

function getClassName(
    item
) {
    return (
        getField(
            item,
            [
                "className",
                "class_name",
                "name",
                "classCode",
                "class_code"
            ]
        ) ||
        "Unnamed Class"
    );
}

function getClassArmName(
    item
) {
    return (
        getField(
            item,
            [
                "classArmName",
                "class_arm_name",
                "armName",
                "arm_name",
                "name",
                "armCode",
                "arm_code"
            ]
        ) ||
        "Unnamed Arm"
    );
}

function getSubjectName(
    item
) {
    return (
        getField(
            item,
            [
                "subjectName",
                "subject_name",
                "name",
                "subjectCode",
                "subject_code"
            ]
        ) ||
        "Unnamed Subject"
    );
}

function getStaffName(
    item
) {
    const fullName =
        getField(
            item,
            [
                "fullName",
                "full_name",
                "name"
            ]
        );

    if (fullName) {
        return fullName;
    }

    const firstName =
        getField(
            item,
            [
                "firstName",
                "first_name"
            ]
        ) || "";

    const middleName =
        getField(
            item,
            [
                "middleName",
                "middle_name"
            ]
        ) || "";

    const lastName =
        getField(
            item,
            [
                "lastName",
                "last_name"
            ]
        ) || "";

    const name =
        [
            firstName,
            middleName,
            lastName
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

    return (
        name ||
        getField(
            item,
            [
                "staffNumber",
                "staff_number",
                "email"
            ]
        ) ||
        "Unnamed Teacher"
    );
}

function getDay(
    entry
) {
    return getField(
        entry,
        [
            "dayOfWeek",
            "day_of_week",
            "day"
        ]
    );
}

function getStartTime(
    entry
) {
    return getField(
        entry,
        [
            "startTime",
            "start_time"
        ]
    );
}

function getEndTime(
    entry
) {
    return getField(
        entry,
        [
            "endTime",
            "end_time"
        ]
    );
}

function getRoom(
    entry
) {
    return getField(
        entry,
        [
            "room",
            "venue",
            "classroom"
        ]
    );
}

function getSubjectNameFromEntry(
    entry
) {
    return (
        getField(
            entry,
            [
                "subjectName",
                "subject_name"
            ]
        ) ||
        getSubjectName(
            entry.subject || {}
        )
    );
}

function getTeacherNameFromEntry(
    entry
) {
    return (
        getField(
            entry,
            [
                "teacherName",
                "teacher_name",
                "staffName",
                "staff_name"
            ]
        ) ||
        getStaffName(
            entry.teacher ||
            entry.staff ||
            {}
        )
    );
}

function getClassNameFromEntry(
    entry
) {
    return (
        getField(
            entry,
            [
                "className",
                "class_name"
            ]
        ) ||
        getClassName(
            entry.class || {}
        )
    );
}

function getClassArmNameFromEntry(
    entry
) {
    return (
        getField(
            entry,
            [
                "classArmName",
                "class_arm_name",
                "armName",
                "arm_name"
            ]
        ) ||
        getClassArmName(
            entry.classArm ||
            entry.class_arm ||
            {}
        )
    );
}

function buildClassDisplay(
    entry
) {
    const className =
        getClassNameFromEntry(
            entry
        );

    const classArmName =
        getClassArmNameFromEntry(
            entry
        );

    if (
        classArmName &&
        classArmName !== "Unnamed Arm"
    ) {
        return `${className} - ${classArmName}`;
    }

    return className;
}

/*
|--------------------------------------------------------------------------
| TIME HELPERS
|--------------------------------------------------------------------------
*/

function normalizeDay(
    value
) {
    if (!value) {
        return "";
    }

    const text =
        String(value)
            .trim()
            .toLowerCase();

    const day =
        DAYS.find(
            item =>
                item.toLowerCase() ===
                text
        );

    return day || String(value);
}

function normalizeTimeInput(
    value
) {
    if (!value) {
        return "";
    }

    const text =
        String(value);

    const match =
        text.match(
            /^(\d{1,2}):(\d{2})/
        );

    if (!match) {
        return text;
    }

    return (
        `${String(
            match[1]
        ).padStart(2, "0")}:${match[2]}`
    );
}

function createTimeLabel(
    startTime,
    endTime
) {
    const start =
        normalizeTimeInput(
            startTime
        );

    const end =
        normalizeTimeInput(
            endTime
        );

    return `${start}-${end}`;
}

function formatTimeRangeFromValues(
    startTime,
    endTime
) {
    if (!startTime && !endTime) {
        return "";
    }

    return (
        `${formatTime(startTime)} - ${formatTime(endTime)}`
    );
}

function formatTimeRangeFromLabel(
    label
) {
    if (!label) {
        return "";
    }

    const parts =
        String(label).split("-");

    if (parts.length !== 2) {
        return label;
    }

    return (
        `${formatTime(parts[0])} - ${formatTime(parts[1])}`
    );
}

function formatTime(
    value
) {
    if (!value) {
        return "";
    }

    const normalized =
        normalizeTimeInput(value);

    const parts =
        normalized.split(":");

    if (parts.length < 2) {
        return normalized;
    }

    let hour =
        parseInt(
            parts[0],
            10
        );

    const minute =
        parts[1];

    if (Number.isNaN(hour)) {
        return normalized;
    }

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return (
        `${hour}:${minute} ${period}`
    );
}

function compareTimeLabels(
    a,
    b
) {
    const aStart =
        a.split("-")[0];

    const bStart =
        b.split("-")[0];

    return aStart.localeCompare(
        bStart
    );
}

function compareTimetableEntries(
    a,
    b
) {
    const dayA =
        DAY_ORDER[
            normalizeDay(
                getDay(a)
            )
        ] || 99;

    const dayB =
        DAY_ORDER[
            normalizeDay(
                getDay(b)
            )
        ] || 99;

    if (dayA !== dayB) {
        return dayA - dayB;
    }

    return String(
        getStartTime(a) || ""
    ).localeCompare(
        String(
            getStartTime(b) || ""
        )
    );
}

/*
|--------------------------------------------------------------------------
| PUBLIC PAGE API
|--------------------------------------------------------------------------
*/

window.TimetablePage = {
    load: loadTimetable,
    refresh: loadTimetable,
    openCreate: openCreateModal,
    openEdit: openEditModal,
    clearFilters,
    print: printTimetable
};
```

})();
