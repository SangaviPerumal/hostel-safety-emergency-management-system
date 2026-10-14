-- Hostel Safety and Emergency Management System
-- MySQL Relational Database Schema

CREATE DATABASE IF NOT EXISTS hostel_safety_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hostel_safety_db;

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_name VARCHAR(120) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  hostel_name VARCHAR(100) NOT NULL,
  room_number VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_student_id (student_id),
  UNIQUE KEY uk_student_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Wardens & Administrators Table
CREATE TABLE IF NOT EXISTS wardens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  role ENUM('WARDEN', 'ADMIN') NOT NULL DEFAULT 'WARDEN',
  staff_id VARCHAR(50) NULL,
  phone_number VARCHAR(30) NULL,
  hostel_assigned VARCHAR(100) DEFAULT 'All Hostels',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_warden_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Emergency Reports Table
CREATE TABLE IF NOT EXISTS emergencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_name VARCHAR(120) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  hostel_name VARCHAR(100) NULL,
  emergency_category VARCHAR(60) NOT NULL,
  emergency_type VARCHAR(100) NOT NULL,
  room_number VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('Pending', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Pending',
  date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  admin_remarks TEXT NULL,
  has_image BOOLEAN DEFAULT FALSE,
  alert_recipients TEXT NULL,
  INDEX idx_emergency_student (student_id),
  INDEX idx_emergency_status (status),
  INDEX idx_emergency_date (date_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Safety Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  hostel_name VARCHAR(100) NULL,
  room_number VARCHAR(30) NOT NULL,
  complaint_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('Pending', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Pending',
  date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  admin_remarks TEXT NULL,
  alert_recipients TEXT NULL,
  INDEX idx_complaint_student (student_id),
  INDEX idx_complaint_status (status),
  INDEX idx_complaint_date (date_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Active User Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(120) PRIMARY KEY,
  user_id INT NOT NULL,
  role ENUM('WARDEN', 'ADMIN', 'STUDENT') NOT NULL,
  username VARCHAR(120) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  INDEX idx_session_expires (expires_at),
  INDEX idx_session_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
