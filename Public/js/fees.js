/*
|--------------------------------------------------------------------------
| FEES.JS
|--------------------------------------------------------------------------
| Handles school fees, payments, balances and fee records.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    let feeRecords = [];
    let students = [];
    let editingFeeId = null;


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

        await loadFees();

        updateSummary();
    }


    /*
    |--------------------------------------------------------------------------
    | EVENTS
    |--------------------------------------------------------------------------
    */

    function setupEvents() {

        const form =
            document.querySelector("#feeForm") ||
            document.querySelector("form[data-fee-form]");

        if (form) {
            form.addEventListener(
                "submit",
                handleSubmit
            );
        }


        const search =
            document.querySelector("#feeSearch") ||
            document.querySelector(
                "[name='fee_search']"
            );

        if (search) {

            const handler =
                window.App &&
                typeof App.debounce === "function"
                    ? App.debounce(
                        renderFees,
                        300
                    )
                    : renderFees;

            search.addEventListener(
                "input",
                handler
            );
        }


        const studentSelect =
            document.querySelector("#studentId") ||
            document.querySelector("#student-id") ||
            document.querySelector(
                "[name='student_id']"
            );

        if (studentSelect) {

            studentSelect.addEventListener(
                "change",
                function () {

                    const student =
                        students.find(function (item) {

                            return String(
                                item.id ||
                                item.student_id
                            ) ===
                            String(
                                studentSelect.value
                            );
                        });


                    if (student) {
                        fillStudentDetails(student);
                    }
                }
            );
        }


        const amountInput =
            document.querySelector("#amount") ||
            document.querySelector(
                "[name='amount']"
            );

        if (amountInput) {

            amountInput.addEventListener(
                "input",
                updateBalancePreview
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
    | LOAD FEES
    |--------------------------------------------------------------------------
    */

    async function loadFees() {

        showLoading();

        try {

            const data =
                await request(
                    "/api/fees"
                );

            feeRecords =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.fees ||
                        data?.records ||
                        []
                    );

            renderFees();

            updateSummary();

        } catch (error) {

            console.error(
                "Unable to load fees:",
                error
            );

            feeRecords = [];

            showError(
                error.message ||
                "Unable to load fee records."
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
    | RENDER FEES
    |--------------------------------------------------------------------------
    */

    function renderFees() {

        const container =
            document.querySelector(
                "#feesTableBody"
            ) ||
            document.querySelector(
                "#feeTableBody"
            ) ||
            document.querySelector(
                "tbody[data-fees-body]"
            );


        if (!container) {
            return;
        }


        const search =
            getValue(
                "#feeSearch",
                "[name='fee_search']"
            ).toLowerCase();


        let records =
            feeRecords;


        if (search) {

            records =
                feeRecords.filter(
                    function (record) {

                        const studentName =
                            getStudentName(
                                record
                            ).toLowerCase();


                        const admission =
                            String(
                                record.admission_number ||
                                record.admissionNumber ||
                                ""
                            ).toLowerCase();


                        const reference =
                            String(
                                record.reference ||
                                record.payment_reference ||
                                ""
                            ).toLowerCase();


                        return (
                            studentName.includes(search) ||
                            admission.includes(search) ||
                            reference.includes(search)
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
                                ₦
                            </div>
                            <h3>No fee records found</h3>
                            <p>
                                No school fee records are available.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        container.innerHTML =
            records
                .map(renderFeeRow)
                .join("");
    }


    /*
    |--------------------------------------------------------------------------
    | FEE ROW
    |--------------------------------------------------------------------------
    */

    function renderFeeRow(record) {

        const id =
            record.id ||
            record.fee_id;


        const studentName =
            getStudentName(record);


        const admission =
            record.admission_number ||
            record.admissionNumber ||
            "-";


        const session =
            record.session_name ||
            record.session ||
            record.academic_session ||
            "-";


        const term =
            record.term_name ||
            record.term ||
            "-";


        const amount =
            Number(
                record.amount ||
                record.fee_amount ||
                0
            );


        const paid =
            Number(
                record.amount_paid ||
                record.paid_amount ||
                record.paid ||
                0
            );


        const balance =
            Math.max(
                amount - paid,
                0
            );


        const status =
            getFeeStatus(
                amount,
                paid,
                record.status
            );


        const paymentDate =
            record.payment_date ||
            record.paid_at ||
            record.created_at ||
            "";


        return `
            <tr>

                <td>
                    <div class="student-name">

                        <div class="student-avatar">
                            ${getInitials(studentName)}
                        </div>

                        <div class="student-name-text">
                            <strong>
                                ${escapeHtml(studentName)}
                            </strong>
                        </div>

                    </div>
                </td>

                <td>
                    ${escapeHtml(admission)}
                </td>

                <td>
                    ${escapeHtml(session)}
                </td>

                <td>
                    ${escapeHtml(term)}
                </td>

                <td>
                    ${formatCurrency(amount)}
                </td>

                <td>
                    ${formatCurrency(paid)}
                </td>

                <td>
                    <strong>
                        ${formatCurrency(balance)}
                    </strong>
                </td>

                <td>
                    <span class="student-status ${status}">
                        ${capitalize(status)}
                    </span>
                </td>

                <td>
                    ${formatDate(paymentDate)}
                </td>

                <td>
                    <div class="student-actions">

                        <button
                            type="button"
                            class="student-action-btn"
                            data-action="edit-fee"
                            data-id="${escapeAttribute(id)}"
                            title="Edit"
                        >
                            ✎
                        </button>

                        <button
                            type="button"
                            class="student-action-btn delete"
                            data-action="delete-fee"
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
    | FEE STATUS
    |--------------------------------------------------------------------------
    */

    function getFeeStatus(
        amount,
        paid,
        suppliedStatus
    ) {

        if (suppliedStatus) {

            const normalized =
                String(
                    suppliedStatus
                ).toLowerCase();

            if (
                normalized === "paid" ||
                normalized === "partial" ||
                normalized === "pending" ||
                normalized === "overdue"
            ) {
                return normalized;
            }
        }


        if (paid <= 0) {
            return "pending";
        }


        if (paid >= amount) {
            return "paid";
        }


        return "partial";
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


        const amount =
            Number(
                data.amount ||
                data.fee_amount ||
                0
            );


        if (!data.student_id) {

            notify(
                "Please select a student.",
                "error"
            );

            return;
        }


        if (
            !amount ||
            amount < 0
        ) {

            notify(
                "Please enter a valid fee amount.",
                "error"
            );

            return;
        }


        try {

            if (editingFeeId) {

                await request(
                    `/api/fees/${editingFeeId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Fee record updated successfully.",
                    "success"
                );

            } else {

                await request(
                    "/api/fees",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Fee record created successfully.",
                    "success"
                );
            }


            resetForm();

            await loadFees();

        } catch (error) {

            console.error(
                "Fee save failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save fee record.",
                "error"
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | EDIT FEE
    |--------------------------------------------------------------------------
    */

    function editFee(id) {

        const record =
            feeRecords.find(
                function (item) {

                    return String(
                        item.id ||
                        item.fee_id
                    ) === String(id);
                }
            );


        if (!record) {
            return;
        }


        editingFeeId =
            id;


        setFormValue(
            "#studentId",
            record.student_id ||
            record.studentId
        );


        setFormValue(
            "#amount",
            record.amount ||
            record.fee_amount
        );


        setFormValue(
            "#amountPaid",
            record.amount_paid ||
            record.paid_amount ||
            record.paid
        );


        setFormValue(
            "#session",
            record.session_id ||
            record.session
        );


        setFormValue(
            "#term",
            record.term_id ||
            record.term
        );


        setFormValue(
            "#paymentDate",
            record.payment_date
        );


        setFormValue(
            "#paymentMethod",
            record.payment_method
        );


        setFormValue(
            "#reference",
            record.reference ||
            record.payment_reference
        );


        setFormValue(
            "#remarks",
            record.remarks ||
            record.remark
        );


        updateFormMode(
            "Update Fee"
        );


        updateBalancePreview();
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE FEE
    |--------------------------------------------------------------------------
    */

    async function deleteFee(id) {

        if (
            !window.confirm(
                "Are you sure you want to delete this fee record?"
            )
        ) {
            return;
        }


        try {

            await request(
                `/api/fees/${id}`,
                {
                    method: "DELETE"
                }
            );


            notify(
                "Fee record deleted successfully.",
                "success"
            );


            await loadFees();

        } catch (error) {

            console.error(
                "Fee deletion failed:",
                error
            );

            notify(
                error.message ||
                "Unable to delete fee record.",
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
            action === "edit-fee"
        ) {

            editFee(id);

            return;
        }


        if (
            action === "delete-fee"
        ) {

            await deleteFee(id);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | FILL STUDENT DETAILS
    |--------------------------------------------------------------------------
    */

    function fillStudentDetails(student) {

        setFormValue(
            "#admissionNumber",
            student.admission_number ||
            student.admissionNumber
        );


        setFormValue(
            "#className",
            student.class_name ||
            student.className
        );
    }


    /*
    |--------------------------------------------------------------------------
    | BALANCE PREVIEW
    |--------------------------------------------------------------------------
    */

    function updateBalancePreview() {

        const amount =
            Number(
                getValue(
                    "#amount",
                    "[name='amount']"
                ) || 0
            );


        const paid =
            Number(
                getValue(
                    "#amountPaid",
                    "[name='amount_paid']"
                ) || 0
            );


        const balance =
            Math.max(
                amount - paid,
                0
            );


        const element =
            document.querySelector(
                "#feeBalance"
            ) ||
            document.querySelector(
                "#balance"
            ) ||
            document.querySelector(
                "[data-fee-balance]"
            );


        if (element) {

            element.textContent =
                formatCurrency(balance);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    function updateSummary() {

        const total =
            feeRecords.reduce(
                function (sum, record) {

                    return sum +
                        Number(
                            record.amount ||
                            record.fee_amount ||
                            0
                        );
                },
                0
            );


        const paid =
            feeRecords.reduce(
                function (sum, record) {

                    return sum +
                        Number(
                            record.amount_paid ||
                            record.paid_amount ||
                            record.paid ||
                            0
                        );
                },
                0
            );


        const balance =
            Math.max(
                total - paid,
                0
            );


        setSummary(
            [
                "#totalFees",
                "#total-fees",
                "[data-total-fees]"
            ],
            total
        );


        setSummary(
            [
                "#totalPaid",
                "#total-paid",
                "[data-total-paid]"
            ],
            paid
        );


        setSummary(
            [
                "#totalBalance",
                "#total-balance",
                "[data-total-balance]"
            ],
            balance
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SET SUMMARY
    |--------------------------------------------------------------------------
    */

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
                    formatCurrency(value);

                return;
            }
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RESET FORM
    |--------------------------------------------------------------------------
    */

    function resetForm() {

        editingFeeId =
            null;


        const form =
            document.querySelector(
                "#feeForm"
            );


        if (form) {
            form.reset();
        }


        updateFormMode(
            "Add Fee"
        );


        updateBalancePreview();
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE FORM BUTTON
    |--------------------------------------------------------------------------
    */

    function updateFormMode(text) {

        const form =
            document.querySelector(
                "#feeForm"
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
    | STUDENT NAME
    |--------------------------------------------------------------------------
    */

    function getStudentName(record) {

        return (
            record.student_name ||
            record.studentName ||
            [
                record.first_name ||
                record.firstName ||
                "",

                record.middle_name ||
                record.middleName ||
                "",

                record.last_name ||
                record.lastName ||
                ""
            ]
                .filter(Boolean)
                .join(" ")
        ) || "Unknown Student";
    }


    /*
    |--------------------------------------------------------------------------
    | INITIALS
    |--------------------------------------------------------------------------
    */

    function getInitials(name) {

        if (
            window.App &&
            typeof App.getInitials === "function"
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
    | FORMAT CURRENCY
    |--------------------------------------------------------------------------
    */

    function formatCurrency(amount) {

        return new Intl.NumberFormat(
            "en-NG",
            {
                style: "currency",
                currency: "NGN",
                minimumFractionDigits: 2
            }
        ).format(
            Number(amount) || 0
        );
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT DATE
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | CAPITALIZE
    |--------------------------------------------------------------------------
    */

    function capitalize(value) {

        if (!value) {
            return "";
        }


        return String(value)
            .charAt(0)
            .toUpperCase() +
            String(value)
                .slice(1)
                .toLowerCase();
    }


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    function showLoading() {

        const container =
            document.querySelector(
                "#feesTableBody"
            ) ||
            document.querySelector(
                "#feeTableBody"
            ) ||
            document.querySelector(
                "tbody[data-fees-body]"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="students-loading">
                        <div class="students-loading-spinner"></div>
                        <p>Loading fee records...</p>
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
                "#feesTableBody"
            ) ||
            document.querySelector(
                "#feeTableBody"
            ) ||
            document.querySelector(
                "tbody[data-fees-body]"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="students-empty">
                        <h3>Unable to load fees</h3>
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

    window.FeesPage = {
        initialize,
        loadFees,
        loadStudents,
        editFee,
        deleteFee,
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