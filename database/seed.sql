BEGIN;

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
    website,
    motto,
    principal_name,
    school_type,
    status
)
VALUES (
    'Leadedge Model College',
    'LMC001',
    'LMC/001/2026',
    'Abesan Estate',
    'Lagos',
    'Lagos',
    'Nigeria',
    '08000000000',
    'admin@leadedgecollege.local',
    'https://leadedgecollege.local',
    'Knowledge, Character and Excellence',
    'Principal',
    'Secondary School',
    'Active'
)
ON CONFLICT (school_code) DO NOTHING;

INSERT INTO roles (
    role_name,
    description
)
VALUES
(
    'Administrator',
    'Full system administrator with access to all school management functions.'
),
(
    'Principal / Head Admin',
    'School principal or head administrator with broad management access.'
),
(
    'Teacher',
    'Teacher with access to teaching, students, attendance and results.'
),
(
    'Accountant',
    'Accountant responsible for fees, payments and financial records.'
),
(
    'Secretary / Records',
    'Secretary responsible for student and school records.'
),
(
    'Student',
    'Student account with access to permitted academic information.'
),
(
    'Parent / Guardian',
    'Parent or guardian account with access to permitted student information.'
),
(
    'Admissions Officer',
    'Officer responsible for admissions and student registration.'
),
(
    'Data Officer',
    'Officer responsible for school data and student records.'
),
(
    'Examination Officer',
    'Officer responsible for examinations and academic results.'
),
(
    'Account Officer',
    'Officer responsible for account-related operations.'
)
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO permissions (
    permission_name,
    description
)
VALUES
(
    'dashboard.view',
    'View the school dashboard.'
),
(
    'school.view',
    'View school information.'
),
(
    'school.update',
    'Update school information.'
),
(
    'students.view',
    'View student records.'
),
(
    'students.create',
    'Create student records.'
),
(
    'students.update',
    'Update student records.'
),
(
    'students.delete',
    'Delete student records.'
),
(
    'admissions.view',
    'View admissions records.'
),
(
    'admissions.create',
    'Create admissions records.'
),
(
    'classes.view',
    'View classes and class arms.'
),
(
    'classes.create',
    'Create classes and class arms.'
),
(
    'classes.update',
    'Update classes and class arms.'
),
(
    'classes.delete',
    'Delete classes and class arms.'
),
(
    'subjects.view',
    'View subjects.'
),
(
    'subjects.create',
    'Create subjects.'
),
(
    'subjects.update',
    'Update subjects.'
),
(
    'subjects.delete',
    'Delete subjects.'
),
(
    'academics.view',
    'View academic sessions, terms and academic levels.'
),
(
    'academics.create',
    'Create academic sessions, terms and academic levels.'
),
(
    'academics.update',
    'Update academic sessions, terms and academic levels.'
),
(
    'academics.delete',
    'Delete academic sessions, terms and academic levels.'
),
(
    'results.view',
    'View student results.'
),
(
    'results.create',
    'Create student results.'
),
(
    'results.update',
    'Update student results.'
),
(
    'results.delete',
    'Delete student results.'
),
(
    'results.settings',
    'Manage result settings.'
),
(
    'fees.view',
    'View fee structures and student fee accounts.'
),
(
    'fees.create',
    'Create fee structures and student fee accounts.'
),
(
    'fees.update',
    'Update fee structures and student fee accounts.'
),
(
    'fees.delete',
    'Delete fee structures and student fee accounts.'
),
(
    'payments.view',
    'View payment records.'
),
(
    'payments.create',
    'Create payment records.'
),
(
    'payments.update',
    'Update payment records.'
),
(
    'payments.delete',
    'Delete payment records.'
),
(
    'uniforms.view',
    'View uniform records.'
),
(
    'uniforms.create',
    'Create uniform records.'
),
(
    'uniforms.update',
    'Update uniform records.'
),
(
    'uniforms.delete',
    'Delete uniform records.'
),
(
    'attendance.view',
    'View attendance records.'
),
(
    'attendance.create',
    'Create attendance records.'
),
(
    'attendance.update',
    'Update attendance records.'
),
(
    'attendance.delete',
    'Delete attendance records.'
),
(
    'documents.view',
    'View student documents.'
),
(
    'documents.create',
    'Upload student documents.'
),
(
    'documents.update',
    'Update student documents.'
),
(
    'documents.delete',
    'Delete student documents.'
),
(
    'staff.view',
    'View staff records.'
),
(
    'staff.create',
    'Create staff records.'
),
(
    'staff.update',
    'Update staff records.'
),
(
    'staff.delete',
    'Delete staff records.'
),
(
    'guardians.view',
    'View guardian records.'
),
(
    'guardians.create',
    'Create guardian records.'
),
(
    'guardians.update',
    'Update guardian records.'
),
(
    'guardians.delete',
    'Delete guardian records.'
),
(
    'reports.view',
    'View system reports.'
),
(
    'reports.generate',
    'Generate system reports.'
),
(
    'users.view',
    'View system users.'
),
(
    'users.create',
    'Create system users.'
),
(
    'users.update',
    'Update system users.'
),
(
    'users.delete',
    'Delete system users.'
),
(
    'users.activate',
    'Activate system users.'
),
(
    'users.deactivate',
    'Deactivate system users.'
),
(
    'settings.view',
    'View system settings.'
),
(
    'settings.update',
    'Update system settings.'
),
(
    'timetable.view',
    'View school timetable.'
),
(
    'timetable.create',
    'Create timetable entries.'
),
(
    'timetable.update',
    'Update timetable entries.'
),
(
    'timetable.delete',
    'Delete timetable entries.'
),
(
    'notifications.view',
    'View notifications.'
),
(
    'notifications.create',
    'Create notifications.'
),
(
    'notifications.update',
    'Update notifications.'
),
(
    'notifications.delete',
    'Delete notifications.'
),
(
    'announcements.view',
    'View school announcements.'
),
(
    'announcements.create',
    'Create school announcements.'
),
(
    'announcements.update',
    'Update school announcements.'
),
(
    'announcements.delete',
    'Delete school announcements.'
),
(
    'audit.view',
    'View system audit logs.'
);

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'Administrator'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'school.view',
        'school.update',
        'students.view',
        'students.create',
        'students.update',
        'students.delete',
        'admissions.view',
        'admissions.create',
        'classes.view',
        'classes.create',
        'classes.update',
        'classes.delete',
        'subjects.view',
        'subjects.create',
        'subjects.update',
        'subjects.delete',
        'academics.view',
        'academics.create',
        'academics.update',
        'academics.delete',
        'results.view',
        'results.create',
        'results.update',
        'results.delete',
        'results.settings',
        'fees.view',
        'fees.create',
        'fees.update',
        'fees.delete',
        'payments.view',
        'payments.create',
        'payments.update',
        'payments.delete',
        'uniforms.view',
        'uniforms.create',
        'uniforms.update',
        'uniforms.delete',
        'attendance.view',
        'attendance.create',
        'attendance.update',
        'attendance.delete',
        'documents.view',
        'documents.create',
        'documents.update',
        'documents.delete',
        'staff.view',
        'staff.create',
        'staff.update',
        'staff.delete',
        'guardians.view',
        'guardians.create',
        'guardians.update',
        'guardians.delete',
        'reports.view',
        'reports.generate',
        'users.view',
        'users.create',
        'users.update',
        'users.delete',
        'users.activate',
        'users.deactivate',
        'settings.view',
        'settings.update',
        'timetable.view',
        'timetable.create',
        'timetable.update',
        'timetable.delete',
        'notifications.view',
        'notifications.create',
        'notifications.update',
        'notifications.delete',
        'announcements.view',
        'announcements.create',
        'announcements.update',
        'announcements.delete',
        'audit.view'
    )
WHERE r.role_name = 'Principal / Head Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'students.view',
        'students.update',
        'classes.view',
        'subjects.view',
        'academics.view',
        'results.view',
        'results.create',
        'results.update',
        'attendance.view',
        'attendance.create',
        'attendance.update',
        'documents.view',
        'guardians.view',
        'reports.view',
        'timetable.view',
        'notifications.view',
        'announcements.view'
    )
WHERE r.role_name = 'Teacher'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'students.view',
        'fees.view',
        'fees.create',
        'fees.update',
        'fees.delete',
        'payments.view',
        'payments.create',
        'payments.update',
        'payments.delete',
        'uniforms.view',
        'uniforms.create',
        'uniforms.update',
        'uniforms.delete',
        'reports.view',
        'reports.generate',
        'guardians.view'
    )
WHERE r.role_name = 'Accountant'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'students.view',
        'students.create',
        'students.update',
        'admissions.view',
        'admissions.create',
        'classes.view',
        'subjects.view',
        'academics.view',
        'attendance.view',
        'documents.view',
        'documents.create',
        'guardians.view',
        'guardians.create',
        'guardians.update',
        'staff.view',
        'reports.view',
        'users.view'
    )
WHERE r.role_name = 'Secretary / Records'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'students.view',
        'classes.view',
        'subjects.view',
        'academics.view',
        'results.view',
        'fees.view',
        'payments.view',
        'uniforms.view',
        'attendance.view',
        'documents.view',
        'guardians.view',
        'reports.view',
        'timetable.view',
        'notifications.view',
        'announcements.view'
    )
WHERE r.role_name = 'Student'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'students.view',
        'classes.view',
        'subjects.view',
        'academics.view',
        'results.view',
        'fees.view',
        'payments.view',
        'uniforms.view',
        'attendance.view',
        'documents.view',
        'guardians.view',
        'notifications.view',
        'announcements.view'
    )
WHERE r.role_name = 'Parent / Guardian'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'students.view',
        'students.create',
        'students.update',
        'admissions.view',
        'admissions.create',
        'classes.view',
        'guardians.view',
        'guardians.create',
        'guardians.update',
        'documents.view',
        'documents.create'
    )
WHERE r.role_name = 'Admissions Officer'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'students.view',
        'students.create',
        'students.update',
        'students.delete',
        'classes.view',
        'classes.create',
        'classes.update',
        'subjects.view',
        'academics.view',
        'attendance.view',
        'documents.view',
        'documents.create',
        'guardians.view',
        'guardians.create'
    )
WHERE r.role_name = 'Data Officer'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'students.view',
        'classes.view',
        'subjects.view',
        'academics.view',
        'results.view',
        'results.create',
        'results.update',
        'results.delete',
        'results.settings',
        'attendance.view',
        'reports.view',
        'reports.generate',
        'documents.view',
        'guardians.view'
    )
WHERE r.role_name = 'Examination Officer'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.permission_name IN (
        'dashboard.view',
        'students.view',
        'fees.view',
        'fees.create',
        'fees.update',
        'payments.view',
        'payments.create',
        'payments.update',
        'payments.delete',
        'uniforms.view',
        'uniforms.create',
        'uniforms.update',
        'reports.view',
        'reports.generate'
    )
WHERE r.role_name = 'Account Officer'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO academic_levels (
    school_id,
    level_name,
    level_order,
    description
)
SELECT
    s.id,
    'Junior Secondary School',
    1,
    'Junior Secondary School levels covering JSS 1 to JSS 3.'
FROM schools s
WHERE s.school_code = 'LMC001'
ON CONFLICT (school_id, level_order) DO NOTHING;

INSERT INTO academic_levels (
    school_id,
    level_name,
    level_order,
    description
)
SELECT
    s.id,
    'Senior Secondary School',
    2,
    'Senior Secondary School levels covering SS 1 to SS 3.'
FROM schools s
WHERE s.school_code = 'LMC001'
ON CONFLICT (school_id, level_order) DO NOTHING;

INSERT INTO academic_sessions (
    school_id,
    session_name,
    start_date,
    end_date,
    is_current,
    is_active
)
SELECT
    s.id,
    '2026/2027',
    '2026-09-01',
    '2027-07-31',
    TRUE,
    TRUE
FROM schools s
WHERE s.school_code = 'LMC001'
ON CONFLICT (school_id, session_name) DO NOTHING;

INSERT INTO terms (
    school_id,
    term_name,
    term_order,
    start_date,
    end_date,
    is_current,
    is_active
)
SELECT
    s.id,
    'First Term',
    1,
    '2026-09-01',
    '2026-12-18',
    TRUE,
    TRUE
FROM schools s
WHERE s.school_code = 'LMC001'
ON CONFLICT (school_id, term_name) DO NOTHING;

INSERT INTO terms (
    school_id,
    term_name,
    term_order,
    start_date,
    end_date,
    is_current,
    is_active
)
SELECT
    s.id,
    'Second Term',
    2,
    '2027-01-11',
    '2027-04-09',
    FALSE,
    TRUE
FROM schools s
WHERE s.school_code = 'LMC001'
ON CONFLICT (school_id, term_name) DO NOTHING;

INSERT INTO terms (
    school_id,
    term_name,
    term_order,
    start_date,
    end_date,
    is_current,
    is_active
)
SELECT
    s.id,
    'Third Term',
    3,
    '2027-04-26',
    '2027-07-23',
    FALSE,
    TRUE
FROM schools s
WHERE s.school_code = 'LMC001'
ON CONFLICT (school_id, term_name) DO NOTHING;

INSERT INTO classes (
    school_id,
    academic_level_id,
    class_name,
    class_code,
    class_order,
    description,
    is_active
)
SELECT
    s.id,
    al.id,
    c.class_name,
    c.class_code,
    c.class_order,
    c.description,
    TRUE
FROM schools s
JOIN academic_levels al
    ON al.school_id = s.id
CROSS JOIN (
    VALUES
        ('JSS 1', 'JSS1', 1, 'Junior Secondary School 1.'),
        ('JSS 2', 'JSS2', 2, 'Junior Secondary School 2.'),
        ('JSS 3', 'JSS3', 3, 'Junior Secondary School 3.')
) AS c(
    class_name,
    class_code,
    class_order,
    description
)
WHERE s.school_code = 'LMC001'
AND al.level_name = 'Junior Secondary School'
ON CONFLICT (school_id, class_name) DO NOTHING;

INSERT INTO classes (
    school_id,
    academic_level_id,
    class_name,
    class_code,
    class_order,
    description,
    is_active
)
SELECT
    s.id,
    al.id,
    c.class_name,
    c.class_code,
    c.class_order,
    c.description,
    TRUE
FROM schools s
JOIN academic_levels al
    ON al.school_id = s.id
CROSS JOIN (
    VALUES
        ('SS 1', 'SS1', 4, 'Senior Secondary School 1.'),
        ('SS 2', 'SS2', 5, 'Senior Secondary School 2.'),
        ('SS 3', 'SS3', 6, 'Senior Secondary School 3.')
) AS c(
    class_name,
    class_code,
    class_order,
    description
)
WHERE s.school_code = 'LMC001'
AND al.level_name = 'Senior Secondary School'
ON CONFLICT (school_id, class_name) DO NOTHING;

INSERT INTO class_arms (
    school_id,
    class_id,
    arm_name,
    arm_code,
    description,
    is_active
)
SELECT
    s.id,
    c.id,
    a.arm_name,
    a.arm_code,
    a.description,
    TRUE
FROM schools s
JOIN classes c
    ON c.school_id = s.id
CROSS JOIN (
    VALUES
        ('JSS 1', 'A', 'A', 'JSS 1 Arm A.'),
        ('JSS 1', 'B', 'B', 'JSS 1 Arm B.'),
        ('JSS 1', 'C', 'C', 'JSS 1 Arm C.'),
        ('JSS 2', 'A', 'A', 'JSS 2 Arm A.'),
        ('JSS 2', 'B', 'B', 'JSS 2 Arm B.'),
        ('JSS 2', 'C', 'C', 'JSS 2 Arm C.'),
        ('JSS 3', 'A', 'A', 'JSS 3 Arm A.'),
        ('JSS 3', 'B', 'B', 'JSS 3 Arm B.'),
        ('JSS 3', 'C', 'C', 'JSS 3 Arm C.'),
        ('SS 1', 'Science', 'SCI', 'SS 1 Science Arm.'),
        ('SS 1', 'Arts', 'ART', 'SS 1 Arts Arm.'),
        ('SS 1', 'Commercial', 'COM', 'SS 1 Commercial Arm.'),
        ('SS 2', 'Science', 'SCI', 'SS 2 Science Arm.'),
        ('SS 2', 'Arts', 'ART', 'SS 2 Arts Arm.'),
        ('SS 2', 'Commercial', 'COM', 'SS 2 Commercial Arm.'),
        ('SS 3', 'Science', 'SCI', 'SS 3 Science Arm.'),
        ('SS 3', 'Arts', 'ART', 'SS 3 Arts Arm.'),
        ('SS 3', 'Commercial', 'COM', 'SS 3 Commercial Arm.')
) AS a(
    class_name,
    arm_name,
    arm_code,
    description
)
WHERE s.school_code = 'LMC001'
AND c.class_name = a.class_name
ON CONFLICT (class_id, arm_name) DO NOTHING;

INSERT INTO departments (
    school_id,
    department_name,
    department_code,
    description,
    is_active
)
SELECT
    s.id,
    d.department_name,
    d.department_code,
    d.description,
    TRUE
FROM schools s
CROSS JOIN (
    VALUES
        ('Science', 'SCI', 'Science department.'),
        ('Arts', 'ART', 'Arts department.'),
        ('Commercial', 'COM', 'Commercial department.')
) AS d(
    department_name,
    department_code,
    description
)
WHERE s.school_code = 'LMC001'
ON CONFLICT (school_id, department_name) DO NOTHING;

INSERT INTO subjects (
    school_id,
    subject_name,
    subject_code,
    description,
    is_compulsory,
    is_active
)
SELECT
    s.id,
    x.subject_name,
    x.subject_code,
    x.description,
    x.is_compulsory,
    TRUE
FROM schools s
CROSS JOIN (
    VALUES
        ('Mathematics', 'MATH', 'Mathematics subject.', TRUE),
        ('English Language', 'ENG', 'English Language subject.', TRUE),
        ('Basic Science', 'BSC', 'Basic Science subject.', TRUE),
        ('Basic Technology', 'BT', 'Basic Technology subject.', FALSE),
        ('Social Studies', 'SOS', 'Social Studies subject.', TRUE),
        ('Civic Education', 'CIV', 'Civic Education subject.', TRUE),
        ('Computer Studies', 'COMP', 'Computer Studies subject.', FALSE),
        ('Agricultural Science', 'AGR', 'Agricultural Science subject.', FALSE),
        ('Physical and Health Education', 'PHE', 'Physical and Health Education subject.', FALSE),
        ('Christian Religious Studies', 'CRS', 'Christian Religious Studies subject.', FALSE),
        ('Islamic Religious Studies', 'IRS', 'Islamic Religious Studies subject.', FALSE),
        ('Biology', 'BIO', 'Biology subject.', FALSE),
        ('Chemistry', 'CHEM', 'Chemistry subject.', FALSE),
        ('Physics', 'PHY', 'Physics subject.', FALSE),
        ('Economics', 'ECO', 'Economics subject.', FALSE),
        ('Government', 'GOV', 'Government subject.', FALSE)
) AS x(
    subject_name,
    subject_code,
    description,
    is_compulsory
)
WHERE s.school_code = 'LMC001'
ON CONFLICT (school_id, subject_name) DO NOTHING;

INSERT INTO result_settings (
    school_id,
    setting_name,
    minimum_score,
    maximum_score,
    grade,
    remark,
    grade_point
)
SELECT
    s.id,
    x.setting_name,
    x.minimum_score,
    x.maximum_score,
    x.grade,
    x.remark,
    x.grade_point
FROM schools s
CROSS JOIN (
    VALUES
        ('Grade A1', 75::NUMERIC, 100::NUMERIC, 'A1', 'Excellent', 4.00::NUMERIC),
        ('Grade B2', 70::NUMERIC, 74::NUMERIC, 'B2', 'Very Good', 3.50::NUMERIC),
        ('Grade B3', 65::NUMERIC, 69::NUMERIC, 'B3', 'Good', 3.00::NUMERIC),
        ('Grade C4', 60::NUMERIC, 64::NUMERIC, 'C4', 'Credit', 2.50::NUMERIC),
        ('Grade C5', 55::NUMERIC, 59::NUMERIC, 'C5', 'Credit', 2.00::NUMERIC),
        ('Grade C6', 50::NUMERIC, 54::NUMERIC, 'C6', 'Credit', 1.50::NUMERIC),
        ('Grade D7', 45::NUMERIC, 49::NUMERIC, 'D7', 'Pass', 1.00::NUMERIC),
        ('Grade E8', 40::NUMERIC, 44::NUMERIC, 'E8', 'Pass', 0.50::NUMERIC),
        ('Grade F9', 0::NUMERIC, 39::NUMERIC, 'F9', 'Fail', 0.00::NUMERIC)
) AS x(
    setting_name,
    minimum_score,
    maximum_score,
    grade,
    remark,
    grade_point
)
WHERE s.school_code = 'LMC001'
ON CONFLICT (
    school_id,
    setting_name,
    minimum_score,
    maximum_score
) DO NOTHING;

COMMIT;