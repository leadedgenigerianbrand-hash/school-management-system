"use strict";

const permissionModel =
    require("../models/permissionModel");

function getPermissionName(req) {
    return (
        req.body?.permissionName ||
        req.body?.permission_name ||
        req.body?.name ||
        null
    );
}

function normalizePermissionName(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim().toLowerCase();
}

async function createPermission(
    req,
    res,
    next
) {
    try {
        const permissionName =
            normalizePermissionName(
                getPermissionName(req)
            );

        const description =
            req.body?.description;

        if (!permissionName) {
            const error =
                new Error(
                    "Permission name is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const exists =
            await permissionModel.permissionExists(
                permissionName
            );

        if (exists) {
            const error =
                new Error(
                    "A permission with this name already exists."
                );

            error.statusCode = 409;

            return next(error);
        }

        const permission =
            await permissionModel.createPermission({
                permissionName,
                description:
                    description === undefined ||
                    description === null ||
                    String(description).trim() === ""
                        ? null
                        : String(description).trim()
            });

        return res.status(201).json({
            success: true,
            message:
                "Permission created successfully.",
            data: permission
        });
    } catch (error) {
        console.error(
            "Create permission error:",
            error
        );

        return next(error);
    }
}

async function getPermissions(
    req,
    res,
    next
) {
    try {
        const module =
            req.query?.module || null;

        const permissions =
            await permissionModel.findPermissions({
                module
            });

        return res.status(200).json({
            success: true,
            count:
                permissions.length,
            data: permissions
        });
    } catch (error) {
        console.error(
            "Get permissions error:",
            error
        );

        return next(error);
    }
}

async function getPermissionById(
    req,
    res,
    next
) {
    try {
        const { id } =
            req.params;

        if (!id) {
            const error =
                new Error(
                    "Permission ID is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const permission =
            await permissionModel.findPermissionById(
                id
            );

        if (!permission) {
            const error =
                new Error(
                    "Permission not found."
                );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            data: permission
        });
    } catch (error) {
        console.error(
            "Get permission by ID error:",
            error
        );

        return next(error);
    }
}

async function getPermissionByName(
    req,
    res,
    next
) {
    try {
        const name =
            normalizePermissionName(
                req.params?.name
            );

        if (!name) {
            const error =
                new Error(
                    "Permission name is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const permission =
            await permissionModel.findPermissionByName(
                name
            );

        if (!permission) {
            const error =
                new Error(
                    "Permission not found."
                );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            data: permission
        });
    } catch (error) {
        console.error(
            "Get permission by name error:",
            error
        );

        return next(error);
    }
}

async function updatePermission(
    req,
    res,
    next
) {
    try {
        const { id } =
            req.params;

        if (!id) {
            const error =
                new Error(
                    "Permission ID is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const existing =
            await permissionModel.findPermissionById(
                id
            );

        if (!existing) {
            const error =
                new Error(
                    "Permission not found."
                );

            error.statusCode = 404;

            return next(error);
        }

        const submittedName =
            getPermissionName(req);

        const permissionName =
            submittedName === undefined ||
            submittedName === null ||
            String(submittedName).trim() === ""
                ? existing.permission_name
                : normalizePermissionName(
                    submittedName
                );

        const description =
            req.body?.description !== undefined
                ? req.body.description
                : existing.description;

        const duplicate =
            await permissionModel.findPermissionByName(
                permissionName
            );

        if (
            duplicate &&
            String(duplicate.id) !== String(id)
        ) {
            const error =
                new Error(
                    "A permission with this name already exists."
                );

            error.statusCode = 409;

            return next(error);
        }

        const permission =
            await permissionModel.updatePermission(
                id,
                {
                    permissionName,
                    description:
                        description === undefined ||
                        description === null ||
                        String(description).trim() === ""
                            ? null
                            : String(description).trim()
                }
            );

        if (!permission) {
            const error =
                new Error(
                    "Permission could not be updated."
                );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            message:
                "Permission updated successfully.",
            data: permission
        });
    } catch (error) {
        console.error(
            "Update permission error:",
            error
        );

        return next(error);
    }
}

async function deletePermission(
    req,
    res,
    next
) {
    try {
        const { id } =
            req.params;

        if (!id) {
            const error =
                new Error(
                    "Permission ID is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const existing =
            await permissionModel.findPermissionById(
                id
            );

        if (!existing) {
            const error =
                new Error(
                    "Permission not found."
                );

            error.statusCode = 404;

            return next(error);
        }

        const usage =
            await permissionModel.getPermissionUsage(
                id
            );

        if (
            usage &&
            Number(usage.role_count) > 0
        ) {
            const error =
                new Error(
                    "This permission is assigned to one or more roles and cannot be deleted until it is removed from those roles."
                );

            error.statusCode = 409;

            return next(error);
        }

        const permission =
            await permissionModel.deletePermission(
                id
            );

        if (!permission) {
            const error =
                new Error(
                    "Permission could not be deleted."
                );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            message:
                "Permission deleted successfully.",
            data: permission
        });
    } catch (error) {
        console.error(
            "Delete permission error:",
            error
        );

        return next(error);
    }
}

async function searchPermissions(
    req,
    res,
    next
) {
    try {
        const searchTerm =
            String(
                req.query?.q ||
                req.query?.search ||
                ""
            ).trim();

        if (!searchTerm) {
            const error =
                new Error(
                    "Search term is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const permissions =
            await permissionModel.searchPermissions(
                searchTerm
            );

        return res.status(200).json({
            success: true,
            count:
                permissions.length,
            data: permissions
        });
    } catch (error) {
        console.error(
            "Search permissions error:",
            error
        );

        return next(error);
    }
}

async function getPermissionsByModule(
    req,
    res,
    next
) {
    try {
        const module =
            String(
                req.params?.module ||
                ""
            ).trim();

        if (!module) {
            const error =
                new Error(
                    "Permission module is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const permissions =
            await permissionModel.getPermissionsByModule(
                module
            );

        return res.status(200).json({
            success: true,
            count:
                permissions.length,
            data: permissions
        });
    } catch (error) {
        console.error(
            "Get permissions by module error:",
            error
        );

        return next(error);
    }
}

async function getPermissionModules(
    req,
    res,
    next
) {
    try {
        const modules =
            await permissionModel.getPermissionModules();

        return res.status(200).json({
            success: true,
            count:
                modules.length,
            data: modules
        });
    } catch (error) {
        console.error(
            "Get permission modules error:",
            error
        );

        return next(error);
    }
}

async function getPermissionRoles(
    req,
    res,
    next
) {
    try {
        const { id } =
            req.params;

        if (!id) {
            const error =
                new Error(
                    "Permission ID is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const permission =
            await permissionModel.findPermissionById(
                id
            );

        if (!permission) {
            const error =
                new Error(
                    "Permission not found."
                );

            error.statusCode = 404;

            return next(error);
        }

        const roles =
            await permissionModel.getPermissionRoles(
                id
            );

        return res.status(200).json({
            success: true,
            count:
                roles.length,
            data: roles
        });
    } catch (error) {
        console.error(
            "Get permission roles error:",
            error
        );

        return next(error);
    }
}

async function checkPermissionExists(
    req,
    res,
    next
) {
    try {
        const name =
            normalizePermissionName(
                req.params?.name
            );

        if (!name) {
            const error =
                new Error(
                    "Permission name is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const exists =
            await permissionModel.permissionExists(
                name
            );

        return res.status(200).json({
            success: true,
            exists
        });
    } catch (error) {
        console.error(
            "Check permission exists error:",
            error
        );

        return next(error);
    }
}

async function countPermissions(
    req,
    res,
    next
) {
    try {
        const module =
            req.query?.module || null;

        const count =
            await permissionModel.countPermissions(
                module
            );

        return res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error(
            "Count permissions error:",
            error
        );

        return next(error);
    }
}

async function getPermissionSummary(
    req,
    res,
    next
) {
    try {
        const summary =
            await permissionModel.getPermissionSummary();

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error(
            "Get permission summary error:",
            error
        );

        return next(error);
    }
}

async function getPermissionUsage(
    req,
    res,
    next
) {
    try {
        const { id } =
            req.params;

        if (!id) {
            const error =
                new Error(
                    "Permission ID is required."
                );

            error.statusCode = 400;

            return next(error);
        }

        const usage =
            await permissionModel.getPermissionUsage(
                id
            );

        if (!usage) {
            const error =
                new Error(
                    "Permission not found."
                );

            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            data: usage
        });
    } catch (error) {
        console.error(
            "Get permission usage error:",
            error
        );

        return next(error);
    }
}

module.exports = {
    createPermission,
    getPermissions,
    getPermissionById,
    getPermissionByName,
    updatePermission,
    deletePermission,
    searchPermissions,
    getPermissionsByModule,
    getPermissionModules,
    getPermissionRoles,
    checkPermissionExists,
    countPermissions,
    getPermissionSummary,
    getPermissionUsage
};