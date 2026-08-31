/*
|--------------------------------------------------------------------------
| GUARDIANS.JS
|--------------------------------------------------------------------------
| Handles student guardians / parents.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    let guardians = [];
    let students = [];
    let editingGuardianId = null;


    /*
    |--------------------------------------------------------------------------
    | API HELPER
    |--------------------------------------------------------------------------
    */

    async function request(url, options = {}) {

        if (
            window.API &&
            typeof window.API.request === "function"
        ) {
            return window.API.request(url, options);
        }

        const response = await fetch(url, {
            credentials: "include",
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        const contentType =
            response.headers.get("content-type") || "";

        const data =
            contentType.includes("application/json")
                ? await response.json()
                : await response.text();

        if (!response.ok) {
            throw new Error(
                data?.message ||
                data?.error ||
                "Request failed."
            );
        }

        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | INITIALIZE
    |--------------------------------------------------------------------------
    */

    async function initialize() {

        setupEvents();

        await loadStudents();

        await loadGuardians();
    }


    /*
    |--------------------------------------------------------------------------
    | EVENTS
    |--------------------------------------------------------------------------
    */

    function setupEvents() {

        const form =
            document.querySelector("#guardianForm") ||
            document.querySelector(
                "form[data-guardian-form]"
            );

        if (form) {

            form.addEventListener(
                "submit",
                handleSubmit
            );
        }


        const search =
            document.querySelector("#guardianSearch") ||
            document.querySelector(
                "[name='guardian_search']"
            );

        if (search) {

            const handler =
                window.App &&
                typeof App.debounce === "function"
                    ? App.debounce(
                        renderGuardians,
                        300
                    )
                    : renderGuardians;

            search.addEventListener(
                "input",
                handler
            );
        }


        document.addEventListener(
            "click",
            handleActionClick
        );
    }


    /*
    |--------------------------------------------------------------------------
    | LOAD STUDENTS
    |--------------------------------------------------------------------------
    */

    async function loadStudents() {

        try {

            const data =
                await request(
                    "/api/students"
                );

            students =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.students ||
                        []
                    );

            populateStudentSelect();

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
    | LOAD GUARDIANS
    |--------------------------------------------------------------------------
    */

    async function loadGuardians() {

        showLoading();

        try {

            const data =
                await request(
                    "/api/guardians"
                );

            guardians =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.guardians ||
                        data?.records ||
                        []
                    );

            renderGuardians();

        } catch (error) {

            console.error(
                "Unable to load guardians:",
                error
            );

            guardians = [];

            showError(
                error.message ||
                "Unable to load guardians."
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | POPULATE STUDENT SELECT
    |--------------------------------------------------------------------------
    */

    function populateStudentSelect() {

        const select =
            document.querySelector("#studentId") ||
            document.querySelector("#student-id") ||
            document.querySelector(
                "[name='student_id']"
            );

        if (!select) {
            return;
        }


        const currentValue =
            select.value;


        select.innerHTML =
            `<option value="">
                Select student
            </option>`;


        students.forEach(function (student) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                student.id ||
                student.student_id;


            option.textContent =
                getStudentName(student);


            select.appendChild(
                option
            );
        });


        if (currentValue) {
            select.value =
                currentValue;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RENDER GUARDIANS
    |--------------------------------------------------------------------------
    */

    function renderGuardians() {

        const container =
            document.querySelector(
                "#guardiansTableBody"
            ) ||
            document.querySelector(
                "#guardianTableBody"
            ) ||
            document.querySelector(
                "tbody[data-guardians-body]"
            );


        if (!container) {
            return;
        }


        const search =
            getValue(
                "#guardianSearch",
                "[name='guardian_search']"
            ).toLowerCase();


        let records =
            guardians;


        if (search) {

            records =
                guardians.filter(
                    function (guardian) {

                        const guardianName =
                            getGuardianName(
                                guardian
                            ).toLowerCase();


                        const phone =
                            String(
                                guardian.phone ||
                                guardian.phone_number ||
                                ""
                            ).toLowerCase();


                        const email =
                            String(
                                guardian.email ||
                                ""
                            ).toLowerCase();


                        const studentName =
                            getStudentName(
                                guardian
                            ).toLowerCase();


                        return (
                            guardianName.includes(search) ||
                            phone.includes(search) ||
                            email.includes(search) ||
                            studentName.includes(search)
                        );
                    }
                );
        }


        if (!records.length) {

            container.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="students-empty">
                            <div class="students-empty-icon">
                                👤
                            </div>
                            <h3>No guardians found</h3>
                            <p>
                                No parent or guardian records are available.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        container.innerHTML =
            records
                .map(renderGuardianRow)
                .join("");
    }


    /*
    |--------------------------------------------------------------------------
    | GUARDIAN ROW
    |--------------------------------------------------------------------------
    */

    function renderGuardianRow(guardian) {

        const id =
            guardian.id ||
            guardian.guardian_id;


        const guardianName =
            getGuardianName(guardian);


        const studentName =
            getStudentName(guardian);


        const relationship =
            guardian.relationship ||
            guardian.relation ||
            "-";


        const phone =
            guardian.phone ||
            guardian.phone_number ||
            "-";


        const email =
            guardian.email ||
            "-";


        const occupation =
            guardian.occupation ||
            "-";


        const address =
            guardian.address ||
            "-";


        return `
            <tr>

                <td>
                    <div class="student-name">

                        <div class="student-avatar">
                            ${getInitials(guardianName)}
                        </div>

                        <div class="student-name-text">
                            <strong>
                                ${escapeHtml(guardianName)}
                            </strong>
                        </div>

                    </div>
                </td>

                <td>
                    ${escapeHtml(studentName)}
                </td>

                <td>
                    ${escapeHtml(relationship)}
                </td>

                <td>
                    ${escapeHtml(phone)}
                </td>

                <td>
                    ${escapeHtml(email)}
                </td>

                <td>
                    ${escapeHtml(occupation)}
                </td>

                <td>
                    ${escapeHtml(address)}
                </td>

                <td>
                    <span class="student-status active">
                        Active
                    </span>
                </td>

                <td>
                    <div class="student-actions">

                        <button
                            type="button"
                            class="student-action-btn"
                            data-action="edit-guardian"
                            data-id="${escapeAttribute(id)}"
                            title="Edit"
                        >
                            ✎
                        </button>

                        <button
                            type="button"
                            class="student-action-btn delete"
                            data-action="delete-guardian"
                            data-id="${escapeAttribute(id)}"
                            title="Delete"
                        >
                            ×
                        </button>

                    </div>
                </td>

            </tr>
        `;
    }


    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    async function handleSubmit(event) {

        event.preventDefault();


        const form =
            event.currentTarget;


        const data =
            formToObject(form);


        if (!data.student_id) {

            notify(
                "Please select a student.",
                "error"
            );

            return;
        }


        const firstName =
            data.first_name ||
            data.firstname ||
            "";


        const lastName =
            data.last_name ||
            data.lastname ||
            "";


        if (
            !firstName &&
            !lastName &&
            !data.name &&
            !data.full_name
        ) {

            notify(
                "Please enter the guardian's name.",
                "error"
            );

            return;
        }


        try {

            if (editingGuardianId) {

                await request(
                    `/api/guardians/${editingGuardianId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Guardian updated successfully.",
                    "success"
                );

            } else {

                await request(
                    "/api/guardians",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Guardian added successfully.",
                    "success"
                );
            }


            resetForm();

            await loadGuardians();

        } catch (error) {

            console.error(
                "Guardian save failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save guardian.",
                "error"
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | EDIT GUARDIAN
    |--------------------------------------------------------------------------
    */

    function editGuardian(id) {

        const guardian =
            guardians.find(
                function (item) {

                    return String(
                        item.id ||
                        item.guardian_id
                    ) === String(id);
                }
            );


        if (!guardian) {
            return;
        }


        editingGuardianId =
            id;


        setFormValue(
            "#studentId",
            guardian.student_id ||
            guardian.studentId
        );


        setFormValue(
            "#firstName",
            guardian.first_name ||
            guardian.firstName
        );


        setFormValue(
            "#lastName",
            guardian.last_name ||
            guardian.lastName
        );


        setFormValue(
            "#middleName",
            guardian.middle_name ||
            guardian.middleName
        );


        setFormValue(
            "#name",
            guardian.name ||
            guardian.full_name
        );


        setFormValue(
            "#relationship",
            guardian.relationship ||
            guardian.relation
        );


        setFormValue(
            "#phone",
            guardian.phone ||
            guardian.phone_number
        );


        setFormValue(
            "#email",
            guardian.email
        );


        setFormValue(
            "#occupation",
            guardian.occupation
        );


        setFormValue(
            "#address",
            guardian.address
        );


        setFormValue(
            "#isPrimary",
            guardian.is_primary ??
            guardian.isPrimary ??
            false
        );


        updateFormMode(
            "Update Guardian"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE GUARDIAN
    |--------------------------------------------------------------------------
    */

    async function deleteGuardian(id) {

        if (
            !window.confirm(
                "Are you sure you want to delete this guardian?"
            )
        ) {
            return;
        }


        try {

            await request(
                `/api/guardians/${id}`,
                {
                    method: "DELETE"
                }
            );


            notify(
                "Guardian deleted successfully.",
                "success"
            );


            await loadGuardians();

        } catch (error) {

            console.error(
                "Guardian deletion failed:",
                error
            );

            notify(
                error.message ||
                "Unable to delete guardian.",
                "error"
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | ACTION CLICK
    |--------------------------------------------------------------------------
    */

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
            "edit-guardian"
        ) {

            editGuardian(id);

            return;
        }


        if (
            action ===
            "delete-guardian"
        ) {

            await deleteGuardian(id);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RESET FORM
    |--------------------------------------------------------------------------
    */

    function resetForm() {

        editingGuardianId =
            null;


        const form =
            document.querySelector(
                "#guardianForm"
            );


        if (form) {
            form.reset();
        }


        updateFormMode(
            "Add Guardian"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE FORM BUTTON
    |--------------------------------------------------------------------------
    */

    function updateFormMode(text) {

        const form =
            document.querySelector(
                "#guardianForm"
            );


        if (!form) {
            return;
        }


        const button =
            form.querySelector(
                "button[type='submit']"
            );


        if (button) {
            button.textContent =
                text;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | GET GUARDIAN NAME
    |--------------------------------------------------------------------------
    */

    function getGuardianName(guardian) {

        const fullName =
            guardian.name ||
            guardian.full_name ||
            guardian.guardian_name;


        if (fullName) {
            return fullName;
        }


        return [
            guardian.first_name ||
            guardian.firstName ||
            "",

            guardian.middle_name ||
            guardian.middleName ||
            "",

            guardian.last_name ||
            guardian.lastName ||
            ""
        ]
            .filter(Boolean)
            .join(" ") ||
            "Unknown Guardian";
    }


    /*
    |--------------------------------------------------------------------------
    | GET STUDENT NAME
    |--------------------------------------------------------------------------
    */

    function getStudentName(record) {

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


        return [
            record.student_first_name ||
            record.studentFirstName ||
            record.first_name ||
            record.firstName ||
            "",

            record.student_middle_name ||
            record.studentMiddleName ||
            record.middle_name ||
            record.middleName ||
            "",

            record.student_last_name ||
            record.studentLastName ||
            record.last_name ||
            record.lastName ||
            ""
        ]
            .filter(Boolean)
            .join(" ") ||
            "Unknown Student";
    }


    /*
    |--------------------------------------------------------------------------
    | INITIALS
    |--------------------------------------------------------------------------
    */

    function getInitials(name) {

        if (
            window.App &&
            typeof App.getInitials ===
            "function"
        ) {
            return App.getInitials(name);
        }


        return String(name)
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");
    }


    /*
    |--------------------------------------------------------------------------
    | FORM TO OBJECT
    |--------------------------------------------------------------------------
    */

    function formToObject(form) {

        const formData =
            new FormData(form);


        const data = {};


        formData.forEach(
            function (value, key) {

                data[key] =
                    value;
            }
        );


        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | SET FORM VALUE
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | GET VALUE
    |--------------------------------------------------------------------------
    */

    function getValue(...selectors) {

        for (
            const selector of selectors
        ) {

            const element =
                document.querySelector(
                    selector
                );


            if (element) {
                return element.value || "";
            }
        }


        return "";
    }


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    function showLoading() {

        const container =
            document.querySelector(
                "#guardiansTableBody"
            ) ||
            document.querySelector(
                "#guardianTableBody"
            ) ||
            document.querySelector(
                "tbody[data-guardians-body]"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="students-loading">
                        <div class="students-loading-spinner"></div>
                        <p>
                            Loading guardians...
                        </p>
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

        const container =
            document.querySelector(
                "#guardiansTableBody"
            ) ||
            document.querySelector(
                "#guardianTableBody"
            ) ||
            document.querySelector(
                "tbody[data-guardians-body]"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="students-empty">
                        <h3>Unable to load guardians</h3>
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
    | ESCAPE HTML
    |--------------------------------------------------------------------------
    */

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }


        if (
            window.App &&
            typeof App.escapeHtml ===
            "function"
        ) {
            return App.escapeHtml(value);
        }


        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /*
    |--------------------------------------------------------------------------
    | ESCAPE ATTRIBUTE
    |--------------------------------------------------------------------------
    */

    function escapeAttribute(value) {

        return escapeHtml(value);
    }


    /*
    |--------------------------------------------------------------------------
    | EXPORT
    |--------------------------------------------------------------------------
    */

    window.GuardiansPage = {
        initialize,
        loadGuardians,
        loadStudents,
        editGuardian,
        deleteGuardian,
        resetForm
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