/*
===============================================================================
 SCHOOL MANAGEMENT SYSTEM
 PostgreSQL Database Schema
 Version: 2.0.0

 Designed for Nigerian Secondary Schools

 FINAL DATABASE FOUNDATION

 Supports:

    Schools
    Users
    Roles
    Permissions
    Academic Sessions
    Terms
    Academic Levels
    Classes
    Class Arms / Streams
    Departments
    Subjects
    Students
    Student Enrollments
    Student / Guardian Relationships
    Student Results
    Result Settings
    Fees
    Student Fee Accounts
    Payments
    Uniform Items
    Uniform Purchases
    Attendance
    Student Documents
    Staff
    Timetable
    Notifications
    Announcements
    Audit Logs

 Academic structure is configurable.

 Examples:

    JSS 1 A
    JSS 1 B
    JSS 1 Rose
    JSS 1 Yellow
    SS 1 Science
    SS 1 Arts
    SS 1 Commercial

 The system is NOT hard-coded to these examples.

 IMPORTANT:

 This file is the master baseline schema.

 After this schema is locked, future structural database changes should be
 introduced through migration files rather than repeatedly redesigning this
 schema.
===============================================================================
*/


/*
===============================================================================
 1. EXTENSIONS
===============================================================================
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


/*
===============================================================================
 2. SCHOOLS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_name VARCHAR(255) NOT NULL,

    school_code VARCHAR(50) UNIQUE,

    registration_number VARCHAR(100),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100) DEFAULT 'Nigeria',

    phone VARCHAR(50),

    email VARCHAR(255),

    website VARCHAR(255),

    logo_url TEXT,

    motto VARCHAR(255),

    principal_name VARCHAR(255),

    school_type VARCHAR(50)
        DEFAULT 'Secondary School'
        CHECK (
            school_type IN (
                'Secondary School',
                'Primary and Secondary',
                'College',
                'Other'
            )
        ),

    status VARCHAR(30)
        DEFAULT 'Active'
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Suspended'
            )
        ),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 3. ROLES
===============================================================================
*/

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 4. PERMISSIONS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    permission_name VARCHAR(150) NOT NULL UNIQUE,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 5. ROLE PERMISSIONS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_id UUID NOT NULL
        REFERENCES roles(id)
        ON DELETE CASCADE,

    permission_id UUID NOT NULL
        REFERENCES permissions(id)
        ON DELETE CASCADE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(role_id, permission_id)
);


/*
===============================================================================
 6. USERS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    role_id UUID NOT NULL
        REFERENCES roles(id),

    first_name VARCHAR(100) NOT NULL,

    middle_name VARCHAR(100),

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL,

    phone VARCHAR(50),

    username VARCHAR(100),

    password_hash TEXT NOT NULL,

    profile_photo_url TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, email),

    UNIQUE(school_id, username)
);


/*
===============================================================================
 7. ACADEMIC LEVELS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS academic_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    level_name VARCHAR(100) NOT NULL,

    level_order INTEGER NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, level_name),

    UNIQUE(school_id, level_order)
);


/*
===============================================================================
 8. CLASSES
===============================================================================
*/

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    academic_level_id UUID
        REFERENCES academic_levels(id)
        ON DELETE SET NULL,

    class_name VARCHAR(100) NOT NULL,

    class_code VARCHAR(50),

    class_order INTEGER,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, class_name)
);


/*
===============================================================================
 9. CLASS ARMS / STREAMS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS class_arms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    class_id UUID NOT NULL
        REFERENCES classes(id)
        ON DELETE CASCADE,

    arm_name VARCHAR(100) NOT NULL,

    arm_code VARCHAR(50),

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(class_id, arm_name)
);


/*
===============================================================================
 10. DEPARTMENTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    department_name VARCHAR(150) NOT NULL,

    department_code VARCHAR(50),

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, department_name)
);


/*
===============================================================================
 11. ACADEMIC SESSIONS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS academic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    session_name VARCHAR(50) NOT NULL,

    start_date DATE,

    end_date DATE,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, session_name)
);


/*
===============================================================================
 12. TERMS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    term_name VARCHAR(100) NOT NULL,

    term_order INTEGER NOT NULL,

    start_date DATE,

    end_date DATE,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, term_name),

    UNIQUE(school_id, term_order)
);


/*
===============================================================================
 13. GUARDIANS / PARENTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    first_name VARCHAR(100) NOT NULL,

    middle_name VARCHAR(100),

    last_name VARCHAR(100) NOT NULL,

    relationship VARCHAR(100),

    phone VARCHAR(50),

    alternative_phone VARCHAR(50),

    email VARCHAR(255),

    address TEXT,

    occupation VARCHAR(150),

    employer VARCHAR(255),

    emergency_contact BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 14. STUDENTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    student_number VARCHAR(100) NOT NULL,

    admission_number VARCHAR(100),

    first_name VARCHAR(100) NOT NULL,

    middle_name VARCHAR(100),

    last_name VARCHAR(100) NOT NULL,

    other_names VARCHAR(255),

    gender VARCHAR(30),

    date_of_birth DATE,

    age INTEGER,

    email VARCHAR(255),

    phone VARCHAR(50),

    residential_address TEXT,

    state_of_origin VARCHAR(100),

    local_government_area VARCHAR(150),

    nationality VARCHAR(100)
        DEFAULT 'Nigerian',

    religion VARCHAR(100),

    blood_group VARCHAR(20),

    genotype VARCHAR(20),

    student_photo_url TEXT,

    admission_date DATE,

    graduation_date DATE,

    status VARCHAR(50)
        DEFAULT 'Active'
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Graduated',
                'Withdrawn',
                'Expelled',
                'Transferred'
            )
        ),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, student_number),

    UNIQUE(school_id, admission_number)
);


/*
===============================================================================
 15. STUDENT ENROLLMENTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    academic_session_id UUID NOT NULL
        REFERENCES academic_sessions(id),

    class_id UUID NOT NULL
        REFERENCES classes(id),

    class_arm_id UUID
        REFERENCES class_arms(id)
        ON DELETE SET NULL,

    department_id UUID
        REFERENCES departments(id)
        ON DELETE SET NULL,

    admission_status VARCHAR(50)
        DEFAULT 'Enrolled'
        CHECK (
            admission_status IN (
                'Enrolled',
                'Promoted',
                'Repeated',
                'Transferred',
                'Withdrawn',
                'Graduated'
            )
        ),

    enrollment_date DATE DEFAULT CURRENT_DATE,

    exit_date DATE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(
        student_id,
        academic_session_id
    )
);


/*
===============================================================================
 16. STUDENT-GUARDIAN RELATIONSHIP
===============================================================================
*/

CREATE TABLE IF NOT EXISTS student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    guardian_id UUID NOT NULL
        REFERENCES guardians(id)
        ON DELETE CASCADE,

    is_primary BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, guardian_id)
);


/*
===============================================================================
 17. SUBJECTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    subject_name VARCHAR(150) NOT NULL,

    subject_code VARCHAR(50),

    description TEXT,

    is_compulsory BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, subject_name)
);


/*
===============================================================================
 18. CLASS SUBJECTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    class_id UUID NOT NULL
        REFERENCES classes(id)
        ON DELETE CASCADE,

    subject_id UUID NOT NULL
        REFERENCES subjects(id)
        ON DELETE CASCADE,

    is_compulsory BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(class_id, subject_id)
);


/*
===============================================================================
 19. STUDENT RESULTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    academic_session_id UUID NOT NULL
        REFERENCES academic_sessions(id),

    term_id UUID NOT NULL
        REFERENCES terms(id),

    class_id UUID NOT NULL
        REFERENCES classes(id),

    subject_id UUID NOT NULL
        REFERENCES subjects(id),

    ca_score NUMERIC(6,2) DEFAULT 0,

    exam_score NUMERIC(6,2) DEFAULT 0,

    total_score NUMERIC(6,2) DEFAULT 0,

    grade VARCHAR(10),

    grade_point NUMERIC(5,2),

    position INTEGER,

    teacher_remark TEXT,

    principal_remark TEXT,

    is_published BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(
        student_id,
        academic_session_id,
        term_id,
        subject_id
    )
);


/*
===============================================================================
 20. RESULT SETTINGS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS result_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    setting_name VARCHAR(150) NOT NULL,

    minimum_score NUMERIC(6,2),

    maximum_score NUMERIC(6,2),

    grade VARCHAR(10),

    remark VARCHAR(255),

    grade_point NUMERIC(5,2),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(
        school_id,
        setting_name,
        minimum_score,
        maximum_score
    )
);


/*
===============================================================================
 21. SCHOOL FEES
===============================================================================
*/

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    academic_session_id UUID NOT NULL
        REFERENCES academic_sessions(id),

    term_id UUID
        REFERENCES terms(id)
        ON DELETE SET NULL,

    class_id UUID
        REFERENCES classes(id)
        ON DELETE SET NULL,

    fee_name VARCHAR(150) NOT NULL,

    description TEXT,

    amount NUMERIC(14,2) NOT NULL DEFAULT 0,

    compulsory BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 22. STUDENT FEE ACCOUNTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    fee_structure_id UUID NOT NULL
        REFERENCES fee_structures(id)
        ON DELETE CASCADE,

    amount_due NUMERIC(14,2) NOT NULL DEFAULT 0,

    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,

    balance NUMERIC(14,2) NOT NULL DEFAULT 0,

    payment_status VARCHAR(30)
        DEFAULT 'Unpaid'
        CHECK (
            payment_status IN (
                'Unpaid',
                'Partially Paid',
                'Paid',
                'Overpaid'
            )
        ),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, fee_structure_id)
);


/*
===============================================================================
 23. PAYMENTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    student_fee_id UUID
        REFERENCES student_fees(id)
        ON DELETE SET NULL,

    receipt_number VARCHAR(100) NOT NULL,

    amount NUMERIC(14,2) NOT NULL,

    payment_method VARCHAR(50),

    transaction_reference VARCHAR(150),

    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

    received_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, receipt_number)
);


/*
===============================================================================
 24. UNIFORM ITEMS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS uniform_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    item_name VARCHAR(150) NOT NULL,

    description TEXT,

    size VARCHAR(50),

    price NUMERIC(14,2) NOT NULL DEFAULT 0,

    stock_quantity INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, item_name, size)
);


/*
===============================================================================
 25. STUDENT UNIFORM PURCHASES
===============================================================================
*/

CREATE TABLE IF NOT EXISTS uniform_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    uniform_item_id UUID NOT NULL
        REFERENCES uniform_items(id),

    quantity INTEGER NOT NULL DEFAULT 1,

    unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,

    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,

    payment_status VARCHAR(30)
        DEFAULT 'Unpaid'
        CHECK (
            payment_status IN (
                'Unpaid',
                'Partially Paid',
                'Paid'
            )
        ),

    purchase_date DATE DEFAULT CURRENT_DATE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 26. ATTENDANCE
===============================================================================
*/

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    academic_session_id UUID NOT NULL
        REFERENCES academic_sessions(id),

    term_id UUID
        REFERENCES terms(id)
        ON DELETE SET NULL,

    class_id UUID
        REFERENCES classes(id)
        ON DELETE SET NULL,

    class_arm_id UUID
        REFERENCES class_arms(id)
        ON DELETE SET NULL,

    attendance_date DATE NOT NULL,

    status VARCHAR(30) NOT NULL
        CHECK (
            status IN (
                'Present',
                'Absent',
                'Late',
                'Excused'
            )
        ),

    remark TEXT,

    recorded_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, attendance_date)
);


/*
===============================================================================
 27. STUDENT DOCUMENTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    document_name VARCHAR(255) NOT NULL,

    document_type VARCHAR(100),

    file_url TEXT NOT NULL,

    file_size BIGINT,

    mime_type VARCHAR(100),

    uploaded_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 28. STAFF
===============================================================================
*/

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    staff_number VARCHAR(100),

    first_name VARCHAR(100) NOT NULL,

    middle_name VARCHAR(100),

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255),

    phone VARCHAR(50),

    position VARCHAR(150),

    department VARCHAR(150),

    employment_date DATE,

    profile_photo_url TEXT,

    status VARCHAR(30)
        DEFAULT 'Active'
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Suspended',
                'Resigned'
            )
        ),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(school_id, staff_number)
);


/*
===============================================================================
 29. TIMETABLE
===============================================================================
*/

CREATE TABLE IF NOT EXISTS timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    academic_session_id UUID NOT NULL
        REFERENCES academic_sessions(id),

    term_id UUID
        REFERENCES terms(id)
        ON DELETE SET NULL,

    class_id UUID NOT NULL
        REFERENCES classes(id)
        ON DELETE CASCADE,

    class_arm_id UUID
        REFERENCES class_arms(id)
        ON DELETE SET NULL,

    subject_id UUID NOT NULL
        REFERENCES subjects(id)
        ON DELETE CASCADE,

    teacher_id UUID
        REFERENCES staff(id)
        ON DELETE SET NULL,

    day_of_week INTEGER NOT NULL
        CHECK(day_of_week BETWEEN 1 AND 7),

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    room VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK(end_time > start_time)
);


/*
===============================================================================
 30. NOTIFICATIONS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    user_id UUID
        REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    notification_type VARCHAR(50),

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 31. ANNOUNCEMENTS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,

    content TEXT NOT NULL,

    target_role VARCHAR(100),

    target_class_id UUID
        REFERENCES classes(id)
        ON DELETE SET NULL,

    target_class_arm_id UUID
        REFERENCES class_arms(id)
        ON DELETE SET NULL,

    published_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    is_published BOOLEAN NOT NULL DEFAULT FALSE,

    published_at TIMESTAMP,

    expires_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 32. AUDIT LOGS
===============================================================================
*/

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID
        REFERENCES schools(id)
        ON DELETE CASCADE,

    user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,

    table_name VARCHAR(100),

    record_id UUID,

    old_data JSONB,

    new_data JSONB,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/*
===============================================================================
 33. INDEXES — SCHOOLS / USERS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_users_school
ON users(school_id);

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role_id);

CREATE INDEX IF NOT EXISTS idx_users_active
ON users(is_active);


/*
===============================================================================
 34. INDEXES — ACADEMIC STRUCTURE
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_academic_levels_school
ON academic_levels(school_id);

CREATE INDEX IF NOT EXISTS idx_classes_school
ON classes(school_id);

CREATE INDEX IF NOT EXISTS idx_classes_level
ON classes(academic_level_id);

CREATE INDEX IF NOT EXISTS idx_class_arms_school
ON class_arms(school_id);

CREATE INDEX IF NOT EXISTS idx_class_arms_class
ON class_arms(class_id);

CREATE INDEX IF NOT EXISTS idx_departments_school
ON departments(school_id);

CREATE INDEX IF NOT EXISTS idx_sessions_school
ON academic_sessions(school_id);

CREATE INDEX IF NOT EXISTS idx_terms_school
ON terms(school_id);


/*
===============================================================================
 35. INDEXES — STUDENTS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_students_school
ON students(school_id);

CREATE INDEX IF NOT EXISTS idx_students_student_number
ON students(student_number);

CREATE INDEX IF NOT EXISTS idx_students_name
ON students(last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_students_status
ON students(status);

CREATE INDEX IF NOT EXISTS idx_students_email
ON students(email);


/*
===============================================================================
 36. INDEXES — ENROLLMENTS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_enrollments_student
ON student_enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_school
ON student_enrollments(school_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_session
ON student_enrollments(academic_session_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_class
ON student_enrollments(class_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_arm
ON student_enrollments(class_arm_id);


/*
===============================================================================
 37. INDEXES — GUARDIANS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_guardians_school
ON guardians(school_id);

CREATE INDEX IF NOT EXISTS idx_student_guardians_student
ON student_guardians(student_id);

CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian
ON student_guardians(guardian_id);


/*
===============================================================================
 38. INDEXES — SUBJECTS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_subjects_school
ON subjects(school_id);

CREATE INDEX IF NOT EXISTS idx_class_subjects_class
ON class_subjects(class_id);

CREATE INDEX IF NOT EXISTS idx_class_subjects_subject
ON class_subjects(subject_id);


/*
===============================================================================
 39. INDEXES — RESULTS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_results_student
ON results(student_id);

CREATE INDEX IF NOT EXISTS idx_results_school
ON results(school_id);

CREATE INDEX IF NOT EXISTS idx_results_session_term
ON results(academic_session_id, term_id);

CREATE INDEX IF NOT EXISTS idx_results_class
ON results(class_id);

CREATE INDEX IF NOT EXISTS idx_results_subject
ON results(subject_id);

CREATE INDEX IF NOT EXISTS idx_result_settings_school
ON result_settings(school_id);


/*
===============================================================================
 40. INDEXES — FEES / PAYMENTS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_fee_structures_school
ON fee_structures(school_id);

CREATE INDEX IF NOT EXISTS idx_fee_structures_session
ON fee_structures(academic_session_id);

CREATE INDEX IF NOT EXISTS idx_student_fees_student
ON student_fees(student_id);

CREATE INDEX IF NOT EXISTS idx_student_fees_school
ON student_fees(school_id);

CREATE INDEX IF NOT EXISTS idx_payments_student
ON payments(student_id);

CREATE INDEX IF NOT EXISTS idx_payments_school
ON payments(school_id);

CREATE INDEX IF NOT EXISTS idx_payments_date
ON payments(payment_date);


/*
===============================================================================
 41. INDEXES — UNIFORMS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_uniform_items_school
ON uniform_items(school_id);

CREATE INDEX IF NOT EXISTS idx_uniform_purchases_student
ON uniform_purchases(student_id);

CREATE INDEX IF NOT EXISTS idx_uniform_purchases_school
ON uniform_purchases(school_id);


/*
===============================================================================
 42. INDEXES — ATTENDANCE
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_attendance_student
ON attendance(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_school
ON attendance(school_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date
ON attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_session_term
ON attendance(academic_session_id, term_id);

CREATE INDEX IF NOT EXISTS idx_attendance_class
ON attendance(class_id);


/*
===============================================================================
 43. INDEXES — DOCUMENTS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_documents_student
ON student_documents(student_id);

CREATE INDEX IF NOT EXISTS idx_documents_school
ON student_documents(school_id);


/*
===============================================================================
 44. INDEXES — STAFF
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_staff_school
ON staff(school_id);

CREATE INDEX IF NOT EXISTS idx_staff_user
ON staff(user_id);

CREATE INDEX IF NOT EXISTS idx_staff_status
ON staff(status);


/*
===============================================================================
 45. INDEXES — TIMETABLE
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_timetable_school
ON timetable_entries(school_id);

CREATE INDEX IF NOT EXISTS idx_timetable_class
ON timetable_entries(class_id);

CREATE INDEX IF NOT EXISTS idx_timetable_arm
ON timetable_entries(class_arm_id);

CREATE INDEX IF NOT EXISTS idx_timetable_teacher
ON timetable_entries(teacher_id);

CREATE INDEX IF NOT EXISTS idx_timetable_session
ON timetable_entries(academic_session_id);


/*
===============================================================================
 46. INDEXES — NOTIFICATIONS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_notifications_school
ON notifications(school_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read
ON notifications(user_id, is_read);


/*
===============================================================================
 47. INDEXES — ANNOUNCEMENTS
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_announcements_school
ON announcements(school_id);

CREATE INDEX IF NOT EXISTS idx_announcements_published
ON announcements(is_published);

CREATE INDEX IF NOT EXISTS idx_announcements_class
ON announcements(target_class_id);


/*
===============================================================================
 48. INDEXES — AUDIT
===============================================================================
*/

CREATE INDEX IF NOT EXISTS idx_audit_school
ON audit_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_audit_user
ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_created
ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_table_record
ON audit_logs(table_name, record_id);


/*
===============================================================================
 49. UPDATED_AT FUNCTION
===============================================================================
*/

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


/*
===============================================================================
 50. UPDATED_AT TRIGGERS
===============================================================================
*/

DROP TRIGGER IF EXISTS trg_schools_updated_at
ON schools;

CREATE TRIGGER trg_schools_updated_at
BEFORE UPDATE ON schools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_users_updated_at
ON users;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_classes_updated_at
ON classes;

CREATE TRIGGER trg_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_class_arms_updated_at
ON class_arms;

CREATE TRIGGER trg_class_arms_updated_at
BEFORE UPDATE ON class_arms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_guardians_updated_at
ON guardians;

CREATE TRIGGER trg_guardians_updated_at
BEFORE UPDATE ON guardians
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_students_updated_at
ON students;

CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_results_updated_at
ON results;

CREATE TRIGGER trg_results_updated_at
BEFORE UPDATE ON results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_student_fees_updated_at
ON student_fees;

CREATE TRIGGER trg_student_fees_updated_at
BEFORE UPDATE ON student_fees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_staff_updated_at
ON staff;

CREATE TRIGGER trg_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_timetable_updated_at
ON timetable_entries;

CREATE TRIGGER trg_timetable_updated_at
BEFORE UPDATE ON timetable_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_announcements_updated_at
ON announcements;

CREATE TRIGGER trg_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


/*
===============================================================================
 END OF MASTER SCHEMA
===============================================================================
*/