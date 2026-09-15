"use strict";

const { query } = require("../config/database");

function requireRole(...allowedRoles) {
    return function (req, res, next) {
        try {
            if (!req.user) {
                const error = new Error("Authentication required.");
                error.statusCode = 401;
                return next(error);
            }

            if (!allowedRoles.length) {
                const error = new Error(
                    "No authorized role was specified for this route."
                );
                error.statusCode = 500;
                return next(error);
            }

            const userRole =
                req.user.roleName ||
                req.user.role_name ||
                req.user.role;

            if (!userRole) {
                const error = new Error(
                    "User role information is not available."
                );
                error.statusCode = 403;
                return next(error);
            }

            const normalizedUserRole =
                String(userRole)
                    .trim()
                    .toLowerCase();

            const normalizedAllowedRoles =
                allowedRoles.map((role) =>
                    String(role)
                        .trim()
                        .toLowerCase()
                );

            if (
                !normalizedAllowedRoles.includes(
                    normalizedUserRole
                )
            ) {
                const error = new Error(
                    "You do not have permission to perform this action."
                );
                error.statusCode = 403;
                return next(error);
            }

            return next();
        } catch (error) {
            console.error(
                "Role middleware error:",
                error.message
            );

            return next(error);
        }
    };
}

function requirePermission(...requiredPermissions) {
    return async function (req, res, next) {
        try {
            if (!req.user) {
                const error = new Error("Authentication required.");
                error.statusCode = 401;
                return next(error);
            }

            if (!requiredPermissions.length) {
                const error = new Error(
                    "No permission was specified for this route."
                );
                error.statusCode = 500;
                return next(error);
            }

            const roleId =
                req.user.roleId ||
                req.user.role_id;

            if (!roleId) {
                const error = new Error(
                    "User role information is not available."
                );
                error.statusCode = 403;
                return next(error);
            }

            const normalizedPermissions =
                requiredPermissions
                    .map((permission) =>
                        String(permission)
                            .trim()
                            .toLowerCase()
                    )
                    .filter(Boolean);

            if (!normalizedPermissions.length) {
                const error = new Error(
                    "No valid permission was specified for this route."
                );
                error.statusCode = 500;
                return next(error);
            }

            const result = await query(
                `
                SELECT
                    LOWER(p.permission_name) AS permission_name
                FROM role_permissions rp
                INNER JOIN permissions p
                    ON p.id = rp.permission_id
                WHERE rp.role_id = $1
                  AND LOWER(p.permission_name) = ANY($2::text[])
                `,
                [
                    roleId,
                    normalizedPermissions
                ]
            );

            const grantedPermissions =
                result.rows.map((row) =>
                    String(row.permission_name)
                        .trim()
                        .toLowerCase()
                );

            const hasAllPermissions =
                normalizedPermissions.every(
                    (permission) =>
                        grantedPermissions.includes(
                            permission
                        )
                );

            if (!hasAllPermissions) {
                const error = new Error(
                    "You do not have permission to perform this action."
                );
                error.statusCode = 403;
                return next(error);
            }

            return next();
        } catch (error) {
            console.error(
                "Permission middleware error:",
                error.message
            );

            return next(error);
        }
    };
}

const administratorOnly =
    requireRole(
        "administrator",
        "admin",
        "school administrator",
        "school_admin"
    );

function requireSchoolContext(req, res, next) {
    try {
        if (!req.user) {
            const error = new Error("Authentication required.");
            error.statusCode = 401;
            return next(error);
        }

        const schoolId =
            req.user.schoolId ||
            req.user.school_id;

        if (!schoolId) {
            const error = new Error(
                "School context is required."
            );
            error.statusCode = 403;
            return next(error);
        }

        req.schoolId = schoolId;

        return next();
    } catch (error) {
        console.error(
            "School context middleware error:",
            error.message
        );

        return next(error);
    }
}

module.exports = {
    requireRole,
    requirePermission,
    administratorOnly,
    requireSchoolContext
};