const permissionModel = require("../models/permissionModel");


/*
|--------------------------------------------------------------------------
| Permission Controller
|--------------------------------------------------------------------------
|
| Handles:
|
| - Create permission
| - Get all permissions
| - Get permission by ID
| - Get permission by name
| - Update permission
| - Delete permission
| - Search permissions
| - Get permissions by module
| - Get permission modules
| - Get roles using a permission
| - Check if permission exists
| - Count permissions
| - Permission summary
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Permission
|--------------------------------------------------------------------------
|
| POST /api/permissions
|
*/

async function createPermission(req, res, next) {

    try {

        const {
            name,
            description,
            module
        } = req.body;


        if (!name || !name.trim()) {

            return res.status(400).json({

                success: false,

                message:
                    "Permission name is required."

            });

        }


        const exists =
            await permissionModel.permissionExists(
                name.trim()
            );


        if (exists) {

            return res.status(409).json({

                success: false,

                message:
                    "A permission with this name already exists."

            });

        }


        const permission =
            await permissionModel.createPermission({

                name: name.trim(),

                description:
                    description || null,

                module:
                    module || null

            });


        return res.status(201).json({

            success: true,

            message:
                "Permission created successfully.",

            data:
                permission

        });

    } catch (error) {

        console.error(
            "Create permission error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get All Permissions
|--------------------------------------------------------------------------
|
| GET /api/permissions
|
*/

async function getPermissions(req, res, next) {

    try {

        const {
            module
        } = req.query;


        const permissions =
            await permissionModel.findPermissions({

                module:
                    module || null

            });


        return res.status(200).json({

            success: true,

            count:
                permissions.length,

            data:
                permissions

        });

    } catch (error) {

        console.error(
            "Get permissions error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Permission By ID
|--------------------------------------------------------------------------
|
| GET /api/permissions/:id
|
*/

async function getPermissionById(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const permission =
            await permissionModel.findPermissionById(
                id
            );


        if (!permission) {

            return res.status(404).json({

                success: false,

                message:
                    "Permission not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                permission

        });

    } catch (error) {

        console.error(
            "Get permission by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Permission By Name
|--------------------------------------------------------------------------
|
| GET /api/permissions/name/:name
|
*/

async function getPermissionByName(req, res, next) {

    try {

        const {
            name
        } = req.params;


        const permission =
            await permissionModel.findPermissionByName(
                name
            );


        if (!permission) {

            return res.status(404).json({

                success: false,

                message:
                    "Permission not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                permission

        });

    } catch (error) {

        console.error(
            "Get permission by name error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Update Permission
|--------------------------------------------------------------------------
|
| PUT /api/permissions/:id
|
*/

async function updatePermission(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const {
            name,
            description,
            module
        } = req.body;


        if (!name || !name.trim()) {

            return res.status(400).json({

                success: false,

                message:
                    "Permission name is required."

            });

        }


        const existing =
            await permissionModel.findPermissionById(
                id
            );


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Permission not found."

            });

        }


        const duplicate =
            await permissionModel.findPermissionByName(
                name.trim()
            );


        if (
            duplicate &&
            String(duplicate.id) !== String(id)
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "A permission with this name already exists."

            });

        }


        const permission =
            await permissionModel.updatePermission(

                id,

                {

                    name:
                        name.trim(),

                    description:
                        description || null,

                    module:
                        module || null

                }

            );


        if (!permission) {

            return res.status(404).json({

                success: false,

                message:
                    "Permission not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Permission updated successfully.",

            data:
                permission

        });

    } catch (error) {

        console.error(
            "Update permission error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Delete Permission
|--------------------------------------------------------------------------
|
| DELETE /api/permissions/:id
|
*/

async function deletePermission(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const permission =
            await permissionModel.deletePermission(
                id
            );


        if (!permission) {

            return res.status(404).json({

                success: false,

                message:
                    "Permission not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Permission deleted successfully.",

            data:
                permission

        });

    } catch (error) {

        console.error(
            "Delete permission error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Search Permissions
|--------------------------------------------------------------------------
|
| GET /api/permissions/search?q=
|
*/

async function searchPermissions(req, res, next) {

    try {

        const searchTerm =
            String(
                req.query.q ||
                req.query.search ||
                ""
            ).trim();


        if (!searchTerm) {

            return res.status(400).json({

                success: false,

                message:
                    "Search term is required."

            });

        }


        const permissions =
            await permissionModel.searchPermissions(
                searchTerm
            );


        return res.status(200).json({

            success: true,

            count:
                permissions.length,

            data:
                permissions

        });

    } catch (error) {

        console.error(
            "Search permissions error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Permissions By Module
|--------------------------------------------------------------------------
|
| GET /api/permissions/module/:module
|
*/

async function getPermissionsByModule(req, res, next) {

    try {

        const {
            module
        } = req.params;


        const permissions =
            await permissionModel.getPermissionsByModule(
                module
            );


        return res.status(200).json({

            success: true,

            count:
                permissions.length,

            data:
                permissions

        });

    } catch (error) {

        console.error(
            "Get permissions by module error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Permission Modules
|--------------------------------------------------------------------------
|
| GET /api/permissions/modules
|
*/

async function getPermissionModules(req, res, next) {

    try {

        const modules =
            await permissionModel.getPermissionModules();


        return res.status(200).json({

            success: true,

            count:
                modules.length,

            data:
                modules

        });

    } catch (error) {

        console.error(
            "Get permission modules error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Roles With Permission
|--------------------------------------------------------------------------
|
| GET /api/permissions/:id/roles
|
*/

async function getPermissionRoles(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const permission =
            await permissionModel.findPermissionById(
                id
            );


        if (!permission) {

            return res.status(404).json({

                success: false,

                message:
                    "Permission not found."

            });

        }


        const roles =
            await permissionModel.getPermissionRoles(
                id
            );


        return res.status(200).json({

            success: true,

            count:
                roles.length,

            data:
                roles

        });

    } catch (error) {

        console.error(
            "Get permission roles error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Check Permission Exists
|--------------------------------------------------------------------------
|
| GET /api/permissions/check/:name
|
*/

async function checkPermissionExists(req, res, next) {

    try {

        const {
            name
        } = req.params;


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

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Count Permissions
|--------------------------------------------------------------------------
|
| GET /api/permissions/count
|
*/

async function countPermissions(req, res, next) {

    try {

        const {
            module
        } = req.query;


        const count =
            await permissionModel.countPermissions(
                module || null
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

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Permission Summary
|--------------------------------------------------------------------------
|
| GET /api/permissions/summary
|
*/

async function getPermissionSummary(req, res, next) {

    try {

        const summary =
            await permissionModel.getPermissionSummary();


        return res.status(200).json({

            success: true,

            data:
                summary

        });

    } catch (error) {

        console.error(
            "Get permission summary error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

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

    getPermissionSummary

};