"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    findUserForLogin,
    updateLastLogin
} = require("../models/userModel");


/*
|--------------------------------------------------------------------------
| AUTHENTICATION CONFIGURATION
|--------------------------------------------------------------------------
*/

function getJwtSecret() {

    const secret = process.env.JWT_SECRET;

    if (!secret) {

        throw new Error(
            "JWT_SECRET is not configured in .env"
        );

    }

    return secret;

}


function getJwtExpiresIn() {

    return process.env.JWT_EXPIRES_IN || "1d";

}


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

async function login(req, res, next) {

    try {

        const {
            identifier,
            password
        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | VALIDATE REQUEST
        |--------------------------------------------------------------------------
        */

        if (
            typeof identifier !== "string" ||
            !identifier.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Username or email is required."

            });

        }


        if (
            typeof password !== "string" ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Password is required."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | FIND USER
        |--------------------------------------------------------------------------
        */

        const user =
            await findUserForLogin(
                identifier.trim()
            );


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username/email or password."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | CHECK USER ACCOUNT
        |--------------------------------------------------------------------------
        */

        if (user.is_active !== true) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account has been deactivated."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | CHECK SCHOOL
        |--------------------------------------------------------------------------
        */

        if (
            user.school_status &&
            String(user.school_status)
                .trim()
                .toLowerCase() !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This school's account is not active."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | CHECK PASSWORD HASH
        |--------------------------------------------------------------------------
        */

        if (!user.password_hash) {

            console.error(
                "User authentication data is missing a password hash."
            );

            return res.status(500).json({

                success: false,

                message:
                    "User authentication data is incomplete."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | VERIFY PASSWORD
        |--------------------------------------------------------------------------
        */

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password_hash
            );


        if (!passwordMatches) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username/email or password."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE LAST LOGIN
        |--------------------------------------------------------------------------
        */

        await updateLastLogin(
            user.id
        );


        /*
        |--------------------------------------------------------------------------
        | GET JWT SECRET
        |--------------------------------------------------------------------------
        */

        let jwtSecret;

        try {

            jwtSecret =
                getJwtSecret();

        } catch (error) {

            console.error(
                error.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Authentication service is not configured."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | JWT PAYLOAD
        |--------------------------------------------------------------------------
        */

        const payload = {

            id:
                user.id,

            schoolId:
                user.school_id,

            roleId:
                user.role_id,

            roleName:
                user.role_name,

            username:
                user.username,

            email:
                user.email

        };


        /*
        |--------------------------------------------------------------------------
        | CREATE TOKEN
        |--------------------------------------------------------------------------
        */

        const token =
            jwt.sign(
                payload,
                jwtSecret,
                {
                    expiresIn:
                        getJwtExpiresIn()
                }
            );


        /*
        |--------------------------------------------------------------------------
        | SAFE USER RESPONSE
        |--------------------------------------------------------------------------
        */

        const safeUser = {

            id:
                user.id,

            schoolId:
                user.school_id,

            roleId:
                user.role_id,

            roleName:
                user.role_name,

            username:
                user.username,

            email:
                user.email,

            firstName:
                user.first_name,

            lastName:
                user.last_name,

            phone:
                user.phone,

            isActive:
                user.is_active,

            lastLoginAt:
                user.last_login_at,

            schoolName:
                user.school_name,

            schoolCode:
                user.school_code

        };


        /*
        |--------------------------------------------------------------------------
        | LOGIN SUCCESS
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token,

            user:
                safeUser

        });


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/

async function getCurrentUser(
    req,
    res,
    next
) {

    try {

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        return res.status(200).json({

            success: true,

            user: {

                id:
                    req.user.id,

                schoolId:
                    req.user.schoolId,

                roleId:
                    req.user.roleId,

                roleName:
                    req.user.roleName,

                username:
                    req.user.username,

                email:
                    req.user.email

            }

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
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {

    login,

    getCurrentUser

};
