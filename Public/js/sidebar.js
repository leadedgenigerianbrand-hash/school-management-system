"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| SHARED SIDEBAR CONTROLLER
|--------------------------------------------------------------------------
|
| File:
| Public/js/sidebar.js
|
| Purpose:
| - Build the application sidebar in one central location.
| - Display navigation according to the authenticated user's role.
| - Highlight the current page.
| - Handle mobile sidebar controls.
| - Handle logout using the official authentication keys.
|
| Authentication keys:
| - school_management_token
| - school_management_user
|
| Security note:
| This file controls navigation visibility only.
| Backend authentication and authorization remain responsible for
| protecting API routes and application data.
|
|--------------------------------------------------------------------------
*/

(function () {
    const TOKEN_KEY = "school_management_token";
    const USER_KEY = "school_management_user";

    const SIDEBAR_ID = "appSidebar";
    const SIDEBAR_OVERLAY_ID = "sidebarOverlay";
    const SIDEBAR_TOGGLE_ID = "sidebarToggle";
    const SIDEBAR_CLOSE_ID = "sidebarClose";

    const MANAGEMENT_ROLES = [
        "admin",
        "administrator",
        "super_admin",
        "superadmin",
        "school_admin",
        "school administrator",
        "principal",
        "vice_principal",
        "management",
        "manager"
    ];

    const STAFF_ROLES = [
        "staff",
        "teacher",
        "teacher_staff",
        "teacher-staff",
        "head_teacher",
        "head-teacher",
        "form_teacher",
        "form-teacher"
    ];

    const STUDENT_ROLES = [
        "student",
        "learner"
    ];

    const GUARDIAN_ROLES = [
        "guardian",
        "parent"
    ];

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

    function getStoredToken() {
        return (
            localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY) ||
            ""
        );
    }

    function getStoredUser() {
        let storedUser = null;

        try {
            const localUser = localStorage.getItem(USER_KEY);
            const sessionUser = sessionStorage.getItem(USER_KEY);

            const rawUser = localUser || sessionUser;

            if (rawUser) {
                storedUser = JSON.parse(rawUser);
            }
        } catch (error) {
            console.error("Unable to read stored user information:", error);
            storedUser = null;
        }

        return storedUser;
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

    function getUserName(user) {
        if (!user || typeof user !== "object") {
            return "User";
        }

        const fullName =
            user.fullName ||
            user.full_name ||
            user.name ||
            "";

        if (fullName) {
            return String(fullName).trim();
        }

        const firstName =
            user.firstName ||
            user.first_name ||
            "";

        const middleName =
            user.middleName ||
            user.middle_name ||
            "";

        const lastName =
            user.lastName ||
            user.last_name ||
            "";

        const name = [
            firstName,
            middleName,
            lastName
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        return name || user.username || user.email || "User";
    }

    function getUserInitials(user) {
        const name = getUserName(user);

        const parts = name
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 0) {
            return "U";
        }

        if (parts.length === 1) {
            return parts[0].substring(0, 1).toUpperCase();
        }

        return (
            parts[0].substring(0, 1) +
            parts[parts.length - 1].substring(0, 1)
        ).toUpperCase();
    }

    function isManagementRole(role) {
        return MANAGEMENT_ROLES.includes(normalizeRole(role));
    }

    function isStaffRole(role) {
        return STAFF_ROLES.includes(normalizeRole(role));
    }

    function isStudentRole(role) {
        return STUDENT_ROLES.includes(normalizeRole(role));
    }

    function isGuardianRole(role) {
        return GUARDIAN_ROLES.includes(normalizeRole(role));
    }

    function getCurrentPage() {
        const path = window.location.pathname.toLowerCase();

        const filename = path.substring(
            path.lastIndexOf("/") + 1
        );

        return filename || "dashboard.html";
    }

    function isActivePage(page) {
        return getCurrentPage() === page.toLowerCase();
    }

    function createNavLink(page, label, icon, extraClass) {
        const activeClass = isActivePage(page) ? "active" : "";
        const classes = [
            "sidebar-nav-link",
            activeClass,
            extraClass || ""
        ]
            .filter(Boolean)
            .join(" ");

        return `
            <a href="/pages/${page}" class="${classes}">
                <i class="bi ${icon}" aria-hidden="true"></i>
                <span>${label}</span>
            </a>
        `;
    }

    function createSection(title, links) {
        return `
            <div class="sidebar-section">
                <div class="sidebar-section-title">
                    ${title}
                </div>
                <div class="sidebar-section-links">
                    ${links}
                </div>
            </div>
        `;
    }

    function buildManagementNavigation() {
        return `
            ${createSection(
                "Main",
                [
                    createNavLink(
                        "dashboard.html",
                        "Dashboard",
                        "bi-speedometer2"
                    ),
                    createNavLink(
                        "profile.html",
                        "My Profile",
                        "bi-person-circle"
                    )
                ].join("")
            )}

            ${createSection(
                "People",
                [
                    createNavLink(
                        "students.html",
                        "Students",
                        "bi-mortarboard"
                    ),
                    createNavLink(
                        "staff.html",
                        "Staff",
                        "bi-people"
                    ),
                    createNavLink(
                        "guardian-list.html",
                        "Guardians",
                        "bi-person-hearts"
                    )
                ].join("")
            )}

            ${createSection(
                "Academics",
                [
                    createNavLink(
                        "classes.html",
                        "Classes",
                        "bi-building"
                    ),
                    createNavLink(
                        "class-arms.html",
                        "Class Arms",
                        "bi-diagram-3"
                    ),
                    createNavLink(
                        "academic-levels.html",
                        "Academic Levels",
                        "bi-layers"
                    ),
                    createNavLink(
                        "academic-sessions.html",
                        "Academic Sessions",
                        "bi-calendar3"
                    ),
                    createNavLink(
                        "terms.html",
                        "Terms",
                        "bi-calendar-week"
                    ),
                    createNavLink(
                        "departments.html",
                        "Departments",
                        "bi-diagram-2"
                    ),
                    createNavLink(
                        "subjects.html",
                        "Subjects",
                        "bi-book"
                    ),
                    createNavLink(
                        "attendance.html",
                        "Attendance",
                        "bi-calendar-check"
                    ),
                    createNavLink(
                        "results.html",
                        "Results",
                        "bi-bar-chart"
                    )
                ].join("")
            )}

            ${createSection(
                "Finance & Records",
                [
                    createNavLink(
                        "fees.html",
                        "Fees",
                        "bi-cash-stack"
                    ),
                    createNavLink(
                        "documents.html",
                        "Documents",
                        "bi-folder2-open"
                    ),
                    createNavLink(
                        "reports.html",
                        "Reports",
                        "bi-file-earmark-bar-graph"
                    )
                ].join("")
            )}

            ${createSection(
                "Administration",
                [
                    createNavLink(
                        "users.html",
                        "Users",
                        "bi-person-gear"
                    ),
                    createNavLink(
                        "roles.html",
                        "Roles",
                        "bi-shield-check"
                    ),
                    createNavLink(
                        "permissions.html",
                        "Permissions",
                        "bi-key"
                    ),
                    createNavLink(
                        "settings.html",
                        "Settings",
                        "bi-gear"
                    )
                ].join("")
            )}
        `;
    }

    function buildStaffNavigation() {
        return `
            ${createSection(
                "Main",
                [
                    createNavLink(
                        "dashboard.html",
                        "Dashboard",
                        "bi-speedometer2"
                    ),
                    createNavLink(
                        "profile.html",
                        "My Profile",
                        "bi-person-circle"
                    )
                ].join("")
            )}

            ${createSection(
                "School",
                [
                    createNavLink(
                        "students.html",
                        "Students",
                        "bi-mortarboard"
                    ),
                    createNavLink(
                        "classes.html",
                        "Classes",
                        "bi-building"
                    ),
                    createNavLink(
                        "class-arms.html",
                        "Class Arms",
                        "bi-diagram-3"
                    ),
                    createNavLink(
                        "subjects.html",
                        "Subjects",
                        "bi-book"
                    )
                ].join("")
            )}

            ${createSection(
                "Academic",
                [
                    createNavLink(
                        "attendance.html",
                        "Attendance",
                        "bi-calendar-check"
                    ),
                    createNavLink(
                        "results.html",
                        "Results",
                        "bi-bar-chart"
                    )
                ].join("")
            )}

            ${createSection(
                "Records",
                [
                    createNavLink(
                        "documents.html",
                        "Documents",
                        "bi-folder2-open"
                    ),
                    createNavLink(
                        "reports.html",
                        "Reports",
                        "bi-file-earmark-bar-graph"
                    )
                ].join("")
            )}
        `;
    }

    function buildStudentNavigation() {
        return `
            ${createSection(
                "Student Portal",
                [
                    createNavLink(
                        "dashboard.html",
                        "Dashboard",
                        "bi-speedometer2"
                    ),
                    createNavLink(
                        "student-profile.html",
                        "My Student Profile",
                        "bi-person-badge"
                    ),
                    createNavLink(
                        "profile.html",
                        "My Account",
                        "bi-person-circle"
                    )
                ].join("")
            )}

            ${createSection(
                "Academic",
                [
                    createNavLink(
                        "student-attendance.html",
                        "My Attendance",
                        "bi-calendar-check"
                    ),
                    createNavLink(
                        "student-results.html",
                        "My Results",
                        "bi-bar-chart"
                    )
                ].join("")
            )}

            ${createSection(
                "Finance",
                [
                    createNavLink(
                        "student-fees.html",
                        "My Fees",
                        "bi-cash-stack"
                    )
                ].join("")
            )}

            ${createSection(
                "Records",
                [
                    createNavLink(
                        "documents.html",
                        "My Documents",
                        "bi-folder2-open"
                    )
                ].join("")
            )}
        `;
    }

    function buildGuardianNavigation() {
        return `
            ${createSection(
                "Parent Portal",
                [
                    createNavLink(
                        "dashboard.html",
                        "Dashboard",
                        "bi-speedometer2"
                    ),
                    createNavLink(
                        "profile.html",
                        "My Profile",
                        "bi-person-circle"
                    )
                ].join("")
            )}

            ${createSection(
                "Student Information",
                [
                    createNavLink(
                        "student-profile.html",
                        "Student Profile",
                        "bi-person-badge"
                    ),
                    createNavLink(
                        "student-attendance.html",
                        "Attendance",
                        "bi-calendar-check"
                    ),
                    createNavLink(
                        "student-results.html",
                        "Results",
                        "bi-bar-chart"
                    )
                ].join("")
            )}

            ${createSection(
                "Finance",
                [
                    createNavLink(
                        "student-fees.html",
                        "Fees",
                        "bi-cash-stack"
                    )
                ].join("")
            )}
        `;
    }

    function buildRestrictedNavigation() {
        return `
            ${createSection(
                "Account",
                [
                    createNavLink(
                        "dashboard.html",
                        "Dashboard",
                        "bi-speedometer2"
                    ),
                    createNavLink(
                        "profile.html",
                        "My Profile",
                        "bi-person-circle"
                    )
                ].join("")
            )}
        `;
    }

    function getNavigationForRole(role) {
        const normalizedRole = normalizeRole(role);

        if (isManagementRole(normalizedRole)) {
            return buildManagementNavigation();
        }

        if (isStudentRole(normalizedRole)) {
            return buildStudentNavigation();
        }

        if (isGuardianRole(normalizedRole)) {
            return buildGuardianNavigation();
        }

        if (isStaffRole(normalizedRole)) {
            return buildStaffNavigation();
        }

        return buildRestrictedNavigation();
    }

    function createSidebarMarkup(user) {
        const userName = getUserName(user);
        const userInitials = getUserInitials(user);
        const userRole = getUserRole(user) || "User";

        return `
            <aside
                id="${SIDEBAR_ID}"
                class="app-sidebar"
                aria-label="Main navigation"
            >
                <div class="sidebar-header">
                    <a
                        href="/pages/dashboard.html"
                        class="sidebar-brand"
                    >
                        <span class="sidebar-brand-icon">
                            <i class="bi bi-mortarboard-fill" aria-hidden="true"></i>
                        </span>

                        <span class="sidebar-brand-text">
                            School Management
                        </span>
                    </a>

                    <button
                        type="button"
                        id="${SIDEBAR_CLOSE_ID}"
                        class="sidebar-close"
                        aria-label="Close navigation"
                    >
                        <i class="bi bi-x-lg" aria-hidden="true"></i>
                    </button>
                </div>

                <div class="sidebar-user">
                    <div class="sidebar-user-avatar">
                        ${userInitials}
                    </div>

                    <div class="sidebar-user-details">
                        <div class="sidebar-user-name">
                            ${escapeHtml(userName)}
                        </div>

                        <div class="sidebar-user-role">
                            ${escapeHtml(userRole)}
                        </div>
                    </div>
                </div>

                <nav class="sidebar-navigation">
                    ${getNavigationForRole(userRole)}
                </nav>

                <div class="sidebar-footer">
                    <button
                        type="button"
                        id="sidebarLogout"
                        class="sidebar-logout"
                    >
                        <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <div
                id="${SIDEBAR_OVERLAY_ID}"
                class="sidebar-overlay"
                aria-hidden="true"
            ></div>
        `;
    }

    function escapeHtml(value) {
        const text = String(value === undefined || value === null ? "" : value);

        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function findSidebarMountPoint() {
        return (
            document.querySelector("[data-sidebar]") ||
            document.getElementById("sidebar-container") ||
            document.getElementById("app-sidebar-container")
        );
    }

    function mountSidebar() {
        const mountPoint = findSidebarMountPoint();

        if (!mountPoint) {
            console.warn(
                "Sidebar mount point not found. Add data-sidebar to the sidebar container."
            );
            return;
        }

        const user = getStoredUser();
        const token = getStoredToken();

        if (!token || !user) {
            return;
        }

        mountPoint.innerHTML = createSidebarMarkup(user);

        bindSidebarEvents();
        applySidebarBodyClasses();
    }

    function bindSidebarEvents() {
        const toggleButton = document.getElementById(
            SIDEBAR_TOGGLE_ID
        );

        const closeButton = document.getElementById(
            SIDEBAR_CLOSE_ID
        );

        const overlay = document.getElementById(
            SIDEBAR_OVERLAY_ID
        );

        const logoutButton = document.getElementById(
            "sidebarLogout"
        );

        if (toggleButton) {
            toggleButton.addEventListener(
                "click",
                openSidebar
            );
        }

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                closeSidebar
            );
        }

        if (overlay) {
            overlay.addEventListener(
                "click",
                closeSidebar
            );
        }

        if (logoutButton) {
            logoutButton.addEventListener(
                "click",
                handleLogout
            );
        }

        const sidebarLinks = document.querySelectorAll(
            `#${SIDEBAR_ID} .sidebar-nav-link`
        );

        sidebarLinks.forEach(function (link) {
            link.addEventListener(
                "click",
                closeSidebar
            );
        });

        document.addEventListener(
            "keydown",
            handleKeyboardNavigation
        );
    }

    function applySidebarBodyClasses() {
        document.body.classList.add(
            "has-shared-sidebar"
        );
    }

    function openSidebar() {
        const sidebar = document.getElementById(
            SIDEBAR_ID
        );

        const overlay = document.getElementById(
            SIDEBAR_OVERLAY_ID
        );

        if (sidebar) {
            sidebar.classList.add("sidebar-open");
        }

        if (overlay) {
            overlay.classList.add("sidebar-overlay-visible");
            overlay.setAttribute("aria-hidden", "false");
        }

        document.body.classList.add(
            "sidebar-is-open"
        );
    }

    function closeSidebar() {
        const sidebar = document.getElementById(
            SIDEBAR_ID
        );

        const overlay = document.getElementById(
            SIDEBAR_OVERLAY_ID
        );

        if (sidebar) {
            sidebar.classList.remove("sidebar-open");
        }

        if (overlay) {
            overlay.classList.remove(
                "sidebar-overlay-visible"
            );
            overlay.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        document.body.classList.remove(
            "sidebar-is-open"
        );
    }

    function handleKeyboardNavigation(event) {
        if (event.key === "Escape") {
            closeSidebar();
        }
    }

    function handleLogout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);

        window.location.href = "/pages/login.html";
    }

    function ensureSidebarStyles() {
        if (document.getElementById("sharedSidebarStyles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "sharedSidebarStyles";

        style.textContent = `
            .app-sidebar {
                position: fixed;
                top: 0;
                left: 0;
                width: 270px;
                height: 100vh;
                display: flex;
                flex-direction: column;
                background: #212529;
                color: #ffffff;
                z-index: 1040;
                overflow-y: auto;
                box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
            }

            .sidebar-header {
                min-height: 64px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .sidebar-brand {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #ffffff;
                text-decoration: none;
                font-weight: 600;
            }

            .sidebar-brand-icon {
                width: 36px;
                height: 36px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.12);
                flex-shrink: 0;
            }

            .sidebar-brand-text {
                font-size: 15px;
                line-height: 1.2;
            }

            .sidebar-close {
                display: none;
                border: 0;
                background: transparent;
                color: #ffffff;
                font-size: 18px;
                cursor: pointer;
            }

            .sidebar-user {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 18px 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .sidebar-user-avatar {
                width: 42px;
                height: 42px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: #0d6efd;
                color: #ffffff;
                font-weight: 700;
                flex-shrink: 0;
            }

            .sidebar-user-details {
                min-width: 0;
            }

            .sidebar-user-name {
                color: #ffffff;
                font-size: 14px;
                font-weight: 600;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .sidebar-user-role {
                margin-top: 3px;
                color: rgba(255, 255, 255, 0.65);
                font-size: 12px;
                text-transform: capitalize;
            }

            .sidebar-navigation {
                flex: 1;
                padding: 12px 10px;
            }

            .sidebar-section {
                margin-bottom: 16px;
            }

            .sidebar-section-title {
                padding: 6px 10px;
                color: rgba(255, 255, 255, 0.45);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            .sidebar-section-links {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .sidebar-nav-link {
                display: flex;
                align-items: center;
                gap: 10px;
                min-height: 42px;
                padding: 9px 12px;
                border-radius: 7px;
                color: rgba(255, 255, 255, 0.78);
                text-decoration: none;
                font-size: 14px;
                transition:
                    background-color 0.15s ease,
                    color 0.15s ease;
            }

            .sidebar-nav-link i {
                width: 20px;
                text-align: center;
                font-size: 16px;
                flex-shrink: 0;
            }

            .sidebar-nav-link:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #ffffff;
            }

            .sidebar-nav-link.active {
                background: #0d6efd;
                color: #ffffff;
            }

            .sidebar-footer {
                padding: 12px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .sidebar-logout {
                width: 100%;
                min-height: 42px;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 10px;
                padding: 9px 12px;
                border: 0;
                border-radius: 7px;
                background: transparent;
                color: rgba(255, 255, 255, 0.78);
                font-size: 14px;
                cursor: pointer;
                text-align: left;
            }

            .sidebar-logout:hover {
                background: rgba(220, 53, 69, 0.18);
                color: #ffffff;
            }

            .sidebar-overlay {
                display: none;
            }

            body.has-shared-sidebar {
                padding-left: 270px;
            }

            @media (max-width: 991.98px) {
                .app-sidebar {
                    transform: translateX(-100%);
                    transition: transform 0.2s ease;
                }

                .app-sidebar.sidebar-open {
                    transform: translateX(0);
                }

                .sidebar-close {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                }

                .sidebar-overlay {
                    position: fixed;
                    inset: 0;
                    display: block;
                    background: rgba(0, 0, 0, 0.45);
                    opacity: 0;
                    visibility: hidden;
                    z-index: 1030;
                    transition:
                        opacity 0.2s ease,
                        visibility 0.2s ease;
                }

                .sidebar-overlay.sidebar-overlay-visible {
                    opacity: 1;
                    visibility: visible;
                }

                body.has-shared-sidebar {
                    padding-left: 0;
                }

                body.sidebar-is-open {
                    overflow: hidden;
                }
            }

            @media (min-width: 992px) {
                body.has-shared-sidebar {
                    padding-left: 270px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createMobileToggleIfNeeded() {
        if (document.getElementById(SIDEBAR_TOGGLE_ID)) {
            return;
        }

        const existingToggle =
            document.querySelector(
                "[data-sidebar-toggle]"
            );

        if (existingToggle) {
            existingToggle.id = SIDEBAR_TOGGLE_ID;
            return;
        }

        const button = document.createElement("button");

        button.type = "button";
        button.id = SIDEBAR_TOGGLE_ID;
        button.className = "sidebar-mobile-toggle";
        button.setAttribute(
            "aria-label",
            "Open navigation"
        );
        button.innerHTML =
            '<i class="bi bi-list" aria-hidden="true"></i>';

        button.style.cssText = [
            "position: fixed",
            "top: 12px",
            "left: 12px",
            "width: 42px",
            "height: 42px",
            "display: none",
            "align-items: center",
            "justify-content: center",
            "border: 0",
            "border-radius: 7px",
            "background: #212529",
            "color: #ffffff",
            "font-size: 20px",
            "cursor: pointer",
            "z-index: 1020"
        ].join(";");

        document.body.appendChild(button);

        const mediaQuery = window.matchMedia(
            "(max-width: 991.98px)"
        );

        function updateToggleVisibility() {
            button.style.display = mediaQuery.matches
                ? "inline-flex"
                : "none";
        }

        updateToggleVisibility();

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener(
                "change",
                updateToggleVisibility
            );
        } else if (
            typeof mediaQuery.addListener === "function"
        ) {
            mediaQuery.addListener(
                updateToggleVisibility
            );
        }
    }

    function initializeSidebar() {
        ensureSidebarStyles();
        createMobileToggleIfNeeded();
        mountSidebar();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeSidebar
        );
    } else {
        initializeSidebar();
    }

    window.SchoolManagementSidebar = {
        initialize: initializeSidebar,
        open: openSidebar,
        close: closeSidebar,
        logout: handleLogout,
        getStoredUser: getStoredUser,
        getStoredToken: getStoredToken,
        getUserRole: getUserRole
    };
})();