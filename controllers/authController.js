"use strict";

const {
    findUserForLogin,
    updateLastLogin
} = require("../models/userModel");

const {
    comparePassword
} = require("../utils/passwordUtils");

const {
    generateToken
} = require("../utils/tokenUtils");

function normalizeIdentifier(identifier) {
    return String(identifier)
        .trim();
}

function buildSafeUser(user) {
    return {
        id: user.id,
        schoolId: user.school_id,
        roleId: user.role_id,
        roleName: user.role_name,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        middleName: user.middle_name,
        lastName: user.last_name,
        phone: user.phone,
        profilePhotoUrl: user.profile_photo_url,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at,
        schoolName: user.school_name,
        schoolCode: user.school_code
    };
}

async function login(req, res, next) {
    try {
        const {
            identifier,
            password
        } = req.body || {};

        if (
            typeof identifier !== "string" ||
            !identifier.trim()
        ) {
            const error = new Error(
                "Username or email is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        if (
            typeof password !== "string" ||
            !password
        ) {
            const error = new Error(
                "Password is required."
            );

            error.statusCode = 400;

            return next(error);
        }

        const normalizedIdentifier =
            normalizeIdentifier(
                identifier
            );

        const user =
            await findUserForLogin(
                normalizedIdentifier
            );

        if (!user) {
            const error = new Error(
                "Invalid username/email or password."
            );

            error.statusCode = 401;

            return next(error);
        }

        if (user.is_active !== true) {
            const error = new Error(
                "Your account has been deactivated."
            );

            error.statusCode = 403;

            return next(error);
        }

        if (
            user.school_status &&
            String(user.school_status)
                .trim()
                .toLowerCase() !== "active"
        ) {
            const error = new Error(
                "This school's account is not active."
            );

            error.statusCode = 403;

            return next(error);
        }

        if (
            !user.password_hash ||
            typeof user.password_hash !== "string"
        ) {
            console.error(
                "User authentication data is missing a password hash."
            );

            const error = new Error(
                "User authentication data is incomplete."
            );

            error.statusCode = 500;

            return next(error);
        }

        const passwordMatches =
            await comparePassword(
                password,
                user.password_hash
            );

        if (!passwordMatches) {
            const error = new Error(
                "Invalid username/email or password."
            );

            error.statusCode = 401;

            return next(error);
        }

        const token =
            generateToken({
                userId: user.id,
                schoolId: user.school_id,
                roleId: user.role_id,
                roleName: user.role_name
            });

        await updateLastLogin(
            user.id
        );

        const safeUser =
            buildSafeUser(
                user
            );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: safeUser
        });
    } catch (error) {
        console.error(
            "Login error:",
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
        if (!req.user) {
            const error = new Error(
                "Authentication required."
            );

            error.statusCode = 401;

            return next(error);
        }

        return res.status(200).json({
            success: true,
            user: {
                id:
                    req.user.userId ??
                    req.user.id ??
                    null,
                schoolId:
                    req.user.schoolId ??
                    req.user.school_id ??
                    null,
                roleId:
                    req.user.roleId ??
                    req.user.role_id ??
                    null,
                roleName:
                    req.user.roleName ??
                    req.user.role_name ??
                    req.user.role ??
                    null,
                username:
                    req.user.username ??
                    null,
                email:
                    req.user.email ??
                    null
            }
        });
    } catch (error) {
        console.error(
            "Get current user error:",
            error
        );

        return next(error);
    }
}

async function logout(
    req,
    res,
    next
) {
    try {
        return res.status(200).json({
            success: true,
            message:
                "Logout successful. Please remove the authentication token from the client."
        });
    } catch (error) {
        console.error(
            "Logout error:",
            error
        );

        return next(error);
    }
}

module.exports = {
    login,
    getCurrentUser,
    logout
};