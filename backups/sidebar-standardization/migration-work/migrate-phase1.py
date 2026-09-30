from pathlib import Path
import re

ROOT = Path("Public/pages")
DASHBOARD = ROOT / "dashboard.html"

TARGETS = [
    "academic-levels.html",
    "academic-sessions.html",
    "attendance.html",
    "class-arms.html",
    "departments.html",
    "documents.html",
    "fees.html",
    "guardians.html",
    "permissions.html",
    "results.html",
    "roles.html",
    "settings.html",
    "student-form.html",
    "students.html",
]

def extract_dashboard_sidebar():
    text = DASHBOARD.read_text(encoding="utf-8")

    match = re.search(
        r'<aside\s+id="smsSidebar"\s+class="sms-sidebar">.*?</aside>',
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )

    if not match:
        raise RuntimeError(
            "Could not locate the Dashboard master smsSidebar."
        )

    sidebar = match.group(0)

    # The Dashboard is the master navigation.
    # Remove any page-specific active state so sidebar.js
    # can determine the active page automatically.
    sidebar = re.sub(
        r'\s+active(?=[\s"])',
        "",
        sidebar,
        flags=re.IGNORECASE,
    )

    return sidebar


def replace_sidebar(text, master_sidebar):
    pattern = re.compile(
        r'<aside\b[^>]*\bid="smsSidebar"[^>]*>.*?</aside>',
        flags=re.DOTALL | re.IGNORECASE,
    )

    if not pattern.search(text):
        # Some pages place id before class.
        pattern = re.compile(
            r'<aside\b[^>]*class="sms-sidebar"[^>]*>.*?</aside>',
            flags=re.DOTALL | re.IGNORECASE,
        )

    if not pattern.search(text):
        raise RuntimeError(
            "Could not locate an sms-sidebar <aside>."
        )

    return pattern.sub(master_sidebar, text, count=1)


def standardize_overlay(text):
    pattern = re.compile(
        r'<div\s+id="sidebarOverlay"[^>]*></div>',
        flags=re.IGNORECASE,
    )

    replacement = (
        '<div id="sidebarOverlay" class="sidebar-overlay"></div>'
    )

    if pattern.search(text):
        return pattern.sub(replacement, text, count=1)

    # Insert immediately after the sidebar if no overlay exists.
    aside_end = re.search(
        r'</aside>',
        text,
        flags=re.IGNORECASE,
    )

    if not aside_end:
        raise RuntimeError("Could not find sidebar closing tag.")

    position = aside_end.end()

    return (
        text[:position]
        + '\n\n        '
        + replacement
        + text[position:]
    )


def standardize_main(text):
    # Preserve the page's existing main classes while adding sms-main.
    pattern = re.compile(
        r'<main\s+class="([^"]*)"',
        flags=re.IGNORECASE,
    )

    match = pattern.search(text)

    if not match:
        raise RuntimeError("Could not locate the page main element.")

    classes = match.group(1).split()

    if "sms-main" not in classes:
        classes.append("sms-main")

    new_class = " ".join(classes)

    return (
        text[:match.start(1)]
        + new_class
        + text[match.end(1):]
    )


def ensure_mobile_toggle(text):
    if 'id="sidebarToggle"' in text:
        return text

    pattern = re.compile(
        r'(<main\b[^>]*>)',
        flags=re.IGNORECASE,
    )

    match = pattern.search(text)

    if not match:
        raise RuntimeError(
            "Could not locate main element for mobile menu button."
        )

    button = """
            <button
                type="button"
                id="sidebarToggle"
                class="btn btn-light border mobile-menu-button"
                aria-label="Open navigation"
                aria-expanded="false"
            >
                <i class="bi bi-list"></i>
            </button>
"""

    return (
        text[:match.end()]
        + button
        + text[match.end():]
    )


def remove_old_sidebar_scripts(text):
    """
    Remove standalone inline scripts whose primary purpose is
    controlling sidebarToggle/sidebarOverlay.

    Page-specific external JS files are untouched.
    """
    script_pattern = re.compile(
        r'<script\b[^>]*>.*?</script>',
        flags=re.DOTALL | re.IGNORECASE,
    )

    scripts = script_pattern.findall(text)

    for script in scripts:
        lower = script.lower()

        if (
            "sidebartoggle" in lower
            and "sidebaroverlay" in lower
            and (
                "classlist.add" in lower
                or "classlist.remove" in lower
                or "addeventlistener" in lower
            )
        ):
            text = text.replace(script, "", 1)

    return text


def ensure_shared_css(text):
    if '../css/sidebar.css' in text:
        return text

    marker = '</head>'

    if marker.lower() not in text.lower():
        raise RuntimeError("Could not locate </head>.")

    replacement = (
        '    <link rel="stylesheet" href="../css/sidebar.css">\n'
        '</head>'
    )

    return re.sub(
        r'</head>',
        replacement,
        text,
        count=1,
        flags=re.IGNORECASE,
    )


def ensure_shared_js(text):
    if '../js/sidebar.js' in text:
        return text

    marker = '</body>'

    if marker.lower() not in text.lower():
        raise RuntimeError("Could not locate </body>.")

    replacement = (
        '    <script src="../js/sidebar.js"></script>\n'
        '</body>'
    )

    return re.sub(
        r'</body>',
        replacement,
        text,
        count=1,
        flags=re.IGNORECASE,
    )


def process_file(filename, master_sidebar):
    path = ROOT / filename
    text = path.read_text(encoding="utf-8")

    text = replace_sidebar(text, master_sidebar)
    text = standardize_overlay(text)
    text = standardize_main(text)
    text = ensure_mobile_toggle(text)
    text = remove_old_sidebar_scripts(text)
    text = ensure_shared_css(text)
    text = ensure_shared_js(text)

    path.write_text(text, encoding="utf-8")


def main():
    master_sidebar = extract_dashboard_sidebar()

    print("=" * 46)
    print("PHASE 1 SIDEBAR MIGRATION")
    print("=" * 46)

    completed = []
    failed = []

    for filename in TARGETS:
        try:
            process_file(filename, master_sidebar)
            completed.append(filename)
            print(f"OK  {filename}")
        except Exception as error:
            failed.append((filename, str(error)))
            print(f"ERR {filename}: {error}")

    print()
    print("=" * 46)
    print(f"Completed: {len(completed)}/{len(TARGETS)}")
    print(f"Failed:   {len(failed)}/{len(TARGETS)}")
    print("=" * 46)

    if failed:
        print()
        print("FAILED FILES:")
        for filename, error in failed:
            print(f"- {filename}: {error}")
        raise SystemExit(1)

    print()
    print("PHASE 1 MIGRATION COMPLETED SUCCESSFULLY.")


if __name__ == "__main__":
    main()
