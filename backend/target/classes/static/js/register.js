/**
 * JavaScript handler for Student Registration
 * Connects with REST API:
 * - POST /api/students/register
 * Enforces role: 'STUDENT' on the backend.
 */

document.addEventListener('DOMContentLoaded', () => {
  const studentForm = document.getElementById('register-form');
  const btnToggleRegPass = document.getElementById('btn-toggle-reg-pass');
  const regPasswordInput = document.getElementById('regPassword');
  const eyeIconReg = document.getElementById('eye-icon-reg');

  // Password toggle
  if (btnToggleRegPass && regPasswordInput) {
    btnToggleRegPass.addEventListener('click', (e) => {
      e.preventDefault();
      if (regPasswordInput.type === 'password') {
        regPasswordInput.type = 'text';
        if (eyeIconReg) eyeIconReg.textContent = '🙈';
        btnToggleRegPass.setAttribute('title', 'Hide password');
      } else {
        regPasswordInput.type = 'password';
        if (eyeIconReg) eyeIconReg.textContent = '👁️';
        btnToggleRegPass.setAttribute('title', 'Show password');
      }
    });
  }

  // Student Registration Form Submit
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const studentName = document.getElementById('regStudentName').value.trim();
      const studentId = document.getElementById('regStudentId').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const phoneNumber = document.getElementById('regPhone').value.trim();
      const hostelName = document.getElementById('regHostelName').value;
      const roomNumber = document.getElementById('regRoomNumber').value.trim();
      const password = document.getElementById('regPassword').value;

      if (!studentName || !studentId || !email || !phoneNumber || !hostelName || !roomNumber || !password) {
        showToast('Please fill out all student registration fields.', 'error');
        return;
      }

      if (password.length < 4) {
        showToast('Password must be at least 4 characters long.', 'error');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-register');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span> Registering Student...';
      }

      const payload = {
        studentName,
        studentId,
        email,
        phoneNumber,
        hostelName,
        roomNumber,
        password
      };

      try {
        const response = await apiRequest('/students/register', 'POST', payload);
        
        showToast(`🎉 Registration successful! Welcome, ${response.studentName}.`, 'success');

        // Clear any previous admin session and save student session
        AuthService.clearAdmin();
        AuthService.setStudent(response);

        setTimeout(() => {
          window.location.href = 'student-dashboard.html';
        }, 800);

      } catch (error) {
        showToast(error.message || 'Registration failed. Please check if ID or Email already exists.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }
});
