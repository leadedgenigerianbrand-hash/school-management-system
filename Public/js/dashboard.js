"use strict";

/* ==========================================================================
   SCHOOL MANAGEMENT SYSTEM
   DASHBOARD JAVASCRIPT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", initializeDashboard);

async function initializeDashboard() {
    if (
        typeof isAuthenticated === "function" &&
        !isAuthenticated()
    ) {
        return;
    }

    await Promise.allSettled([
        loadDashboardStatistics(),
        loadRecentStudents(),
        loadRecentPayments(),
        loadDashboardUser(),
        loadSchoolInformation()
    ]);

    initializeDashboardNavigation();
    initializeQuickActions();
    initializeRefreshButton();
}


/* ==========================================================================
   DASHBOARD STATISTICS
   ========================================================================== */

async function loadDashboardStatistics() {
    try {
        if (typeof apiRequest !== "function") {
            console.error("apiRequest() is not available.");
            return;
        }

        const response = await apiRequest("/dashboard", {
            method: "GET"
        });

        if (!response || response.success === false) {
            return;
        }

        const data =
            response.data ||
            response.dashboard ||
            response;

        setDashboardValue(
            ["totalStudents", "studentCount", "total-students"],
            data.totalStudents ??
            data.studentCount ??
            data.students ??
            0
        );

        setDashboardValue(
            ["totalStaff", "staffCount", "total-staff"],
            data.totalStaff ??
            data.staffCount ??
            data.staff ??
            0
        );

        setDashboardValue(
            ["totalClasses", "classCount", "total-classes"],
            data.totalClasses ??
            data.classCount ??
            data.classes ??
            0
        );

        setDashboardValue(
            ["totalSubjects", "subjectCount", "total-subjects"],
            data.totalSubjects ??
            data.subjectCount ??
            data.subjects ??
            0
        );

        setDashboardValue(
            ["totalGuardians", "guardianCount", "total-guardians"],
            data.totalGuardians ??
            data.guardianCount ??
            data.guardians ??
            0
        );

        setDashboardValue(
            ["totalFees", "feeCount", "total-fees"],
            formatCurrency(
                data.totalFees ??
                data.totalFeeAmount ??
                data.fees ??
                0
            )
        );

        setDashboardValue(
            ["outstandingFees", "totalOutstanding", "outstanding-fees"],
            formatCurrency(
                data.totalOutstanding ??
                data.outstandingFees ??
                0
            )
        );

        setDashboardValue(
            ["totalPayments", "paymentCount", "total-payments"],
            formatCurrency(
                data.totalPayments ??
                data.totalCollected ??
                data.paymentAmount ??
                0
            )
        );
    } catch (error) {
        console.error("Dashboard statistics error:", error);
    }
}


/* ==========================================================================
   RECENT STUDENTS
   ========================================================================== */

async function loadRecentStudents() {
    try {
        if (typeof apiRequest !== "function") {
            return;
        }

        const response = await apiRequest("/students?limit=5", {
            method: "GET"
        });

        if (!response || response.success === false) {
            renderRecentStudents([]);
            return;
        }

        let students = [];

        if (Array.isArray(response)) {
            students = response;
        } else if (Array.isArray(response.students)) {
            students = response.students;
        } else if (Array.isArray(response.data)) {
            students = response.data;
        } else if (Array.isArray(response.data?.students)) {
            students = response.data.students;
        }

        renderRecentStudents(students);
    } catch (error) {
        console.error("Recent students error:", error);
        renderRecentStudents([]);
    }
}

function renderRecentStudents(students) {
    const containers = document.querySelectorAll(
        "[data-recent-students]"
    );

    if (!containers.length) {
        return;
    }

    containers.forEach((container) => {
        container.innerHTML = "";

        if (!Array.isArray(students) || students.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-people"></i>
                    <p>No students found.</p>
                </div>
            `;
            return;
        }

        students.slice(0, 5).forEach((student) => {
            const row = document.createElement("div");

            row.className =
                "recent-item dashboard-student-row";

            const name = [
                student.first_name || student.firstName,
                student.middle_name || student.middleName,
                student.last_name || student.lastName
            ]
                .filter(Boolean)
                .join(" ") ||
                student.name ||
                "Unknown Student";

            const admissionNumber =
                student.admission_number ||
                student.admissionNumber ||
                student.student_number ||
                student.studentNumber ||
                "N/A";

            const gender =
                student.gender ||
                "";

            row.innerHTML = `
                <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                    <div class="recent-avatar">
                        <i class="bi bi-person-fill"></i>
                    </div>

                    <div class="recent-info">
                        <div class="recent-name">
                            ${escapeHtml(name)}
                        </div>

                        <div class="recent-meta">
                            ${escapeHtml(admissionNumber)}
                        </div>
                    </div>
                </div>

                ${
                    gender
                        ? `<span class="badge text-bg-light">
                            ${escapeHtml(gender)}
                           </span>`
                        : ""
                }
            `;

            if (student.id) {
                row.style.cursor = "pointer";

                row.addEventListener("click", () => {
                    window.location.href =
                        `/pages/student-profile.html?id=${encodeURIComponent(
                            student.id
                        )}`;
                });
            }

            container.appendChild(row);
        });
    });
}


/* ==========================================================================
   RECENT PAYMENTS
   ========================================================================== */

async function loadRecentPayments() {
    try {
        if (typeof apiRequest !== "function") {
            return;
        }

        const response = await apiRequest(
            "/fees/payments/recent",
            {
                method: "GET"
            }
        );

        if (!response || response.success === false) {
            renderRecentPayments([]);
            return;
        }

        let payments = [];

        if (Array.isArray(response)) {
            payments = response;
        } else if (Array.isArray(response.payments)) {
            payments = response.payments;
        } else if (Array.isArray(response.data)) {
            payments = response.data;
        } else if (Array.isArray(response.data?.payments)) {
            payments = response.data.payments;
        }

        renderRecentPayments(payments);
    } catch (error) {
        console.warn(
            "Recent payments unavailable:",
            error?.message || error
        );

        renderRecentPayments([]);
    }
}

function renderRecentPayments(payments) {
    const containers = document.querySelectorAll(
        "[data-recent-payments]"
    );

    if (!containers.length) {
        return;
    }

    containers.forEach((container) => {
        container.innerHTML = "";

        if (!Array.isArray(payments) || payments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-cash-stack"></i>
                    <p>No recent payments.</p>
                </div>
            `;
            return;
        }

        payments.slice(0, 5).forEach((payment) => {
            const row = document.createElement("div");

            row.className =
                "recent-item dashboard-payment-row";

            const studentName = [
                payment.first_name || payment.firstName,
                payment.last_name || payment.lastName
            ]
                .filter(Boolean)
                .join(" ") ||
                payment.student_name ||
                payment.studentName ||
                "Student";

            const amount =
                payment.amount ??
                payment.paid_amount ??
                payment.paidAmount ??
                0;

            const method =
                payment.payment_method ||
                payment.paymentMethod ||
                "Payment";

            row.innerHTML = `
                <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                    <div class="recent-avatar">
                        <i class="bi bi-cash-coin"></i>
                    </div>

                    <div class="recent-info">
                        <div class="recent-name">
                            ${escapeHtml(studentName)}
                        </div>

                        <div class="recent-meta">
                            ${escapeHtml(method)}
                        </div>
                    </div>
                </div>

                <strong class="recent-amount text-success">
                    ${formatCurrency(amount)}
                </strong>
            `;

            container.appendChild(row);
        });
    });
}


/* ==========================================================================
   CURRENT USER
   ========================================================================== */

async function loadDashboardUser() {
    try {
        if (typeof getStoredUser !== "function") {
            return;
        }

        const user = getStoredUser();

        if (
            user &&
            typeof populateAuthenticatedUser === "function"
        ) {
            populateAuthenticatedUser(user);
        }

        updateUserAvatar(user);
    } catch (error) {
        console.error("Dashboard user error:", error);
    }
}

function updateUserAvatar(user) {
    const avatar = document.getElementById("userAvatar");

    if (!avatar) {
        return;
    }

    if (!user) {
        avatar.textContent = "U";
        return;
    }

    const firstName =
        user.firstName ||
        user.first_name ||
        "";

    const lastName =
        user.lastName ||
        user.last_name ||
        "";

    let initials = "";

    if (firstName) {
        initials += firstName.charAt(0).toUpperCase();
    }

    if (lastName) {
        initials += lastName.charAt(0).toUpperCase();
    }

    if (!initials) {
        initials =
            (
                user.username ||
                user.email ||
                "U"
            )
                .charAt(0)
                .toUpperCase();
    }

    avatar.textContent = initials.slice(0, 2);
}


/* ==========================================================================
   SCHOOL INFORMATION
   ========================================================================== */

async function loadSchoolInformation() {
    try {
        if (typeof getStoredUser !== "function") {
            return;
        }

        const user = getStoredUser();

        if (!user) {
            return;
        }

        const schoolName =
            user.schoolName ||
            user.school_name ||
            user.school?.name ||
            "School Management System";

        const schoolCode =
            user.schoolCode ||
            user.school_code ||
            user.school?.code ||
            "";

        document
            .querySelectorAll("[data-school-name]")
            .forEach((element) => {
                element.textContent = schoolName;
            });

        document
            .querySelectorAll("[data-school-code]")
            .forEach((element) => {
                element.textContent = schoolCode || "—";
            });
    } catch (error) {
        console.error(
            "School information error:",
            error
        );
    }
}


/* ==========================================================================
   DASHBOARD VALUES
   ========================================================================== */

function setDashboardValue(identifiers, value) {
    identifiers.forEach((identifier) => {
        const selectors = [
            `#${identifier}`,
            `[data-dashboard="${identifier}"]`,
            `[data-stat="${identifier}"]`
        ];

        selectors.forEach((selector) => {
            document
                .querySelectorAll(selector)
                .forEach((element) => {
                    element.textContent = value;
                });
        });
    });
}


/* ==========================================================================
   CURRENCY
   ========================================================================== */

function formatCurrency(amount) {
    const numericAmount = Number(amount) || 0;

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericAmount);
}


/* ==========================================================================
   NAVIGATION
   ========================================================================== */

function initializeDashboardNavigation() {
    document
        .querySelectorAll("[data-dashboard-link]")
        .forEach((link) => {
            if (
                link.dataset.navigationInitialized === "true"
            ) {
                return;
            }

            link.dataset.navigationInitialized = "true";

            link.addEventListener("click", (event) => {
                const target =
                    link.getAttribute("href") ||
                    link.dataset.dashboardLink;

                if (!target || target === "#") {
                    return;
                }

                event.preventDefault();

                window.location.href = target;
            });
        });
}


/* ==========================================================================
   QUICK ACTIONS
   ========================================================================== */

function initializeQuickActions() {
    document
        .querySelectorAll("[data-action]")
        .forEach((element) => {
            if (
                element.dataset.actionInitialized === "true"
            ) {
                return;
            }

            element.dataset.actionInitialized = "true";

            element.addEventListener(
                "click",
                handleQuickAction
            );
        });
}

function handleQuickAction(event) {
    const action =
        event.currentTarget?.dataset?.action;

    if (!action) {
        return;
    }

    const actions = {
        "add-student":
            "/pages/student-form.html",

        students:
            "/pages/students.html",

        staff:
            "/pages/staff.html",

        classes:
            "/pages/classes.html",

        subjects:
            "/pages/subjects.html",

        attendance:
            "/pages/attendance.html",

        results:
            "/pages/results.html",

        fees:
            "/pages/fees.html",

        payments:
            "/pages/fees.html",

        guardians:
            "/pages/guardians.html",

        documents:
            "/pages/documents.html",

        settings:
            "/pages/settings.html"
    };

    const destination = actions[action];

    if (destination) {
        window.location.href = destination;
    }
}


/* ==========================================================================
   REFRESH
   ========================================================================== */

function initializeRefreshButton() {
    const buttons = document.querySelectorAll(
        "#refreshDashboard, [data-refresh-dashboard]"
    );

    buttons.forEach((button) => {
        if (
            button.dataset.refreshInitialized === "true"
        ) {
            return;
        }

        button.dataset.refreshInitialized = "true";

        button.addEventListener(
            "click",
            async (event) => {
                event.preventDefault();

                if (button.disabled) {
                    return;
                }

                button.disabled = true;

                const originalHTML =
                    button.innerHTML;

                button.innerHTML = `
                    <span
                        class="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                    ></span>
                    <span>Refreshing...</span>
                `;

                try {
                    await Promise.allSettled([
                        loadDashboardStatistics(),
                        loadRecentStudents(),
                        loadRecentPayments()
                    ]);
                } finally {
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                }
            }
        );
    });
}


/* ==========================================================================
   HTML ESCAPING
   ========================================================================== */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================================================
   GLOBAL EXPORTS
   ========================================================================== */

window.initializeDashboard =
    initializeDashboard;

window.loadDashboardStatistics =
    loadDashboardStatistics;

window.loadRecentStudents =
    loadRecentStudents;

window.loadRecentPayments =
    loadRecentPayments;

window.renderRecentStudents =
    renderRecentStudents;

window.renderRecentPayments =
    renderRecentPayments;

window.formatCurrency =
    formatCurrency;

window.handleQuickAction =
    handleQuickAction;

window.initializeRefreshButton =
    initializeRefreshButton;