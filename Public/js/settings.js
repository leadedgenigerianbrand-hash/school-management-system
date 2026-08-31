/*
|--------------------------------------------------------------------------
| SETTINGS.JS
|--------------------------------------------------------------------------
| Handles school settings, profile information and preferences.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    let settings = {};
    let school = {};
    let currentUser = {};

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

        await loadSettings();

        await loadSchool();

        await loadCurrentUser();

        populateForms();
    }

    /*
    |--------------------------------------------------------------------------
    | EVENTS
    |--------------------------------------------------------------------------
    */

    function setupEvents() {

        const settingsForm =
            document.querySelector("#settingsForm") ||
            document.querySelector(
                "form[data-settings-form]"
            );

        if (settingsForm) {

            settingsForm.addEventListener(
                "submit",
                handleSettingsSubmit
            );
        }

        const schoolForm =
            document.querySelector("#schoolForm") ||
            document.querySelector(
                "form[data-school-form]"
            );

        if (schoolForm) {

            schoolForm.addEventListener(
                "submit",
                handleSchoolSubmit
            );
        }

        const profileForm =
            document.querySelector("#profileForm") ||
            document.querySelector(
                "form[data-profile-form]"
            );

        if (profileForm) {

            profileForm.addEventListener(
                "submit",
                handleProfileSubmit
            );
        }

        const passwordForm =
            document.querySelector("#passwordForm") ||
            document.querySelector(
                "form[data-password-form]"
            );

        if (passwordForm) {

            passwordForm.addEventListener(
                "submit",
                handlePasswordSubmit
            );
        }

        document.addEventListener(
            "click",
            handleActionClick
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD SETTINGS
    |--------------------------------------------------------------------------
    */

    async function loadSettings() {

        try {

            const data =
                await request(
                    "/api/school/settings"
                );

            settings =
                data?.data ||
                data?.settings ||
                data ||
                {};

        } catch (error) {

            console.error(
                "Unable to load settings:",
                error
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD SCHOOL
    |--------------------------------------------------------------------------
    */

    async function loadSchool() {

        try {

            const data =
                await request(
                    "/api/schools"
                );

            const records =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.schools ||
                        []
                    );

            school =
                records[0] ||
                data?.school ||
                {};

        } catch (error) {

            console.error(
                "Unable to load school:",
                error
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD CURRENT USER
    |--------------------------------------------------------------------------
    */

    async function loadCurrentUser() {

        try {

            const data =
                await request(
                    "/api/auth/me"
                );

            currentUser =
                data?.user ||
                data?.data ||
                data ||
                {};

        } catch (error) {

            console.error(
                "Unable to load current user:",
                error
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | POPULATE FORMS
    |--------------------------------------------------------------------------
    */

    function populateForms() {

        populateSchoolForm();

        populateSettingsForm();

        populateProfileForm();
    }

    /*
    |--------------------------------------------------------------------------
    | SCHOOL FORM
    |--------------------------------------------------------------------------
    */

    function populateSchoolForm() {

        setFormValue(
            "#schoolName",
            school.name ||
            school.school_name
        );

        setFormValue(
            "#schoolCode",
            school.code ||
            school.school_code
        );

        setFormValue(
            "#schoolEmail",
            school.email
        );

        setFormValue(
            "#schoolPhone",
            school.phone ||
            school.phone_number
        );

        setFormValue(
            "#schoolAddress",
            school.address
        );

        setFormValue(
            "#schoolCity",
            school.city
        );

        setFormValue(
            "#schoolState",
            school.state
        );

        setFormValue(
            "#schoolCountry",
            school.country ||
            "Nigeria"
        );

        setFormValue(
            "#schoolMotto",
            school.motto
        );

        setFormValue(
            "#schoolWebsite",
            school.website
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SETTINGS FORM
    |--------------------------------------------------------------------------
    */

    function populateSettingsForm() {

        Object.keys(settings).forEach(
            function (key) {

                const selector =
                    `#${key}`;

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
                        Boolean(
                            settings[key]
                        );

                } else {

                    element.value =
                        settings[key] ??
                        "";
                }
            }
        );

        setFormValue(
            "#academicSession",
            settings.academic_session ||
            settings.academicSession
        );

        setFormValue(
            "#currentTerm",
            settings.current_term ||
            settings.currentTerm
        );

        setFormValue(
            "#gradingSystem",
            settings.grading_system ||
            settings.gradingSystem
        );

        setFormValue(
            "#currency",
            settings.currency ||
            "NGN"
        );

        setFormValue(
            "#timezone",
            settings.timezone ||
            "Africa/Lagos"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PROFILE FORM
    |--------------------------------------------------------------------------
    */

    function populateProfileForm() {

        setFormValue(
            "#firstName",
            currentUser.first_name ||
            currentUser.firstName
        );

        setFormValue(
            "#lastName",
            currentUser.last_name ||
            currentUser.lastName
        );

        setFormValue(
            "#email",
            currentUser.email
        );

        setFormValue(
            "#phone",
            currentUser.phone ||
            currentUser.phone_number
        );

        setFormValue(
            "#username",
            currentUser.username
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SETTINGS SUBMIT
    |--------------------------------------------------------------------------
    */

    async function handleSettingsSubmit(event) {

        event.preventDefault();

        const form =
            event.currentTarget;

        const data =
            formToObject(form);

        try {

            await request(
                "/api/school/settings",
                {
                    method: "PUT",
                    body:
                        JSON.stringify(data)
                }
            );

            settings = {
                ...settings,
                ...data
            };

            notify(
                "Settings saved successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Settings update failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save settings.",
                "error"
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SCHOOL SUBMIT
    |--------------------------------------------------------------------------
    */

    async function handleSchoolSubmit(event) {

        event.preventDefault();

        const form =
            event.currentTarget;

        const data =
            formToObject(form);

        const schoolId =
            school.id ||
            school.school_id;

        try {

            if (schoolId) {

                await request(
                    `/api/schools/${schoolId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(data)
                    }
                );

            } else {

                await request(
                    "/api/schools",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(data)
                    }
                );
            }

            school = {
                ...school,
                ...data
            };

            notify(
                "School information saved successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "School update failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save school information.",
                "error"
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PROFILE SUBMIT
    |--------------------------------------------------------------------------
    */

    async function handleProfileSubmit(event) {

        event.preventDefault();

        const form =
            event.currentTarget;

        const data =
            formToObject(form);

        const userId =
            currentUser.id ||
            currentUser.user_id;

        try {

            if (!userId) {

                throw new Error(
                    "Current user could not be identified."
                );
            }

            await request(
                `/api/users/${userId}`,
                {
                    method: "PUT",
                    body:
                        JSON.stringify(data)
                }
            );

            currentUser = {
                ...currentUser,
                ...data
            };

            notify(
                "Profile updated successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Profile update failed:",
                error
            );

            notify(
                error.message ||
                "Unable to update profile.",
                "error"
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PASSWORD SUBMIT
    |--------------------------------------------------------------------------
    */

    async function handlePasswordSubmit(event) {

        event.preventDefault();

        const form =
            event.currentTarget;

        const data =
            formToObject(form);

        const currentPassword =
            data.current_password ||
            data.currentPassword;

        const newPassword =
            data.new_password ||
            data.newPassword;

        const confirmPassword =
            data.confirm_password ||
            data.confirmPassword;

        if (!currentPassword) {

            notify(
                "Enter your current password.",
                "error"
            );

            return;
        }

        if (!newPassword) {

            notify(
                "Enter a new password.",
                "error"
            );

            return;
        }

        if (
            newPassword.length < 6
        ) {

            notify(
                "New password must be at least 6 characters.",
                "error"
            );

            return;
        }

        if (
            newPassword !==
            confirmPassword
        ) {

            notify(
                "New passwords do not match.",
                "error"
            );

            return;
        }

        try {

            await request(
                "/api/auth/change-password",
                {
                    method: "PUT",
                    body:
                        JSON.stringify({
                            current_password:
                                currentPassword,

                            new_password:
                                newPassword
                        })
                }
            );

            form.reset();

            notify(
                "Password changed successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Password change failed:",
                error
            );

            notify(
                error.message ||
                "Unable to change password.",
                "error"
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIONS
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

        if (
            action ===
            "reset-settings"
        ) {

            resetSettings();

            return;
        }

        if (
            action ===
            "logout"
        ) {

            await logout();
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESET SETTINGS
    |--------------------------------------------------------------------------
    */

    function resetSettings() {

        const form =
            document.querySelector(
                "#settingsForm"
            );

        if (!form) {
            return;
        }

        if (
            !window.confirm(
                "Reset the settings form?"
            )
        ) {
            return;
        }

        form.reset();

        populateSettingsForm();

        notify(
            "Settings restored.",
            "success"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    async function logout() {

        try {

            await request(
                "/api/auth/logout",
                {
                    method: "POST"
                }
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        } finally {

            window.location.href =
                "/pages/login.html";
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
    | EXPORT
    |--------------------------------------------------------------------------
    */

    window.SettingsPage = {
        initialize,
        loadSettings,
        loadSchool,
        loadCurrentUser,
        resetSettings,
        logout
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