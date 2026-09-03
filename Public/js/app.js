```javascript
/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| APP.JS
|--------------------------------------------------------------------------
| Global frontend application functionality.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    const App = {

        init() {
            this.setupNavigation();
            this.setupSidebar();
            this.setupUserMenu();
            this.setupAlerts();
            this.setupModals();
            this.setupGlobalActions();
            this.highlightCurrentPage();
        },

        setupNavigation() {
            document.addEventListener("click", function (event) {
                const link = event.target.closest("[data-page]");

                if (!link) return;

                const page = link.getAttribute("data-page");

                if (!page) return;

                event.preventDefault();
                window.location.href = page;
            });
        },

        setupSidebar() {
            const sidebar =
                document.querySelector(".sms-sidebar") ||
                document.querySelector(".sidebar");

            const overlay =
                document.querySelector(".sidebar-overlay");

            const menuButton =
                document.querySelector(".mobile-menu-button") ||
                document.querySelector(".sidebar-toggle");

            if (!sidebar) return;

            const openSidebar = () => {
                sidebar.classList.add("active");

                if (overlay) {
                    overlay.classList.add("active");
                }

                document.body.classList.add("sidebar-open");
            };

            const closeSidebar = () => {
                sidebar.classList.remove("active");

                if (overlay) {
                    overlay.classList.remove("active");
                }

                document.body.classList.remove("sidebar-open");
            };

            if (menuButton) {
                menuButton.addEventListener("click", function () {
                    if (sidebar.classList.contains("active")) {
                        closeSidebar();
                    } else {
                        openSidebar();
                    }
                });
            }

            if (overlay) {
                overlay.addEventListener("click", closeSidebar);
            }

            document.addEventListener("keydown", function (event) {
                if (event.key === "Escape") {
                    closeSidebar();
                }
            });

            sidebar.addEventListener("click", function (event) {
                const link = event.target.closest("a");

                if (
                    link &&
                    window.innerWidth <= 768
                ) {
                    closeSidebar();
                }
            });
        },

        setupUserMenu() {
            const buttons =
                document.querySelectorAll(
                    "[data-user-menu-toggle]"
                );

            buttons.forEach(function (button) {
                button.addEventListener("click", function (event) {
                    event.stopPropagation();

                    const selector =
                        button.getAttribute(
                            "data-user-menu-toggle"
                        );

                    const menu =
                        document.querySelector(selector);

                    if (!menu) return;

                    menu.classList.toggle("active");
                });
            });

            document.addEventListener("click", function () {
                document
                    .querySelectorAll(
                        ".user-menu.active"
                    )
                    .forEach(function (menu) {
                        menu.classList.remove("active");
                    });
            });
        },

        setupAlerts() {
            document.addEventListener("click", function (event) {
                const closeButton =
                    event.target.closest(
                        "[data-close-alert]"
                    );

                if (!closeButton) return;

                const alert =
                    closeButton.closest(".alert");

                if (alert) {
                    alert.remove();
                }
            });
        },

        setupModals() {
            document.addEventListener("click", function (event) {
                const openButton =
                    event.target.closest("[data-modal]");

                if (openButton) {
                    const selector =
                        openButton.getAttribute("data-modal");

                    if (!selector) return;

                    const modal =
                        document.querySelector(selector);

                    if (modal) {
                        App.openModal(modal);
                    }

                    return;
                }

                const closeButton =
                    event.target.closest(
                        "[data-close-modal]"
                    );

                if (closeButton) {
                    const modal =
                        closeButton.closest(
                            ".modal-overlay, .modal"
                        );

                    if (modal) {
                        App.closeModal(modal);
                    }

                    return;
                }

                if (
                    event.target.classList.contains(
                        "modal-overlay"
                    )
                ) {
                    App.closeModal(event.target);
                }
            });

            document.addEventListener("keydown", function (event) {
                if (event.key !== "Escape") return;

                document
                    .querySelectorAll(
                        ".modal-overlay.active, .modal.active"
                    )
                    .forEach(function (modal) {
                        App.closeModal(modal);
                    });
            });
        },

        openModal(modal) {
            if (!modal) return;

            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");

            document.body.classList.add("modal-open");
        },

        closeModal(modal) {
            if (!modal) return;

            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");

            if (
                !document.querySelector(
                    ".modal-overlay.active, .modal.active"
                )
            ) {
                document.body.classList.remove("modal-open");
            }
        },

        setupGlobalActions() {
            document.addEventListener("click", function (event) {

                const logoutButton =
                    event.target.closest(
                        "[data-action='logout']"
                    );

                if (logoutButton) {
                    event.preventDefault();

                    if (
                        typeof window.logout ===
                        "function"
                    ) {
                        window.logout();
                    }

                    return;
                }

                const backButton =
                    event.target.closest(
                        "[data-action='back']"
                    );

                if (backButton) {
                    event.preventDefault();
                    window.history.back();
                    return;
                }

                const printButton =
                    event.target.closest(
                        "[data-action='print']"
                    );

                if (printButton) {
                    event.preventDefault();
                    window.print();
                }
            });
        },

        highlightCurrentPage() {
            const currentPath =
                window.location.pathname
                    .split("/")
                    .pop()
                    .toLowerCase();

            document
                .querySelectorAll(
                    ".sms-sidebar a, .sidebar a, .nav-link"
                )
                .forEach(function (link) {

                    const href =
                        link.getAttribute("href");

                    if (!href) return;

                    const linkPath =
                        href
                            .split("/")
                            .pop()
                            .split("?")[0]
                            .split("#")[0]
                            .toLowerCase();

                    link.classList.remove("active");

                    if (
                        linkPath &&
                        linkPath === currentPath
                    ) {
                        link.classList.add("active");
                    }
                });
        },

        showLoading(element) {
            if (!element) return;

            element.innerHTML = `
                <div class="loading-state">
                    <div class="students-loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
        },

        showEmpty(
            element,
            message = "No records found."
        ) {
            if (!element) return;

            element.innerHTML = `
                <div class="empty-state">
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `;
        },

        escapeHtml(value) {
            if (
                value === null ||
                value === undefined
            ) {
                return "";
            }

            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },

        formatCurrency(
            amount,
            currency = "NGN"
        ) {
            const value =
                Number(amount) || 0;

            try {
                return new Intl.NumberFormat(
                    "en-NG",
                    {
                        style: "currency",
                        currency,
                        minimumFractionDigits: 2
                    }
                ).format(value);
            } catch (error) {
                return `${currency} ${value.toFixed(2)}`;
            }
        },

        formatDate(date) {
            if (!date) return "";

            const parsed = new Date(date);

            if (
                Number.isNaN(
                    parsed.getTime()
                )
            ) {
                return "";
            }

            return parsed.toLocaleDateString(
                "en-NG",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );
        },

        getInitials(name) {
            if (!name) return "";

            return String(name)
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(function (word) {
                    return word
                        .charAt(0)
                        .toUpperCase();
                })
                .join("");
        },

        debounce(
            callback,
            delay = 300
        ) {
            let timer;

            return function (...args) {
                clearTimeout(timer);

                timer = setTimeout(
                    () => callback.apply(
                        this,
                        args
                    ),
                    delay
                );
            };
        }
    };

    window.App = App;

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            function () {
                App.init();
            },
            { once: true }
        );
    } else {
        App.init();
    }

})();
```
