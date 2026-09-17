"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| DASHBOARD JAVASCRIPT
|--------------------------------------------------------------------------
|
| Responsibilities:
|
| - Dashboard statistics
| - Current authenticated user
| - Current user role
| - School information
| - Recent students
| - Recent payments
| - Quick actions
| - Sidebar navigation
| - Dashboard refresh
| - Logout
|
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);

/*
|--------------------------------------------------------------------------
| INITIALIZE DASHBOARD
|--------------------------------------------------------------------------
*/

async function initializeDashboard() {
    try {
        renderRecentStudents([]);
        renderRecentPayments([]);

        await Promise.allSettled([
            loadDashboardData(),
            loadRecentStudents(),
            loadRecentPayments(),
            loadCurrentUser()
        ]);
    } catch (error) {
        console.error(
            "Dashboard data initialization error:",
            error
        );
    } finally {
        setupDashboardNavigation();
        setupQuickActions();
        setupRefreshButton();
    }
}

/*
|--------------------------------------------------------------------------
| DASHBOARD STATISTICS
|--------------------------------------------------------------------------
*/

async function loadDashboardData() {
    try {
        const data = await apiRequest(
            "/reports/dashboard",
            {
                method: "GET"
            }
        );

        if (
            !data ||
            data.success !== true
        ) {
            throw new Error(
                data && data.message
                    ? data.message
                    : "Failed to load dashboard statistics."
            );
        }

        if (data.data) {
            updateDashboardStatistics(
                data.data
            );
        }
    } catch (error) {
        console.error(
            "Dashboard statistics error:",
            error
        );
    }
}

function updateDashboardStatistics(stats) {
    if (
        !stats ||
        typeof stats !== "object"
    ) {
        return;
    }

    const source =
        stats.overview ||
        stats;

    const studentStats =
        stats.students ||
        {};

    const staffStats =
        stats.staff ||
        {};

    const financeStats =
        stats.finance ||
        stats.financial ||
        {};

    const mappings = {
        totalStudents: [
            "totalStudents",
            "studentCount",
            "studentsCount",
            "total_students"
        ],

        totalStaff: [
            "totalStaff",
            "staffCount",
            "staff_count"
        ],

        totalGuardians: [
            "totalGuardians",
            "guardianCount",
            "guardiansCount",
            "guardian_count"
        ],

        totalClasses: [
            "totalClasses",
            "classCount",
            "classesCount",
            "class_count"
        ],

        totalSubjects: [
            "totalSubjects",
            "subjectCount",
            "subjectsCount",
            "subject_count"
        ],

        totalFees: [
            "totalFees",
            "total_fees",
            "feesTotal",
            "fees_total"
        ],

        outstandingFees: [
            "outstandingFees",
            "outstanding_fees",
            "feesOutstanding",
            "fees_outstanding"
        ],

        totalPayments: [
            "totalPayments",
            "total_payments",
            "paymentsTotal",
            "payments_total"
        ]
    };

    Object.keys(mappings).forEach(
        function (targetId) {
            const element =
                document.getElementById(
                    targetId
                );

            if (!element) {
                return;
            }

            let value = null;

            for (
                const key of mappings[
                    targetId
                ]
            ) {
                if (
                    source[key] !==
                        undefined &&
                    source[key] !==
                        null
                ) {
                    value =
                        source[key];

                    break;
                }

                if (
                    financeStats[key] !==
                        undefined &&
                    financeStats[key] !==
                        null
                ) {
                    value =
                        financeStats[key];

                    break;
                }
            }

            if (
                value === null &&
                targetId ===
                    "totalStudents"
            ) {
                value =
                    studentStats.totalStudents ??
                    studentStats.total_students ??
                    null;
            }

            if (
                value === null &&
                targetId ===
                    "totalStaff"
            ) {
                value =
                    staffStats.totalStaff ??
                    staffStats.total_staff ??
                    null;
            }

            if (
                value !== null &&
                value !== undefined
            ) {
                if (
                    targetId ===
                        "totalFees" ||
                    targetId ===
                        "outstandingFees" ||
                    targetId ===
                        "totalPayments"
                ) {
                    element.textContent =
                        formatCurrency(
                            value
                        );
                } else {
                    element.textContent =
                        Number(
                            value
                        ).toLocaleString(
                            "en-NG"
                        );
                }
            }
        }
    );

    updateElementFromStats(
        [
            "activeStudents",
            "studentsActive"
        ],
        studentStats.activeStudents ??
            studentStats.active_students ??
            source.activeStudents ??
            source.active_students
    );

    updateElementFromStats(
        [
            "maleStudents",
            "studentsMale"
        ],
        studentStats.maleStudents ??
            studentStats.male_students ??
            source.maleStudents ??
            source.male_students
    );

    updateElementFromStats(
        [
            "femaleStudents",
            "studentsFemale"
        ],
        studentStats.femaleStudents ??
            studentStats.female_students ??
            source.femaleStudents ??
            source.female_students
    );
}

function updateElementFromStats(
    ids,
    value
) {
    if (
        value === undefined ||
        value === null
    ) {
        return;
    }

    ids.forEach(
        function (id) {
            const element =
                document.getElementById(
                    id
                );

            if (element) {
                element.textContent =
                    Number(
                        value
                    ).toLocaleString(
                        "en-NG"
                    );
            }
        }
    );
}

/*
|--------------------------------------------------------------------------
| CURRENT AUTHENTICATED USER
|--------------------------------------------------------------------------
*/

async function loadCurrentUser() {
    try {
        const response =
            await apiRequest(
                "/auth/me",
                {
                    method: "GET"
                }
            );

        console.log(
            "Dashboard /auth/me response:",
            response
        );

        if (
            !response ||
            response.success === false
        ) {
            console.warn(
                "Dashboard /auth/me did not return a successful response."
            );

            loadStoredUserFallback();

            return;
        }

        const user =
            extractCurrentUser(
                response
            );

        if (!user) {
            console.warn(
                "Authenticated user was not found in /auth/me response."
            );

            loadStoredUserFallback();

            return;
        }

        console.log(
            "Dashboard authenticated user:",
            user
        );

        const userRole =
            getAuthenticatedUserRole(
                user
            );

        const userName =
            getAuthenticatedUserName(
                user,
                userRole
            );

        console.log(
            "Dashboard resolved user name:",
            userName
        );

        console.log(
            "Dashboard resolved user role:",
            userRole
        );

        updateCurrentUserDisplay(
            userName,
            userRole
        );
    } catch (error) {
        console.error(
            "Current user error:",
            error
        );

        loadStoredUserFallback();
    }
}

/*
|--------------------------------------------------------------------------
| EXTRACT CURRENT USER
|--------------------------------------------------------------------------
*/

function extractCurrentUser(response) {
    if (
        !response ||
        typeof response !==
            "object"
    ) {
        return null;
    }

    const possibleUsers = [
        response.user,
        response.currentUser,
        response.current_user,

        response.data?.user,
        response.data?.currentUser,
        response.data?.current_user,

        response.data?.data?.user,
        response.data?.data?.currentUser,
        response.data?.data?.current_user,

        response.data
    ];

    for (
        const candidate of possibleUsers
    ) {
        if (
            candidate &&
            typeof candidate ===
                "object" &&
            !Array.isArray(candidate)
        ) {
            if (
                hasUserIdentity(
                    candidate
                )
            ) {
                return candidate;
            }
        }
    }

    if (
        hasUserIdentity(
            response
        )
    ) {
        return response;
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| CHECK USER IDENTITY
|--------------------------------------------------------------------------
*/

function hasUserIdentity(user) {
    if (
        !user ||
        typeof user !==
            "object"
    ) {
        return false;
    }

    return Boolean(
        user.id ||
        user.userId ||
        user.user_id ||
        user.username ||
        user.email ||
        user.name ||
        user.fullName ||
        user.full_name ||
        user.firstName ||
        user.first_name ||
        user.lastName ||
        user.last_name
    );
}

/*
|--------------------------------------------------------------------------
| GET AUTHENTICATED USER NAME
|--------------------------------------------------------------------------
|
| The authenticated API response is authoritative.
|
| Important:
|
| - "admin" is an account username, not the dashboard display name.
| - Generic values such as "user" must not replace "Administrator".
| - A real personal name is preferred when available.
| - If this is the Administrator account and no personal name exists,
|   display "Administrator".
|
|--------------------------------------------------------------------------
*/

function getAuthenticatedUserName(
    user,
    userRole
) {
    if (!user) {
        return getMeaningfulStoredOrDomName(
            "Administrator"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Direct display-name fields
    |--------------------------------------------------------------------------
    */

    const directNameFields = [
        user.name,
        user.fullName,
        user.full_name,
        user.displayName,
        user.display_name
    ];

    for (
        const value of directNameFields
    ) {
        if (
            isMeaningfulUserName(
                value
            )
        ) {
            return String(
                value
            ).trim();
        }
    }

    /*
    |--------------------------------------------------------------------------
    | First / middle / last name
    |--------------------------------------------------------------------------
    */

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

    const constructedName = [
        firstName,
        middleName,
        lastName
    ]
        .filter(
            function (value) {
                return Boolean(
                    String(
                        value
                    ).trim()
                );
            }
        )
        .join(" ")
        .trim();

    if (
        isMeaningfulUserName(
            constructedName
        )
    ) {
        return constructedName;
    }

    /*
    |--------------------------------------------------------------------------
    | Administrator account handling
    |--------------------------------------------------------------------------
    |
    | "admin" is the login identifier.
    | It should not be displayed as the person's dashboard name.
    |
    */

    const username =
        String(
            user.username ||
                user.userName ||
                user.user_name ||
                ""
        )
            .trim()
            .toLowerCase();

    const normalizedRole =
        String(
            userRole ||
                ""
        )
            .trim()
            .toLowerCase();

    if (
        username ===
            "admin" ||
        username ===
            "administrator" ||
        normalizedRole ===
            "administrator" ||
        normalizedRole ===
            "admin"
    ) {
        return "Administrator";
    }

    /*
    |--------------------------------------------------------------------------
    | Other meaningful usernames
    |--------------------------------------------------------------------------
    */

    if (
        username &&
        !isGenericUserValue(
            username
        )
    ) {
        return String(
            user.username ||
                user.userName ||
                user.user_name
        ).trim();
    }

    /*
    |--------------------------------------------------------------------------
    | Email fallback
    |--------------------------------------------------------------------------
    */

    if (
        user.email &&
        String(
            user.email
        ).trim()
    ) {
        const email =
            String(
                user.email
            ).trim();

        const emailName =
            email.split(
                "@"
            )[0];

        if (
            isMeaningfulUserName(
                emailName
            )
        ) {
            return emailName;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Preserve the meaningful dashboard value instead of replacing it
    | with "User".
    |--------------------------------------------------------------------------
    */

    return getMeaningfulStoredOrDomName(
        "Administrator"
    );
}

/*
|--------------------------------------------------------------------------
| CHECK WHETHER A NAME IS MEANINGFUL
|--------------------------------------------------------------------------
*/

function isMeaningfulUserName(
    value
) {
    if (
        value === undefined ||
        value === null
    ) {
        return false;
    }

    const normalized =
        String(
            value
        )
            .trim()
            .toLowerCase();

    if (!normalized) {
        return false;
    }

    return !isGenericUserValue(
        normalized
    );
}

/*
|--------------------------------------------------------------------------
| GENERIC USER VALUES
|--------------------------------------------------------------------------
*/

function isGenericUserValue(
    value
) {
    const normalized =
        String(
            value ||
                ""
        )
            .trim()
            .toLowerCase();

    return [
        "user",
        "users",
        "unknown",
        "unknown user",
        "guest",
        "admin",
        "administrator",
        "null",
        "undefined",
        "n/a",
        "na",
        "-"
    ].includes(
        normalized
    );
}

/*
|--------------------------------------------------------------------------
| PRESERVE A MEANINGFUL EXISTING NAME
|--------------------------------------------------------------------------
*/

function getMeaningfulStoredOrDomName(
    fallbackName
) {
    /*
    |--------------------------------------------------------------------------
    | First check the current dashboard HTML.
    |--------------------------------------------------------------------------
    |
    | The dashboard HTML already contains "Administrator".
    | Do not replace that meaningful value with "User".
    |
    */

    const dashboardNameElement =
        document.querySelector(
            "[data-user-name]"
        );

    if (
        dashboardNameElement
    ) {
        const domName =
            String(
                dashboardNameElement.textContent ||
                    ""
            ).trim();

        if (
            isMeaningfulUserName(
                domName
            )
        ) {
            return domName;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Then check stored user information.
    |--------------------------------------------------------------------------
    */

    try {
        const storedUser =
            localStorage.getItem(
                "school_management_user"
            );

        if (storedUser) {
            const parsedUser =
                JSON.parse(
                    storedUser
                );

            if (
                parsedUser &&
                typeof parsedUser ===
                    "object"
            ) {
                const storedName =
                    parsedUser.name ||
                    parsedUser.fullName ||
                    parsedUser.full_name ||
                    parsedUser.displayName ||
                    parsedUser.display_name;

                if (
                    isMeaningfulUserName(
                        storedName
                    )
                ) {
                    return String(
                        storedName
                    ).trim();
                }

                const storedUsername =
                    parsedUser.username ||
                    parsedUser.userName ||
                    parsedUser.user_name ||
                    "";

                if (
                    storedUsername &&
                    !isGenericUserValue(
                        storedUsername
                    )
                ) {
                    return String(
                        storedUsername
                    ).trim();
                }

                const storedRole =
                    parsedUser.roleName ||
                    parsedUser.role_name ||
                    parsedUser.role ||
                    "";

                if (
                    String(
                        storedRole
                    )
                        .trim()
                        .toLowerCase() ===
                        "administrator"
                ) {
                    return "Administrator";
                }
            }
        }
    } catch (error) {
        console.warn(
            "Unable to read stored dashboard user:",
            error
        );
    }

    return fallbackName || "Administrator";
}

/*
|--------------------------------------------------------------------------
| GET AUTHENTICATED USER ROLE
|--------------------------------------------------------------------------
*/

function getAuthenticatedUserRole(
    user
) {
    if (!user) {
        return "User";
    }

    /*
    |--------------------------------------------------------------------------
    | Direct role fields
    |--------------------------------------------------------------------------
    */

    const directRole =
        user.roleName ||
        user.role_name ||
        user.roleTitle ||
        user.role_title;

    if (
        directRole &&
        typeof directRole ===
            "string"
    ) {
        const normalizedRole =
            String(
                directRole
            ).trim();

        if (normalizedRole) {
            return normalizeRoleDisplay(
                normalizedRole
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Role field may itself be a string
    |--------------------------------------------------------------------------
    */

    if (
        typeof user.role ===
        "string"
    ) {
        const normalizedRole =
            String(
                user.role
            ).trim();

        if (normalizedRole) {
            return normalizeRoleDisplay(
                normalizedRole
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Nested role object
    |--------------------------------------------------------------------------
    */

    if (
        user.role &&
        typeof user.role ===
            "object"
    ) {
        const nestedRole =
            user.role.name ||
            user.role.roleName ||
            user.role.role_name ||
            user.role.title;

        if (
            nestedRole
        ) {
            return normalizeRoleDisplay(
                nestedRole
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Administrator account fallback
    |--------------------------------------------------------------------------
    */

    const username =
        String(
            user.username ||
                user.userName ||
                user.user_name ||
                ""
        )
            .trim()
            .toLowerCase();

    if (
        username ===
            "admin" ||
        username ===
            "administrator"
    ) {
        return "Administrator";
    }

    return "User";
}

/*
|--------------------------------------------------------------------------
| NORMALIZE ROLE DISPLAY
|--------------------------------------------------------------------------
*/

function normalizeRoleDisplay(
    role
) {
    const normalized =
        String(
            role ||
                ""
        )
            .trim()
            .toLowerCase();

    if (
        normalized ===
            "admin" ||
        normalized ===
            "administrator" ||
        normalized ===
            "administrator role"
    ) {
        return "Administrator";
    }

    if (
        normalized ===
            "staff"
    ) {
        return "Staff";
    }

    if (
        normalized ===
            "teacher"
    ) {
        return "Teacher";
    }

    if (
        normalized ===
            "student"
    ) {
        return "Student";
    }

    if (
        normalized ===
            "guardian"
    ) {
        return "Guardian";
    }

    if (
        normalized ===
            "management"
    ) {
        return "Management";
    }

    return String(
        role
    ).trim();
}

/*
|--------------------------------------------------------------------------
| UPDATE CURRENT USER DISPLAY
|--------------------------------------------------------------------------
*/

function updateCurrentUserDisplay(
    userName,
    userRole
) {
    let safeUserName =
        userName &&
        String(
            userName
        ).trim()
            ? String(
                  userName
              ).trim()
            : "";

    let safeUserRole =
        userRole &&
        String(
            userRole
        ).trim()
            ? String(
                  userRole
              ).trim()
            : "";

    /*
    |--------------------------------------------------------------------------
    | Never allow generic "User" to overwrite a meaningful dashboard name.
    |--------------------------------------------------------------------------
    */

    if (
        !safeUserName ||
        isGenericUserValue(
            safeUserName
        )
    ) {
        safeUserName =
            getMeaningfulStoredOrDomName(
                "Administrator"
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Resolve Administrator display consistently.
    |--------------------------------------------------------------------------
    */

    if (
        String(
            safeUserRole
        )
            .trim()
            .toLowerCase() ===
            "admin"
    ) {
        safeUserRole =
            "Administrator";
    }

    if (
        String(
            safeUserRole
        )
            .trim()
            .toLowerCase() ===
        "administrator"
    ) {
        safeUserRole =
            "Administrator";
    }

    if (
        !safeUserRole ||
        isGenericUserValue(
            safeUserRole
        )
    ) {
        safeUserRole =
            "User";
    }

    /*
    |--------------------------------------------------------------------------
    | Header and welcome user name
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-user-name], #currentUserName, #userName"
        )
        .forEach(
            function (element) {
                element.textContent =
                    safeUserName;
            }
        );

    /*
    |--------------------------------------------------------------------------
    | User role
    |--------------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-user-role], #currentUserRole, #userRole"
        )
        .forEach(
            function (element) {
                element.textContent =
                    safeUserRole;
            }
        );

    /*
    |--------------------------------------------------------------------------
    | User avatar
    |--------------------------------------------------------------------------
    */

    const avatar =
        document.getElementById(
            "userAvatar"
        );

    if (avatar) {
        avatar.textContent =
            getInitials(
                safeUserName
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Save corrected normalized user information locally.
    |--------------------------------------------------------------------------
    */

    try {
        const storedUser =
            localStorage.getItem(
                "school_management_user"
            );

        let parsedUser = {};

        if (storedUser) {
            try {
                parsedUser =
                    JSON.parse(
                        storedUser
                    ) || {};
            } catch (
                parseError
            ) {
                console.warn(
                    "Stored user data could not be parsed:",
                    parseError
                );
            }
        }

        const normalizedUser =
            Object.assign(
                {},
                parsedUser,
                {
                    name:
                        safeUserName,
                    full_name:
                        safeUserName,
                    displayName:
                        safeUserName,
                    role:
                        safeUserRole,
                    roleName:
                        safeUserRole
                }
            );

        localStorage.setItem(
            "school_management_user",
            JSON.stringify(
                normalizedUser
            )
        );
    } catch (storageError) {
        console.warn(
            "Unable to save normalized dashboard user:",
            storageError
        );
    }
}

/*
|--------------------------------------------------------------------------
| STORED USER FALLBACK
|--------------------------------------------------------------------------
|
| This is only used if /auth/me cannot provide the user.
|
|--------------------------------------------------------------------------
*/

function loadStoredUserFallback() {
    try {
        const storedUser =
            localStorage.getItem(
                "school_management_user"
            );

        if (!storedUser) {
            return;
        }

        const user =
            JSON.parse(
                storedUser
            );

        if (
            !user ||
            typeof user !==
                "object"
        ) {
            return;
        }

        const userRole =
            getAuthenticatedUserRole(
                user
            );

        const userName =
            getAuthenticatedUserName(
                user,
                userRole
            );

        updateCurrentUserDisplay(
            userName,
            userRole
        );
    } catch (error) {
        console.error(
            "Stored user fallback error:",
            error
        );
    }
}

/*
|--------------------------------------------------------------------------
| RECENT STUDENTS
|--------------------------------------------------------------------------
*/

async function loadRecentStudents() {
    const container =
        getRecentStudentsContainer();

    if (!container) {
        console.warn(
            "Recent Students container was not found on the dashboard."
        );

        return;
    }

    try {
        const response =
            await apiRequest(
                "/students?limit=100",
                {
                    method: "GET"
                }
            );

        if (
            !response ||
            response.success === false
        ) {
            renderRecentStudents([]);

            return;
        }

        let students =
            extractCollection(
                response,
                [
                    "students",
                    "data",
                    "results",
                    "rows"
                ]
            );

        if (
            !Array.isArray(
                students
            )
        ) {
            students = [];
        }

        students.sort(
            function (a, b) {
                const timeA =
                    getStudentTimestamp(
                        a
                    );

                const timeB =
                    getStudentTimestamp(
                        b
                    );

                return (
                    timeB -
                    timeA
                );
            }
        );

        renderRecentStudents(
            students.slice(
                0,
                5
            )
        );
    } catch (error) {
        console.error(
            "Recent students error:",
            error
        );

        renderRecentStudents([]);
    }
}

function getRecentStudentsContainer() {
    return document.querySelector(
        "[data-recent-students]"
    );
}

function getStudentTimestamp(
    student
) {
    if (!student) {
        return 0;
    }

    const value =
        student.createdAt ||
        student.created_at ||
        student.registrationDate ||
        student.registration_date ||
        student.registeredAt ||
        student.registered_at ||
        student.admissionDate ||
        student.admission_date ||
        student.enrollmentDate ||
        student.enrollment_date ||
        student.dateRegistered ||
        student.date_registered ||
        null;

    if (!value) {
        return 0;
    }

    const timestamp =
        new Date(
            value
        ).getTime();

    return Number.isNaN(
        timestamp
    )
        ? 0
        : timestamp;
}

/*
|--------------------------------------------------------------------------
| RENDER RECENT STUDENTS
|--------------------------------------------------------------------------
*/

function renderRecentStudents(
    students
) {
    const container =
        getRecentStudentsContainer();

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(
            students
        ) ||
        students.length === 0
    ) {
        container.innerHTML =
            '<div class="empty-state">' +
            '<i class="bi bi-people"></i>' +
            "<p>No students registered yet.</p>" +
            "</div>";

        return;
    }

    students
        .slice(
            0,
            5
        )
        .forEach(
            function (student) {
                const id =
                    student.id ||
                    "";

                const studentNumber =
                    student.studentNumber ||
                    student.student_number ||
                    student.admissionNumber ||
                    student.admission_number ||
                    "-";

                const name =
                    getStudentName(
                        student
                    );

                const gender =
                    student.gender ||
                    "-";

                const status =
                    student.status ||
                    "Active";

                const initials =
                    getInitials(
                        name
                    );

                const profileUrl =
                    id
                        ? "/pages/student-profile.html?id=" +
                          encodeURIComponent(
                              id
                          )
                        : "/pages/students.html";

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "recent-item";

                item.innerHTML =
                    '<div class="d-flex align-items-center gap-3 min-w-0 flex-grow-1">' +
                    '<div class="recent-avatar">' +
                    escapeHtml(
                        initials
                    ) +
                    "</div>" +
                    '<div class="recent-info">' +
                    '<div class="recent-name">' +
                    '<a href="' +
                    profileUrl +
                    '" class="text-decoration-none">' +
                    escapeHtml(
                        name ||
                            "Unnamed Student"
                    ) +
                    "</a>" +
                    "</div>" +
                    '<div class="recent-meta">' +
                    escapeHtml(
                        studentNumber
                    ) +
                    " • " +
                    escapeHtml(
                        gender
                    ) +
                    "</div>" +
                    "</div>" +
                    "</div>" +
                    '<div class="text-end">' +
                    '<span class="badge ' +
                    getStatusBadgeClass(
                        status
                    ) +
                    '">' +
                    escapeHtml(
                        status
                    ) +
                    "</span>" +
                    "</div>";

                container.appendChild(
                    item
                );
            }
        );
}

/*
|--------------------------------------------------------------------------
| RECENT PAYMENTS
|--------------------------------------------------------------------------
*/

async function loadRecentPayments() {
    const container =
        getRecentPaymentsContainer();

    if (!container) {
        console.warn(
            "Recent Payments container was not found on the dashboard."
        );

        return;
    }

    try {
        const response =
            await apiRequest(
                "/fees/payments/recent",
                {
                    method: "GET"
                }
            );

        if (
            !response ||
            response.success === false
        ) {
            renderRecentPayments([]);

            return;
        }

        let payments =
            extractCollection(
                response,
                [
                    "payments",
                    "data",
                    "results",
                    "rows"
                ]
            );

        if (
            !Array.isArray(
                payments
            )
        ) {
            payments = [];
        }

        payments.sort(
            function (a, b) {
                const timeA =
                    getPaymentTimestamp(
                        a
                    );

                const timeB =
                    getPaymentTimestamp(
                        b
                    );

                return (
                    timeB -
                    timeA
                );
            }
        );

        renderRecentPayments(
            payments.slice(
                0,
                5
            )
        );
    } catch (error) {
        console.error(
            "Recent payments error:",
            error
        );

        renderRecentPayments([]);
    }
}

function getRecentPaymentsContainer() {
    return document.querySelector(
        "[data-recent-payments]"
    );
}

function getPaymentTimestamp(
    payment
) {
    if (!payment) {
        return 0;
    }

    const value =
        payment.paymentDate ||
        payment.payment_date ||
        payment.paidAt ||
        payment.paid_at ||
        payment.transactionDate ||
        payment.transaction_date ||
        payment.date ||
        payment.createdAt ||
        payment.created_at ||
        null;

    if (!value) {
        return 0;
    }

    const timestamp =
        new Date(
            value
        ).getTime();

    return Number.isNaN(
        timestamp
    )
        ? 0
        : timestamp;
}

/*
|--------------------------------------------------------------------------
| RENDER RECENT PAYMENTS
|--------------------------------------------------------------------------
*/

function renderRecentPayments(
    payments
) {
    const container =
        getRecentPaymentsContainer();

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(
            payments
        ) ||
        payments.length === 0
    ) {
        const item =
            document.createElement(
                "div"
            );

        item.className =
            "recent-item";

        item.innerHTML =
            '<div class="d-flex align-items-center gap-3 min-w-0 flex-grow-1">' +
            '<div class="recent-avatar">' +
            '<i class="bi bi-cash-stack"></i>' +
            "</div>" +
            '<div class="recent-info">' +
            '<div class="recent-name">' +
            "No recent payment" +
            "</div>" +
            '<div class="recent-meta">' +
            "No payment has been recorded yet" +
            "</div>" +
            "</div>" +
            "</div>" +
            '<div class="text-end">' +
            '<div class="recent-amount">' +
            formatCurrency(
                0
            ) +
            "</div>" +
            '<div class="recent-meta">' +
            "—" +
            "</div>" +
            "</div>";

        container.appendChild(
            item
        );

        return;
    }

    payments
        .slice(
            0,
            5
        )
        .forEach(
            function (payment) {
                const studentName =
                    getPaymentStudentName(
                        payment
                    );

                const amount =
                    getPaymentAmount(
                        payment
                    );

                const date =
                    getPaymentDate(
                        payment
                    );

                const initials =
                    getInitials(
                        studentName
                    );

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "recent-item";

                item.innerHTML =
                    '<div class="d-flex align-items-center gap-3 min-w-0 flex-grow-1">' +
                    '<div class="recent-avatar">' +
                    escapeHtml(
                        initials
                    ) +
                    "</div>" +
                    '<div class="recent-info">' +
                    '<div class="recent-name">' +
                    escapeHtml(
                        studentName
                    ) +
                    "</div>" +
                    '<div class="recent-meta">' +
                    formatDate(
                        date
                    ) +
                    "</div>" +
                    "</div>" +
                    "</div>" +
                    '<div class="text-end">' +
                    '<div class="recent-amount">' +
                    formatCurrency(
                        amount
                    ) +
                    "</div>" +
                    '<span class="badge bg-success">' +
                    "Paid" +
                    "</span>" +
                    "</div>";

                container.appendChild(
                    item
                );
            }
        );
}

/*
|--------------------------------------------------------------------------
| COLLECTION HELPERS
|--------------------------------------------------------------------------
*/

function extractCollection(
    response,
    keys
) {
    if (
        Array.isArray(
            response
        )
    ) {
        return response;
    }

    if (
        !response ||
        typeof response !==
            "object"
    ) {
        return [];
    }

    for (
        const key of keys
    ) {
        if (
            Array.isArray(
                response[key]
            )
        ) {
            return response[key];
        }
    }

    if (
        response.data &&
        typeof response.data ===
            "object"
    ) {
        for (
            const key of keys
        ) {
            if (
                Array.isArray(
                    response.data[key]
                )
            ) {
                return response.data[key];
            }
        }
    }

    return [];
}

/*
|--------------------------------------------------------------------------
| STUDENT HELPERS
|--------------------------------------------------------------------------
*/

function getStudentName(
    student
) {
    if (!student) {
        return "Unnamed Student";
    }

    const directName =
        student.name ||
        student.fullName ||
        student.full_name ||
        student.studentName ||
        student.student_name;

    if (directName) {
        return String(
            directName
        ).trim();
    }

    return [
        student.firstName ||
            student.first_name ||
            "",

        student.middleName ||
            student.middle_name ||
            "",

        student.lastName ||
            student.last_name ||
            ""
    ]
        .filter(
            function (value) {
                return Boolean(
                    value
                );
            }
        )
        .join(" ")
        .trim() ||
        "Unnamed Student";
}

/*
|--------------------------------------------------------------------------
| PAYMENT HELPERS
|--------------------------------------------------------------------------
*/

function getPaymentStudentName(
    payment
) {
    if (!payment) {
        return "Unknown Student";
    }

    const directName =
        payment.studentName ||
        payment.student_name ||
        payment.payerName ||
        payment.payer_name ||
        payment.name ||
        payment.fullName ||
        payment.full_name;

    if (directName) {
        return String(
            directName
        ).trim();
    }

    return [
        payment.firstName ||
            payment.first_name ||
            "",

        payment.middleName ||
            payment.middle_name ||
            "",

        payment.lastName ||
            payment.last_name ||
            ""
    ]
        .filter(
            function (value) {
                return Boolean(
                    value
                );
            }
        )
        .join(" ")
        .trim() ||
        "Unknown Student";
}

function getPaymentAmount(
    payment
) {
    if (!payment) {
        return 0;
    }

    const amount =
        payment.amount ??
        payment.paidAmount ??
        payment.paid_amount ??
        payment.paymentAmount ??
        payment.payment_amount ??
        payment.totalAmount ??
        payment.total_amount ??
        0;

    const numericAmount =
        Number(
            amount
        );

    return Number.isNaN(
        numericAmount
    )
        ? 0
        : numericAmount;
}

function getPaymentDate(
    payment
) {
    if (!payment) {
        return null;
    }

    return (
        payment.paymentDate ||
        payment.payment_date ||
        payment.paidAt ||
        payment.paid_at ||
        payment.transactionDate ||
        payment.transaction_date ||
        payment.date ||
        payment.createdAt ||
        payment.created_at ||
        null
    );
}

/*
|--------------------------------------------------------------------------
| FORMATTING
|--------------------------------------------------------------------------
*/

function formatCurrency(
    value
) {
    const amount =
        Number(
            value
        );

    const safeAmount =
        Number.isNaN(
            amount
        )
            ? 0
            : amount;

    return (
        "₦" +
        safeAmount.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );
}

function formatDate(
    value
) {
    if (!value) {
        return "-";
    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(
            value
        );
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

function getInitials(
    name
) {
    if (!name) {
        return "—";
    }

    const parts =
        String(
            name
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );

    if (
        parts.length === 1
    ) {
        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[
            parts.length - 1
        ][0]
    ).toUpperCase();
}

function getStatusBadgeClass(
    status
) {
    const normalized =
        String(
            status ||
                ""
        )
            .trim()
            .toLowerCase();

    if (
        normalized ===
            "active" ||
        normalized ===
            "approved" ||
        normalized ===
            "paid" ||
        normalized ===
            "completed"
    ) {
        return "bg-success";
    }

    if (
        normalized ===
            "pending" ||
        normalized ===
            "processing"
    ) {
        return "bg-warning text-dark";
    }

    if (
        normalized ===
            "inactive" ||
        normalized ===
            "suspended" ||
        normalized ===
            "cancelled" ||
        normalized ===
            "rejected"
    ) {
        return "bg-danger";
    }

    return "bg-secondary";
}

function escapeHtml(
    value
) {
    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

/*
|--------------------------------------------------------------------------
| DASHBOARD NAVIGATION
|--------------------------------------------------------------------------
*/

function setupDashboardNavigation() {
    const sidebarToggle =
        document.querySelector(
            "#sidebarToggle"
        );

    const sidebar =
        document.querySelector(
            "#smsSidebar"
        );

    const sidebarOverlay =
        document.querySelector(
            "#sidebarOverlay"
        );

    if (
        sidebarToggle &&
        sidebar
    ) {
        if (
            sidebarToggle.dataset
                .dashboardSidebarInitialized !==
            "true"
        ) {
            sidebarToggle.dataset
                .dashboardSidebarInitialized =
                "true";

            sidebarToggle.addEventListener(
                "click",
                function () {
                    const isOpen =
                        sidebar.classList.contains(
                            "show"
                        );

                    if (isOpen) {
                        sidebar.classList.remove(
                            "show"
                        );

                        if (
                            sidebarOverlay
                        ) {
                            sidebarOverlay.classList.remove(
                                "show"
                            );
                        }
                    } else {
                        sidebar.classList.add(
                            "show"
                        );

                        if (
                            sidebarOverlay
                        ) {
                            sidebarOverlay.classList.add(
                                "show"
                            );
                        }
                    }
                }
            );
        }
    }

    if (
        sidebarOverlay &&
        sidebarOverlay.dataset
            .dashboardOverlayInitialized !==
        "true"
    ) {
        sidebarOverlay.dataset
            .dashboardOverlayInitialized =
            "true";

        sidebarOverlay.addEventListener(
            "click",
            function () {
                if (sidebar) {
                    sidebar.classList.remove(
                        "show"
                    );
                }

                sidebarOverlay.classList.remove(
                    "show"
                );
            }
        );
    }

    document
        .querySelectorAll(
            "[data-dashboard-link]"
        )
        .forEach(
            function (link) {
                if (
                    link.dataset
                        .dashboardLinkInitialized ===
                    "true"
                ) {
                    return;
                }

                link.dataset
                    .dashboardLinkInitialized =
                    "true";

                link.addEventListener(
                    "click",
                    function () {
                        if (
                            sidebar
                        ) {
                            sidebar.classList.remove(
                                "show"
                            );
                        }

                        if (
                            sidebarOverlay
                        ) {
                            sidebarOverlay.classList.remove(
                                "show"
                            );
                        }
                    }
                );
            }
        );

    const logoutButtons =
        document.querySelectorAll(
            "[data-logout], #logoutButton, .logout-button"
        );

    logoutButtons.forEach(
        function (button) {
            if (
                button.dataset
                    .dashboardLogoutInitialized ===
                "true"
            ) {
                return;
            }

            button.dataset
                .dashboardLogoutInitialized =
                "true";

            button.addEventListener(
                "click",
                async function (
                    event
                ) {
                    event.preventDefault();

                    try {
                        if (
                            typeof logoutUser ===
                            "function"
                        ) {
                            await logoutUser();

                            return;
                        }

                        if (
                            window.Auth &&
                            typeof window
                                .Auth
                                .logout ===
                            "function"
                        ) {
                            await window.Auth.logout();

                            return;
                        }

                        if (
                            typeof logout ===
                            "function"
                        ) {
                            await logout();

                            return;
                        }

                        localStorage.removeItem(
                            "school_management_token"
                        );

                        localStorage.removeItem(
                            "school_management_user"
                        );

                        window.location.href =
                            "/pages/login.html";
                    } catch (
                        error
                    ) {
                        console.error(
                            "Logout error:",
                            error
                        );

                        localStorage.removeItem(
                            "school_management_token"
                        );

                        localStorage.removeItem(
                            "school_management_user"
                        );

                        window.location.href =
                            "/pages/login.html";
                    }
                }
            );
        }
    );
}

/*
|--------------------------------------------------------------------------
| DASHBOARD REFRESH
|--------------------------------------------------------------------------
*/

function setupRefreshButton() {
    const refreshButton =
        document.getElementById(
            "refreshDashboard"
        );

    if (!refreshButton) {
        return;
    }

    if (
        refreshButton.dataset
            .dashboardRefreshInitialized ===
        "true"
    ) {
        return;
    }

    refreshButton.dataset
        .dashboardRefreshInitialized =
        "true";

    refreshButton.addEventListener(
        "click",
        async function () {
            const icon =
                refreshButton.querySelector(
                    "i"
                );

            refreshButton.disabled =
                true;

            if (icon) {
                icon.classList.add(
                    "spin"
                );
            }

            try {
                await Promise.allSettled([
                    loadDashboardData(),
                    loadRecentStudents(),
                    loadRecentPayments(),
                    loadCurrentUser()
                ]);
            } catch (error) {
                console.error(
                    "Dashboard refresh error:",
                    error
                );
            } finally {
                refreshButton.disabled =
                    false;

                if (icon) {
                    icon.classList.remove(
                        "spin"
                    );
                }
            }
        }
    );
}

/*
|--------------------------------------------------------------------------
| QUICK ACTIONS
|--------------------------------------------------------------------------
*/

function setupQuickActions() {
    const quickActions =
        document.querySelectorAll(
            ".quick-action[data-action], [data-quick-action], [data-action]"
        );

    quickActions.forEach(
        function (button) {
            if (
                button.dataset
                    .quickActionInitialized ===
                "true"
            ) {
                return;
            }

            button.dataset
                .quickActionInitialized =
                "true";

            button.addEventListener(
                "click",
                function (
                    event
                ) {
                    event.preventDefault();
                    event.stopPropagation();

                    const action =
                        String(
                            button
                                .dataset
                                .action ||
                                button
                                    .dataset
                                    .quickAction ||
                                ""
                        )
                            .trim()
                            .toLowerCase()
                            .replace(
                                /_/g,
                                "-"
                            );

                    navigateQuickAction(
                        action
                    );
                }
            );

            button.style.cursor =
                "pointer";
        }
    );
}

/*
|--------------------------------------------------------------------------
| QUICK ACTION ROUTES
|--------------------------------------------------------------------------
*/

function navigateQuickAction(
    action
) {
    const normalizedAction =
        String(
            action || ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /_/g,
                "-"
            );

    const routes = {
        "add-student":
            "/pages/student-form.html",

        "new-student":
            "/pages/student-form.html",

        "student-form":
            "/pages/student-form.html",

        students:
            "/pages/students.html",

        "view-students":
            "/pages/students.html",

        "add-staff":
            "/pages/staff-form.html",

        "new-staff":
            "/pages/staff-form.html",

        "staff-form":
            "/pages/staff-form.html",

        staff:
            "/pages/staff.html",

        "view-staff":
            "/pages/staff.html",

        "add-guardian":
            "/pages/guardian-form.html",

        "new-guardian":
            "/pages/guardian-form.html",

        "guardian-form":
            "/pages/guardian-form.html",

        guardians:
            "/pages/guardians.html",

        "view-guardians":
            "/pages/guardians.html",

        "add-class":
            "/pages/class-form.html",

        "new-class":
            "/pages/class-form.html",

        "class-form":
            "/pages/class-form.html",

        classes:
            "/pages/classes.html",

        "view-classes":
            "/pages/classes.html",

        "add-class-arm":
            "/pages/class-arm-form.html",

        "new-class-arm":
            "/pages/class-arm-form.html",

        "class-arms":
            "/pages/class-arms.html",

        "add-subject":
            "/pages/subject-form.html",

        "new-subject":
            "/pages/subject-form.html",

        "subject-form":
            "/pages/subject-form.html",

        subjects:
            "/pages/subjects.html",

        "view-subjects":
            "/pages/subjects.html",

        "add-department":
            "/pages/department-form.html",

        "new-department":
            "/pages/department-form.html",

        "department-form":
            "/pages/department-form.html",

        departments:
            "/pages/departments.html",

        "academic-sessions":
            "/pages/academic-sessions.html",

        "academic-session":
            "/pages/academic-sessions.html",

        "academic-session-form":
            "/pages/academic-session-form.html",

        sessions:
            "/pages/academic-sessions.html",

        session:
            "/pages/academic-sessions.html",

        terms:
            "/pages/terms.html",

        term:
            "/pages/terms.html",

        attendance:
            "/pages/attendance.html",

        "mark-attendance":
            "/pages/attendance.html",

        results:
            "/pages/results.html",

        "add-result":
            "/pages/results.html",

        "new-result":
            "/pages/results.html",

        fees:
            "/pages/fees.html",

        fee:
            "/pages/fees.html",

        payments:
            "/pages/fees.html",

        "add-payment":
            "/pages/fees.html",

        documents:
            "/pages/documents.html",

        reports:
            "/pages/reports.html",

        notifications:
            "/pages/notifications.html",

        announcements:
            "/pages/announcements.html",

        users:
            "/pages/users.html",

        roles:
            "/pages/roles.html",

        permissions:
            "/pages/permissions.html",

        profile:
            "/pages/profile.html",

        settings:
            "/pages/settings.html",

        dashboard:
            "/pages/dashboard.html"
    };

    const target =
        routes[
            normalizedAction
        ];

    if (!target) {
        console.warn(
            "Dashboard Quick Action has no configured route:",
            action
        );

        return;
    }

    window.location.href =
        target;
}

/*
|--------------------------------------------------------------------------
| GLOBAL DASHBOARD FUNCTIONS
|--------------------------------------------------------------------------
*/

window.loadDashboardData =
    loadDashboardData;

window.loadRecentStudents =
    loadRecentStudents;

window.loadRecentPayments =
    loadRecentPayments;

window.loadCurrentUser =
    loadCurrentUser;

window.setupQuickActions =
    setupQuickActions;

window.navigateQuickAction =
    navigateQuickAction;