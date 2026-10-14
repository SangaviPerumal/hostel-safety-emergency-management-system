import express from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import {
  pool,
  initDatabase,
  isDbConnected,
  StudentRow,
  WardenRow,
  EmergencyRow,
  ComplaintRow,
  SessionRow
} from './src/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Maximum session lifetime: 8 hours (in milliseconds)
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

interface ActiveSession {
  token: string;
  userId: number;
  role: 'WARDEN' | 'ADMIN' | 'STUDENT';
  username: string;
  name: string;
  createdAt: number;
}

/**
 * Generate cryptographically secure authentication tokens
 * Uses Node.js crypto.randomBytes(32) giving 256 bits of entropy
 */
function generateSecureToken(prefix: 'stu' | 'wrd'): string {
  const secureRandom = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${Date.now()}_${secureRandom}`;
}

/**
 * Password hashing & verification helpers using BCrypt (strictly no plaintext fallback)
 */
function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain: string, hash: string): boolean {
  if (!plain || !hash) return false;
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
    return false;
  }
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

/**
 * Formatters to map MySQL snake_case table columns to REST API camelCase response models
 */
function formatStudent(row: StudentRow) {
  return {
    id: row.id,
    studentName: row.student_name,
    studentId: row.student_id,
    email: row.email,
    phoneNumber: row.phone_number,
    hostelName: row.hostel_name,
    roomNumber: row.room_number,
    createdAt: row.created_at
  };
}

function formatEmergency(row: EmergencyRow) {
  return {
    id: row.id,
    studentName: row.student_name,
    studentId: row.student_id,
    hostelName: row.hostel_name || 'Chellammal hostel',
    emergencyCategory: row.emergency_category,
    emergencyType: row.emergency_type,
    roomNumber: row.room_number,
    description: row.description,
    status: row.status,
    dateTime: row.date_time,
    adminRemarks: row.admin_remarks || '',
    hasImage: Boolean(row.has_image),
    alertRecipients: row.alert_recipients || ''
  };
}

function formatComplaint(row: ComplaintRow) {
  return {
    id: row.id,
    studentId: row.student_id,
    hostelName: row.hostel_name || 'Chellammal hostel',
    roomNumber: row.room_number,
    complaintType: row.complaint_type,
    description: row.description,
    status: row.status,
    dateTime: row.date_time,
    adminRemarks: row.admin_remarks || '',
    alertRecipients: row.alert_recipients || ''
  };
}

// Key Personnel & Emergency Contacts Directory (Dr. Sumathi as Chief Warden)
export const HOSTEL_CONTACTS = {
  warden: {
    role: 'Chief Warden',
    phone: '7305004032',
    display: '+91 73050 04032',
    name: 'Dr. Sumathi'
  },
  hostelManagement: {
    role: 'Hostel Management',
    phone: '8148850319',
    display: '+91 81488 50319',
    name: 'Hostel Central Office'
  },
  plumber: {
    role: 'Hostel Plumber',
    phone: '1234567890',
    display: '+91 12345 67890',
    name: 'Maintenance Plumbing Desk'
  },
  electrician: {
    role: 'Hostel Electrician',
    phone: '1357924680',
    display: '+91 13579 24680',
    name: 'Electrical Duty Desk'
  },
  doctorNurse: {
    role: 'Doctor & Nurse',
    phone: '108',
    display: '108 / Campus Health Unit',
    name: 'Emergency Medical Staff'
  },
  fireTeam: {
    role: 'Fire Emergency Team',
    phone: '101',
    display: '101 / Campus Fire Safety Unit',
    name: 'Campus Fire Wing'
  },
  securityBouncers: {
    role: 'Hostel Security & Bouncers',
    phone: '9444400100',
    display: '+91 94444 00100',
    name: 'Hostel Security Patrol & Bouncers'
  }
};

function getEmergencyAlertRecipients(category: string, type: string = ''): string {
  const cat = (category || '').toLowerCase();
  const typ = (type || '').toLowerCase();

  if (cat.includes('medical') || typ.includes('illness') || typ.includes('injury') || typ.includes('unconscious')) {
    return 'Dr. Sumathi (Chief Warden), Hostel Management, Doctor and Nurse';
  } else if (cat.includes('electrical') || typ.includes('electrical') || typ.includes('spark') || typ.includes('wire') || typ.includes('shock')) {
    return 'Electrician, Dr. Sumathi (Chief Warden) and Hostel Management';
  } else if (cat.includes('fire') || typ.includes('flame') || typ.includes('smoke') || typ.includes('gas leak')) {
    return 'Dr. Sumathi (Hostel Warden), Hostel Management and Fire Emergency Team';
  } else if (cat.includes('security') || typ.includes('intruder') || typ.includes('fight') || typ.includes('theft') || typ.includes('harass')) {
    return 'Dr. Sumathi (Hostel Warden), Hostel Management, Hostel Security and Bouncers';
  } else {
    return 'Dr. Sumathi (Hostel Warden) and Hostel Management';
  }
}

function getComplaintAlertRecipients(complaintType: string = ''): string {
  const typ = (complaintType || '').toLowerCase();
  if (typ.includes('plumb') || typ.includes('pipe') || typ.includes('water leak') || typ.includes('drain')) {
    return 'Plumber, Dr. Sumathi (Hostel Warden) and Hostel Management';
  } else if (typ.includes('light') || typ.includes('wiring') || typ.includes('socket') || typ.includes('power')) {
    return 'Electrician, Dr. Sumathi (Chief Warden) and Hostel Management';
  } else {
    return 'Dr. Sumathi (Hostel Warden) and Hostel Management';
  }
}

// ---------------- DATABASE-BACKED SESSION MANAGEMENT ----------------

/**
 * Validates session token from MySQL database and checks 8-hour maximum lifetime
 * Automatically evicts expired sessions from MySQL
 */
async function getSessionFromRequest(req: express.Request): Promise<{ session?: ActiveSession; errorStatus?: number; errorMessage?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { errorStatus: 401, errorMessage: 'Authentication required. Authorization header missing.' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { errorStatus: 401, errorMessage: 'Authentication required. Bearer token missing.' };
  }

  try {
    const [rows] = await pool.query<SessionRow[]>(
      'SELECT token, user_id, role, username, name, created_at, expires_at FROM sessions WHERE token = ? LIMIT 1',
      [token]
    );

    if (rows.length === 0) {
      return { errorStatus: 401, errorMessage: 'Invalid or revoked session. Please log in again.' };
    }

    const sessionRow = rows[0];
    const now = Date.now();

    // Validate 8-hour lifetime
    if (now > Number(sessionRow.expires_at)) {
      await pool.query('DELETE FROM sessions WHERE token = ?', [token]);
      return { errorStatus: 401, errorMessage: 'Session expired (maximum 8-hour lifetime exceeded). Please log in again.' };
    }

    return {
      session: {
        token: sessionRow.token,
        userId: sessionRow.user_id,
        role: sessionRow.role,
        username: sessionRow.username,
        name: sessionRow.name,
        createdAt: Number(sessionRow.created_at)
      }
    };
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to query session:', error?.message || error);
    return { errorStatus: 500, errorMessage: 'Database error validating session.' };
  }
}

// Periodic cleanup of expired sessions from MySQL every 30 minutes
setInterval(async () => {
  try {
    const now = Date.now();
    await pool.query('DELETE FROM sessions WHERE expires_at < ?', [now]);
  } catch (error: any) {
    console.error('[DATABASE CLEANUP ERROR]:', error?.message || error);
  }
}, 30 * 60 * 1000);

// ---------------- AUTHENTICATION & AUTHORIZATION MIDDLEWARE ----------------

/**
 * Middleware: Requires an active authenticated session (WARDEN, ADMIN, or STUDENT)
 */
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authResult = await getSessionFromRequest(req);
  if (!authResult.session) {
    return res.status(authResult.errorStatus || 401).json({ error: authResult.errorMessage });
  }
  (req as any).user = authResult.session;
  next();
}

/**
 * Middleware: Requires an authorized WARDEN or ADMIN session
 */
async function requireWardenAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authResult = await getSessionFromRequest(req);
  if (!authResult.session) {
    return res.status(authResult.errorStatus || 401).json({ error: authResult.errorMessage });
  }

  if (authResult.session.role !== 'WARDEN' && authResult.session.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Only authorized wardens can access this resource.' });
  }

  (req as any).user = authResult.session;
  next();
}

// ---------------- REST API ROUTES (ALL PERSISTED IN MYSQL) ----------------

// 0. Database Status Endpoint
app.get('/api/db/status', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 as connected');
    return res.json({
      status: 'connected',
      database: process.env.MYSQL_DATABASE || 'hostel_safety_db',
      host: process.env.MYSQL_HOST || '127.0.0.1'
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'disconnected',
      error: 'Database connection offline'
    });
  }
});

// 1. Student Registration: POST /api/students/register
app.post('/api/students/register', async (req, res) => {
  const { studentName, studentId, email, phoneNumber, password, hostelName, roomNumber } = req.body;
  if (!studentName || !studentId || !email || !phoneNumber || !password || !hostelName || !roomNumber) {
    return res.status(400).json({ error: 'All registration fields are required.' });
  }

  try {
    // Check if studentId already exists in MySQL
    const [existingIdRows] = await pool.query<StudentRow[]>(
      'SELECT id FROM students WHERE LOWER(student_id) = ? LIMIT 1',
      [studentId.trim().toLowerCase()]
    );
    if (existingIdRows.length > 0) {
      return res.status(400).json({ error: `Student ID "${studentId}" is already registered. Please login.` });
    }

    // Check if email already exists in MySQL
    const [existingEmailRows] = await pool.query<StudentRow[]>(
      'SELECT id FROM students WHERE LOWER(email) = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );
    if (existingEmailRows.length > 0) {
      return res.status(400).json({ error: `Email "${email}" is already registered. Please login.` });
    }

    // Prevent student registration with reserved warden email
    const [existingWardenRows] = await pool.query<WardenRow[]>(
      'SELECT id FROM wardens WHERE LOWER(username) = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );
    if (existingWardenRows.length > 0) {
      return res.status(400).json({ error: 'This email is reserved for campus administration.' });
    }

    const passwordHash = hashPassword(password);

    // Insert student into MySQL using parameterized query
    const [insertResult] = await pool.execute<any>(
      `INSERT INTO students (student_name, student_id, email, phone_number, password_hash, hostel_name, room_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [studentName.trim(), studentId.trim(), email.trim(), phoneNumber.trim(), passwordHash, hostelName.trim(), roomNumber.trim()]
    );

    const newStudentId = insertResult.insertId;

    // Issue cryptographically secure session token and persist in MySQL sessions table
    const token = generateSecureToken('stu');
    const now = Date.now();
    const expiresAt = now + SESSION_MAX_AGE_MS;

    await pool.execute(
      `INSERT INTO sessions (token, user_id, role, username, name, created_at, expires_at)
       VALUES (?, ?, 'STUDENT', ?, ?, ?, ?)`,
      [token, newStudentId, studentId.trim(), studentName.trim(), now, expiresAt]
    );

    return res.status(201).json({
      id: newStudentId,
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      hostelName: hostelName.trim(),
      roomNumber: roomNumber.trim(),
      role: 'STUDENT',
      token
    });
  } catch (error: any) {
    console.error('[DATABASE ERROR] Registration failed:', error?.message || error);
    return res.status(500).json({ error: 'Registration failed due to a database error.' });
  }
});

// 2. Student Login: POST /api/students/login
app.post('/api/students/login', async (req, res) => {
  const identifier = (req.body.identifier || req.body.studentId || req.body.email || '').trim();
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Student ID or Registered Email and password are required.' });
  }

  try {
    // Reject warden credentials submitted to student portal
    const [wardenMatchRows] = await pool.query<WardenRow[]>(
      'SELECT id FROM wardens WHERE LOWER(username) = ? LIMIT 1',
      [identifier.toLowerCase()]
    );
    if (wardenMatchRows.length > 0 || identifier.toLowerCase() === 'warden') {
      return res.status(400).json({
        error: 'Warden credentials detected. Please switch to the "Warden Login" tab.'
      });
    }

    const idLower = identifier.toLowerCase();

    // Query student from MySQL
    const [studentRows] = await pool.query<StudentRow[]>(
      `SELECT id, student_name, student_id, email, phone_number, password_hash, hostel_name, room_number, created_at
       FROM students
       WHERE LOWER(student_id) = ? OR LOWER(email) = ? OR (LOWER(student_name) LIKE ? AND student_id = 'STU101')
       LIMIT 1`,
      [idLower, idLower, `%${idLower}%`]
    );

    if (studentRows.length === 0) {
      return res.status(401).json({
        error: 'Account not found. Only registered students can log in. Please register first using the "Register as Student" link.'
      });
    }

    const student = studentRows[0];
    const passwordValid = verifyPassword(password, student.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Issue cryptographically secure session token and persist in MySQL sessions table
    const token = generateSecureToken('stu');
    const now = Date.now();
    const expiresAt = now + SESSION_MAX_AGE_MS;

    await pool.execute(
      `INSERT INTO sessions (token, user_id, role, username, name, created_at, expires_at)
       VALUES (?, ?, 'STUDENT', ?, ?, ?, ?)`,
      [token, student.id, student.student_id, student.student_name, now, expiresAt]
    );

    return res.json({
      id: student.id,
      studentName: student.student_name,
      studentId: student.student_id,
      email: student.email,
      phoneNumber: student.phone_number,
      hostelName: student.hostel_name,
      roomNumber: student.room_number,
      role: 'STUDENT',
      token
    });
  } catch (error: any) {
    console.error('[DATABASE ERROR] Student login failed:', error?.message || error);
    return res.status(500).json({ error: 'Authentication failed due to a database error.' });
  }
});

// 3. Admin / Warden Login: POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
  const username = (req.body.username || req.body.email || '').trim().toLowerCase();
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ error: 'Warden email or username and password are required.' });
  }

  try {
    // If student submits student credentials through warden login form, reject with 403
    const [studentAttemptRows] = await pool.query<StudentRow[]>(
      'SELECT id FROM students WHERE LOWER(email) = ? OR LOWER(student_id) = ? LIMIT 1',
      [username, username]
    );
    if (studentAttemptRows.length > 0 || username.startsWith('stu') || username.includes('student')) {
      return res.status(403).json({
        error: 'Access denied. Only authorized wardens can log in here.'
      });
    }

    // Query warden from MySQL
    const initialWardenEmail = (process.env.INITIAL_WARDEN_EMAIL || 'warden@hostel.edu').trim().toLowerCase();
    const [wardenRows] = await pool.query<WardenRow[]>(
      'SELECT id, username, password_hash, name, role, staff_id, phone_number, hostel_assigned FROM wardens WHERE LOWER(username) = ? OR (? = "warden" AND LOWER(username) = ?) LIMIT 1',
      [username, username, initialWardenEmail]
    );

    if (wardenRows.length === 0) {
      return res.status(401).json({
        error: 'Access denied. Only authorized wardens can log in here.'
      });
    }

    const warden = wardenRows[0];
    const passwordValid = verifyPassword(password, warden.password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Access denied. Only authorized wardens can log in here.'
      });
    }

    // Issue cryptographically secure session token and persist in MySQL sessions table
    const token = generateSecureToken('wrd');
    const now = Date.now();
    const expiresAt = now + SESSION_MAX_AGE_MS;

    await pool.execute(
      `INSERT INTO sessions (token, user_id, role, username, name, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [token, warden.id, warden.role, warden.username, warden.name, now, expiresAt]
    );

    return res.json({
      id: warden.id,
      username: warden.username,
      name: warden.name,
      role: warden.role,
      staffId: warden.staff_id,
      phoneNumber: warden.phone_number,
      hostelAssigned: warden.hostel_assigned,
      token
    });
  } catch (error: any) {
    console.error('[DATABASE ERROR] Warden login failed:', error?.message || error);
    return res.status(500).json({ error: 'Authentication failed due to a database error.' });
  }
});

// 4. Secure Logout Handlers (Session Token Invalidation from MySQL)
app.post('/api/admin/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    try {
      await pool.execute('DELETE FROM sessions WHERE token = ?', [token]);
    } catch (e) {
      // Continue cleanup
    }
  }
  return res.json({ message: 'Warden logged out successfully.' });
});

app.post('/api/students/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    try {
      await pool.execute('DELETE FROM sessions WHERE token = ?', [token]);
    } catch (e) {
      // Continue cleanup
    }
  }
  return res.json({ message: 'Student logged out successfully.' });
});

app.post('/api/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    try {
      await pool.execute('DELETE FROM sessions WHERE token = ?', [token]);
    } catch (e) {
      // Continue cleanup
    }
  }
  return res.json({ message: 'Logged out successfully.' });
});

// 5. Get All Students: GET /api/students (Protected: WARDEN / ADMIN only)
app.get('/api/students', requireWardenAuth, async (req, res) => {
  try {
    const [rows] = await pool.query<StudentRow[]>(
      'SELECT id, student_name, student_id, email, phone_number, hostel_name, room_number, created_at FROM students ORDER BY id ASC'
    );
    const safeStudents = rows.map(formatStudent);
    return res.json(safeStudents);
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to fetch students:', error?.message || error);
    return res.status(500).json({ error: 'Failed to retrieve students from database.' });
  }
});

// 6. Get Student by ID: GET /api/students/:id (Protected: Self or Warden)
app.get('/api/students/:id', requireAuth, async (req, res) => {
  const session = (req as any).user as ActiveSession;
  const requestedId = req.params.id.toUpperCase();

  try {
    const [rows] = await pool.query<StudentRow[]>(
      'SELECT id, student_name, student_id, email, phone_number, hostel_name, room_number, created_at FROM students WHERE UPPER(student_id) = ? LIMIT 1',
      [requestedId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // If role is STUDENT, only allow access to their own profile
    if (session.role === 'STUDENT' && session.username.toUpperCase() !== requestedId) {
      return res.status(403).json({ error: 'Access denied. Students are only authorized to view their own profile.' });
    }

    return res.json(formatStudent(rows[0]));
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to fetch student by id:', error?.message || error);
    return res.status(500).json({ error: 'Database query failed.' });
  }
});

// 7. Submit Emergency: POST /api/emergencies (Open for immediate distress reporting, persists in MySQL)
app.post('/api/emergencies', async (req, res) => {
  const { studentName, studentId, hostelName, emergencyCategory, emergencyType, roomNumber, description, hasImage, alertRecipients } = req.body;

  if (!studentName || !studentId || !emergencyType || !roomNumber || !description) {
    return res.status(400).json({ error: 'Missing required emergency details.' });
  }

  try {
    // Resolve hostel name from student profile if not specified
    let resolvedHostelName = hostelName;
    if (!resolvedHostelName) {
      const [stuRows] = await pool.query<StudentRow[]>(
        'SELECT hostel_name FROM students WHERE UPPER(student_id) = ? LIMIT 1',
        [studentId.toUpperCase()]
      );
      resolvedHostelName = stuRows.length > 0 ? stuRows[0].hostel_name : 'Chellammal hostel';
    }

    const determinedRecipients = alertRecipients || getEmergencyAlertRecipients(emergencyCategory, emergencyType);

    // Insert into MySQL emergencies table
    const [insertResult] = await pool.execute<any>(
      `INSERT INTO emergencies 
        (student_name, student_id, hostel_name, emergency_category, emergency_type, room_number, description, status, admin_remarks, has_image, alert_recipients)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
      [
        studentName,
        studentId,
        resolvedHostelName,
        emergencyCategory || 'General',
        emergencyType,
        roomNumber,
        description,
        `Alert broadcasted to: ${determinedRecipients}`,
        hasImage ? 1 : 0,
        determinedRecipients
      ]
    );

    const newId = insertResult.insertId;
    const [newRow] = await pool.query<EmergencyRow[]>(
      'SELECT id, student_name, student_id, hostel_name, emergency_category, emergency_type, room_number, description, status, date_time, admin_remarks, has_image, alert_recipients FROM emergencies WHERE id = ? LIMIT 1',
      [newId]
    );

    return res.status(201).json(formatEmergency(newRow[0]));
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to submit emergency report:', error?.message || error);
    return res.status(500).json({ error: 'Failed to record emergency report in database.' });
  }
});

// 8. Get Emergencies: GET /api/emergencies (Protected: Role-Scoped Access from MySQL)
app.get('/api/emergencies', requireAuth, async (req, res) => {
  const session = (req as any).user as ActiveSession;

  try {
    if (session.role === 'WARDEN' || session.role === 'ADMIN') {
      const category = req.query.category as string;
      const status = req.query.status as string;

      let query = `
        SELECT id, student_name, student_id, hostel_name, emergency_category, emergency_type, room_number, description, status, date_time, admin_remarks, has_image, alert_recipients
        FROM emergencies
        WHERE 1=1
      `;
      const queryParams: any[] = [];

      if (category && category !== 'All') {
        query += ' AND (LOWER(emergency_category) = ? OR LOWER(emergency_type) LIKE ?)';
        queryParams.push(category.toLowerCase(), `%${category.toLowerCase()}%`);
      }
      if (status && status !== 'All') {
        query += ' AND LOWER(status) = ?';
        queryParams.push(status.toLowerCase());
      }
      query += ' ORDER BY id DESC';

      const [rows] = await pool.query<EmergencyRow[]>(query, queryParams);
      return res.json(rows.map(formatEmergency));
    }

    // Student role: Strictly limited to emergency reports submitted by this student
    const [rows] = await pool.query<EmergencyRow[]>(
      `SELECT id, student_name, student_id, hostel_name, emergency_category, emergency_type, room_number, description, status, date_time, admin_remarks, has_image, alert_recipients
       FROM emergencies
       WHERE UPPER(student_id) = ?
       ORDER BY id DESC`,
      [session.username.toUpperCase()]
    );
    return res.json(rows.map(formatEmergency));
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to fetch emergencies:', error?.message || error);
    return res.status(500).json({ error: 'Failed to query emergency reports from database.' });
  }
});

// 9. Get Emergency by ID: GET /api/emergencies/:id (Protected: Role-Scoped Access from MySQL)
app.get('/api/emergencies/:id', requireAuth, async (req, res) => {
  const session = (req as any).user as ActiveSession;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid emergency ID.' });
  }

  try {
    const [rows] = await pool.query<EmergencyRow[]>(
      `SELECT id, student_name, student_id, hostel_name, emergency_category, emergency_type, room_number, description, status, date_time, admin_remarks, has_image, alert_recipients
       FROM emergencies
       WHERE id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Emergency report not found.' });
    }

    const emergency = rows[0];

    // Student can only access their own emergency report
    if (session.role === 'STUDENT' && emergency.student_id.toUpperCase() !== session.username.toUpperCase()) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to view this emergency report.' });
    }

    return res.json(formatEmergency(emergency));
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to fetch emergency by id:', error?.message || error);
    return res.status(500).json({ error: 'Database query failed.' });
  }
});

// 10. Update Emergency Status (Protected: Warden / Admin only, persists in MySQL): PUT /api/emergencies/:id/status
app.put('/api/emergencies/:id/status', requireWardenAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status, remarks } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid emergency ID.' });
  }

  try {
    const [checkRows] = await pool.query<EmergencyRow[]>('SELECT id FROM emergencies WHERE id = ? LIMIT 1', [id]);
    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Emergency report not found.' });
    }

    await pool.execute(
      `UPDATE emergencies
       SET status = COALESCE(?, status),
           admin_remarks = COALESCE(?, admin_remarks)
       WHERE id = ?`,
      [status || null, remarks || null, id]
    );

    const [updatedRows] = await pool.query<EmergencyRow[]>(
      `SELECT id, student_name, student_id, hostel_name, emergency_category, emergency_type, room_number, description, status, date_time, admin_remarks, has_image, alert_recipients
       FROM emergencies WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json(formatEmergency(updatedRows[0]));
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to update emergency status:', error?.message || error);
    return res.status(500).json({ error: 'Failed to update emergency status in database.' });
  }
});

// 11. Submit Complaint: POST /api/complaints (Persists in MySQL)
app.post('/api/complaints', async (req, res) => {
  const { studentId, hostelName, roomNumber, complaintType, description, alertRecipients } = req.body;

  if (!studentId || !roomNumber || !complaintType || !description) {
    return res.status(400).json({ error: 'Missing required safety complaint fields.' });
  }

  try {
    let resolvedHostelName = hostelName;
    if (!resolvedHostelName) {
      const [stuRows] = await pool.query<StudentRow[]>(
        'SELECT hostel_name FROM students WHERE UPPER(student_id) = ? LIMIT 1',
        [studentId.toUpperCase()]
      );
      resolvedHostelName = stuRows.length > 0 ? stuRows[0].hostel_name : 'Chellammal hostel';
    }

    const determinedRecipients = alertRecipients || getComplaintAlertRecipients(complaintType);

    const [insertResult] = await pool.execute<any>(
      `INSERT INTO complaints (student_id, hostel_name, room_number, complaint_type, description, status, admin_remarks, alert_recipients)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [
        studentId,
        resolvedHostelName,
        roomNumber,
        complaintType,
        description,
        `Alert sent to: ${determinedRecipients}`,
        determinedRecipients
      ]
    );

    const newId = insertResult.insertId;
    const [newRows] = await pool.query<ComplaintRow[]>(
      `SELECT id, student_id, hostel_name, room_number, complaint_type, description, status, date_time, admin_remarks, alert_recipients
       FROM complaints WHERE id = ? LIMIT 1`,
      [newId]
    );

    return res.status(201).json(formatComplaint(newRows[0]));
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to submit complaint:', error?.message || error);
    return res.status(500).json({ error: 'Failed to save complaint in database.' });
  }
});

// 12. Emergency & Safety Contacts Directory: GET /api/contacts (Public directory)
app.get('/api/contacts', (req, res) => {
  return res.json(HOSTEL_CONTACTS);
});

// 13. Get Complaints: GET /api/complaints (Protected: Role-Scoped Access from MySQL)
app.get('/api/complaints', requireAuth, async (req, res) => {
  const session = (req as any).user as ActiveSession;

  try {
    if (session.role === 'WARDEN' || session.role === 'ADMIN') {
      const status = req.query.status as string;
      let query = `
        SELECT id, student_id, hostel_name, room_number, complaint_type, description, status, date_time, admin_remarks, alert_recipients
        FROM complaints
        WHERE 1=1
      `;
      const queryParams: any[] = [];
      if (status && status !== 'All') {
        query += ' AND LOWER(status) = ?';
        queryParams.push(status.toLowerCase());
      }
      query += ' ORDER BY id DESC';

      const [rows] = await pool.query<ComplaintRow[]>(query, queryParams);
      return res.json(rows.map(formatComplaint));
    }

    // Student role: Strictly limited to complaints submitted by this student
    const [rows] = await pool.query<ComplaintRow[]>(
      `SELECT id, student_id, hostel_name, room_number, complaint_type, description, status, date_time, admin_remarks, alert_recipients
       FROM complaints
       WHERE UPPER(student_id) = ?
       ORDER BY id DESC`,
      [session.username.toUpperCase()]
    );
    return res.json(rows.map(formatComplaint));
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to fetch complaints:', error?.message || error);
    return res.status(500).json({ error: 'Failed to query complaints from database.' });
  }
});

// 14. Get Complaint by ID: GET /api/complaints/:id (Protected: Role-Scoped Access from MySQL)
app.get('/api/complaints/:id', requireAuth, async (req, res) => {
  const session = (req as any).user as ActiveSession;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid complaint ID.' });
  }

  try {
    const [rows] = await pool.query<ComplaintRow[]>(
      `SELECT id, student_id, hostel_name, room_number, complaint_type, description, status, date_time, admin_remarks, alert_recipients
       FROM complaints WHERE id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = rows[0];
    if (session.role === 'STUDENT' && complaint.student_id.toUpperCase() !== session.username.toUpperCase()) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to view this safety complaint.' });
    }

    return res.json(formatComplaint(complaint));
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to fetch complaint by id:', error?.message || error);
    return res.status(500).json({ error: 'Database query failed.' });
  }
});

// 15. Update Complaint Status (Protected: Warden / Admin only, persists in MySQL): PUT /api/complaints/:id/status
app.put('/api/complaints/:id/status', requireWardenAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status, remarks } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid complaint ID.' });
  }

  try {
    const [checkRows] = await pool.query<ComplaintRow[]>('SELECT id FROM complaints WHERE id = ? LIMIT 1', [id]);
    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    await pool.execute(
      `UPDATE complaints
       SET status = COALESCE(?, status),
           admin_remarks = COALESCE(?, admin_remarks)
       WHERE id = ?`,
      [status || null, remarks || null, id]
    );

    const [updatedRows] = await pool.query<ComplaintRow[]>(
      `SELECT id, student_id, hostel_name, room_number, complaint_type, description, status, date_time, admin_remarks, alert_recipients
       FROM complaints WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json(formatComplaint(updatedRows[0]));
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to update complaint status:', error?.message || error);
    return res.status(500).json({ error: 'Failed to update complaint in database.' });
  }
});

// 16. Dashboard Stats: GET /api/dashboard/stats (Protected: Warden / Admin only, computed in MySQL)
app.get('/api/dashboard/stats', requireWardenAuth, async (req, res) => {
  try {
    const [studentCountRows] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM students');
    const totalStudents = Number((studentCountRows[0] as any).count || 0);

    const [emergStatsRows] = await pool.query<mysql.RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(status = 'Pending') as pending,
        SUM(status = 'In Progress') as in_progress,
        SUM(status = 'Resolved') as resolved
      FROM emergencies
    `);
    const emergStat = emergStatsRows[0] as any;

    const [complStatsRows] = await pool.query<mysql.RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(status = 'Pending') as pending,
        SUM(status = 'In Progress') as in_progress,
        SUM(status = 'Resolved') as resolved
      FROM complaints
    `);
    const complStat = complStatsRows[0] as any;

    const stats = {
      totalStudents,
      totalEmergencies: Number(emergStat.total || 0),
      pendingEmergencies: Number(emergStat.pending || 0),
      inProgressEmergencies: Number(emergStat.in_progress || 0),
      resolvedEmergencies: Number(emergStat.resolved || 0),
      totalComplaints: Number(complStat.total || 0),
      pendingComplaints: Number(complStat.pending || 0),
      inProgressComplaints: Number(complStat.in_progress || 0),
      resolvedComplaints: Number(complStat.resolved || 0)
    };

    return res.json(stats);
  } catch (error: any) {
    console.error('[DATABASE ERROR] Failed to compute dashboard stats:', error?.message || error);
    return res.status(500).json({ error: 'Failed to compute dashboard stats from database.' });
  }
});

// 17. Demo Seed Reset: POST /api/admin/seed (Protected: Warden / Admin only)
app.post('/api/admin/seed', requireWardenAuth, async (req, res) => {
  return res.json({ message: 'MySQL database connected and active.' });
});

// ---------------- Static Frontend Serving ----------------
const frontendPath = path.join(process.cwd(), 'frontend');
app.use(express.static(frontendPath));

// Also serve root static files
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Fallback for HTML pages
app.get('*', (req, res) => {
  const requestedFile = req.path.replace(/^\//, '');
  const filePath = path.join(frontendPath, requestedFile);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
});

// Initialize Database and Start Server
initDatabase().then((dbStatus) => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(`🚨 Hostel Emergency & Safety Management System running on port ${PORT}`);
    console.log(`🗄️ Database Status: ${dbStatus.message}`);
    console.log(`👉 Preview URL: http://localhost:${PORT}`);
    console.log(`================================================================`);
  });
}).catch((err) => {
  console.error('[FATAL] Failed to initialize database:', err);
  process.exit(1);
});
