import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

export interface StudentRow extends mysql.RowDataPacket {
  id: number;
  student_name: string;
  student_id: string;
  email: string;
  phone_number: string;
  password_hash: string;
  hostel_name: string;
  room_number: string;
  created_at: string;
}

export interface WardenRow extends mysql.RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  role: 'WARDEN' | 'ADMIN';
  staff_id: string | null;
  phone_number: string | null;
  hostel_assigned: string | null;
  created_at: string;
}

export interface EmergencyRow extends mysql.RowDataPacket {
  id: number;
  student_name: string;
  student_id: string;
  hostel_name: string | null;
  emergency_category: string;
  emergency_type: string;
  room_number: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  date_time: string;
  admin_remarks: string | null;
  has_image: number;
  alert_recipients: string | null;
}

export interface ComplaintRow extends mysql.RowDataPacket {
  id: number;
  student_id: string;
  hostel_name: string | null;
  room_number: string;
  complaint_type: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  date_time: string;
  admin_remarks: string | null;
  alert_recipients: string | null;
}

export interface SessionRow extends mysql.RowDataPacket {
  token: string;
  user_id: number;
  role: 'WARDEN' | 'ADMIN' | 'STUDENT';
  username: string;
  name: string;
  created_at: number;
  expires_at: number;
}

// Database configuration loaded strictly from environment variables
// Supports both connection URL (DATABASE_URL / MYSQL_URL) and individual host/user/pass variables
const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;
const dbConfig: mysql.PoolOptions = connectionUri
  ? {
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    }
  : {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'hostel_user',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'hostel_safety_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    };

export const pool = mysql.createPool(dbConfig);

export let isDbConnected = false;

/**
 * Initialize MySQL tables, verify connection, and seed initial records safely
 */
export async function initDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Verify connection
    const connection = await pool.getConnection();
    connection.release();
    isDbConnected = true;
    console.log(`[DATABASE] Successfully connected to MySQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

    // 2. Ensure schema tables exist
    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    // 3. Seed initial Warden account if not already present
    const isProduction = process.env.NODE_ENV === 'production';
    const initialWardenEmail = (process.env.INITIAL_WARDEN_EMAIL || 'warden@hostel.edu').trim().toLowerCase();
    const initialWardenPassword = process.env.INITIAL_WARDEN_PASSWORD || 'password123';

    const [wardenRows] = await pool.query<WardenRow[]>(
      'SELECT id FROM wardens WHERE LOWER(username) = ? LIMIT 1',
      [initialWardenEmail]
    );

    if (wardenRows.length === 0) {
      const hashedPass = bcrypt.hashSync(initialWardenPassword, 10);
      await pool.query(
        `INSERT INTO wardens (username, password_hash, name, role, staff_id, phone_number, hostel_assigned)
         VALUES (?, ?, ?, 'WARDEN', 'WRD-01', '7305004032', 'All Hostels')`,
        [initialWardenEmail, hashedPass, 'Dr. Sumathi (Chief Warden)']
      );
      console.log(`[DATABASE] Provisioned initial Warden account: ${initialWardenEmail}`);
    }

    if (!isProduction) {
      // Seed development admin
      const [adminRows] = await pool.query<WardenRow[]>(
        'SELECT id FROM wardens WHERE LOWER(username) = ? LIMIT 1',
        ['admin@hostel.edu']
      );
      if (adminRows.length === 0) {
        const hashedAdminPass = bcrypt.hashSync('admin123', 10);
        await pool.query(
          `INSERT INTO wardens (username, password_hash, name, role, staff_id, phone_number, hostel_assigned)
           VALUES ('admin@hostel.edu', ?, 'Dr. Sumathi (Chief Warden)', 'ADMIN', 'WRD-00', '7305004032', 'All Hostels')`,
          [hashedAdminPass]
        );
      }

      // Seed development students if empty
      const [studentCountRows] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM students');
      const studentCount = (studentCountRows[0] as any).count;
      if (studentCount === 0) {
        const defaultHash = bcrypt.hashSync('password123', 10);
        await pool.query(`
          INSERT INTO students (student_name, student_id, email, phone_number, password_hash, hostel_name, room_number)
          VALUES 
            ('Sangavi Perumal', 'STU101', 'student@hostel.edu', '+91 98765 43210', ?, 'Chellammal hostel', 'G1'),
            ('Rahul Sharma', 'STU102', 'rahul@hostel.edu', '+91 98765 11223', ?, 'Sivasakthi hostel', 'S1'),
            ('Ananya Iyer', 'STU103', 'ananya@hostel.edu', '+91 98765 99881', ?, 'Flat Office', 'G2');
        `, [defaultHash, defaultHash, defaultHash]);
        console.log('[DATABASE] Seeded development students (STU101, STU102, STU103)');
      }

      // Seed initial emergencies if empty
      const [emergCountRows] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM emergencies');
      const emergCount = (emergCountRows[0] as any).count;
      if (emergCount === 0) {
        await pool.query(`
          INSERT INTO emergencies (student_name, student_id, hostel_name, emergency_category, emergency_type, room_number, description, status, admin_remarks, alert_recipients)
          VALUES 
            ('Sangavi Perumal', 'STU101', 'Chellammal hostel', 'Medical Emergency', 'Sudden Severe Illness', 'G1', 'High fever, acute dizziness and breathing difficulty. Please dispatch medical staff to room.', 'Pending', 'Campus medical kit on standby', 'Dr. Sumathi (Chief Warden), Hostel Management, Doctor and Nurse'),
            ('Rahul Sharma', 'STU102', 'Sivasakthi hostel', 'Electrical Emergency', 'Short Circuit Spark', 'S1', 'Severe sparking coming from main switchboard with burning smell.', 'In Progress', 'Block electrician dispatched, main MCB isolated', 'Electrician, Dr. Sumathi (Chief Warden) and Hostel Management'),
            ('Ananya Iyer', 'STU103', 'Flat Office', 'Fire Emergency', 'Smoke in Corridor', 'G2', 'Dense smoke detected near utility shaft.', 'Resolved', 'False alarm from overheated bin. Area cleared.', 'Dr. Sumathi (Hostel Warden), Hostel Management and Fire Emergency Team');
        `);
      }

      // Seed initial complaints if empty
      const [complCountRows] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM complaints');
      const complCount = (complCountRows[0] as any).count;
      if (complCount === 0) {
        await pool.query(`
          INSERT INTO complaints (student_id, hostel_name, room_number, complaint_type, description, status, admin_remarks, alert_recipients)
          VALUES 
            ('STU101', 'Chellammal hostel', 'G1', 'Broken Door Lock / Window Latch', 'Main room door latch is loose and does not lock firmly from the inside.', 'Pending', 'Assigned to hostel carpenter', 'Dr. Sumathi (Hostel Warden) and Hostel Management'),
            ('STU102', 'Sivasakthi hostel', 'S1', 'Corridor Light Out / Dark Area', 'Corridor tube light near room S1 is flickering and off at night.', 'In Progress', 'LED light replacement scheduled', 'Electrician, Dr. Sumathi (Chief Warden) and Hostel Management'),
            ('STU103', 'Flat Office', 'G2', 'Water Leakage / Plumbing Defect', 'Washroom pipe leaking continuously causing water puddling.', 'Resolved', 'Plumber replaced washer valve', 'Plumber, Dr. Sumathi (Hostel Warden) and Hostel Management');
        `);
      }
    }

    return { success: true, message: 'MySQL connected and tables verified.' };
  } catch (error: any) {
    isDbConnected = false;
    // Log safe error message without exposing passwords
    const safeError = error?.code || error?.message || 'Database connection error';
    console.error(`[DATABASE ERROR] Failed to connect to MySQL: ${safeError}`);
    return { success: false, message: `Database connection error: ${safeError}` };
  }
}
