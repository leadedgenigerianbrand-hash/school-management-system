const roleModel = require("../models/roleModel");


/*
|--------------------------------------------------------------------------
| Role Controller
|--------------------------------------------------------------------------
|
| Handles:
|
| - Create role
| - Get all roles
| - Get role by ID
| - Update role
| - Delete role
| - Search roles
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Get School ID
|--------------------------------------------------------------------------
*/

function getSchoolId(req) {

    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.body?.schoolId ||
        req.body?.school_id ||
        req.query?.schoolId
    );

}


/*
|--------------------------------------------------------------------------
| Create Role
|--------------------------------------------------------------------------
*/

async function createRole(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            roleName,
            role_name,
            description
        } = req.body;


        const name =
            roleName ||
            role_name;


        if (!name) {

            return res.status(400).json({

                success: false,

                message:
                    "Role name is required."

            });

        }


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const existing =
            await roleModel.findRoleByName(
                schoolId,
                name
            );


        if (existing) {

            return res.status(409).json({

                success: false,

                message:
                    "A role with this name already exists."

            });

        }


        const role =
            await roleModel.createRole({

                schoolId,

                roleName: name,

                description:
                    description || null

            });


        return res.status(201).json({

            success: true,

            message:
                "Role created successfully.",

            data: role

        });

    } catch (error) {

        console.error(
            "Create role error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get All Roles
|--------------------------------------------------------------------------
*/

async function getRoles(req, res, next) {

    try {

        const schoolId = getSchoolId(req);


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const roles =
            await roleModel.findRolesBySchool(
                schoolId
            );


        return res.status(200).json({

            success: true,

            data: roles

        });

    } catch (error) {

        console.error(
            "Get roles error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Role By ID
|--------------------------------------------------------------------------
*/

async function getRoleById(req, res, next) {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Role ID is required."

            });

        }


        const role =
            await roleModel.findRoleById(id);


        if (!role) {

            return res.status(404).json({

                success: false,

                message:
                    "Role not found."

            });

        }


        const schoolId =
            getSchoolId(req);


        if (
            schoolId &&
            role.school_id &&
            String(role.school_id) !==
            String(schoolId)
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Role not found."

            });

        }


        return res.status(200).json({

            success: true,

            data: role

        });

    } catch (error) {

        console.error(
            "Get role by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Update Role
|--------------------------------------------------------------------------
*/

async function updateRole(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const schoolId =
            getSchoolId(req);


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Role ID is required."

            });

        }


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const existing =
            await roleModel.findRoleById(id);


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Role not found."

            });

        }


        if (
            existing.school_id &&
            String(existing.school_id) !==
            String(schoolId)
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Role not found."

            });

        }


        const {
            roleName,
            role_name,
            description
        } = req.body;


        const name =
            roleName ||
            role_name ||
            existing.role_name;


        const updatedRole =
            await roleModel.updateRole(
                id,
                {
                    roleName: name,
                    description:
                        description !== undefined
                            ? description
                            : existing.description
                }
            );


        if (!updatedRole) {

            return res.status(404).json({

                success: false,

                message:
                    "Role could not be updated."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Role updated successfully.",

            data: updatedRole

        });

    } catch (error) {

        console.error(
            "Update role error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Delete Role
|--------------------------------------------------------------------------
*/

async function deleteRole(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const schoolId =
            getSchoolId(req);


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Role ID is required."

            });

        }


        const existing =
            await roleModel.findRoleById(id);


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Role not found."

            });

        }


        if (
            schoolId &&
            existing.school_id &&
            String(existing.school_id) !==
            String(schoolId)
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Role not found."

            });

        }


        const deletedRole =
            await roleModel.deleteRole(id);


        if (!deletedRole) {

            return res.status(404).json({

                success: false,

                message:
                    "Role could not be deleted."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Role deleted successfully.",

            data: deletedRole

        });

    } catch (error) {

        console.error(
            "Delete role error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Search Roles
|--------------------------------------------------------------------------
*/

async function searchRoles(req, res, next) {

    try {

        const schoolId =
            getSchoolId(req);


        const search =
            req.query.q ||
            req.query.search ||
            "";


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const roles =
            await roleModel.searchRoles(
                schoolId,
                search
            );


        return res.status(200).json({

            success: true,

            data: roles

        });

    } catch (error) {

        console.error(
            "Search roles error:",
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

    createRole,

    getRoles,

    getRoleById,

    updateRole,

    deleteRole,

    searchRoles

};