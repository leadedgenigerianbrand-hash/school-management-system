/*
===============================================================================
 SCHOOL MANAGEMENT SYSTEM
 SEED DATA
 Version: 1.0.0

 IMPORTANT:
 - This file creates initial/demo configuration data.
 - It does NOT create a real staff password.
 - Staff authentication will be handled securely by the application.
===============================================================================
*/


/*
===============================================================================
 1. DEMO SCHOOL
===============================================================================
*/

INSERT INTO schools (
    school_name,
    school_code,
    registration_number,
    address,
    city,
    state,
    country,
    phone,
    email,
    motto,
    school_type,
    status
)
VALUES (
    'Leadedge Model College',
    'LMC001',
    'DEMO-001',
    'Lagos, Nigeria',
    'Lagos',
    'Lagos',
    'Nigeria',
    '+2340000000000',
    'admin@leadedgecollege.local',
    'Knowledge, Character and Excellence',
    'Secondary School',
    'Active'
)
ON CONFLICT (school_code) DO NOTHING;


/*
===============================================================================
 2. ROLES
===============================================================================
*/

INSERT INTO roles (
    role_name,
    description
)
VALUES
(
    'Administrator',
    'Full access to school management system, users, settings and reports.'
),
(
    'Admissions Officer',
    'Responsible for student admission and registration activities.'
),
(
    'Data Officer',
    'Responsible for student records, data entry and student information.'
),
(
    'Examination Officer',
    'Responsible for subjects, examination setup, results and academic reports.'
),
(
    'Account Officer',
    'Responsible for school fees, payments, receipts and financial records.'
)
ON CONFLICT (role_name) DO NOTHING;


/*
===============================================================================
 3. PERMISSIONS
===============================================================================
*/

INSERT INTO permissions (
    permission_name,
    description
)
VALUES

-- Dashboard
('dashboard.view',
 'View the school dashboard.'),

-- School
('school.view',
 'View school information.'),
('school.update',
 'Update school information.'),

-- Students
('students.view',
 'View student records.'),
('students.create',
 'Create new student records.'),
('students.update',
 'Update student records.'),
('students.delete',
 'Delete student records.'),

-- Admissions
('admissions.view',
 'View admissions.'),
('admissions.create',
 'Create admissions.'),

-- Classes
('classes.view',
 'View classes and class arms.'),
('classes.create',
 'Create classes and class arms.'),
('classes.update',
 'Update classes and class arms.'),
('classes.delete',
 'Delete classes and class arms.'),

-- Subjects
('subjects.view',
 'View subjects.'),
('subjects.create',
 'Create subjects.'),
('subjects.update',
 'Update subjects.'),
('subjects.delete',
 'Delete subjects.'),

-- Academics
('academics.view',
 'View academic sessions and terms.'),
('academics.create',
 'Create academic sessions and terms.'),
('academics.update',
 'Update academic sessions and terms.'),

-- Results
('results.view',
 'View student results.'),
('results.enter',
 'Enter student results.'),
('results.update',
 'Update student results.'),
('results.publish',
 'Publish student results.'),
('results.print',
 'Print student results.'),

-- Fees
('fees.view',
 'View fee structures and student fee accounts.'),
('fees.create',
 'Create fee structures.'),
('fees.update',
 'Update fee structures.'),

-- Payments
('payments.view',
 'View student payments.'),
('payments.create',
 'Record payments.'),
('payments.update',
 'Update payment records.'),
('payments.print_receipt',
 'Print payment receipts.'),

-- Uniforms
('uniforms.view',
 'View school uniform records.'),
('uniforms.create',
 'Record uniform purchases.'),
('uniforms.update',
 'Update uniform purchase records.'),

-- Attendance
('attendance.view',
 'View student attendance.'),
('attendance.create',
 'Record attendance.'),
('attendance.update',
 'Update attendance.'),

-- Documents
('documents.view',
 'View student documents.'),
('documents.upload',
 'Upload student documents.'),
('documents.delete',
 'Delete student documents.'),

-- Staff
('staff.view',
 'View staff records.'),
('staff.create',
 'Create staff records.'),
('staff.update',
 'Update staff records.'),
('staff.delete',
 'Delete staff records.'),

-- Reports
('reports.view',
 'View reports.'),
('reports.print',
 'Print reports.'),

-- Users
('users.view',
 'View system users.'),
('users.create',
 'Create system users.'),
('users.update',
 'Update system users.'),
('users.delete',
 'Delete system users.'),

-- Settings
('settings.view',
 'View system settings.'),
('settings.update',
 'Update system settings.')

ON CONFLICT (permission_name) DO NOTHING;


/*
===============================================================================
 4. DEMO SCHOOL ID
===============================================================================
*/

DO $$
DECLARE
    school_uuid UUID;
BEGIN

    SELECT id
    INTO school_uuid
    FROM schools
    WHERE school_code = 'LMC001';

    /*
    ===========================================================================
    5. ACADEMIC LEVELS
    ===========================================================================
    */

    INSERT INTO academic_levels (
        school_id,
        level_name,
        level_order,
        description
    )
    VALUES
    (
        school_uuid,
        'JSS',
        1,
        'Junior Secondary School'
    ),
    (
        school_uuid,
        'SS',
        2,
        'Senior Secondary School'
    )
    ON CONFLICT (school_id, level_name) DO NOTHING;


    /*
    ===========================================================================
    6. ACADEMIC SESSION
    ===========================================================================
    */

    INSERT INTO academic_sessions (
        school_id,
        session_name,
        start_date,
        end_date,
        is_current,
        is_active
    )
    VALUES
    (
        school_uuid,
        '2026/2027',
        '2026-09-01',
        '2027-07-31',
        TRUE,
        TRUE
    )
    ON CONFLICT (school_id, session_name) DO NOTHING;


    /*
    ===========================================================================
    7. TERMS
    ===========================================================================
    */

    INSERT INTO terms (
        school_id,
        term_name,
        term_order,
        start_date,
        end_date,
        is_current,
        is_active
    )
    VALUES
    (
        school_uuid,
        'First Term',
        1,
        '2026-09-01',
        '2026-12-18',
        TRUE,
        TRUE
    ),
    (
        school_uuid,
        'Second Term',
        2,
        '2027-01-11',
        '2027-04-09',
        FALSE,
        TRUE
    ),
    (
        school_uuid,
        'Third Term',
        3,
        '2027-04-26',
        '2027-07-31',
        FALSE,
        TRUE
    )
    ON CONFLICT (school_id, term_name) DO NOTHING;


    /*
    ===========================================================================
    8. JSS CLASSES
    ===========================================================================
    */

    INSERT INTO classes (
        school_id,
        academic_level_id,
        class_name,
        class_code,
        class_order,
        description
    )
    SELECT
        school_uuid,
        al.id,
        class_data.class_name,
        class_data.class_code,
        class_data.class_order,
        class_data.description
    FROM academic_levels al
    CROSS JOIN (
        VALUES
        (
            'JSS 1',
            'JSS1',
            1,
            'Junior Secondary School 1'
        ),
        (
            'JSS 2',
            'JSS2',
            2,
            'Junior Secondary School 2'
        ),
        (
            'JSS 3',
            'JSS3',
            3,
            'Junior Secondary School 3'
        )
    ) AS class_data(
        class_name,
        class_code,
        class_order,
        description
    )
    WHERE al.school_id = school_uuid
      AND al.level_name = 'JSS'
    ON CONFLICT (school_id, class_name) DO NOTHING;


    /*
    ===========================================================================
    9. SS CLASSES
    ===========================================================================
    */

    INSERT INTO classes (
        school_id,
        academic_level_id,
        class_name,
        class_code,
        class_order,
        description
    )
    SELECT
        school_uuid,
        al.id,
        class_data.class_name,
        class_data.class_code,
        class_data.class_order,
        class_data.description
    FROM academic_levels al
    CROSS JOIN (
        VALUES
        (
            'SS 1',
            'SS1',
            4,
            'Senior Secondary School 1'
        ),
        (
            'SS 2',
            'SS2',
            5,
            'Senior Secondary School 2'
        ),
        (
            'SS 3',
            'SS3',
            6,
            'Senior Secondary School 3'
        )
    ) AS class_data(
        class_name,
        class_code,
        class_order,
        description
    )
    WHERE al.school_id = school_uuid
      AND al.level_name = 'SS'
    ON CONFLICT (school_id, class_name) DO NOTHING;


    /*
    ===========================================================================
    10. JSS CLASS ARMS
    ===========================================================================
    */

    INSERT INTO class_arms (
        school_id,
        class_id,
        arm_name,
        arm_code,
        description
    )
    SELECT
        school_uuid,
        c.id,
        arms.arm_name,
        arms.arm_code,
        'Default JSS class arm'
    FROM classes c
    CROSS JOIN (
        VALUES
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C')
    ) AS arms(
        arm_name,
        arm_code
    )
    WHERE c.school_id = school_uuid
      AND c.class_name IN ('JSS 1', 'JSS 2', 'JSS 3')
    ON CONFLICT (class_id, arm_name) DO NOTHING;


    /*
    ===========================================================================
    11. SS CLASS ARMS
    ===========================================================================

    These are only examples.

    The administrator will eventually be able to change them.
    ===========================================================================
    */

    INSERT INTO class_arms (
        school_id,
        class_id,
        arm_name,
        arm_code,
        description
    )
    SELECT
        school_uuid,
        c.id,
        arms.arm_name,
        arms.arm_code,
        'Default SS specialization'
    FROM classes c
    CROSS JOIN (
        VALUES
        ('Science', 'SCI'),
        ('Arts', 'ART'),
        ('Commercial', 'COM')
    ) AS arms(
        arm_name,
        arm_code
    )
    WHERE c.school_id = school_uuid
      AND c.class_name IN ('SS 1', 'SS 2', 'SS 3')
    ON CONFLICT (class_id, arm_name) DO NOTHING;


    /*
    ===========================================================================
    12. DEPARTMENTS
    ===========================================================================
    */

    INSERT INTO departments (
        school_id,
        department_name,
        department_code,
        description
    )
    VALUES
    (
        school_uuid,
        'Science',
        'SCI',
        'Science department'
    ),
    (
        school_uuid,
        'Arts',
        'ART',
        'Arts department'
    ),
    (
        school_uuid,
        'Commercial',
        'COM',
        'Commercial department'
    )
    ON CONFLICT (school_id, department_name) DO NOTHING;


    /*
    ===========================================================================
    13. SUBJECTS
    ===========================================================================
    */

    INSERT INTO subjects (
        school_id,
        subject_name,
        subject_code,
        description,
        is_compulsory
    )
    VALUES
    (
        school_uuid,
        'English Language',
        'ENG',
        'English Language',
        TRUE
    ),
    (
        school_uuid,
        'Mathematics',
        'MTH',
        'Mathematics',
        TRUE
    ),
    (
        school_uuid,
        'Basic Science',
        'BSC',
        'Basic Science',
        TRUE
    ),
    (
        school_uuid,
        'Basic Technology',
        'BTE',
        'Basic Technology',
        TRUE
    ),
    (
        school_uuid,
        'Social Studies',
        'SOS',
        'Social Studies',
        TRUE
    ),
    (
        school_uuid,
        'Civic Education',
        'CIV',
        'Civic Education',
        TRUE
    ),
    (
        school_uuid,
        'Computer Studies',
        'COM',
        'Computer Studies',
        FALSE
    ),
    (
        school_uuid,
        'Agricultural Science',
        'AGR',
        'Agricultural Science',
        FALSE
    ),
    (
        school_uuid,
        'Biology',
        'BIO',
        'Biology',
        FALSE
    ),
    (
        school_uuid,
        'Chemistry',
        'CHE',
        'Chemistry',
        FALSE
    ),
    (
        school_uuid,
        'Physics',
        'PHY',
        'Physics',
        FALSE
    ),
    (
        school_uuid,
        'Economics',
        'ECO',
        'Economics',
        FALSE
    ),
    (
        school_uuid,
        'Government',
        'GOV',
        'Government',
        FALSE
    ),
    (
        school_uuid,
        'Literature in English',
        'LIT',
        'Literature in English',
        FALSE
    ),
    (
        school_uuid,
        'Financial Accounting',
        'ACC',
        'Financial Accounting',
        FALSE
    ),
    (
        school_uuid,
        'Commerce',
        'COMR',
        'Commerce',
        FALSE
    )
    ON CONFLICT (school_id, subject_name) DO NOTHING;


    /*
    ===========================================================================
    14. RESULT GRADING SYSTEM
    ===========================================================================

    Nigerian-style example:

    75 - 100 = A1
    70 - 74  = B2
    65 - 69  = B3
    60 - 64  = C4
    55 - 59  = C5
    50 - 54  = C6
    45 - 49  = D7
    40 - 44  = E8
    0  - 39   = F9

    The administrator will eventually be able to change this.
    ===========================================================================
    */

    INSERT INTO result_settings (
        school_id,
        setting_name,
        minimum_score,
        maximum_score,
        grade,
        remark,
        grade_point
    )
    VALUES
    (
        school_uuid,
        'A1',
        75,
        100,
        'A1',
        'Excellent',
        1.00
    ),
    (
        school_uuid,
        'B2',
        70,
        74.99,
        'B2',
        'Very Good',
        2.00
    ),
    (
        school_uuid,
        'B3',
        65,
        69.99,
        'B3',
        'Good',
        3.00
    ),
    (
        school_uuid,
        'C4',
        60,
        64.99,
        'C4',
        'Credit',
        4.00
    ),
    (
        school_uuid,
        'C5',
        55,
        59.99,
        'C5',
        'Credit',
        5.00
    ),
    (
        school_uuid,
        'C6',
        50,
        54.99,
        'C6',
        'Credit',
        6.00
    ),
    (
        school_uuid,
        'D7',
        45,
        49.99,
        'D7',
        'Pass',
        7.00
    ),
    (
        school_uuid,
        'E8',
        40,
        44.99,
        'E8',
        'Pass',
        8.00
    ),
    (
        school_uuid,
        'F9',
        0,
        39.99,
        'F9',
        'Fail',
        9.00
    );

END $$;


/*
===============================================================================
 END OF SEED DATA
===============================================================================
*/