"use strict";

/*
|--------------------------------------------------------------------------
| ROLE MIDDLEWARE
|--------------------------------------------------------------------------
|
| Handles authentication-related authorization checks.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| REQUIRE ROLE
|--------------------------------------------------------------------------
*/

function requireRole(...allowedRoles) {

    return function (req, res, next) {

        try {

            if (!req.user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authentication required."

                });

            }


            const userRole =
                req.user.roleName ||
                req.user.role_name;


            if (!userRole) {

                return res.status(403).json({

                    success: false,

                    message:
                        "User role is not available."

                });

            }


            const normalizedUserRole =
                String(userRole)
                    .trim()
                    .toLowerCase();


            const normalizedAllowedRoles =
                allowedRoles.map(
                    role =>
                        String(role)
                            .trim()
                            .toLowerCase()
                );


            if (
                !normalizedAllowedRoles.includes(
                    normalizedUserRole
                )
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You do not have permission to perform this action."

                });

            }


            next();


        } catch (error) {

            console.error(
                "Role middleware error:",
                error.message
            );


            return res.status(500).json({

                success: false,

                message:
                    "Authorization service error."

            });

        }

    };

}


/*
|--------------------------------------------------------------------------
| ADMINISTRATOR ONLY
|--------------------------------------------------------------------------
|
| Allows only administrator-type accounts.
|
|--------------------------------------------------------------------------
*/

const administratorOnly =
    requireRole(
        "administrator",
        "admin",
        "school administrator",
        "school_admin"
    );


/*
|--------------------------------------------------------------------------
| REQUIRE SCHOOL CONTEXT
|--------------------------------------------------------------------------
|
| Ensures the authenticated user belongs to a school.
|
|--------------------------------------------------------------------------
*/

function requireSchoolContext(req, res, next) {

    try {

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }


        const schoolId =
            req.user.schoolId ||
            req.user.school_id;


        if (!schoolId) {

            return res.status(403).json({

                success: false,

                message:
                    "School context is required."

            });

        }


        req.schoolId = schoolId;

        next();


    } catch (error) {

        console.error(
            "School context middleware error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "School context service error."

        });

    }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    requireRole,

    administratorOnly,

    requireSchoolContext

};