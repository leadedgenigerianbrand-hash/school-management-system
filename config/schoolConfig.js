/*
|--------------------------------------------------------------------------
| School Management System Configuration
|--------------------------------------------------------------------------
|
| These are DEFAULT application settings.
|
| IMPORTANT:
| The actual school's configuration will eventually be stored in
| PostgreSQL so every school can customize its own:
|
| - Academic levels
| - Classes
| - Class arms
| - Departments
| - Terms
| - Sessions
| - Subjects
| - Result grading
|
| Therefore, these values are NOT permanent database rules.
|--------------------------------------------------------------------------
*/

const schoolConfig = {

    /*
    |--------------------------------------------------------------------------
    | Application
    |--------------------------------------------------------------------------
    */

    application: {
        name: "School Management System",
        shortName: "SMS",
        country: "Nigeria",
        currency: "NGN",
        timezone: "Africa/Lagos"
    },


    /*
    |--------------------------------------------------------------------------
    | Default Academic Structure
    |--------------------------------------------------------------------------
    |
    | These are the starting values for a new school.
    |
    | Schools can later change them from Settings.
    |--------------------------------------------------------------------------
    */

    academic: {

        levels: [
            {
                name: "JSS",
                description: "Junior Secondary School",
                order: 1
            },
            {
                name: "SS",
                description: "Senior Secondary School",
                order: 2
            }
        ],

        classes: [
            {
                name: "JSS 1",
                code: "JSS1",
                level: "JSS",
                order: 1
            },
            {
                name: "JSS 2",
                code: "JSS2",
                level: "JSS",
                order: 2
            },
            {
                name: "JSS 3",
                code: "JSS3",
                level: "JSS",
                order: 3
            },
            {
                name: "SS 1",
                code: "SS1",
                level: "SS",
                order: 4
            },
            {
                name: "SS 2",
                code: "SS2",
                level: "SS",
                order: 5
            },
            {
                name: "SS 3",
                code: "SS3",
                level: "SS",
                order: 6
            }
        ],

        /*
        |--------------------------------------------------------------------------
        | Example class arms
        |--------------------------------------------------------------------------
        |
        | A school can replace these with:
        |
        | A, B, C
        |
        | OR
        |
        | Rose, Yellow, Pink
        |
        | OR
        |
        | Science, Arts, Commercial
        |--------------------------------------------------------------------------
        */

        defaultClassArms: [
            "A",
            "B",
            "C"
        ],

        seniorClassArms: [
            "Science",
            "Arts",
            "Commercial"
        ],

        /*
        |--------------------------------------------------------------------------
        | Default Terms
        |--------------------------------------------------------------------------
        */

        terms: [
            {
                name: "First Term",
                order: 1
            },
            {
                name: "Second Term",
                order: 2
            },
            {
                name: "Third Term",
                order: 3
            }
        ]
    },


    /*
    |--------------------------------------------------------------------------
    | Student Configuration
    |--------------------------------------------------------------------------
    */

    student: {

        studentNumberPrefix: "STU",

        admissionNumberPrefix: "ADM",

        defaultNationality: "Nigerian",

        statuses: [
            "Active",
            "Inactive",
            "Graduated",
            "Withdrawn",
            "Expelled",
            "Transferred"
        ],

        genders: [
            "Male",
            "Female"
        ]
    },


    /*
    |--------------------------------------------------------------------------
    | Staff Roles
    |--------------------------------------------------------------------------
    |
    | These are the initial roles requested for the system.
    |--------------------------------------------------------------------------
    */

    staffRoles: [
        {
            name: "Administrator",
            description:
                "Full access to the school management system."
        },

        {
            name: "Admissions Officer",
            description:
                "Manages admissions and student registration."
        },

        {
            name: "Data Officer",
            description:
                "Manages student records and school data."
        },

        {
            name: "Examination Officer",
            description:
                "Manages examinations, subjects and student results."
        },

        {
            name: "Account Officer",
            description:
                "Manages school fees, payments and receipts."
        }
    ],


    /*
    |--------------------------------------------------------------------------
    | Default Result Grading
    |--------------------------------------------------------------------------
    |
    | These are examples.
    |
    | The actual grading system will eventually be configurable from
    | the Administrator settings.
    |--------------------------------------------------------------------------
    */

    grading: [
        {
            grade: "A1",
            minimum: 75,
            maximum: 100,
            remark: "Excellent",
            gradePoint: 1
        },

        {
            grade: "B2",
            minimum: 70,
            maximum: 74.99,
            remark: "Very Good",
            gradePoint: 2
        },

        {
            grade: "B3",
            minimum: 65,
            maximum: 69.99,
            remark: "Good",
            gradePoint: 3
        },

        {
            grade: "C4",
            minimum: 60,
            maximum: 64.99,
            remark: "Credit",
            gradePoint: 4
        },

        {
            grade: "C5",
            minimum: 55,
            maximum: 59.99,
            remark: "Credit",
            gradePoint: 5
        },

        {
            grade: "C6",
            minimum: 50,
            maximum: 54.99,
            remark: "Credit",
            gradePoint: 6
        },

        {
            grade: "D7",
            minimum: 45,
            maximum: 49.99,
            remark: "Pass",
            gradePoint: 7
        },

        {
            grade: "E8",
            minimum: 40,
            maximum: 44.99,
            remark: "Pass",
            gradePoint: 8
        },

        {
            grade: "F9",
            minimum: 0,
            maximum: 39.99,
            remark: "Fail",
            gradePoint: 9
        }
    ],


    /*
    |--------------------------------------------------------------------------
    | Default Attendance Statuses
    |--------------------------------------------------------------------------
    */

    attendance: {
        statuses: [
            "Present",
            "Absent",
            "Late",
            "Excused"
        ]
    },


    /*
    |--------------------------------------------------------------------------
    | Payment Configuration
    |--------------------------------------------------------------------------
    */

    payments: {

        currency: "NGN",

        paymentMethods: [
            "Cash",
            "Bank Transfer",
            "POS",
            "Card",
            "Online Payment",
            "Other"
        ]
    },


    /*
    |--------------------------------------------------------------------------
    | File Upload Configuration
    |--------------------------------------------------------------------------
    */

    uploads: {

        studentPhotoDirectory: "uploads/students",

        staffPhotoDirectory: "uploads/staff",

        documentDirectory: "uploads/documents",

        maximumFileSizeMB: 5,

        allowedImageTypes: [
            "image/jpeg",
            "image/png",
            "image/webp"
        ],

        allowedDocumentTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png"
        ]
    }

};


/*
|--------------------------------------------------------------------------
| Export Configuration
|--------------------------------------------------------------------------
*/

module.exports = schoolConfig;