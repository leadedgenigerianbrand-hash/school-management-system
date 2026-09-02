"use strict";

/*
 * ============================================================
 * SCHOOL MANAGEMENT SYSTEM
 * Authentication Controller
 * ============================================================
 *
 * Handles:
 * - Login
 * - Logout
 * - Token storage
 * - Current-user verification
 * - Protected-page protection
 * - Role information
 * - Dashboard redirection
 *
 * Backend endpoints:
 * POST /api/auth/login
 * GET  /api/auth/me
 * POST /api/auth/logout
 * ============================================================
 */

const LOGIN_PAGE = "/pages/login.html";
const DASHBOARD_PAGE = "/pages/dashboard.html";

const TOKEN_KEY = "school_management_token";
const USER_KEY = "school_management_user";

const API_BASE = "";


/* ============================================================
   PAGE HELPERS
   ============================================================ */

function isLoginPage() {
    return window.location.pathname.toLowerCase().endsWith("/login.html");
}

function isPublicPage() {
    const path = window.location.pathname.toLowerCase();

    return (
        path.endsWith("/login.html") ||
        path.endsWith("/") ||
        path === ""
    );
}

function getLoginRedirect() {
    return DASHBOARD_PAGE;
}


/* ============================================================
   STORAGE HELPERS
   ============================================================ */

function getStoredToken() {
    return (
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY)
    );
}

function getStoredUser() {
    try {
        const user =
            localStorage.getItem(USER_KEY) ||
            sessionStorage.getItem(USER_KEY);

        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error("Unable to read stored user:", error);
        return null;
    }
}

function storeAuthentication(token, user, rememberMe) {
    clearAuthentication();

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuthentication() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}


/* ============================================================
   API HELPERS
   ============================================================ */

async function parseJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error(
            "Expected JSON response but received:",
            text.substring(0, 500)
        );

        throw new Error(
            "The server returned an unexpected response."
        );
    }

    return response.json();
}


async function apiRequest(endpoint, options = {}) {
    const token = getStoredToken();

    const headers = {
        Accept: "application/json",
        ...options.headers
    };

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: "include"
    });

    return response;
}


/* ============================================================
   CURRENT USER
   ============================================================ */

async function getCurrentUser() {
    const token = getStoredToken();

    if (!token) {
        return null;
    }

    try {
        const response = await apiRequest("/api/auth/me", {
            method: "GET"
        });

        if (response.status === 401 || response.status === 403) {
            clearAuthentication();
            return null;
        }

        const data = await parseJsonResponse(response);

        if (!response.ok) {
            console.error("Authentication verification failed:", data);
            return null;
        }

        if (!data.success) {
            console.error(
                "Authentication verification unsuccessful:",
                data
            );
            return null;
        }

        /*
         * Support common response formats:
         *
         * {
         *   success: true,
         *   user: {...}
         * }
         *
         * or
         *
         * {
         *   success: true,
         *   data: {...}
         * }
         */

        const user = data.user || data.data || null;

        if (!user) {
            console.error(
                "Authentication verification returned no user."
            );
            return null;
        }

        return user;

    } catch (error) {
        console.error("Login verification error:", error);
        return null;
    }
}


/* ============================================================
   LOGIN
   ============================================================ */

async function login(identifier, password, rememberMe = false) {
    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                identifier,
                password
            })
        });

        const data = await parseJsonResponse(response);

        if (!response.ok || !data.success) {
            return {
                success: false,
                message:
                    data.message ||
                    "Invalid username or password."
            };
        }

        if (!data.token) {
            console.error("Login response did not contain a token.");

            return {
                success: false,
                message:
                    "Login succeeded but no authentication token was received."
            };
        }

        /*
         * Save the token and the user returned by login.
         */
        storeAuthentication(
            data.token,
            data.user || {},
            rememberMe
        );

        /*
         * IMPORTANT:
         * Verify the token against /api/auth/me before allowing
         * the user into the protected application.
         */
        const verifiedUser = await getCurrentUser();

        if (!verifiedUser) {
            clearAuthentication();

            return {
                success: false,
                message:
                    "Login succeeded, but your session could not be verified."
            };
        }

        /*
         * Store the verified user.
         */
        const storage = rememberMe
            ? localStorage
            : sessionStorage;

        storage.setItem(
            USER_KEY,
            JSON.stringify(verifiedUser)
        );

        return {
            success: true,
            user: verifiedUser
        };

    } catch (error) {
        console.error("Login error:", error);

        return {
            success: false,
            message:
                error.message ||
                "Unable to connect to the server."
        };
    }
}


/* ============================================================
   LOGOUT
   ============================================================ */

async function logout() {
    const token = getStoredToken();

    try {
        if (token) {
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`
                },
                credentials: "include"
            });
        }
    } catch (error) {
        console.warn(
            "Logout request failed, clearing local session anyway:",
            error
        );
    }

    clearAuthentication();

    window.location.replace(LOGIN_PAGE);
}


/* ============================================================
   LOGIN FORM
   ============================================================ */

function initializeLoginForm() {
    const form =
        document.querySelector("#loginForm") ||
        document.querySelector("form");

    if (!form) {
        console.warn("Login form was not found.");
        return;
    }

    /*
     * Prevent duplicate event listeners.
     */
    if (form.dataset.authInitialized === "true") {
        return;
    }

    form.dataset.authInitialized = "true";

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const identifierInput =
            document.querySelector("#identifier") ||
            document.querySelector("#username") ||
            document.querySelector("#email");

        const passwordInput =
            document.querySelector("#password");

        const rememberMeInput =
            document.querySelector("#rememberMe");

        if (!identifierInput || !passwordInput) {
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

        if (!identifier || !password) {
            showLoginMessage(
                "Please enter your username/email and password.",
                "error"
            );

            return;
        }

        setLoginButtonState(true);

        showLoginMessage(
            "Signing in...",
            "info"
        );

        const result = await login(
            identifier,
            password,
            rememberMe
        );

        if (!result.success) {
            showLoginMessage(
                result.message,
                "error"
            );

            setLoginButtonState(false);
            return;
        }

        showLoginMessage(
            "Login successful. Opening dashboard...",
            "success"
        );

        /*
         * Give the browser a moment to finish storage operations,
         * then navigate to the dashboard.
         */
        setTimeout(function () {
            window.location.replace(
                getLoginRedirect()
            );
        }, 300);
    });
}


/* ============================================================
   LOGIN UI
   ============================================================ */

function setLoginButtonState(disabled) {
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

    button.disabled = disabled;

    if (disabled) {
        if (!button.dataset.originalText) {
            button.dataset.originalText =
                button.textContent;
        }

        button.textContent = "Signing in...";
    } else {
        button.textContent =
            button.dataset.originalText ||
            "Login";
    }
}


function showLoginMessage(message, type = "info") {
    let messageElement =
        document.querySelector("#loginMessage") ||
        document.querySelector(".login-message") ||
        document.querySelector("#loginError");

    /*
     * If the existing login page does not have a message element,
     * create one without changing the HTML file.
     */
    if (!messageElement) {
        messageElement =
            document.createElement("div");

        messageElement.id = "loginMessage";
        messageElement.className =
            "login-message";

        const form =
            document.querySelector("#loginForm") ||
            document.querySelector("form");

        if (form) {
            form.prepend(messageElement);
        }
    }

    messageElement.textContent = message;
    messageElement.dataset.type = type;

    messageElement.style.display = "block";
}


/* ============================================================
   PROTECTED PAGE
   ============================================================ */

async function protectPage() {
    const token = getStoredToken();

    if (!token) {
        window.location.replace(LOGIN_PAGE);
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
        clearAuthentication();

        window.location.replace(LOGIN_PAGE);
        return;
    }

    /*
     * Store the verified user.
     */
    const storage =
        localStorage.getItem(TOKEN_KEY)
            ? localStorage
            : sessionStorage;

    storage.setItem(
        USER_KEY,
        JSON.stringify(user)
    );

    /*
     * Make the user available globally.
     */
    window.currentUser = user;

    /*
     * Populate user information on the page.
     */
    populateUserInformation(user);

    /*
     * Apply role-based visibility.
     */
    applyRolePermissions(user);

    /*
     * Activate logout buttons.
     */
    initializeLogoutButtons();
}


/* ============================================================
   USER INFORMATION
   ============================================================ */

function populateUserInformation(user) {
    const fullName =
        [
            user.firstName,
            user.lastName
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
        .querySelectorAll("[data-user-name]")
        .forEach(function (element) {
            element.textContent = fullName;
        });

    document
        .querySelectorAll("[data-user-full-name]")
        .forEach(function (element) {
            element.textContent = fullName;
        });

    document
        .querySelectorAll("[data-user-username]")
        .forEach(function (element) {
            element.textContent = username;
        });

    document
        .querySelectorAll("[data-user-email]")
        .forEach(function (element) {
            element.textContent = email;
        });

    document
        .querySelectorAll("[data-user-role]")
        .forEach(function (element) {
            element.textContent = roleName;
        });

    document
        .querySelectorAll("[data-school-name]")
        .forEach(function (element) {
            element.textContent = schoolName;
        });
}


/* ============================================================
   ROLE PERMISSIONS
   ============================================================ */

function applyRolePermissions(user) {
    const roleName =
        (
            user.roleName ||
            user.role_name ||
            user.role ||
            ""
        ).toLowerCase();

    /*
     * Store role on body for CSS/other scripts.
     */
    document.body.dataset.role = roleName;

    /*
     * Elements can use:
     *
     * data-role="Administrator"
     *
     * or:
     *
     * data-role="Administrator,Account Officer"
     */
    document
        .querySelectorAll("[data-role]")
        .forEach(function (element) {
            const allowedRoles =
                element
                    .dataset
                    .role
                    .split(",")
                    .map(function (role) {
                        return role
                            .trim()
                            .toLowerCase();
                    });

            const allowed =
                allowedRoles.includes(roleName);

            element.style.display =
                allowed ? "" : "none";
        });
}


/* ============================================================
   LOGOUT BUTTONS
   ============================================================ */

function initializeLogoutButtons() {
    const logoutButtons =
        document.querySelectorAll(
            '[data-action="logout"], #logoutButton, #logoutBtn, .logout-button'
        );

    logoutButtons.forEach(function (button) {
        if (button.dataset.logoutInitialized === "true") {
            return;
        }

        button.dataset.logoutInitialized = "true";

        button.addEventListener("click", function (event) {
            event.preventDefault();
            logout();
        });
    });
}


/* ============================================================
   AUTHENTICATION INITIALIZATION
   ============================================================ */

async function initializeAuthentication() {
    /*
     * Login page:
     * Do not protect it.
     */
    if (isLoginPage()) {
        /*
         * If already authenticated, verify the session.
         * If valid, go straight to dashboard.
         */
        const token = getStoredToken();

        if (token) {
            const user = await getCurrentUser();

            if (user) {
                window.currentUser = user;

                window.location.replace(
                    getLoginRedirect()
                );

                return;
            }
        }

        initializeLoginForm();
        return;
    }

    /*
     * Public page:
     * Nothing else required.
     */
    if (isPublicPage()) {
        return;
    }

    /*
     * Every other page is protected.
     */
    await protectPage();
}


/* ============================================================
   GLOBAL AUTH OBJECT
   ============================================================ */

window.Auth = {
    login,
    logout,
    getCurrentUser,
    getStoredToken,
    getStoredUser,
    clearAuthentication,
    protectPage
};


/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        initializeAuthentication()
            .catch(function (error) {
                console.error(
                    "Authentication initialization error:",
                    error
                );
            });
    }
);