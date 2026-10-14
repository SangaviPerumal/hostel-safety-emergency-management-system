/**
 * API configuration and utility methods for Hostel Safety & Emergency Management System
 * Handles communication with REST API / Express / Spring Boot
 */

const API_BASE_URL = '/api';

/**
 * Common fetch wrapper with error handling, JSON parsing, and auth headers
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  // Attach session token if authenticated
  const admin = AuthService.getAdmin();
  const student = AuthService.getStudent();
  if (admin && admin.token) {
    options.headers['Authorization'] = `Bearer ${admin.token}`;
  } else if (student && student.token) {
    options.headers['Authorization'] = `Bearer ${student.token}`;
  }

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = result.message || result.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.warn(`API [${method}] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Toast Notification display helper
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';
  
  toast.innerHTML = `
    <span>${icon}</span>
    <div style="font-size: 0.9rem; font-weight: 600;">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Session storage helpers for logged in Student / Admin
 */
const AuthService = {
  getStudent() {
    try {
      const data = localStorage.getItem('hostel_current_student');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setStudent(student) {
    localStorage.setItem('hostel_current_student', JSON.stringify(student));
  },
  clearStudent() {
    localStorage.removeItem('hostel_current_student');
  },
  getAdmin() {
    try {
      const data = localStorage.getItem('hostel_current_admin');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setAdmin(admin) {
    localStorage.setItem('hostel_current_admin', JSON.stringify(admin));
  },
  clearAdmin() {
    localStorage.removeItem('hostel_current_admin');
  },
  async logoutWarden() {
    try {
      await apiRequest('/admin/logout', 'POST');
    } catch {
      // Continue client cleanup
    }
    AuthService.clearAdmin();
    showToast('Warden logged out securely.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html?role=warden';
    }, 500);
  },
  async logoutStudent() {
    try {
      await apiRequest('/students/logout', 'POST');
    } catch {
      // Continue client cleanup
    }
    AuthService.clearStudent();
    showToast('Student logged out successfully.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  }
};

/**
 * Global Navigation Auth Controller
 * Enforces role-based display:
 * - If Student is logged in: shows Student portal, hides Warden links
 * - If Warden is logged in: shows Warden dashboard, hides student links
 */
function updateNavbarAuth() {
  const navMenu = document.getElementById('nav-menu-links');
  if (!navMenu) return;

  const admin = AuthService.getAdmin();
  const student = AuthService.getStudent();
  const currentPath = window.location.pathname;

  if (admin && (admin.role === 'WARDEN' || admin.role === 'ADMIN')) {
    // Warden / Admin is logged in
    navMenu.innerHTML = `
      <li><a href="index.html" class="${currentPath.endsWith('index.html') || currentPath === '/' ? 'active' : ''}">🏠 Home</a></li>
      <li><a href="admin-dashboard.html" class="${currentPath.includes('admin') ? 'active' : ''}">⚙️ Warden Control Room</a></li>
      <li><button id="btn-admin-logout" type="button" onclick="AuthService.logoutWarden()" class="btn btn-secondary btn-sm" style="color: #ffffff; padding: 6px 12px; margin-left: 6px; cursor: pointer; display: inline-flex; align-items: center;">🚪 Logout (${admin.name ? admin.name.split(' ')[0] : 'Warden'})</button></li>
    `;
  } else if (student) {
    // Student is logged in: Student cannot see or access Warden portal
    navMenu.innerHTML = `
      <li><a href="index.html" class="${currentPath.endsWith('index.html') || currentPath === '/' ? 'active' : ''}">🏠 Home</a></li>
      <li><a href="emergency.html" class="nav-emergency-btn ${currentPath.includes('emergency') ? 'active' : ''}">🚨 Emergency</a></li>
      <li><a href="complaint.html" class="${currentPath.includes('complaint') ? 'active' : ''}">🛡️ Safety Complaint</a></li>
      <li><a href="student-dashboard.html" class="${currentPath.includes('student') ? 'active' : ''}">👤 Student Dashboard</a></li>
      <li><button id="btn-logout" type="button" onclick="AuthService.logoutStudent()" class="btn btn-secondary btn-sm" style="color: #ffffff; padding: 6px 12px; margin-left: 6px; cursor: pointer; display: inline-flex; align-items: center;">🚪 Logout (${student.studentName ? student.studentName.split(' ')[0] : 'Student'})</button></li>
    `;
  } else {
    // Guest / Not logged in: show separate Student Login and Warden Login
    navMenu.innerHTML = `
      <li><a href="index.html" class="${currentPath.endsWith('index.html') || currentPath === '/' ? 'active' : ''}">🏠 Home</a></li>
      <li><a href="emergency.html" class="nav-emergency-btn ${currentPath.includes('emergency') ? 'active' : ''}">🚨 Emergency</a></li>
      <li><a href="complaint.html" class="${currentPath.includes('complaint') ? 'active' : ''}">🛡️ Safety Complaint</a></li>
      <li><a href="login.html" class="${currentPath.includes('login') ? 'active' : ''}">👤 Student Login</a></li>
      <li><a href="login.html?role=warden" style="background: rgba(255,255,255,0.12); border-radius: 6px;">🛡️ Warden Login</a></li>
    `;
  }
}

document.addEventListener('DOMContentLoaded', updateNavbarAuth);
