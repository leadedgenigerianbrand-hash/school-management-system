"use strict";

(function () {
    let staff = [];
    let departments = [];
    let editingStaffId = null;
    let staffModal = null;

    async function request(endpoint, options = {}) {
        if (typeof window.apiRequest === "function") {
            return window.apiRequest(endpoint, options);
        }

        let url = endpoint;

        if (
            !url.startsWith("http://") &&
            !url.startsWith("https://")
        ) {
            if (!url.startsWith("/")) {
                url = "/" + url;
            }

            if (!url.startsWith("/api/")) {
                url = "/api" + url;
            }
        }

        const token =
            localStorage.getItem("school_management_token") ||
            sessionStorage.getItem("school_management_token") ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            "";

        const headers = {
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        if (
            options.body &&
            !(options.body instanceof FormData) &&
            !headers["Content-Type"] &&
            !headers["content-type"]
        ) {
            headers["Content-Type"] = "application/json";
        }

        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers
            });
        } catch (error) {
            console.error("Staff API error:", error);
            throw new Error("Unable to connect to the server.");
        }

        if (response.status === 401) {
            if (typeof window.clearApiAuthentication === "function") {
                window.clearApiAuthentication();
            } else {
                localStorage.removeItem("school_management_token");
                localStorage.removeItem("school_management_user");
                sessionStorage.removeItem("school_management_token");
                sessionStorage.removeItem("school_management_user");
            }

            if (!window.location.pathname.endsWith("/login.html")) {
                window.location.href = "/pages/login.html";
            }

            throw new Error("Authentication required.");
        }

        if (response.status === 403) {
            throw new Error(
                "You do not have permission to perform this action."
            );
        }

        const contentType =
            response.headers.get("content-type") || "";

        const data =
            contentType.includes("application/json")
                ? await response.json()
                : await response.text();

        if (!response.ok) {
            throw new Error(
                typeof data === "object"
                    ? data?.message ||
                      data?.error ||
                      "Request failed."
                    : data || "Request failed."
            );
        }

        return data;
    }

    async function initialize() {
        setupEvents();
        initializeModal();

        await loadDepartments();
        await loadStaff();

        updateSummary();
    }

    function setupEvents() {
        const addButton =
            document.getElementById("addStaffButton");

        if (addButton) {
            addButton.addEventListener(
                "click",
                handleAddStaffClick
            );
        }

        const refreshButton =
            document.getElementById("refreshStaffButton") ||
            document.getElementById("refreshButton");

        if (refreshButton) {
            refreshButton.addEventListener(
                "click",
                handleRefreshClick
            );
        }

        const form =
            document.querySelector("#staffForm") ||
            document.querySelector("form[data-staff-form]");

        if (form) {
            form.addEventListener(
                "submit",
                handleSubmit
            );
        }

        const search =
            document.querySelector("#searchInput") ||
            document.querySelector("#staffSearch") ||
            document.querySelector("[name='staff_search']");

        if (search) {
            search.addEventListener(
                "input",
                renderStaff
            );
        }

        const statusFilter =
            document.getElementById("statusFilter");

        if (statusFilter) {
            statusFilter.addEventListener(
                "change",
                renderStaff
            );
        }

        const staffTypeFilter =
            document.getElementById("staffTypeFilter");

        if (staffTypeFilter) {
            staffTypeFilter.addEventListener(
                "change",
                renderStaff
            );
        }

        document.addEventListener(
            "click",
            handleActionClick
        );
    }

    function initializeModal() {
        const modalElement =
            document.getElementById("staffModal");

        if (!modalElement) {
            console.warn(
                "Staff modal element #staffModal was not found."
            );

            return;
        }

        if (
            window.bootstrap &&
            typeof window.bootstrap.Modal === "function"
        ) {
            staffModal =
                window.bootstrap.Modal.getOrCreateInstance(
                    modalElement
                );
        }
    }

    function handleAddStaffClick(event) {
        event.preventDefault();

        resetForm();
        updateFormMode("Add Staff");
        openStaffModal();

        console.log(
            "Add Staff button clicked."
        );
    }

    function handleRefreshClick(event) {
        event.preventDefault();

        loadDepartments();
        loadStaff();
    }

    function openStaffModal() {
        const modalElement =
            document.getElementById("staffModal");

        if (!modalElement) {
            console.error(
                "Unable to open staff modal: #staffModal was not found."
            );

            return;
        }

        if (
            window.bootstrap &&
            typeof window.bootstrap.Modal === "function"
        ) {
            if (!staffModal) {
                staffModal =
                    window.bootstrap.Modal.getOrCreateInstance(
                        modalElement
                    );
            }

            staffModal.show();

            return;
        }

        console.error(
            "Bootstrap Modal is not available."
        );

        notify(
            "The staff form could not be opened. Please refresh the page.",
            "error"
        );
    }

    function closeStaffModal() {
        const modalElement =
            document.getElementById("staffModal");

        if (
            modalElement &&
            window.bootstrap &&
            typeof window.bootstrap.Modal === "function"
        ) {
            if (!staffModal) {
                staffModal =
                    window.bootstrap.Modal.getOrCreateInstance(
                        modalElement
                    );
            }

            staffModal.hide();
        }
    }

    async function loadStaff() {
        showLoading();

        try {
            const data =
                await request("/staff");

            staff =
                extractRecords(
                    data,
                    [
                        "data",
                        "staff",
                        "records",
                        "rows",
                        "items"
                    ]
                );

            renderStaff();
            updateSummary();

            console.log(
                "Staff data loaded:",
                staff
            );
        } catch (error) {
            console.error(
                "Unable to load staff:",
                error
            );

            staff = [];

            showError(
                error.message ||
                "Unable to load staff."
            );

            updateSummary();
        }
    }

    async function loadDepartments() {
        const select =
            document.querySelector("#departmentId") ||
            document.querySelector("[name='departmentId']");

        try {
            const data =
                await request("/departments");

            departments =
                extractRecords(
                    data,
                    [
                        "data",
                        "departments",
                        "records",
                        "rows",
                        "items"
                    ]
                );

            if (select) {
                populateDepartments(
                    departments
                );
            }

            updateSummary();

            console.log(
                "Departments data loaded:",
                departments
            );
        } catch (error) {
            console.error(
                "Unable to load departments:",
                error
            );

            departments = [];

            if (select) {
                populateDepartments([]);
            }

            updateSummary();
        }
    }

    function extractRecords(data, keys = []) {
        if (Array.isArray(data)) {
            return data;
        }

        if (!data || typeof data !== "object") {
            return [];
        }

        for (const key of keys) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }

        return [];
    }

    function populateDepartments(departmentRecords) {
        const select =
            document.querySelector("#departmentId") ||
            document.querySelector("[name='departmentId']");

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        select.innerHTML =
            '<option value="">Select department</option>';

        departmentRecords.forEach(
            (department) => {
                const option =
                    document.createElement("option");

                option.value =
                    department.id ??
                    department.department_id ??
                    department.departmentId ??
                    "";

                option.textContent =
                    department.name ||
                    department.department_name ||
                    department.departmentName ||
                    "Department";

                select.appendChild(option);
            }
        );

        if (currentValue) {
            select.value = currentValue;
        }
    }

    function renderStaff() {
        const container =
            getStaffTableBody();

        if (!container) {
            return;
        }

        const search =
            getValue(
                "#searchInput",
                "#staffSearch",
                "[name='staff_search']"
            )
                .trim()
                .toLowerCase();

        const statusFilter =
            getValue("#statusFilter")
                .trim()
                .toLowerCase();

        const staffTypeFilter =
            getValue("#staffTypeFilter")
                .trim()
                .toLowerCase();

        let records =
            Array.isArray(staff)
                ? [...staff]
                : [];

        if (search) {
            records =
                records.filter(
                    (member) => {
                        const name =
                            getStaffName(
                                member
                            ).toLowerCase();

                        const staffNumber =
                            String(
                                member.staff_number ||
                                member.staffNumber ||
                                member.staff_id ||
                                member.employee_id ||
                                ""
                            ).toLowerCase();

                        const email =
                            String(
                                member.email ||
                                ""
                            ).toLowerCase();

                        const phone =
                            String(
                                member.phone ||
                                member.phone_number ||
                                ""
                            ).toLowerCase();

                        const department =
                            String(
                                member.department_name ||
                                member.departmentName ||
                                member.department ||
                                ""
                            ).toLowerCase();

                        const position =
                            String(
                                member.position ||
                                member.job_title ||
                                member.jobTitle ||
                                ""
                            ).toLowerCase();

                        return (
                            name.includes(search) ||
                            staffNumber.includes(search) ||
                            email.includes(search) ||
                            phone.includes(search) ||
                            department.includes(search) ||
                            position.includes(search)
                        );
                    }
                );
        }

        if (statusFilter) {
            records =
                records.filter(
                    (member) =>
                        String(
                            member.status ||
                            "active"
                        ).toLowerCase() ===
                        statusFilter
                );
        }

        if (staffTypeFilter) {
            records =
                records.filter(
                    (member) =>
                        getStaffType(
                            member
                        ).toLowerCase() ===
                        staffTypeFilter
                );
        }

        if (!records.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="students-empty">
                            <div class="students-empty-icon">
                                S
                            </div>

                            <h3>No staff found</h3>

                            <p>
                                There are no staff records matching your search.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        container.innerHTML =
            records
                .map(
                    renderStaffRow
                )
                .join("");
    }

    function renderStaffRow(member) {
        const id =
            member.id ??
            member.staff_id ??
            "";

        const name =
            getStaffName(member);

        const staffNumber =
            member.staff_number ||
            member.staffNumber ||
            member.staff_id ||
            member.employee_id ||
            "-";

        const gender =
            member.gender ||
            "-";

        const staffType =
            getStaffType(member);

        const department =
            member.department_name ||
            member.departmentName ||
            member.department ||
            "-";

        const phone =
            member.phone ||
            member.phone_number ||
            "-";

        const email =
            member.email ||
            "-";

        const status =
            member.status ||
            "active";

        return `
            <tr>
                <td>
                    ${escapeHtml(
                        staffNumber
                    )}
                </td>

                <td>
                    <div class="student-name">
                        <div class="student-avatar">
                            ${escapeHtml(
                                getInitials(name)
                            )}
                        </div>

                        <div class="student-name-text">
                            <strong>
                                ${escapeHtml(name)}
                            </strong>
                        </div>
                    </div>
                </td>

                <td>
                    ${escapeHtml(gender)}
                </td>

                <td>
                    ${escapeHtml(staffType)}
                </td>

                <td>
                    ${escapeHtml(department)}
                </td>

                <td>
                    ${escapeHtml(phone)}
                </td>

                <td>
                    ${escapeHtml(email)}
                </td>

                <td>
                    <span class="status-badge ${escapeAttribute(
                        getStatusClass(status)
                    )}">
                        ${escapeHtml(status)}
                    </span>
                </td>

                <td>
                    <div class="student-actions">
                        <button
                            type="button"
                            class="student-action-btn"
                            data-action="edit-staff"
                            data-id="${escapeAttribute(id)}"
                            title="Edit Staff"
                        >
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button
                            type="button"
                            class="student-action-btn delete"
                            data-action="delete-staff"
                            data-id="${escapeAttribute(id)}"
                            title="Delete Staff"
                        >
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const form =
            event.currentTarget;

        const data =
            formToObject(form);

        data.firstName =
            String(
                data.firstName || ""
            ).trim();

        data.lastName =
            String(
                data.lastName || ""
            ).trim();

        data.middleName =
            String(
                data.middleName || ""
            ).trim();

        data.staffNumber =
            String(
                data.staffNumber || ""
            ).trim();

        data.email =
            String(
                data.email || ""
            ).trim();

        data.phone =
            String(
                data.phone || ""
            ).trim();

        data.address =
            String(
                data.address || ""
            ).trim();

        data.position =
            String(
                data.position || ""
            ).trim();

        data.qualification =
            String(
                data.qualification || ""
            ).trim();

        if (!data.firstName) {
            notify(
                "Please enter the staff first name.",
                "error"
            );

            return;
        }

        if (!data.lastName) {
            notify(
                "Please enter the staff last name.",
                "error"
            );

            return;
        }

        if (!data.staffNumber) {
            notify(
                "Please enter the staff number.",
                "error"
            );

            return;
        }

        if (!data.employmentType) {
            notify(
                "Please select the staff type.",
                "error"
            );

            return;
        }

        const submitButton =
            form.querySelector(
                "button[type='submit']"
            );

        const originalButtonHtml =
            submitButton
                ? submitButton.innerHTML
                : "";

        if (submitButton) {
            submitButton.disabled =
                true;

            submitButton.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm me-1"
                    aria-hidden="true"
                ></span>
                Saving...
            `;
        }

        try {
            if (editingStaffId) {
                await request(
                    `/staff/${encodeURIComponent(
                        editingStaffId
                    )}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(data)
                    }
                );

                notify(
                    "Staff record updated successfully.",
                    "success"
                );
            } else {
                await request(
                    "/staff",
                    {
                        method: "POST",
                        body: JSON.stringify(data)
                    }
                );

                notify(
                    "Staff member added successfully.",
                    "success"
                );
            }

            closeStaffModal();
            resetForm();

            await loadStaff();
            await loadDepartments();
            updateSummary();
        } catch (error) {
            console.error(
                "Staff save failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save staff record.",
                "error"
            );
        } finally {
            if (submitButton) {
                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    originalButtonHtml;
            }
        }
    }

    function editStaff(id) {
        const member =
            staff.find(
                (item) =>
                    String(
                        item.id ??
                        item.staff_id
                    ) ===
                    String(id)
            );

        if (!member) {
            notify(
                "Staff record could not be found.",
                "error"
            );

            return;
        }

        editingStaffId =
            id;

        setFormValue(
            "#staffId",
            member.id ??
            member.staff_id ??
            ""
        );

        setFormValue(
            "#staffNumber",
            member.staff_number ||
            member.staffNumber ||
            member.staff_id ||
            member.employee_id ||
            ""
        );

        setFormValue(
            "#firstName",
            member.first_name ||
            member.firstName ||
            ""
        );

        setFormValue(
            "#lastName",
            member.last_name ||
            member.lastName ||
            ""
        );

        setFormValue(
            "#middleName",
            member.middle_name ||
            member.middleName ||
            ""
        );

        setFormValue(
            "#gender",
            member.gender ||
            ""
        );

        setFormValue(
            "#dateOfBirth",
            member.date_of_birth ||
            member.dateOfBirth ||
            ""
        );

        setFormValue(
            "#phone",
            member.phone ||
            member.phone_number ||
            ""
        );

        setFormValue(
            "#email",
            member.email ||
            ""
        );

        setFormValue(
            "#address",
            member.address ||
            member.residential_address ||
            ""
        );

        setFormValue(
            "#departmentId",
            member.department_id ||
            member.departmentId ||
            ""
        );

        setFormValue(
            "#position",
            member.position ||
            member.job_title ||
            member.jobTitle ||
            ""
        );

        setFormValue(
            "#employmentType",
            member.employment_type ||
            member.employmentType ||
            ""
        );

        setFormValue(
            "#employmentDate",
            member.employment_date ||
            member.employmentDate ||
            ""
        );

        setFormValue(
            "#qualification",
            member.qualification ||
            ""
        );

        setFormValue(
            "#status",
            member.status ||
            "active"
        );

        setFormValue(
            "#notes",
            member.notes ||
            ""
        );

        updateFormMode(
            "Update Staff"
        );

        openStaffModal();
    }

    async function deleteStaff(id) {
        if (
            !window.confirm(
                "Are you sure you want to delete this staff record?"
            )
        ) {
            return;
        }

        try {
            await request(
                `/staff/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            notify(
                "Staff record deleted successfully.",
                "success"
            );

            if (
                String(editingStaffId) ===
                String(id)
            ) {
                resetForm();
            }

            await loadStaff();
            await loadDepartments();
            updateSummary();
        } catch (error) {
            console.error(
                "Staff deletion failed:",
                error
            );

            notify(
                error.message ||
                "Unable to delete staff record.",
                "error"
            );
        }
    }

    async function handleActionClick(event) {
        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.getAttribute(
                "data-action"
            );

        const id =
            button.getAttribute(
                "data-id"
            );

        if (!id) {
            return;
        }

        if (
            action ===
            "edit-staff"
        ) {
            editStaff(id);

            return;
        }

        if (
            action ===
            "delete-staff"
        ) {
            await deleteStaff(id);
        }
    }

    function resetForm() {
        editingStaffId =
            null;

        const form =
            document.querySelector(
                "#staffForm"
            );

        if (form) {
            form.reset();
        }

        setFormValue(
            "#staffId",
            ""
        );

        updateFormMode(
            "Add Staff"
        );
    }

    function updateFormMode(text) {
        const title =
            document.querySelector(
                "#staffModalTitle"
            );

        if (title) {
            title.textContent =
                text;
        }

        const form =
            document.querySelector(
                "#staffForm"
            );

        if (!form) {
            return;
        }

        const button =
            form.querySelector(
                "button[type='submit']"
            );

        if (button) {
            button.innerHTML =
                `<i class="bi bi-check2-circle me-1"></i>${escapeHtml(
                    text === "Update Staff"
                        ? "Update Staff"
                        : "Save Staff"
                )}`;
        }
    }

    function updateSummary() {
        const records =
            Array.isArray(staff)
                ? staff
                : [];

        const total =
            records.length;

        const active =
            records.filter(
                (member) =>
                    isActiveStaff(member)
            ).length;

        const teacherTotal =
            records.filter(
                (member) =>
                    isTeacher(member)
            ).length;

        const departmentKeys =
            new Set();

        records.forEach(
            (member) => {
                const key =
                    getDepartmentKey(member);

                if (key) {
                    departmentKeys.add(key);
                }
            }
        );

        let departmentTotal =
            departmentKeys.size;

        /*
         * When staff records do not contain a department
         * identifier/name but the department endpoint
         * successfully returned exactly one department,
         * use that available department for the summary.
         *
         * This handles the current school setup where
         * one staff member belongs to one available
         * department but the staff API may not expose
         * the relationship in the response.
         */
        if (
            departmentTotal === 0 &&
            total > 0 &&
            Array.isArray(departments) &&
            departments.length === 1
        ) {
            departmentTotal = 1;
        }

        /*
         * If the staff API itself provides department
         * information, its distinct values remain the
         * authoritative staff-based count.
         *
         * When the department endpoint has multiple
         * departments but staff records have no department
         * relationship, do not falsely count every department.
         */
        setSummary(
            [
                "#totalStaffCount",
                "#totalStaff",
                "#total-staff",
                "[data-total-staff]"
            ],
            total
        );

        setSummary(
            [
                "#activeStaffCount",
                "#activeStaff",
                "#active-staff",
                "[data-active-staff]"
            ],
            active
        );

        setSummary(
            [
                "#teacherCount",
                "#teacher-count",
                "[data-teacher-count]"
            ],
            teacherTotal
        );

        setSummary(
            [
                "#departmentCount",
                "#department-count",
                "[data-department-count]"
            ],
            departmentTotal
        );

        const inactive =
            Math.max(
                total - active,
                0
            );

        setSummary(
            [
                "#inactiveStaff",
                "#inactive-staff",
                "[data-inactive-staff]"
            ],
            inactive
        );

        console.log(
            "Staff summary updated:",
            {
                total,
                active,
                teachers: teacherTotal,
                departments: departmentTotal
            }
        );
    }

    function isActiveStaff(member) {
        const status =
            String(
                member?.status ||
                "active"
            )
                .trim()
                .toLowerCase();

        return (
            status === "active" ||
            status === "enabled"
        );
    }

    function isTeacher(member) {
        const type =
            getStaffType(member)
                .trim()
                .toLowerCase();

        const position =
            String(
                member?.position ||
                member?.job_title ||
                member?.jobTitle ||
                ""
            )
                .trim()
                .toLowerCase();

        return (
            type === "teacher" ||
            type === "teachers" ||
            type === "teaching" ||
            position === "teacher" ||
            position.includes("teacher")
        );
    }

    function getDepartmentKey(member) {
        const departmentId =
            member?.department_id ??
            member?.departmentId;

        if (
            departmentId !== undefined &&
            departmentId !== null &&
            String(departmentId).trim() !== ""
        ) {
            return `id:${String(departmentId).trim()}`;
        }

        const departmentName =
            member?.department_name ||
            member?.departmentName ||
            member?.department;

        if (
            departmentName !== undefined &&
            departmentName !== null &&
            String(departmentName).trim() !== ""
        ) {
            return `name:${String(departmentName)
                .trim()
                .toLowerCase()}`;
        }

        return "";
    }

    function setSummary(
        selectors,
        value
    ) {
        for (
            const selector of selectors
        ) {
            const element =
                document.querySelector(
                    selector
                );

            if (element) {
                element.textContent =
                    value;

                return;
            }
        }
    }

    function getStaffName(member) {
        return (
            member?.full_name ||
            member?.fullName ||
            member?.name ||
            [
                member?.first_name ||
                member?.firstName ||
                "",

                member?.middle_name ||
                member?.middleName ||
                "",

                member?.last_name ||
                member?.lastName ||
                ""
            ]
                .filter(Boolean)
                .join(" ")
        ) || "Unknown Staff";
    }

    function getStaffType(member) {
        return (
            member?.employment_type ||
            member?.employmentType ||
            member?.staff_type ||
            member?.staffType ||
            member?.type ||
            member?.position ||
            "-"
        );
    }

    function getInitials(name) {
        if (
            window.App &&
            typeof window.App.getInitials ===
                "function"
        ) {
            return window.App.getInitials(
                name
            );
        }

        return String(name)
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                (word) =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");
    }

    function getStatusClass(status) {
        const value =
            String(status)
                .trim()
                .toLowerCase();

        if (
            value === "active" ||
            value === "enabled"
        ) {
            return "status-active";
        }

        if (
            value === "inactive" ||
            value === "suspended" ||
            value === "disabled"
        ) {
            return "status-inactive";
        }

        return "";
    }

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return escapeHtml(value);
        }

        return date.toLocaleDateString(
            "en-NG",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }

    function formToObject(form) {
        const formData =
            new FormData(form);

        const data = {};

        formData.forEach(
            (value, key) => {
                data[key] =
                    value;
            }
        );

        form.querySelectorAll(
            'input[type="checkbox"]'
        ).forEach(
            (checkbox) => {
                data[
                    checkbox.name
                ] =
                    checkbox.checked;
            }
        );

        return data;
    }

    function getValue(...selectors) {
        for (
            const selector of selectors
        ) {
            const element =
                document.querySelector(
                    selector
                );

            if (element) {
                return (
                    element.value ||
                    ""
                );
            }
        }

        return "";
    }

    function setFormValue(
        selector,
        value
    ) {
        const element =
            document.querySelector(
                selector
            );

        if (!element) {
            return;
        }

        if (
            element.type ===
            "checkbox"
        ) {
            element.checked =
                Boolean(value);
        } else {
            element.value =
                value ?? "";
        }
    }

    function showLoading() {
        const container =
            getStaffTableBody();

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="students-loading">
                        <div class="students-loading-spinner"></div>
                        <p>Loading staff...</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function showError(message) {
        const container =
            getStaffTableBody();

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="students-empty">
                        <h3>Unable to load staff</h3>

                        <p>
                            ${escapeHtml(message)}
                        </p>
                    </div>
                </td>
            </tr>
        `;
    }

    function getStaffTableBody() {
        return (
            document.querySelector(
                "#staffTableBody"
            ) ||
            document.querySelector(
                "#staff-table-body"
            ) ||
            document.querySelector(
                "tbody[data-staff-body]"
            )
        );
    }

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
            document.createElement(
                "div"
            );

        notification.className =
            `alert ${
                type === "error"
                    ? "alert-danger"
                    : "alert-" + type
            }`;

        notification.textContent =
            message;

        notification.style.marginBottom =
            "10px";

        container.appendChild(
            notification
        );

        setTimeout(
            () => {
                notification.remove();
            },
            4000
        );
    }

    function escapeHtml(value) {
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

    function escapeAttribute(value) {
        return escapeHtml(value);
    }

    window.StaffPage = {
        initialize,
        loadStaff,
        loadDepartments,
        editStaff,
        deleteStaff,
        resetForm,
        openStaffModal,
        closeStaffModal
    };

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );
    } else {
        initialize();
    }
})();