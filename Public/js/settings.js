"use strict";

(function () {
    let school = {};
    let currentUser = {};

    const SCHOOL_LIST_ENDPOINT = "/schools";
    const AUTH_ME_ENDPOINT = "/auth/me";

    function getStoredUser() {
        const storedUser =
            localStorage.getItem("school_management_user") ||
            sessionStorage.getItem("school_management_user");

        if (!storedUser) {
            return {};
        }

        try {
            return JSON.parse(storedUser);
        } catch (error) {
            console.error(
                "Unable to read stored user:",
                error
            );

            return {};
        }
    }

    async function apiRequest(endpoint, options = {}) {
        if (
            typeof window.apiRequest ===
            "function"
        ) {
            return window.apiRequest(
                endpoint,
                options
            );
        }

        throw new Error(
            "The central API service is unavailable."
        );
    }

    async function initialize() {
        setupSettingsTabs();
        setupSidebar();
        setupSchoolForm();
        setupResetButton();
        setupLogout();

        currentUser =
            getStoredUser();

        populateUserInformation();

        await loadCurrentUser();

        await loadSchool();
    }

    function setupSettingsTabs() {
        const tabs =
            document.querySelectorAll(
                ".settings-tab"
            );

        const sections =
            document.querySelectorAll(
                ".settings-section"
            );

        tabs.forEach((tab) => {
            tab.addEventListener(
                "click",
                function () {
                    const sectionId =
                        tab.dataset.section;

                    tabs.forEach((item) => {
                        item.classList.remove(
                            "active"
                        );
                    });

                    sections.forEach((section) => {
                        section.classList.remove(
                            "active"
                        );
                    });

                    tab.classList.add(
                        "active"
                    );

                    const section =
                        document.getElementById(
                            sectionId
                        );

                    if (section) {
                        section.classList.add(
                            "active"
                        );
                    }
                }
            );
        });
    }

    function setupSidebar() {
        const sidebar =
            document.getElementById(
                "sidebar"
            );

        const sidebarToggle =
            document.getElementById(
                "sidebarToggle"
            );

        const sidebarOverlay =
            document.getElementById(
                "sidebarOverlay"
            );

        function closeSidebar() {
            if (sidebar) {
                sidebar.classList.remove(
                    "show"
                );
            }

            if (sidebarOverlay) {
                sidebarOverlay.classList.remove(
                    "show"
                );
            }
        }

        if (sidebarToggle) {
            sidebarToggle.addEventListener(
                "click",
                function () {
                    if (sidebar) {
                        sidebar.classList.toggle(
                            "show"
                        );
                    }

                    if (sidebarOverlay) {
                        sidebarOverlay.classList.toggle(
                            "show"
                        );
                    }
                }
            );
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener(
                "click",
                closeSidebar
            );
        }

        document
            .querySelectorAll(
                ".sidebar .nav-link"
            )
            .forEach((link) => {
                link.addEventListener(
                    "click",
                    closeSidebar
                );
            });
    }

    function setupSchoolForm() {
        const form =
            document.getElementById(
                "schoolSettingsForm"
            );

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            handleSchoolSubmit
        );
    }

    function setupResetButton() {
        const button =
            document.getElementById(
                "resetSchoolButton"
            );

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            resetSchoolForm
        );
    }

    function setupLogout() {
        const logoutButton =
            document.getElementById(
                "logoutButton"
            );

        if (!logoutButton) {
            return;
        }

        logoutButton.addEventListener(
            "click",
            handleLogout
        );
    }

    async function loadCurrentUser() {
        try {
            const response =
                await apiRequest(
                    AUTH_ME_ENDPOINT
                );

            currentUser =
                response?.user ||
                response?.data ||
                response ||
                currentUser ||
                {};

            populateUserInformation();

            return currentUser;
        } catch (error) {
            console.error(
                "Unable to load current user:",
                error
            );

            return currentUser;
        }
    }

    function populateUserInformation() {
        const userNameElement =
            document.getElementById(
                "userName"
            );

        const userRoleElement =
            document.getElementById(
                "userRole"
            );

        if (userNameElement) {
            const fullName = [
                currentUser.first_name ||
                    currentUser.firstName ||
                    "",
                currentUser.middle_name ||
                    currentUser.middleName ||
                    "",
                currentUser.last_name ||
                    currentUser.lastName ||
                    ""
            ]
                .filter(Boolean)
                .join(" ")
                .trim();

            userNameElement.textContent =
                fullName ||
                currentUser.username ||
                currentUser.email ||
                "Administrator";
        }

        if (userRoleElement) {
            userRoleElement.textContent =
                currentUser.role_name ||
                currentUser.roleName ||
                currentUser.role ||
                "Administrator";
        }
    }

    async function loadSchool() {
        try {
            const schoolId =
                getSchoolId();

            if (schoolId) {
                const response =
                    await apiRequest(
                        `/schools/${encodeURIComponent(
                            schoolId
                        )}`
                    );

                school =
                    response?.data ||
                    response?.school ||
                    response ||
                    {};

                populateSchoolForm();

                return school;
            }

            const response =
                await apiRequest(
                    SCHOOL_LIST_ENDPOINT
                );

            const schools =
                Array.isArray(response)
                    ? response
                    : Array.isArray(
                        response?.data
                    )
                        ? response.data
                        : Array.isArray(
                            response?.schools
                        )
                            ? response.schools
                            : [];

            const userSchoolId =
                Number(
                    currentUser.school_id ||
                    currentUser.schoolId ||
                    0
                );

            if (userSchoolId) {
                school =
                    schools.find(
                        (item) =>
                            Number(item.id) ===
                            userSchoolId
                    ) ||
                    {};
            }

            if (!school.id) {
                school =
                    schools[0] ||
                    {};
            }

            populateSchoolForm();

            return school;
        } catch (error) {
            console.error(
                "Unable to load school:",
                error
            );

            showMessage(
                error.message ||
                    "Unable to load school information.",
                "danger"
            );

            return {};
        }
    }

    function getSchoolId() {
        return Number(
            school.id ||
            currentUser.school_id ||
            currentUser.schoolId ||
            0
        );
    }

    function populateSchoolForm() {
        setValue(
            "schoolName",
            school.school_name
        );

        setValue(
            "schoolCode",
            school.school_code
        );

        setValue(
            "registrationNumber",
            school.registration_number
        );

        setValue(
            "schoolEmail",
            school.email
        );

        setValue(
            "schoolPhone",
            school.phone
        );

        setValue(
            "schoolWebsite",
            school.website
        );

        setValue(
            "schoolType",
            school.school_type ||
                "Secondary School"
        );

        setValue(
            "schoolState",
            school.state
        );

        setValue(
            "schoolCity",
            school.city
        );

        setValue(
            "schoolAddress",
            school.address
        );

        setValue(
            "schoolCountry",
            school.country ||
                "Nigeria"
        );

        setValue(
            "principalName",
            school.principal_name
        );

        setValue(
            "schoolMotto",
            school.motto
        );

        setValue(
            "schoolLogoUrl",
            school.logo_url
        );
    }

    async function handleSchoolSubmit(
        event
    ) {
        event.preventDefault();

        const form =
            event.currentTarget;

        if (!form.checkValidity()) {
            form.classList.add(
                "was-validated"
            );

            showMessage(
                "Please complete the required school information.",
                "danger"
            );

            return;
        }

        const data =
            collectSchoolFormData();

        const schoolId =
            getSchoolId();

        setSavingState(
            true
        );

        try {
            let response;

            if (schoolId) {
                response =
                    await apiRequest(
                        `/schools/${encodeURIComponent(
                            schoolId
                        )}`,
                        {
                            method: "PUT",
                            body:
                                JSON.stringify(
                                    data
                                )
                        }
                    );
            } else {
                response =
                    await apiRequest(
                        SCHOOL_LIST_ENDPOINT,
                        {
                            method: "POST",
                            body:
                                JSON.stringify(
                                    data
                                )
                        }
                    );
            }

            school =
                response?.data ||
                response?.school ||
                response ||
                school;

            school = {
                ...school,
                ...data
            };

            populateSchoolForm();

            showMessage(
                "School information saved successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "School information save failed:",
                error
            );

            showMessage(
                error.message ||
                    "Unable to save school information.",
                "danger"
            );
        } finally {
            setSavingState(
                false
            );
        }
    }

    function collectSchoolFormData() {
        return {
            schoolCode:
                getValue(
                    "schoolCode"
                ).trim(),
            schoolName:
                getValue(
                    "schoolName"
                ).trim(),
            registrationNumber:
                getValue(
                    "registrationNumber"
                ).trim(),
            email:
                getValue(
                    "schoolEmail"
                ).trim(),
            phone:
                getValue(
                    "schoolPhone"
                ).trim(),
            website:
                getValue(
                    "schoolWebsite"
                ).trim(),
            schoolType:
                getValue(
                    "schoolType"
                ).trim(),
            state:
                getValue(
                    "schoolState"
                ).trim(),
            city:
                getValue(
                    "schoolCity"
                ).trim(),
            address:
                getValue(
                    "schoolAddress"
                ).trim(),
            country:
                getValue(
                    "schoolCountry"
                ).trim() ||
                "Nigeria",
            principalName:
                getValue(
                    "principalName"
                ).trim(),
            motto:
                getValue(
                    "schoolMotto"
                ).trim(),
            logoUrl:
                getValue(
                    "schoolLogoUrl"
                ).trim()
        };
    }

    function resetSchoolForm() {
        if (!school) {
            return;
        }

        const confirmed =
            window.confirm(
                "Reset the school information form to the last saved information?"
            );

        if (!confirmed) {
            return;
        }

        populateSchoolForm();

        const form =
            document.getElementById(
                "schoolSettingsForm"
            );

        if (form) {
            form.classList.remove(
                "was-validated"
            );
        }

        showMessage(
            "School information restored.",
            "success"
        );
    }

    function setSavingState(
        saving
    ) {
        const button =
            document.getElementById(
                "saveSchoolButton"
            );

        if (!button) {
            return;
        }

        if (saving) {
            button.disabled =
                true;

            button.innerHTML =
                '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';

            return;
        }

        button.disabled =
            false;

        button.innerHTML =
            '<i class="bi bi-check-lg me-2"></i>Save Changes';
    }

    function setValue(
        id,
        value
    ) {
        const element =
            document.getElementById(
                id
            );

        if (!element) {
            return;
        }

        element.value =
            value === null ||
            value === undefined
                ? ""
                : String(value);
    }

    function getValue(
        id
    ) {
        const element =
            document.getElementById(
                id
            );

        if (!element) {
            return "";
        }

        return element.value || "";
    }

    function showMessage(
        message,
        type = "success"
    ) {
        const element =
            document.getElementById(
                "settingsMessage"
            );

        if (!element) {
            return;
        }

        element.className =
            `alert alert-${type}`;

        element.textContent =
            message;

        element.classList.remove(
            "d-none"
        );

        window.clearTimeout(
            showMessage.timeout
        );

        showMessage.timeout =
            window.setTimeout(
                function () {
                    element.classList.add(
                        "d-none"
                    );
                },
                5000
            );
    }

    async function handleLogout() {
        const confirmed =
            window.confirm(
                "Are you sure you want to sign out?"
            );

        if (!confirmed) {
            return;
        }

        try {
            if (
                typeof window.apiRequest ===
                "function"
            ) {
                await window.apiRequest(
                    "/auth/logout",
                    {
                        method: "POST"
                    }
                );
            }
        } catch (error) {
            console.error(
                "Logout request failed:",
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
                "login.html";
        }
    }

    window.SettingsPage = {
        initialize,
        loadSchool,
        loadCurrentUser,
        populateSchoolForm,
        resetSchoolForm,
        logout: handleLogout
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