"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| PAGE AUTHENTICATION GUARD
|--------------------------------------------------------------------------
|
| File:
| Public/js/pageGuard.js
|
| Purpose:
| - Protect authenticated application pages.
| - Verify the current JWT with the backend.
| - Redirect unauthenticated users to the login page.
| - Preserve the official authentication storage keys.
| - Support optional page-level role restrictions.
|
| Official authentication keys:
| - school_management_token
| - school_management_user
|
| Backend authentication endpoint:
| - GET /api/auth/me
|
| Important:
| - HTTP 401 means the authentication is invalid or expired.
| - HTTP 403 means the user is authenticated but forbidden.
| - Network/server errors must NOT automatically log the user out.
|
|--------------------------------------------------------------------------
*/

(function () {
    const TOKEN_KEY = "school_management_token";
    const USER_KEY = "school_management_user";

    const LOGIN_PAGE = "/pages/login.html";
    const AUTH_ME_ENDPOINT = "/api/auth/me";

    const GUARD_STATE_KEY = "__schoolManagementPageGuard";

    const publicPages = [
        "login.html"
    ];

    function getCurrentPage() {
        const pathname = window.location.pathname.toLowerCase();

        const parts = pathname.split("/");

        return parts[parts.length - 1] || "dashboard.html";
    }

    function isPublicPage() {
        return publicPages.includes(getCurrentPage());
    }

    function getToken() {
        return (
            localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY) ||
            ""
        );
    }

    function getStoredUser() {
        const localUser = localStorage.getItem(USER_KEY);
        const sessionUser = sessionStorage.getItem(USER_KEY);

        const rawUser = localUser || sessionUser;

        if (!rawUser) {
            return null;
        }

        try {
            return JSON.parse(rawUser);
        } catch (error) {
            console.error(
                "Unable to read stored user information:",
                error
            );

            return null;
        }
    }

    function saveUser(user) {
        if (!user || typeof user !== "object") {
            return;
        }

        const serializedUser = JSON.stringify(user);

        if (localStorage.getItem(TOKEN_KEY)) {
            localStorage.setItem(
                USER_KEY,
                serializedUser
            );
        } else if (sessionStorage.getItem(TOKEN_KEY)) {
            sessionStorage.setItem(
                USER_KEY,
                serializedUser
            );
        } else {
            localStorage.setItem(
                USER_KEY,
                serializedUser
            );
        }
    }

    function clearAuthentication() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
    }

    function redirectToLogin() {
        if (window.location.pathname === LOGIN_PAGE) {
            return;
        }

        const currentUrl =
            window.location.pathname +
            window.location.search +
            window.location.hash;

        const loginUrl =
            LOGIN_PAGE +
            "?returnUrl=" +
            encodeURIComponent(currentUrl);

        window.location.replace(loginUrl);
    }

    function normalizeRole(role) {
        if (role === null || role === undefined) {
            return "";
        }

        if (typeof role === "object") {
            role =
                role.name ||
                role.role ||
                role.roleName ||
                role.role_name ||
                role.title ||
                "";
        }

        return String(role)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }

    function getUserRole(user) {
        if (!user || typeof user !== "object") {
            return "";
        }

        return normalizeRole(
            user.role ||
            user.roleName ||
            user.role_name ||
            user.userRole ||
            user.user_role ||
            user.accountRole ||
            user.account_role ||
            ""
        );
    }

    function getAllowedRoles() {
        const pageElement = document.body;

        if (!pageElement) {
            return [];
        }

        const attribute =
            pageElement.getAttribute(
                "data-allowed-roles"
            );

        if (!attribute) {
            return [];
        }

        return attribute
            .split(",")
            .map(function (role) {
                return normalizeRole(role);
            })
            .filter(Boolean);
    }

    function userHasRequiredRole(user) {
        const allowedRoles = getAllowedRoles();

        if (allowedRoles.length === 0) {
            return true;
        }

        const userRole = getUserRole(user);

        if (!userRole) {
            return false;
        }

        return allowedRoles.includes(userRole);
    }

    function showAccessDenied() {
        document.documentElement.innerHTML = `
            <head>
                <meta charset="UTF-8">
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >
                <title>Access Denied</title>
                <style>
                    body {
                        margin: 0;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 24px;
                        box-sizing: border-box;
                        background: #f8f9fa;
                        color: #212529;
                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;
                    }

                    .access-denied {
                        width: 100%;
                        max-width: 520px;
                        padding: 32px;
                        background: #ffffff;
                        border: 1px solid #dee2e6;
                        border-radius: 12px;
                        box-shadow:
                            0 8px 24px
                            rgba(0, 0, 0, 0.08);
                        text-align: center;
                    }

                    .access-denied-icon {
                        margin-bottom: 16px;
                        font-size: 48px;
                    }

                    .access-denied h1 {
                        margin: 0 0 12px;
                        font-size: 26px;
                    }

                    .access-denied p {
                        margin: 0 0 24px;
                        color: #6c757d;
                        line-height: 1.6;
                    }

                    .access-denied a {
                        display: inline-block;
                        padding: 10px 18px;
                        border-radius: 6px;
                        background: #0d6efd;
                        color: #ffffff;
                        text-decoration: none;
                    }

                    .access-denied a:hover {
                        background: #0b5ed7;
                    }
                </style>
            </head>

            <body>
                <main class="access-denied">
                    <div class="access-denied-icon">
                        &#128683;
                    </div>

                    <h1>Access Denied</h1>

                    <p>
                        You are authenticated, but your account does not
                        have permission to access this page.
                    </p>

                    <a href="/pages/dashboard.html">
                        Return to Dashboard
                    </a>
                </main>
            </body>
        `;
    }

    async function verifyAuthentication() {
        const token = getToken();

        if (!token) {
            clearAuthentication();
            redirectToLogin();
            return null;
        }

        try {
            const response = await fetch(
                AUTH_ME_ENDPOINT,
                {
                    method: "GET",
                    headers: {
                        Authorization: "Bearer " + token,
                        Accept: "application/json"
                    },
                    credentials: "same-origin"
                }
            );

            if (response.status === 401) {
                clearAuthentication();
                redirectToLogin();
                return null;
            }

            if (response.status === 403) {
                console.error(
                    "The authenticated user is not permitted to access this resource."
                );

                return getStoredUser();
            }

            if (!response.ok) {
                console.error(
                    "Authentication verification failed with HTTP status:",
                    response.status
                );

                return getStoredUser();
            }

            let data = null;

            try {
                data = await response.json();
            } catch (error) {
                console.error(
                    "The authentication endpoint returned invalid JSON:",
                    error
                );

                return getStoredUser();
            }

            const authenticatedUser =
                data.user ||
                data.data ||
                data.account ||
                data;

            if (
                authenticatedUser &&
                typeof authenticatedUser === "object"
            ) {
                saveUser(authenticatedUser);
                return authenticatedUser;
            }

            return getStoredUser();
        } catch (error) {
            console.error(
                "Unable to verify authentication because of a network or server error:",
                error
            );

            return getStoredUser();
        }
    }

    async function initializePageGuard() {
        if (isPublicPage()) {
            return;
        }

        if (window[GUARD_STATE_KEY]) {
            return window[GUARD_STATE_KEY];
        }

        const guardPromise = verifyAuthentication();

        window[GUARD_STATE_KEY] = guardPromise;

        const user = await guardPromise;

        if (!user) {
            return null;
        }

        if (!userHasRequiredRole(user)) {
            showAccessDenied();
            return null;
        }

        window.schoolManagementCurrentUser = user;

        return user;
    }

    function requireRoles(roles) {
        const requiredRoles = Array.isArray(roles)
            ? roles.map(normalizeRole).filter(Boolean)
            : [normalizeRole(roles)].filter(Boolean);

        return initializePageGuard().then(function (user) {
            if (!user) {
                return null;
            }

            if (requiredRoles.length === 0) {
                return user;
            }

            const userRole = getUserRole(user);

            if (!requiredRoles.includes(userRole)) {
                showAccessDenied();
                return null;
            }

            return user;
        });
    }

    function logout() {
        clearAuthentication();
        window.location.replace(LOGIN_PAGE);
    }

    window.SchoolManagementPageGuard = {
        initialize: initializePageGuard,
        verify: verifyAuthentication,
        requireRoles: requireRoles,
        logout: logout,
        getToken: getToken,
        getStoredUser: getStoredUser,
        getUserRole: getUserRole,
        clearAuthentication: clearAuthentication
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializePageGuard
        );
    } else {
        initializePageGuard();
    }
})();