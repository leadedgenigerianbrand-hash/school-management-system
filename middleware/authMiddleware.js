"use strict";

const jwt = require("jsonwebtoken");


function getJwtSecret() {

    const secret = process.env.JWT_SECRET;

    if (!secret) {

        throw new Error(
            "JWT_SECRET is not configured in .env"
        );

    }

    return secret;
}


function authMiddleware(req, res, next) {

    try {

        const authorization =
            req.headers.authorization;


        if (
            !authorization ||
            !authorization.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        const token =
            authorization.substring(7).trim();


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token is required."

            });

        }


        const decoded =
            jwt.verify(
                token,
                getJwtSecret()
            );


        req.user = decoded;


        next();


    } catch (error) {

        console.error(
            "Authentication error:",
            error.message
        );


        if (
            error.name === "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token has expired."

            });

        }


        if (
            error.name === "JsonWebTokenError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid authentication token."

            });

        }


        return res.status(500).json({

            success: false,

            message:
                "Authentication service error."

        });

    }

}


module.exports =
    authMiddleware;