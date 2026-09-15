"use strict";

const LOGIN_PAGE =
    "/pages/login.html";

const DASHBOARD_PAGE =
    "/pages/dashboard.html";

const TOKEN_KEY =
    "school_management_token";

const USER_KEY =
    "school_management_user";

function isLoginPage() {
    return window.location.pathname
        .toLowerCase()
        .endsWith("/login.html");
}

function isPublicPage() {
    const path =
        window.location.pathname
            .toLowerCase();

    return (
        path === "/" ||
        path === "" ||
        path.endsWith("/login.html")
    );
}

function getLoginRedirect() {
    return DASHBOARD_PAGE;
}

function getStoredToken() {
    return (
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY) ||
        ""
    );
}

function getStoredUser() {
    const storedUser =
        localStorage.getItem(USER_KEY) ||
        sessionStorage.getItem(USER_KEY);

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(
            storedUser
        );
    } catch (error) {
        console.error(
            "Unable to read stored user:",
            error
        );

        localStorage.removeItem(
            USER_KEY
        );

        sessionStorage.removeItem(
            USER_KEY
        );

        return null;
    }
}

function storeAuthentication(
    token,
    user = {},
    rememberMe = false
) {
    if (
        typeof token !== "string" ||
        !token.trim()
    ) {
        throw new Error(
            "Authentication token is required."
        );
    }

    clearAuthentication();

    const storage =
        rememberMe
            ? localStorage
            : sessionStorage;

    storage.setItem(
        TOKEN_KEY,
        token.trim()
    );

    storage.setItem(
        USER_KEY,
        JSON.stringify(
            user || {}
        )
    );

    window.currentUser =
        user || null;
}

function clearAuthentication() {
    localStorage.removeItem(
        TOKEN_KEY
    );

    localStorage.removeItem(
        USER_KEY
    );

    sessionStorage.removeItem(
        TOKEN_KEY
    );

    sessionStorage.removeItem(
        USER_KEY
    );

    window.currentUser =
        null;
}

async function parseJsonResponse(
    response
) {
    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        !contentType
            .toLowerCase()
            .includes(
                "application/json"
            )
    ) {
        const text =
            await response.text();

        console.error(
            "Expected JSON response but received:",
            text.substring(0, 500)
        );

        throw new Error(
            "The server returned an unexpected response."
        );
    }

    try {
        return await response.json();
    } catch (error) {
        console.error(
            "Unable to parse authentication response:",
            error
        );

        throw new Error(
            "The server returned invalid JSON."
        );
    }
}

async function authenticationRequest(
    endpoint,
    options = {}
) {
    const token =
        getStoredToken();

    const headers = {
        Accept:
            "application/json",
        ...(options.headers || {})
    };

    const hasBody =
        options.body !== undefined &&
        options.body !== null;

    const isFormData =
        typeof FormData !==
            "undefined" &&
        options.body instanceof
            FormData;

    if (
        hasBody &&
        !isFormData &&
        !headers["Content-Type"] &&
        !headers["content-type"]
    ) {
        headers["Content-Type"] =
            "application/json";
    }

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    return fetch(
        endpoint,
        {
            ...options,
            headers,
            credentials:
                "include"
        }
    );
}

async function getCurrentUser() {
    const token =
        getStoredToken();

    if (!token) {
        return null;
    }

    try {
        const response =
            await authenticationRequest(
                "/api/auth/me",
                {
                    method: "GET"
                }
            );

        if (
            response.status ===
                401 ||
            response.status ===
                403
        ) {
            clearAuthentication();
            return null;
        }

        const data =
            await parseJsonResponse(
                response
            );

        if (!response.ok) {
            console.error(
                "Authentication verification failed:",
                data
            );

            return null;
        }

        if (
            !data ||
            data.success !== true
        ) {
            console.error(
                "Authentication verification was unsuccessful:",
                data
            );

            return null;
        }

        const user =
            data.user ||
            data.data ||
            null;

        if (!user) {
            console.error(
                "Authentication verification returned no user."
            );

            return null;
        }

        return user;
    } catch (error) {
        console.error(
            "Current-user verification error:",
            error
        );

        return null;
    }
}

async function login(
    identifier,
    password,
    rememberMe = false
) {
    const normalizedIdentifier =
        String(
            identifier || ""
        ).trim();

    const normalizedPassword =
        String(
            password || ""
        );

    if (!normalizedIdentifier) {
        return {
            success: false,
            message:
                "Username or email is required."
        };
    }

    if (!normalizedPassword) {
        return {
            success: false,
            message:
                "Password is required."
        };
    }

    try {
        const response =
            await fetch(
                "/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept:
                            "application/json"
                    },
                    credentials:
                        "include",
                    body:
                        JSON.stringify({
                            identifier:
                                normalizedIdentifier,
                            password:
                                normalizedPassword
                        })
                }
            );

        const data =
            await parseJsonResponse(
                response
            );

        if (
            !response.ok ||
            !data ||
            data.success !== true
        ) {
            return {
                success: false,
                message:
                    data?.message ||
                    "Invalid username or password."
            };
        }

        if (
            typeof data.token !==
                "string" ||
            !data.token.trim()
        ) {
            console.error(
                "Login response did not contain a valid token."
            );

            return {
                success: false,
                message:
                    "Login succeeded but no authentication token was received."
            };
        }

        storeAuthentication(
            data.token,
            data.user || {},
            rememberMe
        );

        const verifiedUser =
            await getCurrentUser();

        if (!verifiedUser) {
            clearAuthentication();

            return {
                success: false,
                message:
                    "Login succeeded, but your session could not be verified."
            };
        }

        const storage =
            rememberMe
                ? localStorage
                : sessionStorage;

        storage.setItem(
            USER_KEY,
            JSON.stringify(
                verifiedUser
            )
        );

        window.currentUser =
            verifiedUser;

        return {
            success: true,
            user:
                verifiedUser
        };
    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        clearAuthentication();

        return {
            success: false,
            message:
                error.message ||
                "Unable to connect to the server."
        };
    }
}

async function logout() {
    const token =
        getStoredToken();

    try {
        if (token) {
            await fetch(
                "/api/auth/logout",
                {
                    method: "POST",
                    headers: {
                        Accept:
                            "application/json",
                        Authorization:
                            `Bearer ${token}`
                    },
                    credentials:
                        "include"
                }
            );
        }
    } catch (error) {
        console.warn(
            "Logout request failed. Clearing local session anyway:",
            error
        );
    }

    clearAuthentication();

    window.location.replace(
        LOGIN_PAGE
    );
}

function initializeLoginForm() {
    const form =
        document.querySelector(
            "#loginForm"
        ) ||
        document.querySelector(
            "form"
        );

    if (!form) {
        console.warn(
            "Login form was not found."
        );

        return;
    }

    if (
        form.dataset
            .authInitialized ===
        "true"
    ) {
        return;
    }

    form.dataset.authInitialized =
        "true";

    form.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const identifierInput =
                document.querySelector(
                    "#identifier"
                ) ||
                document.querySelector(
                    "#username"
                ) ||
                document.querySelector(
                    "#email"
                );

            const passwordInput =
                document.querySelector(
                    "#password"
                );

            const rememberMeInput =
                document.querySelector(
                    "#rememberMe"
                );

            if (
                !identifierInput ||
                !passwordInput
            ) {
                console.error(
                    "Login identifier or password field was not found."
                );

                return;
            }

            const identifier =
                identifierInput.value.trim();

            const password =
                passwordInput.value;

            const rememberMe =
                rememberMeInput
                    ? rememberMeInput.checked
                    : false;

            if (
                !identifier ||
                !password
            ) {
                showLoginMessage(
                    "Please enter your username/email and password.",
                    "error"
                );

                return;
            }

            setLoginButtonState(
                true
            );

            showLoginMessage(
                "Signing in...",
                "info"
            );

            const result =
                await login(
                    identifier,
                    password,
                    rememberMe
                );

            if (!result.success) {
                showLoginMessage(
                    result.message,
                    "error"
                );

                setLoginButtonState(
                    false
                );

                return;
            }

            showLoginMessage(
                "Login successful. Opening dashboard...",
                "success"
            );

            setTimeout(
                function () {
                    window.location.replace(
                        getLoginRedirect()
                    );
                },
                300
            );
        }
    );
}

function setLoginButtonState(
    disabled
) {
    const button =
        document.querySelector(
            '#loginForm button[type="submit"]'
        ) ||
        document.querySelector(
            'form button[type="submit"]'
        );

    if (!button) {
        return;
    }

    button.disabled =
        disabled;

    if (disabled) {
        if (
            !button.dataset
                .originalText
        ) {
            button.dataset.originalText =
                button.textContent;
        }

        button.textContent =
            "Signing in...";
    } else {
        button.textContent =
            button.dataset
                .originalText ||
            "Login";
    }
}

function showLoginMessage(
    message,
    type = "info"
) {
    let messageElement =
        document.querySelector(
            "#loginMessage"
        ) ||
        document.querySelector(
            ".login-message"
        ) ||
        document.querySelector(
            "#loginError"
        );

    if (!messageElement) {
        messageElement =
            document.createElement(
                "div"
            );

        messageElement.id =
            "loginMessage";

        messageElement.className =
            "login-message";

        const form =
            document.querySelector(
                "#loginForm"
            ) ||
            document.querySelector(
                "form"
            );

        if (form) {
            form.prepend(
                messageElement
            );
        }
    }

    messageElement.textContent =
        message;

    messageElement.dataset.type =
        type;

    messageElement.style.display =
        "block";
}

async function protectPage() {
    const token =
        getStoredToken();

    if (!token) {
        window.location.replace(
            LOGIN_PAGE
        );

        return;
    }

    const user =
        await getCurrentUser();

    if (!user) {
        clearAuthentication();

        window.location.replace(
            LOGIN_PAGE
        );

        return;
    }

    const storage =
        localStorage.getItem(
            TOKEN_KEY
        )
            ? localStorage
            : sessionStorage;

    storage.setItem(
        USER_KEY,
        JSON.stringify(
            user
        )
    );

    window.currentUser =
        user;

    populateUserInformation(
        user
    );

    applyRolePermissions(
        user
    );

    initializeLogoutButtons();
}

function populateUserInformation(
    user
) {
    const firstName =
        user.firstName ||
        user.first_name ||
        "";

    const lastName =
        user.lastName ||
        user.last_name ||
        "";

    const fullName =
        [
            firstName,
            lastName
        ]
            .filter(Boolean)
            .join(" ") ||
        user.username ||
        "User";

    const roleName =
        user.roleName ||
        user.role_name ||
        user.role ||
        "User";

    const username =
        user.username ||
        "";

    const email =
        user.email ||
        "";

    const schoolName =
        user.schoolName ||
        user.school_name ||
        "";

    document
        .querySelectorAll(
            "[data-user-name]"
        )
        .forEach(
            function (element) {
                element.textContent =
                    fullName;
            }
        );

    document
        .querySelectorAll(
            "[data-user-full-name]"
        )
        .forEach(
            function (element) {
                element.textContent =
                    fullName;
            }
        );

    document
        .querySelectorAll(
            "[data-user-username]"
        )
        .forEach(
            function (element) {
                element.textContent =
                    username;
            }
        );

    document
        .querySelectorAll(
            "[data-user-email]"
        )
        .forEach(
            function (element) {
                element.textContent =
                    email;
            }
        );

    document
        .querySelectorAll(
            "[data-user-role]"
        )
        .forEach(
            function (element) {
                element.textContent =
                    roleName;
            }
        );

    document
        .querySelectorAll(
            "[data-school-name]"
        )
        .forEach(
            function (element) {
                element.textContent =
                    schoolName;
            }
        );
}

function normalizeRoleName(
    user
) {
    return String(
        user?.roleName ||
        user?.role_name ||
        user?.role ||
        ""
    )
        .trim()
        .toLowerCase();
}

function applyRolePermissions(
    user
) {
    const roleName =
        normalizeRoleName(
            user
        );

    if (
        document.body
    ) {
        document.body.dataset.role =
            roleName;
    }

    document
        .querySelectorAll(
            "[data-role]"
        )
        .forEach(
            function (element) {
                const allowedRoles =
                    String(
                        element.dataset.role ||
                            ""
                    )
                        .split(",")
                        .map(
                            function (role) {
                                return role
                                    .trim()
                                    .toLowerCase();
                            }
                        )
                        .filter(
                            Boolean
                        );

                if (
                    !allowedRoles.length
                ) {
                    return;
                }

                const allowed =
                    allowedRoles.includes(
                        roleName
                    );

                element.hidden =
                    !allowed;
            }
        );
}

function initializeLogoutButtons() {
    const logoutButtons =
        document.querySelectorAll(
            '[data-action="logout"], #logoutButton, #logoutBtn, .logout-button'
        );

    logoutButtons.forEach(
        function (button) {
            if (
                button.dataset
                    .logoutInitialized ===
                "true"
            ) {
                return;
            }

            button.dataset
                .logoutInitialized =
                "true";

            button.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();

                    logout();
                }
            );
        }
    );
}

async function initializeAuthentication() {
    if (isLoginPage()) {
        const token =
            getStoredToken();

        if (token) {
            const user =
                await getCurrentUser();

            if (user) {
                window.currentUser =
                    user;

                window.location.replace(
                    getLoginRedirect()
                );

                return;
            }

            clearAuthentication();
        }

        initializeLoginForm();

        return;
    }

    if (isPublicPage()) {
        return;
    }

    await protectPage();
}

window.Auth = {
    login,
    logout,
    getCurrentUser,
    getStoredToken,
    getStoredUser,
    storeAuthentication,
    clearAuthentication,
    protectPage,
    populateUserInformation,
    applyRolePermissions,
    initializeLoginForm,
    initializeLogoutButtons
};

document.addEventListener(
    "DOMContentLoaded",
    function () {
        initializeAuthentication()
            .catch(
                function (error) {
                    console.error(
                        "Authentication initialization error:",
                        error
                    );
                }
            );
    }
);