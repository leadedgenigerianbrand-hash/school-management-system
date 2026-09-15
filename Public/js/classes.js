"use strict";

(function () {

    const API_BASE = "/api";

    let classes = [];
    let classArms = [];
    let academicLevels = [];

    let editingClassId = null;
    let editingClassArmId = null;

    document.addEventListener("DOMContentLoaded", initialize);

    async function initialize() {

        setupEvents();

        await loadAcademicLevels();
        await loadClasses();
        await loadClassArms();

    }

    function setupEvents() {

        const classForm =
            document.getElementById("classForm");

        const classArmForm =
            document.getElementById("classArmForm");

        const classSearch =
            document.getElementById("classSearch");

        if (classForm) {
            classForm.addEventListener(
                "submit",
                handleClassSubmit
            );
        }

        if (classArmForm) {
            classArmForm.addEventListener(
                "submit",
                handleClassArmSubmit
            );
        }

        if (classSearch) {
            classSearch.addEventListener(
                "input",
                function () {
                    renderClasses(
                        classSearch.value.trim()
                    );
                }
            );
        }

        document.addEventListener(
            "click",
            handleActionClick
        );

    }

    async function loadAcademicLevels() {

        const select =
            document.getElementById("academicLevelId");

        if (!select) {
            return;
        }

        try {

            const response =
                await request(
                    `${API_BASE}/academic-levels`
                );

            academicLevels =
                extractArray(response);

            populateAcademicLevelSelect();

        } catch (error) {

            console.error(
                "Error loading academic levels:",
                error
            );

            select.innerHTML =
                `<option value="">Unable to load levels</option>`;

            showNotification(
                error.message ||
                "Unable to load academic levels.",
                "danger"
            );

        }

    }

    function populateAcademicLevelSelect(
        selectedId = ""
    ) {

        const select =
            document.getElementById("academicLevelId");

        if (!select) {
            return;
        }

        select.innerHTML =
            `<option value="">Select academic level</option>`;

        academicLevels.forEach(function (level) {

            const id =
                getId(level);

            const name =
                level.level_name ||
                level.levelName ||
                level.name ||
                "Academic Level";

            if (!id) {
                return;
            }

            const option =
                document.createElement("option");

            option.value = id;
            option.textContent = name;

            if (
                selectedId &&
                String(id) === String(selectedId)
            ) {
                option.selected = true;
            }

            select.appendChild(option);

        });

    }

    async function loadClasses() {

        try {

            const response =
                await request(
                    `${API_BASE}/classes`
                );

            classes =
                extractArray(response);

            renderClasses();
            populateClassSelect();

        } catch (error) {

            console.error(
                "Error loading classes:",
                error
            );

            renderClassesError(
                error.message ||
                "Unable to load classes."
            );

        }

    }

    async function loadClassArms() {

        try {

            const response =
                await request(
                    `${API_BASE}/class-arms`
                );

            classArms =
                extractArray(response);

            renderClassArms();

        } catch (error) {

            console.error(
                "Error loading class arms:",
                error
            );

            renderClassArmsError(
                error.message ||
                "Unable to load class arms."
            );

        }

    }

    function renderClasses(
        searchTerm = ""
    ) {

        const tbody =
            document.getElementById(
                "classesTableBody"
            );

        if (!tbody) {
            return;
        }

        const search =
            String(searchTerm || "")
                .toLowerCase()
                .trim();

        const filtered =
            classes.filter(function (item) {

                if (!search) {
                    return true;
                }

                const levelName =
                    getAcademicLevelName(item);

                const className =
                    getClassName(item);

                const classCode =
                    item.class_code ||
                    item.classCode ||
                    item.code ||
                    "";

                const description =
                    item.description ||
                    "";

                return (
                    String(levelName)
                        .toLowerCase()
                        .includes(search) ||

                    String(className)
                        .toLowerCase()
                        .includes(search) ||

                    String(classCode)
                        .toLowerCase()
                        .includes(search) ||

                    String(description)
                        .toLowerCase()
                        .includes(search)
                );

            });

        if (!filtered.length) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="loading-cell"
                    >
                        No classes found.
                    </td>
                </tr>
            `;

            return;

        }

        tbody.innerHTML =
            filtered
                .map(renderClassRow)
                .join("");

    }

    function renderClassRow(item) {

        const id =
            getId(item);

        const levelName =
            getAcademicLevelName(item);

        const className =
            getClassName(item);

        const classCode =
            item.class_code ||
            item.classCode ||
            item.code ||
            "-";

        const description =
            item.description ||
            "-";

        const isActive =
            getIsActive(item);

        const armCount =
            getClassArmCount(id);

        return `
            <tr>

                <td>
                    <span class="level-badge">
                        ${escapeHtml(levelName || "-")}
                    </span>
                </td>

                <td>
                    <div class="class-name">
                        ${escapeHtml(className)}
                    </div>
                </td>

                <td>
                    <span class="class-code">
                        ${escapeHtml(classCode)}
                    </span>
                </td>

                <td>
                    ${escapeHtml(description)}
                </td>

                <td>
                    ${armCount}
                </td>

                <td>
                    <span
                        class="status-badge ${
                            isActive
                                ? "bg-success-subtle text-success"
                                : "bg-secondary-subtle text-secondary"
                        }"
                    >
                        ${
                            isActive
                                ? "Active"
                                : "Inactive"
                        }
                    </span>
                </td>

                <td>

                    <div class="btn-group btn-group-sm">

                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            data-action="edit-class"
                            data-id="${escapeAttribute(id)}"
                            title="Edit class"
                        >
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button
                            type="button"
                            class="btn btn-outline-danger"
                            data-action="delete-class"
                            data-id="${escapeAttribute(id)}"
                            title="Delete class"
                        >
                            <i class="bi bi-trash"></i>
                        </button>

                    </div>

                </td>

            </tr>
        `;

    }

    function renderClassArms() {

        const tbody =
            document.getElementById(
                "classArmsTableBody"
            );

        if (!tbody) {
            return;
        }

        if (!classArms.length) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="loading-cell"
                    >
                        No class arms found.
                    </td>
                </tr>
            `;

            return;

        }

        tbody.innerHTML =
            classArms
                .map(renderClassArmRow)
                .join("");

    }

    function renderClassArmRow(item) {

        const id =
            getId(item);

        const className =
            getClassNameFromArm(item);

        const armName =
            item.arm_name ||
            item.armName ||
            item.name ||
            "-";

        const armCode =
            item.arm_code ||
            item.armCode ||
            "";

        const description =
            item.description ||
            "-";

        const isActive =
            getIsActive(item);

        return `
            <tr>

                <td>
                    ${escapeHtml(className)}
                </td>

                <td>

                    <div class="fw-semibold">
                        ${escapeHtml(armName)}
                    </div>

                    ${
                        armCode
                            ? `
                                <small class="text-secondary">
                                    ${escapeHtml(armCode)}
                                </small>
                              `
                            : ""
                    }

                </td>

                <td>
                    ${escapeHtml(description)}
                </td>

                <td>

                    <span
                        class="status-badge ${
                            isActive
                                ? "bg-success-subtle text-success"
                                : "bg-secondary-subtle text-secondary"
                        }"
                    >
                        ${
                            isActive
                                ? "Active"
                                : "Inactive"
                        }
                    </span>

                </td>

                <td>

                    <div class="btn-group btn-group-sm">

                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            data-action="edit-class-arm"
                            data-id="${escapeAttribute(id)}"
                            title="Edit class arm"
                        >
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button
                            type="button"
                            class="btn btn-outline-danger"
                            data-action="delete-class-arm"
                            data-id="${escapeAttribute(id)}"
                            title="Delete class arm"
                        >
                            <i class="bi bi-trash"></i>
                        </button>

                    </div>

                </td>

            </tr>
        `;

    }

    function populateClassSelect(
        selectedId = ""
    ) {

        const select =
            document.getElementById("classId");

        if (!select) {
            return;
        }

        select.innerHTML =
            `<option value="">Select class</option>`;

        classes.forEach(function (item) {

            const id =
                getId(item);

            if (!id) {
                return;
            }

            const className =
                getClassName(item);

            const levelName =
                getAcademicLevelName(item);

            const option =
                document.createElement("option");

            option.value = id;

            option.textContent =
                levelName
                    ? `${levelName} — ${className}`
                    : className;

            if (
                selectedId &&
                String(id) === String(selectedId)
            ) {
                option.selected = true;
            }

            select.appendChild(option);

        });

    }

    async function handleClassSubmit(event) {

        event.preventDefault();

        const levelId =
            document.getElementById(
                "academicLevelId"
            )?.value.trim();

        const className =
            document.getElementById(
                "className"
            )?.value.trim();

        const classCode =
            document.getElementById(
                "classCode"
            )?.value.trim();

        const description =
            document.getElementById(
                "classDescription"
            )?.value.trim();

        const status =
            document.getElementById(
                "classStatus"
            )?.value || "active";

        if (!levelId) {

            showNotification(
                "Please select an academic level.",
                "warning"
            );

            return;

        }

        if (!className) {

            showNotification(
                "Please enter the class name.",
                "warning"
            );

            return;

        }

        if (!classCode) {

            showNotification(
                "Please enter the class code.",
                "warning"
            );

            return;

        }

        const payload = {
            className,
            classCode,
            levelId,
            description,
            status
        };

        try {

            const endpoint =
                editingClassId
                    ? `${API_BASE}/classes/${encodeURIComponent(editingClassId)}`
                    : `${API_BASE}/classes`;

            const method =
                editingClassId
                    ? "PUT"
                    : "POST";

            await request(
                endpoint,
                {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(payload)
                }
            );

            showNotification(
                editingClassId
                    ? "Class updated successfully."
                    : "Class created successfully.",
                "success"
            );

            resetClassForm();

            await loadClasses();
            await loadClassArms();

        } catch (error) {

            console.error(
                "Class save error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to save class.",
                "danger"
            );

        }

    }

    async function handleClassArmSubmit(event) {

        event.preventDefault();

        const classId =
            document.getElementById(
                "classId"
            )?.value.trim();

        const armName =
            document.getElementById(
                "classArmName"
            )?.value.trim();

        const armCode =
            document.getElementById(
                "classArmCode"
            )?.value.trim();

        const description =
            document.getElementById(
                "classArmDescription"
            )?.value.trim();

        const status =
            document.getElementById(
                "classArmStatus"
            )?.value || "active";

        if (!classId) {

            showNotification(
                "Please select a class.",
                "warning"
            );

            return;

        }

        if (!armName) {

            showNotification(
                "Please enter the arm name.",
                "warning"
            );

            return;

        }

        const payload = {
            classId,
            armName,
            armCode,
            description,
            isActive:
                status === "active"
        };

        try {

            const endpoint =
                editingClassArmId
                    ? `${API_BASE}/class-arms/${encodeURIComponent(editingClassArmId)}`
                    : `${API_BASE}/class-arms`;

            const method =
                editingClassArmId
                    ? "PUT"
                    : "POST";

            await request(
                endpoint,
                {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(payload)
                }
            );

            showNotification(
                editingClassArmId
                    ? "Class arm updated successfully."
                    : "Class arm created successfully.",
                "success"
            );

            resetArmForm();

            await loadClassArms();
            await loadClasses();

        } catch (error) {

            console.error(
                "Class arm save error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to save class arm.",
                "danger"
            );

        }

    }

    function editClass(id) {

        const item =
            classes.find(function (classItem) {

                return String(getId(classItem)) ===
                    String(id);

            });

        if (!item) {

            showNotification(
                "Class could not be found.",
                "danger"
            );

            return;

        }

        editingClassId =
            getId(item);

        const levelId =
            item.academic_level_id ||
            item.academicLevelId ||
            item.level_id ||
            item.levelId ||
            "";

        populateAcademicLevelSelect(
            levelId
        );

        setValue(
            "className",
            getClassName(item)
        );

        setValue(
            "classCode",
            item.class_code ||
            item.classCode ||
            item.code ||
            ""
        );

        setValue(
            "classDescription",
            item.description ||
            ""
        );

        setValue(
            "classStatus",
            getIsActive(item)
                ? "active"
                : "inactive"
        );

        const submitButton =
            document.querySelector(
                "#classForm button[type='submit']"
            );

        if (submitButton) {

            submitButton.innerHTML = `
                <i class="bi bi-check2-circle me-2"></i>
                Update Class
            `;

        }

        document
            .getElementById("classForm")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }

    function editClassArm(id) {

        const item =
            classArms.find(function (arm) {

                return String(getId(arm)) ===
                    String(id);

            });

        if (!item) {

            showNotification(
                "Class arm could not be found.",
                "danger"
            );

            return;

        }

        editingClassArmId =
            getId(item);

        setValue(
            "classId",
            item.class_id ||
            item.classId ||
            ""
        );

        setValue(
            "classArmName",
            item.arm_name ||
            item.armName ||
            item.name ||
            ""
        );

        setValue(
            "classArmCode",
            item.arm_code ||
            item.armCode ||
            ""
        );

        setValue(
            "classArmDescription",
            item.description ||
            ""
        );

        setValue(
            "classArmStatus",
            getIsActive(item)
                ? "active"
                : "inactive"
        );

        const submitButton =
            document.querySelector(
                "#classArmForm button[type='submit']"
            );

        if (submitButton) {

            submitButton.innerHTML = `
                <i class="bi bi-check2-circle me-2"></i>
                Update Class Arm
            `;

        }

        document
            .getElementById("classArmForm")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }

    async function deleteClass(id) {

        const item =
            classes.find(function (classItem) {

                return String(getId(classItem)) ===
                    String(id);

            });

        const className =
            item
                ? getClassName(item)
                : "this class";

        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${className}?`
            );

        if (!confirmed) {
            return;
        }

        try {

            await request(
                `${API_BASE}/classes/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            showNotification(
                "Class deleted successfully.",
                "success"
            );

            if (
                editingClassId &&
                String(editingClassId) === String(id)
            ) {

                resetClassForm();

            }

            await loadClasses();
            await loadClassArms();

        } catch (error) {

            console.error(
                "Class delete error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to delete class.",
                "danger"
            );

        }

    }

    async function deleteClassArm(id) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this class arm?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await request(
                `${API_BASE}/class-arms/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            showNotification(
                "Class arm deleted successfully.",
                "success"
            );

            if (
                editingClassArmId &&
                String(editingClassArmId) === String(id)
            ) {

                resetArmForm();

            }

            await loadClassArms();
            await loadClasses();

        } catch (error) {

            console.error(
                "Class arm delete error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to delete class arm.",
                "danger"
            );

        }

    }

    function handleActionClick(event) {

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
            return;
        }

        switch (action) {

            case "edit-class":
                editClass(id);
                break;

            case "delete-class":
                deleteClass(id);
                break;

            case "edit-class-arm":
                editClassArm(id);
                break;

            case "delete-class-arm":
                deleteClassArm(id);
                break;

            default:
                break;

        }

    }

    function resetClassForm() {

        editingClassId = null;

        const form =
            document.getElementById(
                "classForm"
            );

        if (form) {
            form.reset();
        }

        populateAcademicLevelSelect();

        setValue(
            "classStatus",
            "active"
        );

        const submitButton =
            document.querySelector(
                "#classForm button[type='submit']"
            );

        if (submitButton) {

            submitButton.innerHTML = `
                <i class="bi bi-check2-circle me-2"></i>
                Save Class
            `;

        }

    }

    function resetArmForm() {

        editingClassArmId = null;

        const form =
            document.getElementById(
                "classArmForm"
            );

        if (form) {
            form.reset();
        }

        populateClassSelect();

        setValue(
            "classArmStatus",
            "active"
        );

        const submitButton =
            document.querySelector(
                "#classArmForm button[type='submit']"
            );

        if (submitButton) {

            submitButton.innerHTML = `
                <i class="bi bi-check2-circle me-2"></i>
                Save Class Arm
            `;

        }

    }

    async function request(
        endpoint,
        options = {}
    ) {

        const requestOptions = {
            ...options,
            headers: {
                ...(options.headers || {})
            }
        };

        if (!requestOptions.headers.Authorization) {

            let token = null;

            try {

                if (
                    window.Auth &&
                    typeof window.Auth.getToken ===
                        "function"
                ) {

                    token =
                        window.Auth.getToken();

                }

            } catch (error) {

                console.warn(
                    "Unable to read Auth token:",
                    error
                );

            }

            if (!token) {

                token =
                    sessionStorage.getItem(
                        "school_management_token"
                    ) ||
                    localStorage.getItem(
                        "school_management_token"
                    );

            }

            if (token) {

                requestOptions.headers.Authorization =
                    `Bearer ${token}`;

            }

        }

        const response =
            await fetch(
                endpoint,
                requestOptions
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        let body;

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            body =
                await response.json();

        } else {

            const text =
                await response.text();

            body =
                text
                    ? { message: text }
                    : {};

        }

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            showNotification(
                body.message ||
                "Your session has expired. Please log in again.",
                "danger"
            );

            setTimeout(function () {

                if (
                    window.Auth &&
                    typeof window.Auth.logout ===
                        "function"
                ) {

                    window.Auth.logout();

                }

            }, 1200);

            throw new Error(
                body.message ||
                "Authentication failed."
            );

        }

        if (!response.ok) {

            throw new Error(
                body.message ||
                body.error ||
                `Request failed with status ${response.status}.`
            );

        }

        return body;

    }

    function extractArray(response) {

        if (Array.isArray(response)) {
            return response;
        }

        if (
            response &&
            Array.isArray(response.data)
        ) {
            return response.data;
        }

        if (
            response &&
            response.data &&
            Array.isArray(response.data.data)
        ) {
            return response.data.data;
        }

        if (
            response &&
            Array.isArray(response.classes)
        ) {
            return response.classes;
        }

        if (
            response &&
            Array.isArray(response.academicLevels)
        ) {
            return response.academicLevels;
        }

        if (
            response &&
            Array.isArray(response.academic_levels)
        ) {
            return response.academic_levels;
        }

        if (
            response &&
            Array.isArray(response.classArms)
        ) {
            return response.classArms;
        }

        if (
            response &&
            Array.isArray(response.class_arms)
        ) {
            return response.class_arms;
        }

        return [];

    }

    function getId(item) {

        return (
            item?.id ||
            item?._id ||
            item?.class_id ||
            item?.classId ||
            ""
        );

    }

    function getClassName(item) {

        return (
            item?.class_name ||
            item?.className ||
            item?.name ||
            "-"
        );

    }

    function getAcademicLevelName(item) {

        return (
            item?.level_name ||
            item?.levelName ||
            item?.academic_level_name ||
            item?.academicLevelName ||
            item?.academic_level?.level_name ||
            item?.academicLevel?.levelName ||
            findAcademicLevelName(
                item?.academic_level_id ||
                item?.academicLevelId ||
                item?.level_id ||
                item?.levelId
            )
        ) || "-";

    }

    function findAcademicLevelName(id) {

        if (!id) {
            return "";
        }

        const level =
            academicLevels.find(function (item) {

                return String(getId(item)) ===
                    String(id);

            });

        if (!level) {
            return "";
        }

        return (
            level.level_name ||
            level.levelName ||
            level.name ||
            ""
        );

    }

    function getClassNameFromArm(item) {

        if (
            item?.class_name ||
            item?.className
        ) {

            return (
                item.class_name ||
                item.className
            );

        }

        const classId =
            item?.class_id ||
            item?.classId;

        if (!classId) {
            return "-";
        }

        const classItem =
            classes.find(function (classItem) {

                return String(
                    getId(classItem)
                ) ===
                String(classId);

            });

        return classItem
            ? getClassName(classItem)
            : "-";

    }

    function getClassArmCount(classId) {

        if (!classId) {
            return 0;
        }

        return classArms.filter(function (arm) {

            const armClassId =
                arm?.class_id ||
                arm?.classId;

            return String(armClassId) ===
                String(classId);

        }).length;

    }

    function getIsActive(item) {

        if (
            typeof item?.is_active ===
                "boolean"
        ) {

            return item.is_active;

        }

        if (
            typeof item?.isActive ===
                "boolean"
        ) {

            return item.isActive;

        }

        const status =
            String(
                item?.status || ""
            ).toLowerCase();

        if (status) {

            return (
                status === "active" ||
                status === "enabled" ||
                status === "enrolled"
            );

        }

        return true;

    }

    function setValue(
        id,
        value
    ) {

        const element =
            document.getElementById(id);

        if (element) {
            element.value =
                value ?? "";
        }

    }

    function renderClassesError(
        message
    ) {

        const tbody =
            document.getElementById(
                "classesTableBody"
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="loading-cell text-danger"
                >
                    ${escapeHtml(message)}
                </td>
            </tr>
        `;

    }

    function renderClassArmsError(
        message
    ) {

        const tbody =
            document.getElementById(
                "classArmsTableBody"
            );

        if (!tbody) {
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="loading-cell text-danger"
                >
                    ${escapeHtml(message)}
                </td>
            </tr>
        `;

    }

    function showNotification(
        message,
        type = "info"
    ) {

        const container =
            document.getElementById(
                "notification-container"
            );

        if (!container) {

            console.log(
                `[${type}] ${message}`
            );

            return;

        }

        const alert =
            document.createElement(
                "div"
            );

        alert.className =
            `alert alert-${type} alert-dismissible fade show shadow-sm`;

        alert.style.position = "fixed";
        alert.style.top = "20px";
        alert.style.right = "20px";
        alert.style.zIndex = "9999";
        alert.style.minWidth = "280px";

        alert.innerHTML = `
            ${escapeHtml(message)}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert"
                aria-label="Close"
            ></button>
        `;

        container.appendChild(alert);

        setTimeout(function () {

            if (
                alert &&
                alert.parentNode
            ) {

                alert.remove();

            }

        }, 5000);

    }

    function escapeHtml(value) {

        return String(
            value ?? ""
        )
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }

    function escapeAttribute(value) {

        return escapeHtml(value);

    }

    window.ClassesPage = {

        resetClassForm,
        resetArmForm,
        editClass,
        editClassArm,
        deleteClass,
        deleteClassArm,
        loadClasses,
        loadClassArms,
        loadAcademicLevels

    };

})();