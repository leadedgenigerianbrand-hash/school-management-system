"use strict";

(function () {
    let settings = {};
    let school = {};
    let currentUser = {};

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
            console.error("Settings API error:", error);
            throw new Error(
                "Unable to connect to the server."
            );
        }

        if (response.status === 401) {
            localStorage.removeItem("school_management_token");
            localStorage.removeItem("school_management_user");
            sessionStorage.removeItem("school_management_token");
            sessionStorage.removeItem("school_management_user");

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

        const data = contentType.includes("application/json")
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

        await Promise.all([
            loadSettings(),
            loadSchool(),
            loadCurrentUser()
        ]);

        populateForms();
    }

    function setupEvents() {
        const settingsForm =
            document.querySelector("#settingsForm") ||
            document.querySelector("form[data-settings-form]");

        if (settingsForm) {
            settingsForm.addEventListener(
                "submit",
                handleSettingsSubmit
            );
        }

        const schoolForm =
            document.querySelector("#schoolForm") ||
            document.querySelector("form[data-school-form]");

        if (schoolForm) {
            schoolForm.addEventListener(
                "submit",
                handleSchoolSubmit
            );
        }

        const profileForm =
            document.querySelector("#profileForm") ||
            document.querySelector("form[data-profile-form]");

        if (profileForm) {
            profileForm.addEventListener(
                "submit",
                handleProfileSubmit
            );
        }

        const passwordForm =
            document.querySelector("#passwordForm") ||
            document.querySelector("form[data-password-form]");

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

    async function loadSettings() {
        try {
            const data = await request(
                "/school/settings"
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

    async function loadSchool() {
        try {
            const data = await request(
                "/schools"
            );

            const records =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.schools)
                            ? data.schools
                            : [];

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

    async function loadCurrentUser() {
        try {
            const data = await request(
                "/auth/me"
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

    function populateForms() {
        populateSchoolForm();
        populateSettingsForm();
        populateProfileForm();
    }

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
            school.address ||
            school.address_line
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

    function populateSettingsForm() {
        Object.keys(settings).forEach((key) => {
            const element =
                document.getElementById(key);

            if (!element) {
                return;
            }

            if (element.type === "checkbox") {
                element.checked =
                    Boolean(settings[key]);
            } else {
                element.value =
                    settings[key] ?? "";
            }
        });

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

    async function handleSettingsSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = formToObject(form);

        try {
            await request(
                "/school/settings",
                {
                    method: "PUT",
                    body: JSON.stringify(data)
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

    async function handleSchoolSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = formToObject(form);

        const schoolId =
            school.id ||
            school.school_id;

        try {
            if (schoolId) {
                await request(
                    `/schools/${encodeURIComponent(schoolId)}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(data)
                    }
                );
            } else {
                const result = await request(
                    "/schools",
                    {
                        method: "POST",
                        body: JSON.stringify(data)
                    }
                );

                school =
                    result?.data ||
                    result?.school ||
                    result ||
                    {};
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

    async function handleProfileSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = formToObject(form);

        const userId =
            currentUser.id ||
            currentUser.user_id;

        if (!userId) {
            notify(
                "Current user could not be identified.",
                "error"
            );
            return;
        }

        try {
            await request(
                `/users/${encodeURIComponent(userId)}`,
                {
                    method: "PUT",
                    body: JSON.stringify(data)
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

    async function handlePasswordSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = formToObject(form);

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

        if (newPassword.length < 6) {
            notify(
                "New password must be at least 6 characters.",
                "error"
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            notify(
                "New passwords do not match.",
                "error"
            );
            return;
        }

        try {
            await request(
                "/auth/change-password",
                {
                    method: "PUT",
                    body: JSON.stringify({
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

        if (action === "reset-settings") {
            resetSettings();
            return;
        }

        if (action === "logout") {
            await logout();
        }
    }

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

    async function logout() {
        try {
            await request(
                "/auth/logout",
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
            if (
                typeof window.clearApiAuthentication ===
                "function"
            ) {
                window.clearApiAuthentication();
            } else {
                localStorage.removeItem(
                    "school_management_token"
                );
                localStorage.removeItem(
                    "school_management_user"
                );
                sessionStorage.removeItem(
                    "school_management_token"
                );
                sessionStorage.removeItem(
                    "school_management_user"
                );
            }

            window.location.href =
                "/pages/login.html";
        }
    }

    function formToObject(form) {
        const formData =
            new FormData(form);

        const data = {};

        formData.forEach((value, key) => {
            data[key] = value;
        });

        form.querySelectorAll(
            'input[type="checkbox"]'
        ).forEach((checkbox) => {
            data[checkbox.name] =
                checkbox.checked;
        });

        return data;
    }

    function setFormValue(selector, value) {
        const element =
            document.querySelector(selector);

        if (!element) {
            return;
        }

        if (element.type === "checkbox") {
            element.checked =
                Boolean(value);
        } else {
            element.value =
                value ?? "";
        }
    }

    function notify(message, type = "success") {
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
                document.createElement("div");

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
            document.createElement("div");

        notification.className =
            `alert alert-${type}`;

        notification.textContent =
            message;

        notification.style.marginBottom =
            "10px";

        container.appendChild(
            notification
        );

        setTimeout(() => {
            notification.remove();

            if (!container.children.length) {
                container.remove();
            }
        }, 4000);
    }

    window.SettingsPage = {
        initialize,
        loadSettings,
        loadSchool,
        loadCurrentUser,
        resetSettings,
        logout
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();