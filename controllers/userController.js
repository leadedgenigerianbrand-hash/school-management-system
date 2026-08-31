const bcrypt = require("bcryptjs");

const userModel = require("../models/userModel");

const {
    query
} = require("../config/database");


/*
|--------------------------------------------------------------------------
| User Controller
|--------------------------------------------------------------------------
|
| Handles:
|
| - Create user
| - Get all users
| - Get user by ID
| - Get current user
| - Update user profile
| - Change password
| - Activate user
| - Deactivate user
| - Delete user
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
        req.query?.schoolId ||
        null
    );

}


/*
|--------------------------------------------------------------------------
| Get Current User ID
|--------------------------------------------------------------------------
*/

function getUserId(req) {

    return (
        req.user?.id ||
        req.user?.userId ||
        req.user?.user_id ||
        null
    );

}


/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
*/

async function createUser(req, res, next) {

    try {

        const schoolId =
            getSchoolId(req);

        const {
            roleId,
            role_id,
            username,
            email,
            password,
            firstName,
            first_name,
            lastName,
            last_name,
            phone
        } = req.body;


        const finalRoleId =
            roleId || role_id;

        const finalFirstName =
            firstName || first_name;

        const finalLastName =
            lastName || last_name;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!finalRoleId) {

            return res.status(400).json({

                success: false,

                message:
                    "Role ID is required."

            });

        }


        if (!username) {

            return res.status(400).json({

                success: false,

                message:
                    "Username is required."

            });

        }


        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required."

            });

        }


        if (!password) {

            return res.status(400).json({

                success: false,

                message:
                    "Password is required."

            });

        }


        if (!finalFirstName) {

            return res.status(400).json({

                success: false,

                message:
                    "First name is required."

            });

        }


        if (!finalLastName) {

            return res.status(400).json({

                success: false,

                message:
                    "Last name is required."

            });

        }


        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 6 characters."

            });

        }


        const usernameAlreadyExists =
            await userModel.usernameExists(
                username.trim()
            );


        if (usernameAlreadyExists) {

            return res.status(409).json({

                success: false,

                message:
                    "Username already exists."

            });

        }


        const emailAlreadyExists =
            await userModel.emailExists(
                email.trim()
            );


        if (emailAlreadyExists) {

            return res.status(409).json({

                success: false,

                message:
                    "Email already exists."

            });

        }


        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );


        const user =
            await userModel.createUser({

                schoolId,

                roleId:
                    finalRoleId,

                username:
                    username.trim(),

                email:
                    email.trim().toLowerCase(),

                passwordHash,

                firstName:
                    finalFirstName.trim(),

                lastName:
                    finalLastName.trim(),

                phone:
                    phone || null

            });


        return res.status(201).json({

            success: true,

            message:
                "User created successfully.",

            data: user

        });


    } catch (error) {

        console.error(
            "Create user error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get All Users
|--------------------------------------------------------------------------
*/

async function getUsers(req, res, next) {

    try {

        const schoolId =
            getSchoolId(req);


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const users =
            await userModel.findUsersBySchool(
                schoolId
            );


        return res.status(200).json({

            success: true,

            data: users

        });


    } catch (error) {

        console.error(
            "Get users error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get User By ID
|--------------------------------------------------------------------------
*/

async function getUserById(req, res, next) {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "User ID is required."

            });

        }


        const user =
            await userModel.findUserById(
                id
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const schoolId =
            getSchoolId(req);


        if (
            schoolId &&
            String(user.school_id) !==
            String(schoolId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You do not have access to this user."

            });

        }


        return res.status(200).json({

            success: true,

            data: user

        });


    } catch (error) {

        console.error(
            "Get user by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Current User
|--------------------------------------------------------------------------
*/

async function getCurrentUser(req, res, next) {

    try {

        const userId =
            getUserId(req);


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authenticated user not found."

            });

        }


        const user =
            await userModel.findUserById(
                userId
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        return res.status(200).json({

            success: true,

            data: user

        });


    } catch (error) {

        console.error(
            "Get current user error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Update User
|--------------------------------------------------------------------------
*/

async function updateUser(req, res, next) {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "User ID is required."

            });

        }


        const existingUser =
            await userModel.findUserById(
                id
            );


        if (!existingUser) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const schoolId =
            getSchoolId(req);


        if (
            schoolId &&
            String(existingUser.school_id) !==
            String(schoolId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You do not have access to this user."

            });

        }


        const {
            firstName,
            first_name,
            lastName,
            last_name,
            email,
            phone
        } = req.body;


        const finalFirstName =
            firstName || first_name;

        const finalLastName =
            lastName || last_name;


        if (!finalFirstName) {

            return res.status(400).json({

                success: false,

                message:
                    "First name is required."

            });

        }


        if (!finalLastName) {

            return res.status(400).json({

                success: false,

                message:
                    "Last name is required."

            });

        }


        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required."

            });

        }


        const emailAlreadyExists =
            await userModel.emailExists(
                email.trim(),
                id
            );


        if (emailAlreadyExists) {

            return res.status(409).json({

                success: false,

                message:
                    "Email already belongs to another user."

            });

        }


        const updatedUser =
            await userModel.updateUserProfile(

                id,

                {

                    firstName:
                        finalFirstName.trim(),

                    lastName:
                        finalLastName.trim(),

                    email:
                        email.trim().toLowerCase(),

                    phone:
                        phone || null

                }

            );


        return res.status(200).json({

            success: true,

            message:
                "User updated successfully.",

            data: updatedUser

        });


    } catch (error) {

        console.error(
            "Update user error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
*/

async function changePassword(req, res, next) {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "User ID is required."

            });

        }


        const existingUser =
            await userModel.findUserById(
                id
            );


        if (!existingUser) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const schoolId =
            getSchoolId(req);


        if (
            schoolId &&
            String(existingUser.school_id) !==
            String(schoolId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You do not have access to this user."

            });

        }


        const {
            currentPassword,
            current_password,
            newPassword,
            new_password
        } = req.body;


        const oldPassword =
            currentPassword ||
            current_password;

        const passwordToSet =
            newPassword ||
            new_password;


        if (!oldPassword) {

            return res.status(400).json({

                success: false,

                message:
                    "Current password is required."

            });

        }


        if (!passwordToSet) {

            return res.status(400).json({

                success: false,

                message:
                    "New password is required."

            });

        }


        if (passwordToSet.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 6 characters."

            });

        }


        /*
        |------------------------------------------------------------------
        | Get password hash
        |------------------------------------------------------------------
        */

        const passwordResult =
            await query(
                `
                    SELECT
                        id,
                        password_hash

                    FROM users

                    WHERE id = $1

                    LIMIT 1
                `,
                [id]
            );


        if (
            !passwordResult.rows.length
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const passwordHash =
            passwordResult.rows[0]
                .password_hash;


        const passwordMatches =
            await bcrypt.compare(
                oldPassword,
                passwordHash
            );


        if (!passwordMatches) {

            return res.status(401).json({

                success: false,

                message:
                    "Current password is incorrect."

            });

        }


        const newPasswordHash =
            await bcrypt.hash(
                passwordToSet,
                10
            );


        const updated =
            await userModel.updatePassword(

                id,

                newPasswordHash

            );


        return res.status(200).json({

            success: true,

            message:
                "Password changed successfully.",

            data: updated

        });


    } catch (error) {

        console.error(
            "Change password error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Activate User
|--------------------------------------------------------------------------
*/

async function activateUser(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const user =
            await userModel.findUserById(
                id
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const schoolId =
            getSchoolId(req);


        if (
            schoolId &&
            String(user.school_id) !==
            String(schoolId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You do not have access to this user."

            });

        }


        const updated =
            await userModel.activateUser(
                id
            );


        return res.status(200).json({

            success: true,

            message:
                "User activated successfully.",

            data: updated

        });


    } catch (error) {

        console.error(
            "Activate user error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Deactivate User
|--------------------------------------------------------------------------
*/

async function deactivateUser(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const user =
            await userModel.findUserById(
                id
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const schoolId =
            getSchoolId(req);


        if (
            schoolId &&
            String(user.school_id) !==
            String(schoolId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You do not have access to this user."

            });

        }


        const updated =
            await userModel.deactivateUser(
                id
            );


        return res.status(200).json({

            success: true,

            message:
                "User deactivated successfully.",

            data: updated

        });


    } catch (error) {

        console.error(
            "Deactivate user error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Delete User
|--------------------------------------------------------------------------
*/

async function deleteUser(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const user =
            await userModel.findUserById(
                id
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const schoolId =
            getSchoolId(req);


        if (
            schoolId &&
            String(user.school_id) !==
            String(schoolId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You do not have access to this user."

            });

        }


        const deleted =
            await userModel.deleteUser(
                id
            );


        return res.status(200).json({

            success: true,

            message:
                "User deleted successfully.",

            data: deleted

        });


    } catch (error) {

        console.error(
            "Delete user error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Update Last Login
|--------------------------------------------------------------------------
*/

async function updateLastLogin(req, res, next) {

    try {

        const userId =
            getUserId(req);


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authenticated user not found."

            });

        }


        const updated =
            await userModel.updateLastLogin(
                userId
            );


        return res.status(200).json({

            success: true,

            data: updated

        });


    } catch (error) {

        console.error(
            "Update last login error:",
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

    createUser,

    getUsers,

    getUserById,

    getCurrentUser,

    updateUser,

    changePassword,

    activateUser,

    deactivateUser,

    deleteUser,

    updateLastLogin

};