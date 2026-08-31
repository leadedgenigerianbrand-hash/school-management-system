/*
===============================================================================
 SCHOOL MANAGEMENT SYSTEM
 PostgreSQL Database Schema
 Version: 1.0.0

 Designed for Nigerian Secondary Schools

 Academic structure supports:
    JSS 1 - JSS 3
    SS 1 - SS 3

 BUT schools can rename/customize:
    Classes
    Class arms/streams
    Departments
    Sections
    Subjects

 Examples:
    JSS 1 A
    JSS 1 B
    JSS 1 Rose
    JSS 1 Yellow
    SS 1 Science
    SS 1 Arts
    SS 1 Commercial

 The system is NOT hard-coded to these examples.
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

 Examples:

 JSS
 SS

 A school can add other levels if required.
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

 Examples:

 JSS 1
 JSS 2
 JSS 3
 SS 1
 SS 2
 SS 3

 Schools can rename these.

 Example:

 Basic 7
 Basic 8
 Basic 9
 Year 10
 Year 11
 Year 12
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

 Examples:

 A
 B
 C
 Rose
 Yellow
 Pink
 Science
 Arts
 Commercial
 Blue
 Green

 Completely configurable per school.
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
 10. DEPARTMENTS / SPECIALIZATIONS

 Examples:

 Science
 Arts
 Commercial
 Humanities
 Technology

 Schools can create their own names.
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

 Examples:

 2025/2026
 2026/2027
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

 Nigerian standard:

 First Term
 Second Term
 Third Term

 But schools can customize the names.
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
 15. STUDENT ACADEMIC PLACEMENT

 This records where the student currently belongs.

 Example:

 Student
   ↓
 2026/2027
   ↓
 SS 1
   ↓
 Science

 A student's history is preserved when they move to another class.
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

 Determines which subjects belong to which class.
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

 Stores CA, Exam, Total, Grade and other academic information.

 CA and exam structures can later be configured by each school.
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

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
 29. AUDIT LOGS
===============================================================================

 Keeps a history of important actions.

 Example:

 Administrator edited student
 Account Officer recorded payment
 Examination Officer changed result
 Data Officer updated student profile
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
 30. INDEXES
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

CREATE INDEX IF NOT EXISTS idx_enrollments_student
ON student_enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_session
ON student_enrollments(academic_session_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_class
ON student_enrollments(class_id);

CREATE INDEX IF NOT EXISTS idx_results_student
ON results(student_id);

CREATE INDEX IF NOT EXISTS idx_results_session_term
ON results(academic_session_id, term_id);

CREATE INDEX IF NOT EXISTS idx_payments_student
ON payments(student_id);

CREATE INDEX IF NOT EXISTS idx_payments_date
ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_attendance_student
ON attendance(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date
ON attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_documents_student
ON student_documents(student_id);

CREATE INDEX IF NOT EXISTS idx_audit_school
ON audit_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_audit_user
ON audit_logs(user_id);


/*
===============================================================================
 END OF SCHEMA
===============================================================================
*/