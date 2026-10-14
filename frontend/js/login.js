/**
 * JavaScript handler for Student & Warden Login
 * Connects with REST API:
 * - POST /api/students/login
 * - POST /api/admin/login
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabStudent = document.getElementById('tab-btn-student');
  const tabAdmin = document.getElementById('tab-btn-admin');
  const studentForm = document.getElementById('student-login-form');
  const adminForm = document.getElementById('admin-login-form');

  // Tab switching
  if (tabStudent && tabAdmin && studentForm && adminForm) {
    tabStudent.addEventListener('click', () => {
      tabStudent.classList.add('active');
      tabAdmin.classList.remove('active');
      studentForm.style.display = 'block';
      adminForm.style.display = 'none';
    });

    tabAdmin.addEventListener('click', () => {
      tabAdmin.classList.add('active');
      tabStudent.classList.remove('active');
      adminForm.style.display = 'block';
      studentForm.style.display = 'none';
    });

    // Check URL query param ?role=warden or ?role=student
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('role') === 'warden') {
      tabAdmin.click();
    }
  }

  // Password visibility toggle helpers
  setupPasswordToggle('btn-toggle-student-pass', 'loginPassword', 'eye-icon-student');
  setupPasswordToggle('btn-toggle-admin-pass', 'adminPassword', 'eye-icon-admin');

  function setupPasswordToggle(btnId, inputId, iconId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!btn || !input) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.textContent = '🙈';
        btn.setAttribute('title', 'Hide password');
      } else {
        input.type = 'password';
        if (icon) icon.textContent = '👁️';
        btn.setAttribute('title', 'Show password');
      }
    });
  }

  // Forgot password modal handlers
  const forgotModal = document.getElementById('forgot-password-modal');
  const btnForgotStudent = document.getElementById('btn-forgot-student-pass');
  const btnForgotAdmin = document.getElementById('btn-forgot-admin-pass');
  const btnCloseForgot = document.getElementById('btn-close-forgot-modal');
  const btnDismissForgot = document.getElementById('btn-dismiss-forgot-modal');

  function openForgotModal() {
    if (forgotModal) forgotModal.style.display = 'flex';
  }

  function closeForgotModal() {
    if (forgotModal) forgotModal.style.display = 'none';
  }

  if (btnForgotStudent) btnForgotStudent.addEventListener('click', openForgotModal);
  if (btnForgotAdmin) btnForgotAdmin.addEventListener('click', openForgotModal);
  if (btnCloseForgot) btnCloseForgot.addEventListener('click', closeForgotModal);
  if (btnDismissForgot) btnDismissForgot.addEventListener('click', closeForgotModal);
  if (forgotModal) {
    forgotModal.addEventListener('click', (e) => {
      if (e.target === forgotModal) closeForgotModal();
    });
  }

  // 1. Student Login Form Submit
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const idInput = document.getElementById('loginIdentifier');
      const passInput = document.getElementById('loginPassword');
      const identifier = idInput ? idInput.value.trim() : '';
      const password = passInput ? passInput.value : '';

      if (!identifier || !password) {
        showToast('Please enter your Student ID / Email and password.', 'error');
        return;
      }

      // If identifier clearly looks like warden credentials, suggest the Warden tab
      if (identifier.toLowerCase() === 'warden' || identifier.toLowerCase().includes('warden@')) {
        showToast('Warden credentials detected. Please switch to the "Warden Login" tab.', 'error');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-student-login');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span> Verifying Student...';
      }

      try {
        const student = await apiRequest('/students/login', 'POST', {
          identifier: identifier,
          password: password
        });

        // Enforce session separation: clear any previous admin session
        AuthService.clearAdmin();
        AuthService.setStudent(student);

        showToast(`Welcome back, ${student.studentName}! Logged in as Student.`, 'success');

        setTimeout(() => {
          window.location.href = 'student-dashboard.html';
        }, 600);

      } catch (error) {
        showToast(error.message || 'Invalid Student credentials.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }

  // 2. Warden Login Form Submit
  if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const userInput = document.getElementById('adminUsername');
      const passInput = document.getElementById('adminPassword');
      const username = userInput ? userInput.value.trim() : '';
      const password = passInput ? passInput.value : '';

      if (!username || !password) {
        showToast('Please enter your Warden email or username and password.', 'error');
        return;
      }

      // Requirement 4: Reject student credentials immediately if submitted through Warden login
      const isStudentFormat = username.toUpperCase().startsWith('STU') || username.toLowerCase().includes('student');
      if (isStudentFormat) {
        showToast('Access denied. Only authorized wardens can log in here.', 'error');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-admin-login');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span> Verifying Warden Access...';
      }

      try {
        const admin = await apiRequest('/admin/login', 'POST', {
          username: username,
          password: password
        });

        // Enforce session separation: clear student session
        AuthService.clearStudent();
        AuthService.setAdmin(admin);

        showToast(`Welcome, ${admin.name || 'Warden'}! Access granted to Warden Control Room.`, 'success');

        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 600);

      } catch (error) {
        showToast(error.message || 'Access denied. Only authorized wardens can log in here.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }
});
