"use strict";

const userModel = require("../models/userModel");

const {
    hashPassword,
    comparePassword
} = require("../utils/passwordUtils");

function getAuthenticatedUserId(req) {
    return (
        req.user?.userId ||
        req.user?.id ||
        req.user?.user_id ||
        null
    );
}

function getAuthenticatedSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        null
    );
}

function getRequestedUserId(req) {
    return (
        req.params?.id ||
        req.params?.userId ||
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

function normalizeEmail(value) {
    const email =
        normalizeText(value);

    return email
        ? email.toLowerCase()
        : "";
}

function buildSafeUser(user) {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        schoolId: user.school_id,
        roleId: user.role_id,
        roleName: user.role_name || null,
        firstName: user.first_name,
        middleName: user.middle_name || null,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        username: user.username,
        profilePhotoUrl:
            user.profile_photo_url || null,
        isActive: user.is_active,
        lastLoginAt:
            user.last_login_at || null,
        schoolName:
            user.school_name || null,
        schoolCode:
            user.school_code || null,
        createdAt:
            user.created_at || null,
        updatedAt:
            user.updated_at || null
    };
}

function ensureAuthenticatedUser(req) {
    const userId =
        getAuthenticatedUserId(req);

    if (!userId) {
        const error = new Error(
            "Authenticated user not found."
        );

        error.statusCode = 401;

        throw error;
    }

    return userId;
}

function ensureAuthenticatedSchool(req) {
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

function ensureSameSchool(
    user,
    schoolId
) {
    if (!user) {
        const error = new Error(
            "User not found."
        );

        error.statusCode = 404;

        throw error;
    }

    if (
        !schoolId ||
        !user.school_id ||
        String(user.school_id) !==
            String(schoolId)
    ) {
        const error = new Error(
            "You do not have access to this user."
        );

        error.statusCode = 403;

        throw error;
    }
}

async function createUser(
    req,
    res,
    next
) {
    try {
        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        const {
            roleId,
            role_id,
            username,
            email,
            password,
            firstName,
            first_name,
            middleName,
            middle_name,
            lastName,
            last_name,
            phone,
            profilePhotoUrl,
            profile_photo_url,
            isActive,
            is_active
        } = req.body || {};

        const finalRoleId =
            roleId || role_id;

        const finalUsername =
            normalizeText(username);

        const finalEmail =
            normalizeEmail(email);

        const finalPassword =
            typeof password === "string"
                ? password
                : "";

        const finalFirstName =
            normalizeText(
                firstName || first_name
            );

        const finalMiddleName =
            normalizeText(
                middleName || middle_name
            );

        const finalLastName =
            normalizeText(
                lastName || last_name
            );

        const finalPhone =
            normalizeText(phone);

        if (!finalRoleId) {
            const error = new Error(
                "Role ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!finalUsername) {
            const error = new Error(
                "Username is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!finalEmail) {
            const error = new Error(
                "Email is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!finalPassword) {
            const error = new Error(
                "Password is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!finalFirstName) {
            const error = new Error(
                "First name is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!finalLastName) {
            const error = new Error(
                "Last name is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (finalPassword.length < 8) {
            const error = new Error(
                "Password must be at least 8 characters."
            );

            error.statusCode = 400;

            return next(error);
        }

        const usernameExists =
            await userModel.usernameExists(
                finalUsername,
                null,
                schoolId
            );

        if (usernameExists) {
            const error = new Error(
                "Username already exists in this school."
            );

            error.statusCode = 409;

            return next(error);
        }

        const emailExists =
            await userModel.emailExists(
                finalEmail,
                null,
                schoolId
            );

        if (emailExists) {
            const error = new Error(
                "Email already exists in this school."
            );

            error.statusCode = 409;

            return next(error);
        }

        const passwordHash =
            await hashPassword(
                finalPassword
            );

        const user =
            await userModel.createUser({
                schoolId,
                roleId: finalRoleId,
                username: finalUsername,
                email: finalEmail,
                passwordHash,
                firstName:
                    finalFirstName,
                middleName:
                    finalMiddleName || null,
                lastName:
                    finalLastName,
                phone:
                    finalPhone || null,
                profilePhotoUrl:
                    normalizeText(
                        profilePhotoUrl ||
                        profile_photo_url
                    ) || null,
                isActive:
                    isActive !== undefined
                        ? Boolean(isActive)
                        : is_active !== undefined
                            ? Boolean(is_active)
                            : true
            });

        return res.status(201).json({
            success: true,
            message:
                "User created successfully.",
            data:
                buildSafeUser(user)
        });
    } catch (error) {
        console.error(
            "Create user error:",
            error
        );

        return next(error);
    }
}

async function getUsers(
    req,
    res,
    next
) {
    try {
        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        const users =
            await userModel.findUsersBySchool(
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
            "Get users error:",
            error
        );

        return next(error);
    }
}

async function getUserById(
    req,
    res,
    next
) {
    try {
        const userId =
            getRequestedUserId(
                req
            );

        if (!userId) {
            const error = new Error(
                "User ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        const user =
            await userModel.findUserById(
                userId
            );

        if (!user) {
            const error = new Error(
                "User not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        ensureSameSchool(
            user,
            schoolId
        );

        return res.status(200).json({
            success: true,
            data:
                buildSafeUser(user)
        });
    } catch (error) {
        console.error(
            "Get user by ID error:",
            error
        );

        return next(error);
    }
}

async function getCurrentUser(
    req,
    res,
    next
) {
    try {
        const userId =
            ensureAuthenticatedUser(
                req
            );

        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        const user =
            await userModel.findUserById(
                userId
            );

        if (!user) {
            const error = new Error(
                "User not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        ensureSameSchool(
            user,
            schoolId
        );

        return res.status(200).json({
            success: true,
            data:
                buildSafeUser(user)
        });
    } catch (error) {
        console.error(
            "Get current user error:",
            error
        );

        return next(error);
    }
}

async function updateUser(
    req,
    res,
    next
) {
    try {
        const userId =
            getRequestedUserId(
                req
            );

        if (!userId) {
            const error = new Error(
                "User ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        const existingUser =
            await userModel.findUserById(
                userId
            );

        if (!existingUser) {
            const error = new Error(
                "User not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        ensureSameSchool(
            existingUser,
            schoolId
        );

        const {
            firstName,
            first_name,
            middleName,
            middle_name,
            lastName,
            last_name,
            email,
            phone,
            profilePhotoUrl,
            profile_photo_url
        } = req.body || {};

        const finalFirstName =
            normalizeText(
                firstName || first_name
            );

        const finalMiddleName =
            normalizeText(
                middleName || middle_name
            );

        const finalLastName =
            normalizeText(
                lastName || last_name
            );

        const finalEmail =
            normalizeEmail(email);

        const finalPhone =
            normalizeText(phone);

        if (!finalFirstName) {
            const error = new Error(
                "First name is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!finalLastName) {
            const error = new Error(
                "Last name is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!finalEmail) {
            const error = new Error(
                "Email is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const emailExists =
            await userModel.emailExists(
                finalEmail,
                userId,
                schoolId
            );

        if (emailExists) {
            const error = new Error(
                "Email already belongs to another user in this school."
            );

            error.statusCode = 409;

            return next(error);
        }

        const updatedUser =
            await userModel.updateUserProfile(
                userId,
                {
                    firstName:
                        finalFirstName,
                    middleName:
                        finalMiddleName || null,
                    lastName:
                        finalLastName,
                    email:
                        finalEmail,
                    phone:
                        finalPhone || null,
                    profilePhotoUrl:
                        normalizeText(
                            profilePhotoUrl ||
                            profile_photo_url
                        ) || null
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "User updated successfully.",
            data:
                buildSafeUser(
                    updatedUser
                )
        });
    } catch (error) {
        console.error(
            "Update user error:",
            error
        );

        return next(error);
    }
}

async function changePassword(
    req,
    res,
    next
) {
    try {
        const requestedUserId =
            getRequestedUserId(
                req
            );

        if (!requestedUserId) {
            const error = new Error(
                "User ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const authenticatedUserId =
            ensureAuthenticatedUser(
                req
            );

        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        const existingUser =
            await userModel.findUserById(
                requestedUserId
            );

        if (!existingUser) {
            const error = new Error(
                "User not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        ensureSameSchool(
            existingUser,
            schoolId
        );

        if (
            String(
                requestedUserId
            ) !==
            String(
                authenticatedUserId
            )
        ) {
            const error = new Error(
                "You can only change your own password."
            );

            error.statusCode = 403;

            return next(error);
        }

        const {
            currentPassword,
            current_password,
            newPassword,
            new_password
        } = req.body || {};

        const oldPassword =
            typeof currentPassword ===
                "string"
                ? currentPassword
                : typeof current_password ===
                    "string"
                    ? current_password
                    : "";

        const passwordToSet =
            typeof newPassword ===
                "string"
                ? newPassword
                : typeof new_password ===
                    "string"
                    ? new_password
                    : "";

        if (!oldPassword) {
            const error = new Error(
                "Current password is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (!passwordToSet) {
            const error = new Error(
                "New password is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (passwordToSet.length < 8) {
            const error = new Error(
                "New password must be at least 8 characters."
            );

            error.statusCode = 400;

            return next(error);
        }

        const passwordMatches =
            await comparePassword(
                oldPassword,
                existingUser.password_hash
            );

        if (!passwordMatches) {
            const error = new Error(
                "Current password is incorrect."
            );

            error.statusCode = 401;

            return next(error);
        }

        const newPasswordHash =
            await hashPassword(
                passwordToSet
            );

        const updated =
            await userModel.updatePassword(
                requestedUserId,
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

        return next(error);
    }
}

async function activateUser(
    req,
    res,
    next
) {
    try {
        const userId =
            getRequestedUserId(
                req
            );

        if (!userId) {
            const error = new Error(
                "User ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        const user =
            await userModel.findUserById(
                userId
            );

        if (!user) {
            const error = new Error(
                "User not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        ensureSameSchool(
            user,
            schoolId
        );

        const updated =
            await userModel.activateUser(
                userId
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

        return next(error);
    }
}

async function deactivateUser(
    req,
    res,
    next
) {
    try {
        const userId =
            getRequestedUserId(
                req
            );

        if (!userId) {
            const error = new Error(
                "User ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const authenticatedUserId =
            ensureAuthenticatedUser(
                req
            );

        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        if (
            String(userId) ===
            String(authenticatedUserId)
        ) {
            const error = new Error(
                "You cannot deactivate your own account."
            );

            error.statusCode = 400;

            return next(error);
        }

        const user =
            await userModel.findUserById(
                userId
            );

        if (!user) {
            const error = new Error(
                "User not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        ensureSameSchool(
            user,
            schoolId
        );

        const updated =
            await userModel.deactivateUser(
                userId
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

        return next(error);
    }
}

async function deleteUser(
    req,
    res,
    next
) {
    try {
        const userId =
            getRequestedUserId(
                req
            );

        if (!userId) {
            const error = new Error(
                "User ID is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const authenticatedUserId =
            ensureAuthenticatedUser(
                req
            );

        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        if (
            String(userId) ===
            String(authenticatedUserId)
        ) {
            const error = new Error(
                "You cannot delete your own account."
            );

            error.statusCode = 400;

            return next(error);
        }

        const user =
            await userModel.findUserById(
                userId
            );

        if (!user) {
            const error = new Error(
                "User not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        ensureSameSchool(
            user,
            schoolId
        );

        const deleted =
            await userModel.deleteUser(
                userId
            );

        return res.status(200).json({
            success: true,
            message:
                "User deleted successfully.",
            data:
                buildSafeUser(
                    deleted
                )
        });
    } catch (error) {
        console.error(
            "Delete user error:",
            error
        );

        return next(error);
    }
}

async function updateLastLogin(
    req,
    res,
    next
) {
    try {
        const userId =
            ensureAuthenticatedUser(
                req
            );

        const schoolId =
            ensureAuthenticatedSchool(
                req
            );

        const user =
            await userModel.findUserById(
                userId
            );

        if (!user) {
            const error = new Error(
                "User not found."
            );

            error.statusCode = 404;

            return next(error);
        }

        ensureSameSchool(
            user,
            schoolId
        );

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

        return next(error);
    }
}

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