"use strict";

/* ==========================================================================
   SCHOOL MANAGEMENT SYSTEM — SHARED SIDEBAR
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const sidebar = document.getElementById("smsSidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    /* ----------------------------------------------------------------------
       SIDEBAR OPEN / CLOSE
       ---------------------------------------------------------------------- */

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove("show");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("show");
        }

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "false");
        }
    }

    function openSidebar() {
        if (sidebar) {
            sidebar.classList.add("show");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("show");
        }

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "true");
        }
    }

    /* ----------------------------------------------------------------------
       MOBILE TOGGLE
       ---------------------------------------------------------------------- */

    if (sidebarToggle) {

        sidebarToggle.addEventListener("click", function () {

            if (
                sidebar &&
                sidebar.classList.contains("show")
            ) {
                closeSidebar();
            } else {
                openSidebar();
            }

        });

    }

    /* ----------------------------------------------------------------------
       OVERLAY
       ---------------------------------------------------------------------- */

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );
    }

    /* ----------------------------------------------------------------------
       CLOSE SIDEBAR WHEN NAVIGATION LINK IS CLICKED
       ---------------------------------------------------------------------- */

    document
        .querySelectorAll(".sidebar-link")
        .forEach(function (link) {

            link.addEventListener("click", function () {
                closeSidebar();
            });

        });

    /* ----------------------------------------------------------------------
       ACTIVE NAVIGATION
       Automatically identifies the current page.
       ---------------------------------------------------------------------- */

    const currentPath = window.location.pathname
        .replace(/\/+$/, "")
        .toLowerCase();

    document
        .querySelectorAll(".sidebar-link")
        .forEach(function (link) {

            const href = link.getAttribute("href");

            if (!href) {
                return;
            }

            if (
                href.startsWith("#") ||
                href.startsWith("javascript:")
            ) {
                return;
            }

            let linkPath = href;

            try {
                linkPath = new URL(
                    href,
                    window.location.origin
                ).pathname;
            } catch (error) {
                return;
            }

            linkPath = linkPath
                .replace(/\/+$/, "")
                .toLowerCase();

            if (
                linkPath &&
                linkPath === currentPath
            ) {
                link.classList.add("active");
            }

        });

    /* ----------------------------------------------------------------------
       LOGOUT FALLBACK
       ---------------------------------------------------------------------- */

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function () {

                try {

                    if (
                        typeof logoutUser === "function"
                    ) {
                        await logoutUser();
                        return;
                    }

                    if (
                        typeof logout === "function"
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

                } catch (error) {

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

});
