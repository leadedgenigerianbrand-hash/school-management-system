"use strict";

const roleModel = require("../models/roleModel");

function getAuthenticatedSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        null
    );
}

function getRequestedRoleId(req) {
    return (
        req.params?.id ||
        req.params?.roleId ||
        null
    );
}

function normalizeText(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}

function getRoleName(req) {
    return normalizeText(
        req.body?.roleName ||
        req.body?.role_name
    );
}

function getDescription(req) {
    const value =
        req.body?.description;

    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const description =
        normalizeText(value);

    return description || null;
}

function ensureSchoolContext(req) {
    const schoolId =
        getAuthenticatedSchoolId(req);

    if (!schoolId) {
        const error = new Error(
            "Authenticated school context is required."
        );

        error.statusCode = 403;

        throw error;
    }

    return schoolId;
}

function buildSafeRole(role) {
    if (!role) {
        return null;
    }

    return {
        id: role.id,
        roleName:
            role.role_name ||
            role.roleName ||
            null,
        description:
            role.description || null,
        permissionCount:
            role.permission_count !== undefined
                ? Number(
                    role.permission_count
                )
                : undefined,
        userCount:
            role.user_count !== undefined
                ? Number(
                    role.user_count
                )
                : undefined,
        createdAt:
            role.created_at ||
            role.createdAt ||
            null
    };
}

function buildSafePermission(
    permission
) {
    if (!permission) {
        return null;
    }

    return {
        id: permission.id,
        permissionName:
            permission.permission_name ||
            permission.permissionName ||
            null,
        description:
            permission.description ||
            null,
        createdAt:
            permission.created_at ||
            permission.createdAt ||
            null
    };
}

function buildSafeUser(user) {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        username:
            user.username || null,
        email:
            user.email || null,
        roleId:
            user.role_id ||
            user.roleId ||
            null,
        schoolId:
            user.school_id ||
            user.schoolId ||
            null,
        firstName:
            user.first_name ||
            user.firstName ||
            null,
        middleName:
            user.middle_name ||
            user.middleName ||
            null,
        lastName:
            user.last_name ||
            user.lastName ||
            null,
        phone:
            user.phone || null,
        profilePhotoUrl:
            user.profile_photo_url ||
            user.profilePhotoUrl ||
            null,
        isActive:
            user.is_active !== undefined
                ? user.is_active
                : user.isActive
    };
}

async function createRole(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const roleName =
            getRoleName(req);

        const description =
            getDescription(req);

        if (!roleName) {
            const error = new Error(
                "Role name is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const exists =
            await roleModel.roleExists(
                roleName
            );

        if (exists) {
            const error = new Error(
                "A role with this name already exists."
            );

            error.statusCode = 409;

            return next(error);
        }

        const role =
            await roleModel.createRole({
                roleName,
                description
            });

        return res.status(201).json({
            success: true,
            message:
                "Role created successfully.",
            data:
                buildSafeRole(role)
        });
    } catch (error) {
        console.error(
            "Create role error:",
            error
        );

        return next(error);
    }
}

async function getRoles(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const roles =
            await roleModel.findRoles();

        return res.status(200).json({
            success: true,
            data:
                roles.map(
                    buildSafeRole
                )
        });
    } catch (error) {
        console.error(
            "Get roles error:",
            error
        );

        return next(error);
    }
}

async function getRoleById(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const roleId =
            getRequestedRoleId(req);

        if (!roleId) {
            const error = new Error(
                "Role ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const role =
            await roleModel.findRoleById(
                roleId
            );

        if (!role) {
            const error = new Error(
                "Role not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            data:
                buildSafeRole(role)
        });
    } catch (error) {
        console.error(
            "Get role by ID error:",
            error
        );

        return next(error);
    }
}

async function updateRole(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const roleId =
            getRequestedRoleId(req);

        if (!roleId) {
            const error = new Error(
                "Role ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const existingRole =
            await roleModel.findRoleById(
                roleId
            );

        if (!existingRole) {
            const error = new Error(
                "Role not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        const suppliedRoleName =
            getRoleName(req);

        const roleName =
            suppliedRoleName ||
            existingRole.role_name;

        const description =
            req.body?.description !==
            undefined
                ? getDescription(req)
                : existingRole.description;

        const duplicate =
            await roleModel.roleExists(
                roleName,
                roleId
            );

        if (duplicate) {
            const error = new Error(
                "A role with this name already exists."
            );

            error.statusCode = 409;

            return next(error);
        }

        const updatedRole =
            await roleModel.updateRole(
                roleId,
                {
                    roleName,
                    description
                }
            );

        if (!updatedRole) {
            const error = new Error(
                "Role could not be updated."
            );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            message:
                "Role updated successfully.",
            data:
                buildSafeRole(
                    updatedRole
                )
        });
    } catch (error) {
        console.error(
            "Update role error:",
            error
        );

        return next(error);
    }
}

async function deleteRole(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const roleId =
            getRequestedRoleId(req);

        if (!roleId) {
            const error = new Error(
                "Role ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const existingRole =
            await roleModel.findRoleById(
                roleId
            );

        if (!existingRole) {
            const error = new Error(
                "Role not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        const roleUsers =
            await roleModel.getRoleUsers(
                roleId
            );

        if (
            roleUsers.length > 0
        ) {
            const error = new Error(
                "This role cannot be deleted because it is assigned to one or more users."
            );

            error.statusCode = 409;

            return next(error);
        }

        const permissions =
            await roleModel.getRolePermissions(
                roleId
            );

        if (
            permissions.length > 0
        ) {
            const error = new Error(
                "This role cannot be deleted while permissions are assigned to it."
            );

            error.statusCode = 409;

            return next(error);
        }

        const deletedRole =
            await roleModel.deleteRole(
                roleId
            );

        if (!deletedRole) {
            const error = new Error(
                "Role could not be deleted."
            );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            message:
                "Role deleted successfully.",
            data:
                buildSafeRole(
                    deletedRole
                )
        });
    } catch (error) {
        console.error(
            "Delete role error:",
            error
        );

        return next(error);
    }
}

async function searchRoles(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const searchTerm =
            normalizeText(
                req.query?.q ||
                req.query?.search
            );

        const roles =
            await roleModel.findRoles();

        const filteredRoles =
            searchTerm
                ? roles.filter(
                    function (role) {
                        const roleName =
                            normalizeText(
                                role.role_name
                            ).toLowerCase();

                        const description =
                            normalizeText(
                                role.description
                            ).toLowerCase();

                        const term =
                            searchTerm.toLowerCase();

                        return (
                            roleName.includes(
                                term
                            ) ||
                            description.includes(
                                term
                            )
                        );
                    }
                )
                : roles;

        return res.status(200).json({
            success: true,
            data:
                filteredRoles.map(
                    buildSafeRole
                )
        });
    } catch (error) {
        console.error(
            "Search roles error:",
            error
        );

        return next(error);
    }
}

async function getRolePermissions(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const roleId =
            getRequestedRoleId(req);

        if (!roleId) {
            const error = new Error(
                "Role ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const role =
            await roleModel.findRoleById(
                roleId
            );

        if (!role) {
            const error = new Error(
                "Role not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        const permissions =
            await roleModel.getRolePermissions(
                roleId
            );

        return res.status(200).json({
            success: true,
            data:
                permissions.map(
                    buildSafePermission
                )
        });
    } catch (error) {
        console.error(
            "Get role permissions error:",
            error
        );

        return next(error);
    }
}

async function assignPermission(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const roleId =
            getRequestedRoleId(req);

        const permissionId =
            req.body?.permissionId ||
            req.body?.permission_id;

        if (!roleId) {
            const error = new Error(
                "Role ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!permissionId) {
            const error = new Error(
                "Permission ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const role =
            await roleModel.findRoleById(
                roleId
            );

        if (!role) {
            const error = new Error(
                "Role not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        const assigned =
            await roleModel.assignPermission(
                roleId,
                permissionId
            );

        return res.status(200).json({
            success: true,
            message:
                assigned
                    ? "Permission assigned successfully."
                    : "Permission is already assigned to this role.",
            data:
                assigned || null
        });
    } catch (error) {
        console.error(
            "Assign permission error:",
            error
        );

        return next(error);
    }
}

async function removePermission(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const roleId =
            getRequestedRoleId(req);

        const permissionId =
            req.body?.permissionId ||
            req.body?.permission_id ||
            req.params?.permissionId;

        if (!roleId) {
            const error = new Error(
                "Role ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!permissionId) {
            const error = new Error(
                "Permission ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const role =
            await roleModel.findRoleById(
                roleId
            );

        if (!role) {
            const error = new Error(
                "Role not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        const removed =
            await roleModel.removePermission(
                roleId,
                permissionId
            );

        if (!removed) {
            const error = new Error(
                "Permission assignment was not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            message:
                "Permission removed successfully.",
            data: removed
        });
    } catch (error) {
        console.error(
            "Remove permission error:",
            error
        );

        return next(error);
    }
}

async function getRoleUsers(
    req,
    res,
    next
) {
    try {
        const schoolId =
            ensureSchoolContext(req);

        const roleId =
            getRequestedRoleId(req);

        if (!roleId) {
            const error = new Error(
                "Role ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const role =
            await roleModel.findRoleById(
                roleId
            );

        if (!role) {
            const error = new Error(
                "Role not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        const users =
            await roleModel.getRoleUsers(
                roleId,
                schoolId
            );

        return res.status(200).json({
            success: true,
            data:
                users.map(
                    buildSafeUser
                )
        });
    } catch (error) {
        console.error(
            "Get role users error:",
            error
        );

        return next(error);
    }
}

async function getRoleSummary(
    req,
    res,
    next
) {
    try {
        ensureSchoolContext(req);

        const summary =
            await roleModel.getRoleSummary();

        return res.status(200).json({
            success: true,
            data:
                summary.map(
                    buildSafeRole
                )
        });
    } catch (error) {
        console.error(
            "Get role summary error:",
            error
        );

        return next(error);
    }
}

async function getUserRoles(
    req,
    res,
    next
) {
    try {
        const schoolId =
            ensureSchoolContext(req);

        const userId =
            req.params?.userId ||
            req.params?.id;

        if (!userId) {
            const error = new Error(
                "User ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const roles =
            await roleModel.getUserRoles(
                userId
            );

        const filteredRoles =
            roles.filter(
                function (role) {
                    return (
                        role.school_id ===
                        undefined ||
                        role.school_id ===
                        null ||
                        String(
                            role.school_id
                        ) ===
                        String(
                            schoolId
                        )
                    );
                }
            );

        return res.status(200).json({
            success: true,
            data:
                filteredRoles.map(
                    buildSafeRole
                )
        });
    } catch (error) {
        console.error(
            "Get user roles error:",
            error
        );

        return next(error);
    }
}

module.exports = {
    createRole,
    getRoles,
    getRoleById,
    updateRole,
    deleteRole,
    searchRoles,
    getRolePermissions,
    assignPermission,
    removePermission,
    getRoleUsers,
    getRoleSummary,
    getUserRoles
};