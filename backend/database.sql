-- Prospect - Career Explorer for Australian Students
-- Database Setup Script

-- Create database
CREATE DATABASE IF NOT EXISTS career_explorer 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE career_explorer;

-- =====================================================
-- 1. Users table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT 'Username',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT 'Email address',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Password hash',
    full_name VARCHAR(100) COMMENT 'Full name',
    age INT COMMENT 'Age',
    school VARCHAR(200) COMMENT 'School name',
    grade VARCHAR(20) COMMENT 'Current grade',
    avatar_url VARCHAR(500) COMMENT 'Avatar image URL or Base64',
    role ENUM('user', 'admin') DEFAULT 'user' COMMENT 'User role',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Account active status',
    last_login TIMESTAMP NULL COMMENT 'Last login timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User accounts table';

-- =====================================================
-- 2. Courses table
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT 'Course name',
    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Course code',
    category VARCHAR(50) COMMENT 'Course category (STEM, Arts, Humanities, etc)',
    description TEXT COMMENT 'Course description',
    image_base64 LONGTEXT COMMENT 'Base64 encoded image string',
    icon_name VARCHAR(50) COMMENT 'Icon name',
    color_code VARCHAR(7) COMMENT 'Theme color code',
    display_order INT DEFAULT 0 COMMENT 'Display order',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Active status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='School courses table';

-- =====================================================
-- 3. Interest tags table
-- =====================================================
CREATE TABLE IF NOT EXISTS interest_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT 'Tag name',
    category VARCHAR(50) COMMENT 'Tag category',
    emoji VARCHAR(10) COMMENT 'Emoji icon',
    display_order INT DEFAULT 0 COMMENT 'Display order',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Active status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Interest tags table';

-- =====================================================
-- 4. Occupations table (based on ANZSCO standard)
-- =====================================================
CREATE TABLE IF NOT EXISTS occupations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    anzsco_code VARCHAR(6) UNIQUE NOT NULL COMMENT 'ANZSCO occupation code',
    title VARCHAR(200) NOT NULL COMMENT 'Occupation title',
    description TEXT COMMENT 'Occupation description',
    image_base64 LONGTEXT COMMENT 'Base64 encoded image string',
    category VARCHAR(100) COMMENT 'Occupation category',
    sub_category VARCHAR(100) COMMENT 'Occupation sub-category',
    skill_level INT COMMENT 'Skill level 1-5',
    education_required VARCHAR(200) COMMENT 'Required education',
    work_type VARCHAR(50) COMMENT 'Work type (Full-time, Part-time, etc)',
    work_hours VARCHAR(50) COMMENT 'Typical work hours',
    main_tasks TEXT COMMENT 'Main job tasks',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Active status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_anzsco_code (anzsco_code),
    INDEX idx_category (category),
    INDEX idx_title (title),
    INDEX idx_is_active (is_active),
    FULLTEXT idx_title_description (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Occupations table (based on ANZSCO)';

-- =====================================================
-- 5. Occupation-Course relationship table
-- =====================================================
CREATE TABLE IF NOT EXISTS occupation_courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    occupation_id INT NOT NULL COMMENT 'Occupation ID',
    course_id INT NOT NULL COMMENT 'Course ID',
    weight_score DECIMAL(5,2) NOT NULL COMMENT 'Weight score 0-100',
    importance_level INT COMMENT 'Importance level 1-5',
    is_required BOOLEAN DEFAULT FALSE COMMENT 'Is required course',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_occupation_course (occupation_id, course_id),
    INDEX idx_occupation (occupation_id),
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Occupation to course mapping table';

-- =====================================================
-- 6. Occupation-Interest relationship table
-- =====================================================
CREATE TABLE IF NOT EXISTS occupation_interests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    occupation_id INT NOT NULL COMMENT 'Occupation ID',
    interest_tag_id INT NOT NULL COMMENT 'Interest tag ID',
    relevance_score DECIMAL(5,2) COMMENT 'Relevance score 0-100',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
    FOREIGN KEY (interest_tag_id) REFERENCES interest_tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_occupation_interest (occupation_id, interest_tag_id),
    INDEX idx_occupation (occupation_id),
    INDEX idx_interest (interest_tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Occupation to interest mapping table';

-- =====================================================
-- 7. Employment data table
-- =====================================================
CREATE TABLE IF NOT EXISTS employment_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    occupation_id INT NOT NULL COMMENT 'Occupation ID',
    year INT NOT NULL COMMENT 'Year',
    employment_count INT COMMENT 'Number of employed persons',
    unemployment_rate DECIMAL(5,2) COMMENT 'Unemployment rate (%)',
    full_time_percentage DECIMAL(5,2) COMMENT 'Full-time percentage (%)',
    part_time_percentage DECIMAL(5,2) COMMENT 'Part-time percentage (%)',
    female_percentage DECIMAL(5,2) COMMENT 'Female workforce percentage (%)',
    male_percentage DECIMAL(5,2) COMMENT 'Male workforce percentage (%)',
    future_outlook TEXT COMMENT 'Future outlook description',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_occupation_year (occupation_id, year),
    INDEX idx_occupation_year (occupation_id, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Annual employment statistics table';

-- =====================================================
-- 8. Salary trends table
-- =====================================================
CREATE TABLE IF NOT EXISTS salary_trends (
    id INT PRIMARY KEY AUTO_INCREMENT,
    occupation_id INT NOT NULL COMMENT 'Occupation ID',
    year INT NOT NULL COMMENT 'Year',
    average_annual_salary INT COMMENT 'Average annual salary (AUD)',
    median_annual_salary INT COMMENT 'Median annual salary (AUD)',
    entry_level_salary INT COMMENT 'Entry level salary (AUD)',
    senior_level_salary INT COMMENT 'Senior level salary (AUD)',
    gender_pay_gap DECIMAL(5,2) COMMENT 'Gender pay gap (%)',
    salary_growth_rate DECIMAL(5,2) COMMENT 'Salary growth rate (%)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_occupation_year (occupation_id, year),
    INDEX idx_occupation_year (occupation_id, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Annual salary statistics table';

-- =====================================================
-- 9. Regional employment table
-- =====================================================
CREATE TABLE IF NOT EXISTS regional_employment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    occupation_id INT NOT NULL COMMENT 'Occupation ID',
    state VARCHAR(50) NOT NULL COMMENT 'State/Territory',
    employment_share DECIMAL(5,2) COMMENT 'Employment share (%)',
    employment_count INT COMMENT 'Employment count in region',
    growth_rate DECIMAL(10,2) COMMENT 'Growth rate (%)',
    year INT COMMENT 'Data year',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
    INDEX idx_occupation_state (occupation_id, state),
    INDEX idx_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Regional employment distribution table';

-- =====================================================
-- 10. User exploration history table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_explorations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'User ID',
    session_id VARCHAR(100) COMMENT 'Anonymous session ID',
    selected_courses JSON COMMENT 'Selected course IDs (JSON format)',
    selected_tags JSON COMMENT 'Selected interest tag IDs (JSON format)',
    matched_careers JSON COMMENT 'Matched career IDs (JSON format)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User exploration history table';

-- =====================================================
-- 11. User favorites table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'User ID',
    occupation_id INT NOT NULL COMMENT 'Occupation ID',
    notes TEXT COMMENT 'Personal notes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_occupation (user_id, occupation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_occupation_id (occupation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User favorites table';

-- =====================================================
-- 12. User comparison groups table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_comparisons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'User ID',
    comparison_name VARCHAR(100) COMMENT 'Comparison group name',
    occupations JSON NOT NULL COMMENT 'Occupation IDs (JSON array)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User saved comparison groups table';

-- =====================================================
-- 13. Anonymous sessions table
-- =====================================================
CREATE TABLE IF NOT EXISTS anonymous_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) UNIQUE NOT NULL COMMENT 'Unique session identifier',
    selected_courses JSON COMMENT 'Selected course IDs',
    selected_tags JSON COMMENT 'Selected interest tag IDs',
    favorite_occupations JSON COMMENT 'Temporary favorite occupations',
    comparison_occupations JSON COMMENT 'Temporary comparison occupations',
    expires_at TIMESTAMP NOT NULL COMMENT 'Session expiration time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Anonymous user sessions table';

-- =====================================================
-- 14. Future outlook table
-- =====================================================
CREATE TABLE IF NOT EXISTS future_outlook (
    id INT PRIMARY KEY AUTO_INCREMENT,
    occupation_id INT NOT NULL COMMENT 'Occupation ID',
    projected_growth_rate DECIMAL(5,2) COMMENT 'Projected growth rate (%)',
    projected_employment INT COMMENT 'Projected employment (5 years)',
    automation_risk_score DECIMAL(5,2) COMMENT 'Automation risk score 0-100',
    emerging_industry BOOLEAN DEFAULT FALSE COMMENT 'Is emerging industry',
    skills_in_demand JSON COMMENT 'In-demand skills (JSON array)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_occupation (occupation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Future outlook table';

-- =====================================================
-- 15. User activity logs table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT COMMENT 'User ID (nullable for anonymous)',
    session_id VARCHAR(100) COMMENT 'Session ID',
    action_type VARCHAR(50) NOT NULL COMMENT 'Action type',
    action_data JSON COMMENT 'Action data',
    ip_address VARCHAR(45) COMMENT 'IP address',
    user_agent TEXT COMMENT 'Browser user agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User activity logs table';

-- Insert sample data
INSERT INTO courses (name, code, category, description, icon_name, color_code, display_order) VALUES
('Programming & Computer Science', 'CS101', 'STEM', 'Learn programming logic and computer science fundamentals.', 'Code', '#4F46E5', 1),
('Mathematics & Statistics', 'MATH101', 'STEM', 'Develop logical thinking and analytical skills.', 'Calculator', '#10B981', 2),
('English & Writing', 'ENG101', 'Humanities', 'Enhance communication and writing skills.', 'BookOpen', '#F59E0B', 3),
('Physics & Science', 'PHY101', 'STEM', 'Explore natural laws and scientific principles.', 'Atom', '#EF4444', 4),
('Art & Design', 'ART101', 'Arts', 'Unleash creativity through visual expression.', 'Palette', '#EC4899', 5),
('Business & Economics', 'BUS101', 'Commerce', 'Understand business operations and financial management.', 'TrendingUp', '#8B5CF6', 6);

INSERT INTO interest_tags (name, category, emoji, display_order) VALUES
('Coding & Programming', 'Technology', '💻', 1),
('Playing Video Games', 'Entertainment', '🎮', 2),
('Drawing & Painting', 'Arts', '🎨', 3),
('Solving Math Problems', 'Academics', '🔢', 4),
('Creative Writing', 'Academics', '✍️', 5),
('Science Experiments', 'Science', '🔬', 6),
('Problem Solving', 'Thinking', '🧩', 7),
('Helping Others', 'Social', '🤝', 8),
('Design & Creativity', 'Arts', '✏️', 9),
('Data & Analytics', 'Technology', '📊', 10),
('Team Collaboration', 'Social', '👥', 11),
('Innovation', 'Thinking', '💡', 12);

INSERT INTO occupations (anzsco_code, title, description, category, sub_category, skill_level, education_required, work_type) VALUES
('261312', 'Game Developer', 'Design and develop video game software including game engines, graphics rendering, and game mechanics.', 'Information Technology', 'Software Development', 1, 'Bachelor degree or higher', 'Full-time'),
('261311', 'Software Engineer', 'Design, develop, and maintain software systems and applications.', 'Information Technology', 'Software Development', 1, 'Bachelor degree or higher', 'Full-time'),
('224111', 'Data Analyst', 'Collect, analyze, and interpret complex data to support business decisions.', 'Business Analytics', 'Data Analysis', 1, 'Bachelor degree or higher', 'Full-time'),
('233211', 'Civil Engineer', 'Plan, design, and oversee construction projects including roads, bridges, and buildings.', 'Engineering', 'Civil Engineering', 1, 'Bachelor degree or higher', 'Full-time'),
('232411', 'Graphic Designer', 'Create visual concepts using design software to communicate ideas.', 'Arts & Design', 'Visual Design', 2, 'Diploma or Bachelor degree', 'Full-time');

INSERT INTO occupation_courses (occupation_id, course_id, weight_score, importance_level, is_required) VALUES
(1, 1, 95, 5, TRUE),
(1, 2, 80, 4, FALSE),
(1, 5, 70, 3, FALSE),
(2, 1, 95, 5, TRUE),
(2, 2, 85, 4, TRUE),
(3, 1, 85, 4, FALSE),
(3, 2, 90, 5, TRUE),
(3, 6, 75, 3, FALSE);

INSERT INTO occupation_interests (occupation_id, interest_tag_id, relevance_score) VALUES
(1, 1, 95), (1, 2, 90), (1, 7, 85),
(2, 1, 95), (2, 7, 90), (2, 10, 80),
(3, 10, 95), (3, 7, 90), (3, 4, 85),
(4, 7, 90), (4, 6, 85), (4, 11, 80),
(5, 3, 95), (5, 9, 90), (5, 12, 85);

INSERT INTO employment_data (occupation_id, year, employment_count, unemployment_rate, full_time_percentage, part_time_percentage) VALUES
(1, 2020, 12500, 2.5, 92.0, 8.0),
(1, 2021, 13800, 2.3, 93.0, 7.0),
(1, 2022, 15200, 2.1, 94.0, 6.0),
(1, 2023, 16800, 2.0, 94.0, 6.0),
(2, 2020, 85000, 2.0, 95.0, 5.0),
(2, 2021, 92000, 1.9, 95.0, 5.0),
(2, 2022, 101000, 1.8, 96.0, 4.0),
(2, 2023, 112000, 1.7, 96.0, 4.0);

INSERT INTO salary_trends (occupation_id, year, average_annual_salary, median_annual_salary, entry_level_salary, senior_level_salary, gender_pay_gap) VALUES
(1, 2020, 85000, 82000, 65000, 120000, 5.2),
(1, 2021, 88000, 85000, 68000, 125000, 5.0),
(1, 2022, 92000, 89000, 72000, 135000, 4.8),
(1, 2023, 96000, 93000, 76000, 145000, 4.5),
(2, 2020, 95000, 92000, 70000, 140000, 8.5),
(2, 2021, 99000, 96000, 73000, 148000, 8.2),
(2, 2022, 105000, 102000, 78000, 160000, 8.0),
(2, 2023, 112000, 108000, 85000, 175000, 7.8);

-- Insert admin user (password: 123456)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@careerexplorer.com', '$2b$12$h9KGEEciLc9PAfNs0gHR4.wbUpXkVS6gnDW6xyz/AaW7ocFRHJwOy', 'System Administrator', 'admin');