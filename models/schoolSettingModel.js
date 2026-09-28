"use strict";

const { query } = require("../config/database");

/*
===============================================================================
 SCHOOL SETTINGS MODEL
===============================================================================

Database table:
    school_settings

Purpose:
    Stores one configuration record for each school.

Settings include:
    - grading system
    - pass mark
    - notification preferences
    - strong password requirement
    - session timeout

IMPORTANT:
    schoolId must always come from the authenticated user's school context.
===============================================================================
*/

const DEFAULT_SETTINGS = {
    gradingSystem: "standard_nigerian",
    passMark: 40,

    notifyFees: true,
    notifyResults: true,
    notifyAttendance: true,
    notifyAnnouncements: true,

    requireStrongPassword: true,

    sessionTimeoutMinutes: 30
};


/*
===============================================================================
 VALIDATION
===============================================================================
*/

function requireSchoolId(schoolId) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    return schoolId;
}


function normalizeGradingSystem(value) {

    const gradingSystem =
        String(
            value ?? DEFAULT_SETTINGS.gradingSystem
        )
            .trim()
            .toLowerCase();

    if (
        gradingSystem !== "standard_nigerian" &&
        gradingSystem !== "custom"
    ) {
        throw new Error(
            "Grading system must be either standard_nigerian or custom."
        );
    }

    return gradingSystem;
}


function normalizePassMark(value) {

    const passMark =
        Number(
            value ?? DEFAULT_SETTINGS.passMark
        );

    if (!Number.isFinite(passMark)) {
        throw new Error(
            "Pass mark must be a valid number."
        );
    }

    if (passMark < 0 || passMark > 100) {
        throw new Error(
            "Pass mark must be between 0 and 100."
        );
    }

    return passMark;
}


function normalizeBoolean(
    value,
    defaultValue
) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (
        value === "true" ||
        value === "1" ||
        value === 1
    ) {
        return true;
    }

    if (
        value === "false" ||
        value === "0" ||
        value === 0
    ) {
        return false;
    }

    throw new Error(
        "Boolean setting contains an invalid value."
    );
}


function normalizeSessionTimeout(value) {

    const minutes =
        Number(
            value ??
            DEFAULT_SETTINGS.sessionTimeoutMinutes
        );

    if (
        !Number.isInteger(minutes)
    ) {
        throw new Error(
            "Session timeout must be a whole number of minutes."
        );
    }

    if (
        minutes < 5 ||
        minutes > 1440
    ) {
        throw new Error(
            "Session timeout must be between 5 and 1440 minutes."
        );
    }

    return minutes;
}


/*
===============================================================================
 FORMAT DATABASE ROW
===============================================================================
*/

function formatSettings(row) {

    if (!row) {
        return null;
    }

    return {
        id: row.id,
        schoolId: row.school_id,

        gradingSystem: row.grading_system,
        passMark: Number(row.pass_mark),

        notifyFees: row.notify_fees,
        notifyResults: row.notify_results,
        notifyAttendance: row.notify_attendance,
        notifyAnnouncements: row.notify_announcements,

        requireStrongPassword:
            row.require_strong_password,

        sessionTimeoutMinutes:
            row.session_timeout_minutes,

        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


/*
===============================================================================
 FIND SETTINGS
===============================================================================
*/

async function findSchoolSettings(
    schoolId
) {

    const validSchoolId =
        requireSchoolId(schoolId);

    const result =
        await query(
            `
            SELECT
                id,
                school_id,
                grading_system,
                pass_mark,
                notify_fees,
                notify_results,
                notify_attendance,
                notify_announcements,
                require_strong_password,
                session_timeout_minutes,
                created_at,
                updated_at
            FROM school_settings
            WHERE school_id = $1
            LIMIT 1
            `,
            [
                validSchoolId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return null;
    }

    return formatSettings(
        result.rows[0]
    );
}


/*
===============================================================================
 GET OR CREATE SETTINGS
===============================================================================
*/

async function getOrCreateSchoolSettings(
    schoolId
) {

    const validSchoolId =
        requireSchoolId(schoolId);

    const existing =
        await findSchoolSettings(
            validSchoolId
        );

    if (existing) {
        return existing;
    }

    const result =
        await query(
            `
            INSERT INTO school_settings (
                school_id,
                grading_system,
                pass_mark,
                notify_fees,
                notify_results,
                notify_attendance,
                notify_announcements,
                require_strong_password,
                session_timeout_minutes
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            ON CONFLICT (school_id)
            DO UPDATE SET
                school_id = EXCLUDED.school_id
            RETURNING
                id,
                school_id,
                grading_system,
                pass_mark,
                notify_fees,
                notify_results,
                notify_attendance,
                notify_announcements,
                require_strong_password,
                session_timeout_minutes,
                created_at,
                updated_at
            `,
            [
                validSchoolId,
                DEFAULT_SETTINGS.gradingSystem,
                DEFAULT_SETTINGS.passMark,
                DEFAULT_SETTINGS.notifyFees,
                DEFAULT_SETTINGS.notifyResults,
                DEFAULT_SETTINGS.notifyAttendance,
                DEFAULT_SETTINGS.notifyAnnouncements,
                DEFAULT_SETTINGS.requireStrongPassword,
                DEFAULT_SETTINGS.sessionTimeoutMinutes
            ]
        );

    return formatSettings(
        result.rows[0]
    );
}


/*
===============================================================================
 UPDATE SETTINGS
===============================================================================
*/

async function updateSchoolSettings(
    schoolId,
    data = {}
) {

    const validSchoolId =
        requireSchoolId(schoolId);

    const current =
        await getOrCreateSchoolSettings(
            validSchoolId
        );

    const gradingSystem =
        normalizeGradingSystem(
            data.gradingSystem ??
            current.gradingSystem
        );

    const passMark =
        normalizePassMark(
            data.passMark ??
            current.passMark
        );

    const notifyFees =
        normalizeBoolean(
            data.notifyFees,
            current.notifyFees
        );

    const notifyResults =
        normalizeBoolean(
            data.notifyResults,
            current.notifyResults
        );

    const notifyAttendance =
        normalizeBoolean(
            data.notifyAttendance,
            current.notifyAttendance
        );

    const notifyAnnouncements =
        normalizeBoolean(
            data.notifyAnnouncements,
            current.notifyAnnouncements
        );

    const requireStrongPassword =
        normalizeBoolean(
            data.requireStrongPassword,
            current.requireStrongPassword
        );

    const sessionTimeoutMinutes =
        normalizeSessionTimeout(
            data.sessionTimeoutMinutes ??
            current.sessionTimeoutMinutes
        );

    const result =
        await query(
            `
            UPDATE school_settings
            SET
                grading_system = $1,
                pass_mark = $2,
                notify_fees = $3,
                notify_results = $4,
                notify_attendance = $5,
                notify_announcements = $6,
                require_strong_password = $7,
                session_timeout_minutes = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE school_id = $9
            RETURNING
                id,
                school_id,
                grading_system,
                pass_mark,
                notify_fees,
                notify_results,
                notify_attendance,
                notify_announcements,
                require_strong_password,
                session_timeout_minutes,
                created_at,
                updated_at
            `,
            [
                gradingSystem,
                passMark,
                notifyFees,
                notifyResults,
                notifyAttendance,
                notifyAnnouncements,
                requireStrongPassword,
                sessionTimeoutMinutes,
                validSchoolId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        throw new Error(
            "School settings could not be updated."
        );
    }

    return formatSettings(
        result.rows[0]
    );
}


/*
===============================================================================
 RESET SETTINGS
===============================================================================
*/

async function resetSchoolSettings(
    schoolId
) {

    const validSchoolId =
        requireSchoolId(schoolId);

    const result =
        await query(
            `
            INSERT INTO school_settings (
                school_id,
                grading_system,
                pass_mark,
                notify_fees,
                notify_results,
                notify_attendance,
                notify_announcements,
                require_strong_password,
                session_timeout_minutes
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            ON CONFLICT (school_id)
            DO UPDATE SET
                grading_system = EXCLUDED.grading_system,
                pass_mark = EXCLUDED.pass_mark,
                notify_fees = EXCLUDED.notify_fees,
                notify_results = EXCLUDED.notify_results,
                notify_attendance = EXCLUDED.notify_attendance,
                notify_announcements = EXCLUDED.notify_announcements,
                require_strong_password =
                    EXCLUDED.require_strong_password,
                session_timeout_minutes =
                    EXCLUDED.session_timeout_minutes,
                updated_at = CURRENT_TIMESTAMP
            RETURNING
                id,
                school_id,
                grading_system,
                pass_mark,
                notify_fees,
                notify_results,
                notify_attendance,
                notify_announcements,
                require_strong_password,
                session_timeout_minutes,
                created_at,
                updated_at
            `,
            [
                validSchoolId,
                DEFAULT_SETTINGS.gradingSystem,
                DEFAULT_SETTINGS.passMark,
                DEFAULT_SETTINGS.notifyFees,
                DEFAULT_SETTINGS.notifyResults,
                DEFAULT_SETTINGS.notifyAttendance,
                DEFAULT_SETTINGS.notifyAnnouncements,
                DEFAULT_SETTINGS.requireStrongPassword,
                DEFAULT_SETTINGS.sessionTimeoutMinutes
            ]
        );

    return formatSettings(
        result.rows[0]
    );
}


/*
===============================================================================
 EXPORT
===============================================================================
*/

module.exports = {

    DEFAULT_SETTINGS,

    findSchoolSettings,

    getOrCreateSchoolSettings,

    updateSchoolSettings,

    resetSchoolSettings

};