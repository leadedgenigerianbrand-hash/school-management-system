from pathlib import Path
import re

BASE = Path("Public/pages")

FILES = {
    "attendance.html": {},
    "documents.html": {},
    "fees.html": {},
    "roles.html": {},
    "settings.html": {},
    "permissions.html": {},
}


def remove_duplicate_sidebar_overlays(text):
    pattern = re.compile(
        r'\s*<div\s+id="sidebarOverlay"\s+class="sidebar-overlay"\s*></div>'
        r'\s*<div\s+class="sidebar-overlay"\s+id="sidebarOverlay"\s*></div>',
        re.IGNORECASE,
    )

    text, count = pattern.subn(
        '\n\n    <div id="sidebarOverlay" class="sidebar-overlay"></div>',
        text,
        count=1,
    )

    return text, count


def remove_duplicate_sidebar_overlay_reverse(text):
    pattern = re.compile(
        r'\s*<div\s+class="sidebar-overlay"\s+id="sidebarOverlay"\s*></div>'
        r'\s*<div\s+id="sidebarOverlay"\s+class="sidebar-overlay"\s*></div>',
        re.IGNORECASE,
    )

    text, count = pattern.subn(
        '\n\n    <div id="sidebarOverlay" class="sidebar-overlay"></div>',
        text,
        count=1,
    )

    return text, count


def remove_fees_old_css(text):
    patterns = [
        r'\n\s*body\.sidebar-open\s*\{\s*overflow:\s*hidden;\s*\}',
        r'\n\s*\.sms-sidebar\.sidebar-open\s*\{\s*transform:\s*translateX\(0\);\s*\}',
        r'\n\s*\.sidebar-overlay\.sidebar-open\s*\{\s*display:\s*block;\s*\}',
    ]

    removed = 0

    for pattern in patterns:
        text, count = re.subn(
            pattern,
            "",
            text,
            flags=re.IGNORECASE,
        )
        removed += count

    return text, removed


def remove_roles_old_css(text):
    pattern = r'\n\s*body\.sidebar-open\s*\{\s*overflow:\s*hidden;\s*\}'

    text, count = re.subn(
        pattern,
        "",
        text,
        flags=re.IGNORECASE,
    )

    return text, count


def remove_settings_old_css(text):
    pattern = r'\n\s*\.sms-sidebar\.sidebar-open\s*\{\s*transform:\s*translateX\(0\);\s*\}'

    text, count = re.subn(
        pattern,
        "",
        text,
        flags=re.IGNORECASE,
    )

    return text, count


def remove_fees_old_sidebar_script(text):
    start_marker = (
        '            const sidebar =\n'
        '                document.getElementById("smsSidebar");'
    )

    start = text.find(start_marker)

    if start == -1:
        return text, 0

    end_marker = (
        '            document.addEventListener(\n'
        '                "DOMContentLoaded",'
    )

    end = text.find(end_marker, start)

    if end == -1:
        return text, 0

    block = text[start:end]

    if "sidebar.classList.add" not in block:
        return text, 0

    text = text[:start] + text[end:]

    return text, 1


def process_file(filename):
    path = BASE / filename
    text = path.read_text(encoding="utf-8")
    original = text

    changes = []

    if filename in {
        "attendance.html",
        "documents.html",
    }:
        text, count = remove_duplicate_sidebar_overlays(text)
        if count:
            changes.append(f"duplicate overlay removed: {count}")

    if filename == "fees.html":
        text, count = remove_duplicate_sidebar_overlay_reverse(text)
        if count:
            changes.append(f"duplicate overlay removed: {count}")

        text, count = remove_fees_old_css(text)
        if count:
            changes.append(f"obsolete fees sidebar CSS rules removed: {count}")

        text, count = remove_fees_old_sidebar_script(text)
        if count:
            changes.append("obsolete fees sidebar JavaScript removed")

    if filename == "roles.html":
        text, count = remove_roles_old_css(text)
        if count:
            changes.append(f"obsolete roles sidebar CSS removed: {count}")

    if filename == "settings.html":
        text, count = remove_settings_old_css(text)
        if count:
            changes.append(f"obsolete settings sidebar CSS removed: {count}")

    if text != original:
        path.write_text(text, encoding="utf-8")

    return changes


print("==============================================")
print("PHASE 1 SIDEBAR CLEANUP")
print("==============================================")

total_changes = 0

for filename in FILES:
    changes = process_file(filename)

    if changes:
        print(f"OK  {filename}")
        for change in changes:
            print(f"    - {change}")
            total_changes += 1
    else:
        print(f"NO CHANGE  {filename}")

print()
print("==============================================")
print(f"Cleanup change groups: {total_changes}")
print("==============================================")
print()
print("PHASE 1 SIDEBAR CLEANUP COMPLETED.")
