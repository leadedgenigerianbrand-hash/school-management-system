/*
|--------------------------------------------------------------------------
| CLASSES.JS
|--------------------------------------------------------------------------
| Handles class and class-arm management.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    let classes = [];
    let classArms = [];
    let editingClassId = null;
    let editingArmId = null;


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

        await loadClasses();

        await loadClassArms();
    }


    /*
    |--------------------------------------------------------------------------
    | EVENTS
    |--------------------------------------------------------------------------
    */

    function setupEvents() {

        const classForm =
            document.querySelector(
                "#classForm"
            ) ||
            document.querySelector(
                "form[data-class-form]"
            );

        if (classForm) {
            classForm.addEventListener(
                "submit",
                handleClassSubmit
            );
        }


        const armForm =
            document.querySelector(
                "#classArmForm"
            ) ||
            document.querySelector(
                "form[data-class-arm-form]"
            );

        if (armForm) {
            armForm.addEventListener(
                "submit",
                handleArmSubmit
            );
        }


        const search =
            document.querySelector(
                "#classSearch"
            ) ||
            document.querySelector(
                "[name='class_search']"
            );

        if (search) {

            const handler =
                window.App &&
                typeof App.debounce === "function"
                    ? App.debounce(
                        renderClasses,
                        300
                    )
                    : renderClasses;

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
    | LOAD CLASSES
    |--------------------------------------------------------------------------
    */

    async function loadClasses() {

        showLoading(
            "#classesTableBody",
            "Loading classes..."
        );

        try {

            const data =
                await request(
                    "/api/classes"
                );

            classes =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.classes ||
                        []
                    );

            renderClasses();

            populateClassSelects();

        } catch (error) {

            console.error(
                "Failed to load classes:",
                error
            );

            showError(
                "#classesTableBody",
                error.message ||
                "Unable to load classes."
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | LOAD CLASS ARMS
    |--------------------------------------------------------------------------
    */

    async function loadClassArms() {

        const container =
            document.querySelector(
                "#classArmsTableBody"
            );

        if (container) {
            showLoading(
                "#classArmsTableBody",
                "Loading class arms..."
            );
        }

        try {

            const data =
                await request(
                    "/api/class-arms"
                );

            classArms =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.classArms ||
                        data?.class_arms ||
                        []
                    );

            renderClassArms();

        } catch (error) {

            console.error(
                "Failed to load class arms:",
                error
            );

            if (container) {
                showError(
                    "#classArmsTableBody",
                    error.message ||
                    "Unable to load class arms."
                );
            }
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RENDER CLASSES
    |--------------------------------------------------------------------------
    */

    function renderClasses() {

        const container =
            document.querySelector(
                "#classesTableBody"
            ) ||
            document.querySelector(
                "#classTableBody"
            ) ||
            document.querySelector(
                "tbody[data-classes-body]"
            );

        if (!container) {
            return;
        }


        const search =
            getValue(
                "#classSearch",
                "[name='class_search']"
            ).toLowerCase();


        let filtered =
            classes;


        if (search) {

            filtered =
                classes.filter(function (item) {

                    const name =
                        getClassName(item)
                            .toLowerCase();

                    const code =
                        String(
                            item.code ||
                            item.class_code ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(search) ||
                        code.includes(search)
                    );
                });
        }


        if (!filtered.length) {

            container.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="students-empty">
                            <h3>No classes found</h3>
                            <p>
                                No class records are available.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        container.innerHTML =
            filtered
                .map(renderClassRow)
                .join("");
    }


    /*
    |--------------------------------------------------------------------------
    | CLASS ROW
    |--------------------------------------------------------------------------
    */

    function renderClassRow(item) {

        const id =
            item.id ||
            item.class_id;


        const name =
            getClassName(item);


        const code =
            item.code ||
            item.class_code ||
            "-";


        const description =
            item.description ||
            "-";


        const arms =
            classArms.filter(function (arm) {

                return String(
                    arm.class_id ||
                    arm.classId ||
                    ""
                ) === String(id);

            }).length;


        return `
            <tr>

                <td>
                    <strong>
                        ${escapeHtml(name)}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(code)}
                </td>

                <td>
                    ${escapeHtml(description)}
                </td>

                <td>
                    ${arms}
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
                            data-action="edit-class"
                            data-id="${escapeAttribute(id)}"
                            title="Edit"
                        >
                            ✎
                        </button>

                        <button
                            type="button"
                            class="student-action-btn delete"
                            data-action="delete-class"
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
    | RENDER CLASS ARMS
    |--------------------------------------------------------------------------
    */

    function renderClassArms() {

        const container =
            document.querySelector(
                "#classArmsTableBody"
            );

        if (!container) {
            return;
        }


        if (!classArms.length) {

            container.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="students-empty">
                            <h3>No class arms found</h3>
                            <p>
                                No class arm records are available.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        container.innerHTML =
            classArms
                .map(renderClassArmRow)
                .join("");
    }


    /*
    |--------------------------------------------------------------------------
    | CLASS ARM ROW
    |--------------------------------------------------------------------------
    */

    function renderClassArmRow(item) {

        const id =
            item.id ||
            item.class_arm_id;


        const classId =
            item.class_id ||
            item.classId;


        const name =
            item.name ||
            item.arm_name ||
            item.class_arm_name ||
            "-";


        const className =
            item.class_name ||
            item.className ||
            findClassName(classId);


        return `
            <tr>

                <td>
                    ${escapeHtml(className)}
                </td>

                <td>
                    <strong>
                        ${escapeHtml(name)}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        item.capacity || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item.room ||
                        item.room_number ||
                        "-"
                    )}
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
                            data-action="edit-class-arm"
                            data-id="${escapeAttribute(id)}"
                            title="Edit"
                        >
                            ✎
                        </button>

                        <button
                            type="button"
                            class="student-action-btn delete"
                            data-action="delete-class-arm"
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
    | POPULATE CLASS SELECTS
    |--------------------------------------------------------------------------
    */

    function populateClassSelects() {

        const selects =
            document.querySelectorAll(
                "#classId, #class-id, [name='class_id']"
            );


        selects.forEach(function (select) {

            const current =
                select.value;


            select.innerHTML =
                `<option value="">
                    Select class
                </option>`;


            classes.forEach(function (item) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id ||
                    item.class_id;


                option.textContent =
                    getClassName(item);


                select.appendChild(
                    option
                );
            });


            if (current) {
                select.value =
                    current;
            }
        });
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE / UPDATE CLASS
    |--------------------------------------------------------------------------
    */

    async function handleClassSubmit(event) {

        event.preventDefault();


        const form =
            event.currentTarget;


        const data =
            formToObject(form);


        try {

            if (editingClassId) {

                await request(
                    `/api/classes/${editingClassId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Class updated successfully.",
                    "success"
                );

            } else {

                await request(
                    "/api/classes",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Class created successfully.",
                    "success"
                );
            }


            resetClassForm();

            await loadClasses();

        } catch (error) {

            console.error(
                "Class save failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save class.",
                "error"
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE / UPDATE CLASS ARM
    |--------------------------------------------------------------------------
    */

    async function handleArmSubmit(event) {

        event.preventDefault();


        const form =
            event.currentTarget;


        const data =
            formToObject(form);


        try {

            if (editingArmId) {

                await request(
                    `/api/class-arms/${editingArmId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Class arm updated successfully.",
                    "success"
                );

            } else {

                await request(
                    "/api/class-arms",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Class arm created successfully.",
                    "success"
                );
            }


            resetArmForm();

            await loadClassArms();

        } catch (error) {

            console.error(
                "Class arm save failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save class arm.",
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
            "edit-class"
        ) {

            editClass(id);

            return;
        }


        if (
            action ===
            "delete-class"
        ) {

            await deleteClass(id);

            return;
        }


        if (
            action ===
            "edit-class-arm"
        ) {

            editClassArm(id);

            return;
        }


        if (
            action ===
            "delete-class-arm"
        ) {

            await deleteClassArm(id);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | EDIT CLASS
    |--------------------------------------------------------------------------
    */

    function editClass(id) {

        const item =
            classes.find(
                function (record) {

                    return String(
                        record.id ||
                        record.class_id
                    ) === String(id);
                }
            );


        if (!item) {
            return;
        }


        editingClassId =
            id;


        setFormValue(
            "#className",
            item.name ||
            item.class_name
        );


        setFormValue(
            "#classCode",
            item.code ||
            item.class_code
        );


        setFormValue(
            "#classDescription",
            item.description
        );


        updateFormMode(
            "#classForm",
            "Update Class"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | EDIT CLASS ARM
    |--------------------------------------------------------------------------
    */

    function editClassArm(id) {

        const item =
            classArms.find(
                function (record) {

                    return String(
                        record.id ||
                        record.class_arm_id
                    ) === String(id);
                }
            );


        if (!item) {
            return;
        }


        editingArmId =
            id;


        setFormValue(
            "#classId",
            item.class_id ||
            item.classId
        );


        setFormValue(
            "#classArmName",
            item.name ||
            item.arm_name ||
            item.class_arm_name
        );


        setFormValue(
            "#capacity",
            item.capacity
        );


        setFormValue(
            "#room",
            item.room ||
            item.room_number
        );


        updateFormMode(
            "#classArmForm",
            "Update Class Arm"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE CLASS
    |--------------------------------------------------------------------------
    */

    async function deleteClass(id) {

        if (
            !window.confirm(
                "Are you sure you want to delete this class?"
            )
        ) {
            return;
        }


        try {

            await request(
                `/api/classes/${id}`,
                {
                    method: "DELETE"
                }
            );


            notify(
                "Class deleted successfully.",
                "success"
            );


            await loadClasses();

        } catch (error) {

            console.error(
                "Class deletion failed:",
                error
            );

            notify(
                error.message ||
                "Unable to delete class.",
                "error"
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE CLASS ARM
    |--------------------------------------------------------------------------
    */

    async function deleteClassArm(id) {

        if (
            !window.confirm(
                "Are you sure you want to delete this class arm?"
            )
        ) {
            return;
        }


        try {

            await request(
                `/api/class-arms/${id}`,
                {
                    method: "DELETE"
                }
            );


            notify(
                "Class arm deleted successfully.",
                "success"
            );


            await loadClassArms();

        } catch (error) {

            console.error(
                "Class arm deletion failed:",
                error
            );

            notify(
                error.message ||
                "Unable to delete class arm.",
                "error"
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RESET CLASS FORM
    |--------------------------------------------------------------------------
    */

    function resetClassForm() {

        editingClassId =
            null;


        const form =
            document.querySelector(
                "#classForm"
            );


        if (form) {
            form.reset();
        }


        updateFormMode(
            "#classForm",
            "Add Class"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | RESET ARM FORM
    |--------------------------------------------------------------------------
    */

    function resetArmForm() {

        editingArmId =
            null;


        const form =
            document.querySelector(
                "#classArmForm"
            );


        if (form) {
            form.reset();
        }


        updateFormMode(
            "#classArmForm",
            "Add Class Arm"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | FIND CLASS NAME
    |--------------------------------------------------------------------------
    */

    function findClassName(id) {

        const item =
            classes.find(
                function (record) {

                    return String(
                        record.id ||
                        record.class_id
                    ) === String(id);
                }
            );


        return item
            ? getClassName(item)
            : "-";
    }


    /*
    |--------------------------------------------------------------------------
    | GET CLASS NAME
    |--------------------------------------------------------------------------
    */

    function getClassName(item) {

        return (
            item.name ||
            item.class_name ||
            item.title ||
            item.className ||
            `Class ${item.id || ""}`
        );
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


        if (element) {
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
    | UPDATE FORM MODE
    |--------------------------------------------------------------------------
    */

    function updateFormMode(
        formSelector,
        text
    ) {

        const form =
            document.querySelector(
                formSelector
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
    | LOADING
    |--------------------------------------------------------------------------
    */

    function showLoading(
        selector,
        message
    ) {

        const container =
            document.querySelector(
                selector
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="students-loading">
                        <div class="students-loading-spinner"></div>
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
    | ERROR
    |--------------------------------------------------------------------------
    */

    function showError(
        selector,
        message
    ) {

        const container =
            document.querySelector(
                selector
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="students-empty">
                        <h3>Unable to load records</h3>
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

    window.ClassesPage = {
        initialize,
        loadClasses,
        loadClassArms,
        editClass,
        editClassArm,
        deleteClass,
        deleteClassArm,
        resetClassForm,
        resetArmForm
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