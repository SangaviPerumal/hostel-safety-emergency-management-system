-- ============================================================
-- MySQL Database Setup Script for Hostel Safety Management
-- Database: hostel_safety_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS hostel_safety_db;
USE hostel_safety_db;

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    hostel_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Emergencies Table
CREATE TABLE IF NOT EXISTS emergencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    hostel_name VARCHAR(100) DEFAULT 'Chellammal hostel',
    emergency_category VARCHAR(100),
    emergency_type VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_remarks VARCHAR(255),
    alert_recipients VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    hostel_name VARCHAR(100) DEFAULT 'Chellammal hostel',
    room_number VARCHAR(50) NOT NULL,
    complaint_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_remarks VARCHAR(255),
    alert_recipients VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 4. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN'
);

-- ============================================================
-- Initial Sample Seed Data
-- ============================================================

-- Seed Sample Admin (Dr. Sumathi as Chief Warden)
INSERT INTO admins (username, password, name, role)
VALUES ('admin@hostel.edu', 'admin123', 'Dr. Sumathi (Chief Warden)', 'ADMIN')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Sample Students with requested hostel names & rooms
INSERT INTO students (student_name, student_id, email, phone_number, password, hostel_name, room_number)
VALUES ('Sangavi Perumal', 'STU101', 'sangavi@hostel.edu', '+91 98765 43210', 'password123', 'Chellammal hostel', 'G1')
ON DUPLICATE KEY UPDATE student_name=VALUES(student_name);

INSERT INTO students (student_name, student_id, email, phone_number, password, hostel_name, room_number)
VALUES ('Rahul Sharma', 'STU102', 'rahul@hostel.edu', '+91 98765 11223', 'password123', 'Sivasakthi hostel', 'S1')
ON DUPLICATE KEY UPDATE student_name=VALUES(student_name);

INSERT INTO students (student_name, student_id, email, phone_number, password, hostel_name, room_number)
VALUES ('Ananya Iyer', 'STU103', 'ananya@hostel.edu', '+91 98765 99881', 'password123', 'Flat Office', 'G2')
ON DUPLICATE KEY UPDATE student_name=VALUES(student_name);

-- Seed Sample Emergency Reports with clean routing
INSERT INTO emergencies (student_name, student_id, hostel_name, emergency_category, emergency_type, room_number, description, status, admin_remarks, alert_recipients)
VALUES ('Sangavi Perumal', 'STU101', 'Chellammal hostel', 'Medical Emergency', 'Sudden Severe Illness', 'G1', 'High fever, acute dizziness and breathing difficulty. Please dispatch medical staff to room.', 'Pending', 'Campus medical kit on standby', 'Dr. Sumathi (Chief Warden), Hostel Management, Doctor and Nurse');

INSERT INTO emergencies (student_name, student_id, hostel_name, emergency_category, emergency_type, room_number, description, status, admin_remarks, alert_recipients)
VALUES ('Rahul Sharma', 'STU102', 'Sivasakthi hostel', 'Electrical Emergency', 'Short Circuit Spark', 'S1', 'Severe sparking coming from main switchboard with burning smell.', 'In Progress', 'Block electrician dispatched, main MCB isolated', 'Electrician, Dr. Sumathi (Chief Warden) and Hostel Management');

-- Seed Sample Safety Complaints with clean routing
INSERT INTO complaints (student_id, hostel_name, room_number, complaint_type, description, status, admin_remarks, alert_recipients)
VALUES ('STU101', 'Chellammal hostel', 'G1', 'Broken Door Lock / Window Latch', 'Main room door latch is loose and does not lock firmly from the inside.', 'Pending', 'Assigned to hostel carpenter', 'Dr. Sumathi (Hostel Warden) and Hostel Management');

INSERT INTO complaints (student_id, hostel_name, room_number, complaint_type, description, status, admin_remarks, alert_recipients)
VALUES ('STU102', 'Sivasakthi hostel', 'S1', 'Corridor Light Out / Dark Area', 'Corridor tube light near room S1 is flickering and off at night.', 'Resolved', 'LED light replaced', 'Electrician, Dr. Sumathi (Chief Warden) and Hostel Management');
